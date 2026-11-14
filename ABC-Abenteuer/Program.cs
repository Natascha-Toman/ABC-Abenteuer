// ABC-Abenteuer – eigenständiges Windows-Programm.
// Zeigt die Lern-Oberfläche (HTML/JS im Programmordner) in einem Vollbild-Fenster (WebView2)
// und reicht die Blickdaten der Tobii-Augensteuerung (Tobii Core SDK) direkt an die Oberfläche weiter.
//
// Startoptionen:  --nogpu      ohne Grafikbeschleunigung (falls das Bild flackert)
//                 --window     im Fenster statt Vollbild
//                 --dev        Entwicklerwerkzeuge erlauben (F12)
//                 --selftest N / --fakegaze / --quittest / --evaljs datei N   (nur für Tests)
//
// Sicherheit: Es wird ausschließlich die eigene Oberfläche (https://abc-abenteuer.local/) angezeigt,
// Nachrichten werden nur von dort angenommen und jeder Wert wird geprüft.
// Fehler werden in %LOCALAPPDATA%\ABC-Abenteuer\protokoll.txt geschrieben.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Speech.Synthesis;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace AbcAbenteuer
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            // Unerwartete Fehler protokollieren, statt das Programm kommentarlos zu beenden
            Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
            Application.ThreadException += (s, e) => Log.Error("Unerwarteter Fehler (Oberfläche)", e.Exception);
            AppDomain.CurrentDomain.UnhandledException += (s, e) => Log.Error("Unerwarteter Fehler", e.ExceptionObject as Exception);
            TaskScheduler.UnobservedTaskException += (s, e) => { Log.Error("Unbeobachteter Fehler", e.Exception); e.SetObserved(); };
            Log.Write("Programmstart, Version " + Application.ProductVersion + ", Windows " + Environment.OSVersion.Version);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm(args));
            Log.Write("Programmende");
        }
    }

    // ---------------- Fehlerprotokoll (klein gehalten: max. 512 KB, dann wird umbenannt) ----------------
    internal static class Log
    {
        public static readonly string Dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ABC-Abenteuer");
        private static readonly string FileName = Path.Combine(Dir, "protokoll.txt");
        private static readonly object Gate = new object();
        public static void Write(string text)
        {
            try
            {
                lock (Gate)
                {
                    Directory.CreateDirectory(Dir);
                    var fi = new FileInfo(FileName);
                    if (fi.Exists && fi.Length > 512 * 1024)
                    {
                        string old = Path.Combine(Dir, "protokoll-alt.txt");
                        if (File.Exists(old)) File.Delete(old);
                        File.Move(FileName, old);
                    }
                    File.AppendAllText(FileName, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  " + text + Environment.NewLine, Encoding.UTF8);
                }
            }
            catch { /* Protokoll darf das Programm nie stören */ }
        }
        public static void Error(string context, Exception ex) => Write("FEHLER " + context + ": " + (ex == null ? "?" : ex.GetType().Name + ": " + ex.Message));
    }

    internal class MainForm : Form
    {
        private const string Origin = "https://abc-abenteuer.local/";
        private readonly string[] args;
        private readonly WebView2 web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.FromArgb(253, 246, 227) };
        private Tobii.Interaction.Host eyeHost;
        private int gazeCount;
        private string eyeInfo = "nicht gestartet";
        private volatile bool webReady;
        private DateTime lastSend = DateTime.MinValue;
        private SpeechSynthesizer tts;
        private bool ttsBroken;
        private int ttsId;
        private readonly JavaScriptSerializer json = new JavaScriptSerializer { MaxJsonLength = 8 * 1024 * 1024 };
        private static readonly string DataDir = Log.Dir;
        private static readonly string ConfigFile = Path.Combine(DataDir, "programm.ini");

        // kleine Programm-Einstellungen (wirken beim nächsten Start), z. B. nogpu=1
        private static bool ConfigFlag(string key)
        {
            try { return File.Exists(ConfigFile) && File.ReadAllLines(ConfigFile).Any(l => l.Trim() == key + "=1"); } catch { return false; }
        }
        private static void SetConfigFlag(string key, bool on)
        {
            try
            {
                Directory.CreateDirectory(DataDir);
                var lines = File.Exists(ConfigFile) ? File.ReadAllLines(ConfigFile).Where(l => !l.StartsWith(key + "=")).ToList() : new List<string>();
                lines.Add(key + "=" + (on ? "1" : "0"));
                File.WriteAllLines(ConfigFile, lines);
            }
            catch (Exception ex) { Log.Error("Einstellung speichern", ex); }
        }

        private bool Has(string a) => Array.IndexOf(args, a) >= 0;

        public MainForm(string[] args)
        {
            this.args = args;
            Text = "ABC-Abenteuer";
            BackColor = Color.FromArgb(253, 246, 227);
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
            if (!Has("--window")) { FormBorderStyle = FormBorderStyle.None; WindowState = FormWindowState.Maximized; }
            else { Size = new Size(1280, 760); StartPosition = FormStartPosition.CenterScreen; }
            Controls.Add(web);
            Shown += async (s, e) => await StartAsync();
            // Blickerfassung nur, solange das Programm im Vordergrund und nicht minimiert ist
            Activated += (s, e) => UpdateActive();
            Deactivate += (s, e) => UpdateActive();
            Resize += (s, e) => UpdateActive();
            FormClosing += (s, e) =>
            {
                try { eyeHost?.Dispose(); } catch { }
                try { tts?.Dispose(); } catch { }
                ShowOsk(false, 0, 0, 0);          // nur eine selbst geöffnete Bildschirmtastatur schließen
                RemoveClickFilter();
            };
            HandleCreated += (s, e) => InstallClickFilter();
        }

        private async Task StartAsync()
        {
            string appDir = Path.GetDirectoryName(Application.ExecutablePath);
            string ui = Path.Combine(appDir, "index.html");
            if (!File.Exists(ui))
            {
                Log.Write("index.html fehlt: " + ui);
                MessageBox.Show("Die Datei index.html wurde nicht gefunden:\n" + ui + "\n\nBitte das ABC-Abenteuer neu installieren bzw. den Programmordner vollständig kopieren.", "ABC-Abenteuer", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Close(); return;
            }
            try
            {
                var flags = "--autoplay-policy=no-user-gesture-required";
                if (Has("--nogpu") || ConfigFlag("nogpu")) flags += " --disable-gpu --disable-gpu-compositing";
                // Daten (Einstellungen, Lernstand) im Benutzerprofil – funktioniert auch, wenn das Programm auf einem USB-Stick liegt
                var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(DataDir, "WebView2"), new CoreWebView2EnvironmentOptions(flags));
                await web.EnsureCoreWebView2Async(env);
            }
            catch (Exception ex)
            {
                Log.Error("WebView2 starten", ex);
                var r = MessageBox.Show("Die Anzeige-Komponente \"Microsoft Edge WebView2\" fehlt oder ist defekt.\n\n" +
                    "Sie ist bei Windows 10/11 normalerweise vorhanden. Ansonsten kostenlos herunterladen:\n" +
                    "https://go.microsoft.com/fwlink/p/?LinkId=2124703\n\nSeite jetzt öffnen?\n\n(" + ex.GetBaseException().Message + ")",
                    "ABC-Abenteuer", MessageBoxButtons.YesNo, MessageBoxIcon.Error);
                if (r == DialogResult.Yes) try { Process.Start("https://go.microsoft.com/fwlink/p/?LinkId=2124703"); } catch { }
                Close(); return;
            }
            var core = web.CoreWebView2;
            core.Settings.AreDefaultContextMenusEnabled = false;
            core.Settings.AreDevToolsEnabled = Has("--dev");
            core.Settings.IsZoomControlEnabled = false;
            core.Settings.IsPinchZoomEnabled = false;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.AreBrowserAcceleratorKeysEnabled = Has("--dev");   // keine Strg+R/F5-Überraschungen
            core.Settings.IsGeneralAutofillEnabled = false;
            core.Settings.IsPasswordAutosaveEnabled = false;
            core.SetVirtualHostNameToFolderMapping("abc-abenteuer.local", appDir, CoreWebView2HostResourceAccessKind.DenyCors);

            // (1) Nur die eigene Oberfläche anzeigen – jede andere Adresse wird blockiert
            core.NavigationStarting += (s, e) =>
            {
                if (!IsOwn(e.Uri)) { e.Cancel = true; Log.Write("Navigation blockiert: " + Short(e.Uri)); return; }
                webReady = false;              // bis die Oberfläche fertig geladen ist, keine Nachrichten senden
            };
            core.FrameNavigationStarting += (s, e) =>
            {
                if (!IsOwn(e.Uri)) { e.Cancel = true; Log.Write("Rahmen-Navigation blockiert: " + Short(e.Uri)); }
            };
            core.NewWindowRequested += (s, e) => { e.Handled = true; Log.Write("Neues Fenster blockiert: " + Short(e.Uri)); };
            core.DownloadStarting += (s, e) => { e.Cancel = true; };
            core.PermissionRequested += (s, e) => { e.State = CoreWebView2PermissionState.Deny; };
            core.ProcessFailed += (s, e) => Log.Write("Anzeige-Prozess abgestürzt: " + e.ProcessFailedKind);

            core.NavigationCompleted += (s, e) =>
            {
                if (!e.IsSuccess)
                {
                    if (e.WebErrorStatus == CoreWebView2WebErrorStatus.OperationCanceled) return;   // blockierte fremde Adresse
                    Log.Write("Oberfläche konnte nicht geladen werden: " + e.WebErrorStatus);
                    webReady = false;
                    MessageBox.Show(this,
                        "Die Oberfläche des ABC-Abenteuers konnte nicht geladen werden.\n\n" +
                        "Bitte das Programm schließen und neu starten. Hilft das nicht, das ABC-Abenteuer neu installieren " +
                        "bzw. den Programmordner vollständig neu kopieren.\n\n(Fehler: " + e.WebErrorStatus + ")",
                        "ABC-Abenteuer", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
                webReady = true;               // auch nach Neuladen (Profilwechsel): Einstellungen + Stimmen erneut senden
                Post(new { t = "config", nogpu = ConfigFlag("nogpu") });
                SendVoices();
            };
            core.WebMessageReceived += OnWebMessage;
            core.Navigate(Origin + "index.html");

            if (Has("--fakegaze")) FakeGazeTest(); else StartEyeTracking();
            if (Has("--quittest")) QuitTest();
            if (Has("--evaljs")) EvalJsTest();

            if (Array.IndexOf(args, "--selftest") is int i && i >= 0 && i + 1 < args.Length && int.TryParse(args[i + 1], out int sec))
                RunSelfTest(sec);
        }

        // Eigene Oberfläche = genau https://abc-abenteuer.local/index.html (Standard-Port, ohne Benutzerangaben).
        // Geprüft wird die zerlegte Adresse – nicht nur der Textanfang (sonst ginge z. B. "https://abc-abenteuer.local.evil.com").
        private const string OwnHost = "abc-abenteuer.local";
        private static readonly HashSet<string> OwnPages = new HashSet<string>(StringComparer.Ordinal) { "/index.html", "/" };
        private static bool IsOwn(string uri)
        {
            if (string.IsNullOrEmpty(uri) || !Uri.TryCreate(uri, UriKind.Absolute, out Uri u)) return false;
            return u.Scheme == Uri.UriSchemeHttps
                && string.Equals(u.Host, OwnHost, StringComparison.OrdinalIgnoreCase)
                && u.IsDefaultPort
                && string.IsNullOrEmpty(u.UserInfo)
                && OwnPages.Contains(u.AbsolutePath);
        }
        private static string Short(string s) => s == null ? "" : (s.Length > 120 ? s.Substring(0, 120) + "…" : s);

        // ---------------- Klick-Filter: Klicks von TD Control sperren, echte Klicks erlauben ----------------
        private delegate IntPtr LowLevelMouseProc(int nCode, IntPtr wParam, IntPtr lParam);
        [System.Runtime.InteropServices.DllImport("user32.dll")] private static extern IntPtr SetWindowsHookEx(int id, LowLevelMouseProc fn, IntPtr mod, uint thread);
        [System.Runtime.InteropServices.DllImport("user32.dll")] private static extern bool UnhookWindowsHookEx(IntPtr h);
        [System.Runtime.InteropServices.DllImport("user32.dll")] private static extern IntPtr CallNextHookEx(IntPtr h, int n, IntPtr w, IntPtr l);
        [System.Runtime.InteropServices.DllImport("kernel32.dll")] private static extern IntPtr GetModuleHandle(string name);
        [System.Runtime.InteropServices.DllImport("user32.dll")] private static extern IntPtr WindowFromPoint(Point p);
        [System.Runtime.InteropServices.DllImport("user32.dll")] private static extern IntPtr GetAncestor(IntPtr h, uint flags);
        [System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)]
        private struct MSLLHOOKSTRUCT { public Point pt; public uint mouseData; public uint flags; public uint time; public IntPtr extra; }
        private const int WH_MOUSE_LL = 14;
        private LowLevelMouseProc clickProc;   // Referenz halten (sonst räumt der Garbage Collector sie weg)
        private IntPtr clickHook = IntPtr.Zero;
        private volatile string clickMode = "td";
        private volatile bool eyeCtl;
        private int blockedClicks;

        private void InstallClickFilter()
        {
            if (clickHook != IntPtr.Zero) return;
            clickProc = ClickFilter;
            clickHook = SetWindowsHookEx(WH_MOUSE_LL, clickProc, GetModuleHandle(null), 0);
            if (clickHook == IntPtr.Zero) Log.Write("Klick-Filter konnte nicht eingerichtet werden");
        }
        private void RemoveClickFilter()
        {
            if (clickHook != IntPtr.Zero) { UnhookWindowsHookEx(clickHook); clickHook = IntPtr.Zero; }
        }
        private IntPtr ClickFilter(int nCode, IntPtr wParam, IntPtr lParam)
        {
            try
            {
                int msg = wParam.ToInt32();
                bool button = msg == 0x201 || msg == 0x202 || msg == 0x204 || msg == 0x205 || msg == 0x207 || msg == 0x208;
                if (nCode >= 0 && button && clickMode == "td" && eyeCtl && active)
                {
                    var info = (MSLLHOOKSTRUCT)System.Runtime.InteropServices.Marshal.PtrToStructure(lParam, typeof(MSLLHOOKSTRUCT));
                    if ((info.flags & 0x1) != 0)                      // per Software erzeugt (z. B. TD Control)
                    {
                        var root = GetAncestor(WindowFromPoint(info.pt), 2 /* GA_ROOT */);
                        if (root == Handle)
                        {
                            if (msg == 0x201) { blockedClicks++; int n = blockedClicks; SafeInvoke(() => Post(new { t = "blocked", n })); }
                            return (IntPtr)1;
                        }
                    }
                }
            }
            catch { }
            return CallNextHookEx(clickHook, nCode, wParam, lParam);
        }

        private volatile bool active = true;
        private string midState = "?";
        private object gazeStream;
        private void UpdateActive()
        {
            bool now = WindowState != FormWindowState.Minimized && (ActiveForm == this || Has("--fakegaze") || Has("--evaljs"));
            if (now == active) return;
            active = now;
            try { gazeStream?.GetType().GetProperty("IsEnabled")?.SetValue(gazeStream, now); } catch { }
            if (webReady) Post(new { t = "focus", active = now });
        }

        // Aufruf im Fenster-Thread – nur solange das Fenster existiert
        private void SafeInvoke(Action a)
        {
            try { if (IsHandleCreated && !IsDisposed && !Disposing) BeginInvoke(a); } catch (Exception ex) { Log.Error("Weiterleitung an Fenster", ex); }
        }

        // ---------------- Bildschirmtastatur und Emoji-Auswahl (für die Einstellungen) ----------------
        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
        private const byte VK_LWIN = 0x5B, VK_OEM_PERIOD = 0xBE; private const uint KEYUP = 0x2;

        private async void OpenEmojiPanel()
        {
            await Task.Delay(150);
            if (ActiveForm != this) return;      // nur, wenn das ABC-Abenteuer vorne ist
            keybd_event(VK_LWIN, 0, 0, UIntPtr.Zero);
            keybd_event(VK_OEM_PERIOD, 0, 0, UIntPtr.Zero);
            keybd_event(VK_OEM_PERIOD, 0, KEYUP, UIntPtr.Zero);
            keybd_event(VK_LWIN, 0, KEYUP, UIntPtr.Zero);
        }

        [System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode)]
        private static extern IntPtr FindWindow(string cls, string title);
        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int w, int hgt, uint flags);
        private const uint SWP_NOZORDER = 0x4, SWP_NOACTIVATE = 0x10;
        private int oskPid;   // Prozess-Nummer der Bildschirmtastatur, die WIR geöffnet haben (0 = keine)

        // (4) Bildschirmtastatur: Nur eine selbst geöffnete wird wieder geschlossen – war sie schon offen
        // (z. B. von der Betreuung), bleibt sie offen.
        private async void ShowOsk(bool show, double top, double left, double right, bool dock = false)
        {
            try
            {
                var running = Process.GetProcessesByName("osk");
                if (!show)
                {
                    if (oskPid == 0) return;
                    foreach (var p in running.Where(p => p.Id == oskPid))
                        try { if (!p.CloseMainWindow() || !p.WaitForExit(800)) p.Kill(); } catch (Exception ex) { Log.Error("Bildschirmtastatur schließen", ex); }
                    Log.Write("Bildschirmtastatur geschlossen (Prozess " + oskPid + ")");
                    oskPid = 0;
                    return;
                }
                var origin = web.PointToScreen(Point.Empty);
                var area = Screen.FromControl(this).WorkingArea;
                int y = origin.Y + (int)(top * web.Height);
                int h = Math.Min(area.Bottom - y, (int)(area.Height * 0.46));
                if (h < 200) { h = 200; y = area.Bottom - h; }
                int w, x;
                if (dock)
                {
                    // angedockt: volle Breite, direkt unter dem Fenster bis zum unteren Bildschirmrand
                    h = area.Bottom - y; if (h < 200) { h = 200; y = area.Bottom - h; }
                    w = Math.Min(area.Width, (int)(h * 4.2));
                    x = area.Left + (area.Width - w) / 2;
                }
                else
                {
                    w = Math.Min(area.Width, (int)(h * 3.0));
                    int cx = origin.X + (int)((left + right) / 2 * web.Width);
                    x = Math.Max(area.Left, Math.Min(area.Right - w, cx - w / 2));
                }
                try
                {
                    using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Osk"))
                    { k.SetValue("WindowLeft", x); k.SetValue("WindowTop", y); k.SetValue("WindowWidth", w); k.SetValue("WindowHeight", h); }
                }
                catch { }
                if (running.Length == 0)
                {
                    string osk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "osk.exe");
                    var proc = Process.Start(new ProcessStartInfo(File.Exists(osk) ? osk : "osk.exe") { UseShellExecute = true });
                    // Prozess-Nummer merken (Start über Windows liefert sie nicht immer direkt)
                    for (int i = 0; i < 20 && oskPid == 0; i++)
                    {
                        try { oskPid = proc?.Id ?? 0; } catch { }
                        if (oskPid == 0) { var p2 = Process.GetProcessesByName("osk").FirstOrDefault(); if (p2 != null) oskPid = p2.Id; }
                        if (oskPid == 0) await Task.Delay(100);
                    }
                    Log.Write("Bildschirmtastatur geöffnet (Prozess " + oskPid + ")");
                }
                for (int i = 0; i < 30; i++)
                {
                    var hw = FindWindow("OSKMainClass", null);
                    if (hw != IntPtr.Zero) { SetWindowPos(hw, IntPtr.Zero, x, y, w, h, SWP_NOZORDER | SWP_NOACTIVATE); if (i > 3) break; }
                    await Task.Delay(100);
                }
            }
            catch (Exception ex) { Log.Error("Bildschirmtastatur", ex); Post(new { t = "toast", text = "Bildschirmtastatur konnte nicht geöffnet werden." }); }
        }

        private void Post(object o)
        {
            try { web.CoreWebView2?.PostWebMessageAsJson(json.Serialize(o)); } catch (Exception ex) { Log.Error("Nachricht an Oberfläche", ex); }
        }

        // ---------------- (3) Werte aus Nachrichten sicher lesen ----------------
        private static string Str(Dictionary<string, object> m, string k, int max, string def = "")
        {
            if (!m.TryGetValue(k, out object v) || !(v is string s)) return def;
            return s.Length > max ? s.Substring(0, max) : s;
        }
        private static double Num(Dictionary<string, object> m, string k, double min, double max, double def)
        {
            if (!m.TryGetValue(k, out object v) || v == null) return def;
            double d;
            try { d = Convert.ToDouble(v, CultureInfo.InvariantCulture); } catch { return def; }
            if (double.IsNaN(d) || double.IsInfinity(d)) return def;
            return Math.Max(min, Math.Min(max, d));
        }
        private static bool Bool(Dictionary<string, object> m, string k, bool def = false) => m.TryGetValue(k, out object v) && v is bool b ? b : def;
        private static readonly HashSet<string> ClickModes = new HashSet<string> { "td", "eyes", "always", "off" };

        // ---------------- Nachrichten aus der Oberfläche ----------------
        private void OnWebMessage(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            // (2) Nur Nachrichten der eigenen Oberfläche annehmen
            if (!IsOwn(e.Source)) { Log.Write("Nachricht von fremder Quelle ignoriert: " + Short(e.Source)); return; }
            Dictionary<string, object> m;
            try { m = json.Deserialize<Dictionary<string, object>>(e.WebMessageAsJson); }
            catch (Exception ex) { Log.Error("Nachricht lesen", ex); return; }
            if (m == null) return;
            string type = Str(m, "t", 20);
            try
            {
                switch (type)
                {
                    case "speak":
                        Speak((int)Num(m, "id", int.MinValue, int.MaxValue, 0), Str(m, "text", 2000), Str(m, "voice", 200),
                              Num(m, "rate", 0.3, 2.0, 1.0), (int)Num(m, "volume", 0, 100, 100));
                        break;
                    case "stop": try { tts?.SpeakAsyncCancelAll(); } catch (Exception ex) { Log.Error("Sprachausgabe stoppen", ex); } break;
                    case "clickpolicy":
                        string mode = Str(m, "mode", 10, "td");
                        clickMode = ClickModes.Contains(mode) ? mode : "td";
                        eyeCtl = Bool(m, "eye");
                        break;
                    case "emojipanel": OpenEmojiPanel(); break;
                    case "osk":
                        ShowOsk(Bool(m, "show"), Num(m, "top", 0, 1, 0.6), Num(m, "left", 0, 1, 0.2), Num(m, "right", 0, 1, 0.8), Bool(m, "dock"));
                        break;
                    case "manual": OpenManual(); break;
                    case "quit":
                        if (Has("--quittest")) File.WriteAllText(Path.Combine(Path.GetDirectoryName(Application.ExecutablePath), "selbsttest.txt"), "beendet per Tuer-Knopf + Ja nach " + (DateTime.Now - Process.GetCurrentProcess().StartTime).TotalSeconds.ToString("0.0") + " s", Encoding.UTF8);
                        SafeInvoke(Close); break;
                    case "setgpu": SetConfigFlag("nogpu", Bool(m, "off")); break;
                    case "backup":
                        string data = Str(m, "data", 8 * 1024 * 1024);
                        if (data.Length < 10) { Log.Write("Leere Sicherung ignoriert"); break; }
                        SafeInvoke(() => SaveBackup(data, Str(m, "name", 80, "ABC-Abenteuer-Sicherung")));
                        break;
                    case "restore": SafeInvoke(LoadBackup); break;
                    case "log": Log.Write("Oberfläche: " + Str(m, "text", 500)); break;
                    default: Log.Write("Unbekannte Nachricht ignoriert: " + Short(type)); break;
                }
            }
            catch (Exception ex) { Log.Error("Nachricht \"" + type + "\" verarbeiten", ex); }
        }

        private void OpenManual()
        {
            try
            {
                string man = Path.GetFullPath(Path.Combine(Path.GetDirectoryName(Application.ExecutablePath), "..", "Anleitung.html"));
                if (File.Exists(man)) Process.Start(new ProcessStartInfo(man) { UseShellExecute = true });
                else MessageBox.Show("Die Anleitung wurde nicht gefunden: " + man, "ABC-Abenteuer");
            }
            catch (Exception ex) { Log.Error("Anleitung öffnen", ex); MessageBox.Show("Die Anleitung konnte nicht geöffnet werden: " + ex.Message, "ABC-Abenteuer"); }
        }

        // ---------------- (13) Sicherung speichern / laden ----------------
        private void SaveBackup(string data, string name)
        {
            try
            {
                foreach (char c in Path.GetInvalidFileNameChars()) name = name.Replace(c, '-');
                using (var dlg = new SaveFileDialog
                {
                    Title = "Lernfortschritt sichern",
                    Filter = "ABC-Abenteuer-Sicherung (*.json)|*.json",
                    FileName = name + ".json",
                    InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    OverwritePrompt = true,
                })
                {
                    if (dlg.ShowDialog(this) != DialogResult.OK) { Post(new { t = "backupdone", ok = false, cancelled = true }); return; }
                    File.WriteAllText(dlg.FileName, data, new UTF8Encoding(false));
                    Log.Write("Sicherung gespeichert: " + dlg.FileName);
                    Post(new { t = "backupdone", ok = true, path = dlg.FileName });
                }
            }
            catch (Exception ex) { Log.Error("Sicherung speichern", ex); Post(new { t = "backupdone", ok = false, error = ex.Message }); }
        }
        private void LoadBackup()
        {
            try
            {
                using (var dlg = new OpenFileDialog
                {
                    Title = "Sicherung laden",
                    Filter = "ABC-Abenteuer-Sicherung (*.json)|*.json",
                    InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                })
                {
                    if (dlg.ShowDialog(this) != DialogResult.OK) return;
                    var fi = new FileInfo(dlg.FileName);
                    if (fi.Length > 8 * 1024 * 1024) { Post(new { t = "restoredata", ok = false, error = "Die Datei ist zu groß." }); return; }
                    Post(new { t = "restoredata", ok = true, data = File.ReadAllText(dlg.FileName, Encoding.UTF8) });
                }
            }
            catch (Exception ex) { Log.Error("Sicherung laden", ex); Post(new { t = "restoredata", ok = false, error = ex.Message }); }
        }

        // ---------------- (8) Sprachausgabe mit Windows-Stimmen (SAPI) ----------------
        private List<string> voiceNames = new List<string>();
        private void SendVoices()
        {
            try
            {
                if (tts == null && !ttsBroken)
                {
                    tts = new SpeechSynthesizer();
                    tts.SetOutputToDefaultAudioDevice();
                    tts.SpeakProgress += (s, e) => Post(new { t = "word", id = ttsId, pos = e.CharacterPosition });
                    tts.SpeakCompleted += OnCompleted;
                }
                var list = tts == null ? new List<InstalledVoice>() : tts.GetInstalledVoices()
                    .Where(v => v.Enabled && v.VoiceInfo.Culture.Name.StartsWith("de", StringComparison.OrdinalIgnoreCase)).ToList();
                voiceNames = list.Select(v => v.VoiceInfo.Name).ToList();
                Post(new { t = "voices", list = list.Select(v => new { name = v.VoiceInfo.Name, lang = v.VoiceInfo.Culture.Name, gender = v.VoiceInfo.Gender.ToString() }).ToList() });
            }
            catch (Exception ex)
            {
                ttsBroken = true; tts = null;
                Log.Error("Windows-Stimmen laden", ex);
                Post(new { t = "voices", list = new object[0] });
            }
        }

        private readonly Dictionary<Prompt, int> pending = new Dictionary<Prompt, int>();
        private void Speak(int id, string text, string voice, double rate, int volume)
        {
            try
            {
                if (tts == null) SendVoices();
                if (tts == null) { Post(new { t = "end", id }); return; }      // keine Sprachausgabe verfügbar: sofort "fertig"
                tts.SpeakAsyncCancelAll();
                lock (pending) pending.Clear();
                ttsId = id;
                if (voiceNames.Contains(voice)) { try { tts.SelectVoice(voice); } catch (Exception ex) { Log.Error("Stimme wählen", ex); } }
                tts.Rate = Math.Max(-10, Math.Min(10, (int)Math.Round((rate - 1) * 10)));
                tts.Volume = Math.Max(0, Math.Min(100, volume));
                var prompt = new PromptBuilder();
                prompt.AppendText(text ?? "");
                var p = new Prompt(prompt);
                lock (pending) pending[p] = id;
                tts.SpeakAsync(p);
            }
            catch (Exception ex) { Log.Error("Sprechen", ex); Post(new { t = "end", id }); }
        }
        private void OnCompleted(object s, SpeakCompletedEventArgs e)
        {
            if (e.Error != null) Log.Error("Sprachausgabe", e.Error);
            int id = 0; bool found = false;
            lock (pending) { if (e.Prompt != null && pending.TryGetValue(e.Prompt, out id)) { pending.Remove(e.Prompt); found = true; } }
            if (found) Post(new { t = "end", id });
        }

        // ---------------- (9) Augensteuerung (Tobii Core SDK) ----------------
        private Timer eyeRetry;
        private int eyeErrors, eyeTries;
        private void StartEyeTracking()
        {
            try
            {
                eyeHost = new Tobii.Interaction.Host();
                var stream = eyeHost.Streams.CreateGazePointDataStream(Tobii.Interaction.Framework.GazePointDataMode.LightlyFiltered);
                gazeStream = stream;
                stream.GazePoint((x, y, ts) =>
                {
                    try
                    {
                        gazeCount++;
                        if (double.IsNaN(x) || double.IsNaN(y) || double.IsInfinity(x) || double.IsInfinity(y)) return;
                        var now = DateTime.UtcNow;
                        if ((now - lastSend).TotalMilliseconds < 15) return;       // höchstens ~60 pro Sekunde
                        lastSend = now;
                        if (!webReady || !active) return;
                        SafeInvoke(() => SendGaze(x, y));
                    }
                    catch (Exception ex) { if (eyeErrors++ < 5) Log.Error("Blickdaten", ex); }
                });
                eyeInfo = "verbunden";
                eyeHost.States.GetEyeTrackingDeviceStatusAsync().ContinueWith(t =>
                {
                    try { eyeInfo = "Gerätestatus: " + t.Result.Value; } catch { }
                });
                Log.Write(eyeTries > 0 ? "Augensteuerung verbunden (nach " + eyeTries + " Versuchen)" : "Augensteuerung verbunden");
                eyeRetry?.Stop();
            }
            catch (Exception ex)
            {
                // Keine Augensteuerung / Tobii-Software noch nicht bereit: später erneut versuchen, Programm läuft weiter
                eyeInfo = "nicht verfügbar: " + ex.GetBaseException().Message;
                eyeTries++;
                // Protokoll nicht fluten: erster Fehler, dann etwa jede Stunde einmal
                if (eyeTries == 1 || eyeTries % 240 == 0) Log.Error("Augensteuerung verbinden (Versuch " + eyeTries + ")", ex);
                try { eyeHost?.Dispose(); } catch { }
                eyeHost = null;
                if (eyeRetry == null)
                {
                    // Solange das Programm läuft und keine Verbindung besteht: alle 15 s erneut versuchen (unbegrenzt)
                    eyeRetry = new Timer { Interval = 15000 };
                    eyeRetry.Tick += (s, e) =>
                    {
                        if (eyeHost != null || IsDisposed) { eyeRetry.Stop(); return; }
                        StartEyeTracking();
                    };
                    eyeRetry.Start();
                }
            }
        }

        // Blickpunkt (Bildschirm-Pixel) -> Anteil der Fensterfläche (0..1)
        private void SendGaze(double x, double y)
        {
            try
            {
                if (web.CoreWebView2 == null || web.Width <= 0 || web.Height <= 0) return;
                var origin = web.PointToScreen(Point.Empty);
                double nx = (x - origin.X) / web.Width, ny = (y - origin.Y) / web.Height;
                // weit außerhalb des Fensters (Messfehler) -> verwerfen
                if (nx < -0.5 || nx > 1.5 || ny < -0.5 || ny > 1.5) return;
                string msg = "{\"t\":\"gaze\",\"x\":" + nx.ToString("0.0000", CultureInfo.InvariantCulture)
                           + ",\"y\":" + ny.ToString("0.0000", CultureInfo.InvariantCulture) + "}";
                web.CoreWebView2.PostWebMessageAsJson(msg);
            }
            catch (Exception ex) { if (eyeErrors++ < 5) Log.Error("Blickpunkt senden", ex); }
        }

        // ---------------- Test ohne Kamera: simulierte Blicke ----------------
        private async void FakeGazeTest()
        {
            var log = new StringBuilder();
            while (!webReady) await Task.Delay(100);
            await Task.Delay(1500);
            int di = Array.IndexOf(args, "--dwell");
            if (di >= 0 && di + 1 < args.Length) await web.CoreWebView2.ExecuteScriptAsync("S.dwellMs=" + int.Parse(args[di + 1]));
            var rnd = new Random();
            async Task LookAt(string selector, int ms)
            {
                string r = await web.CoreWebView2.ExecuteScriptAsync("(()=>{const b=[...document.querySelectorAll('" + selector + "')].find(e=>e.getBoundingClientRect().width>0).getBoundingClientRect();return [ (b.left+b.width/2)/innerWidth, (b.top+b.height/2)/innerHeight ];})()");
                var parts = r.Trim('[', ']').Split(',');
                double nx = double.Parse(parts[0], CultureInfo.InvariantCulture), ny = double.Parse(parts[1], CultureInfo.InvariantCulture);
                var origin = web.PointToScreen(Point.Empty);
                string t0 = await web.CoreWebView2.ExecuteScriptAsync("performance.now()");
                for (int t = 0; t < ms; t += 16)
                {
                    SendGaze(origin.X + nx * web.Width + rnd.Next(-25, 26), origin.Y + ny * web.Height + rnd.Next(-25, 26));
                    await Task.Delay(16);
                }
                log.AppendLine(selector + " -> " + await web.CoreWebView2.ExecuteScriptAsync("document.querySelector('.screen.active').id + ' / ' + (G.game||'-')")
                    + "   ausgewählt nach ms: " + await web.CoreWebView2.ExecuteScriptAsync("(window.FIRELOG||[]).filter(f=>f.t>" + t0 + ").map(f=>Math.round(f.t-" + t0 + ")+' ('+f.what+')').join(', ')"));
            }
            await LookAt("#btnStart, #startProfiles .ptile", 3000);
            await Task.Delay(1500);
            await LookAt("#menuGrid .tile:nth-child(3)", 3000);
            await Task.Delay(500);
            File.WriteAllText(Path.Combine(Path.GetDirectoryName(Application.ExecutablePath), "selbsttest.txt"), log.ToString(), Encoding.UTF8);
            Close();
        }

        // Entwicklung: "--evaljs datei.js 10" führt ein Skript aus und schreibt nach 10 s window.RESULT in selbsttest.txt
        private async void EvalJsTest()
        {
            TopMost = true; Activate();
            int i = Array.IndexOf(args, "--evaljs");
            string file = args[i + 1]; int sec = int.Parse(args[i + 2]);
            while (!webReady) await Task.Delay(100);
            await Task.Delay(1500);
            await web.CoreWebView2.ExecuteScriptAsync(File.ReadAllText(file));
            await Task.Delay(sec * 1000);
            string r = await web.CoreWebView2.ExecuteScriptAsync("JSON.stringify(window.RESULT)");
            File.WriteAllText(Path.Combine(Path.GetDirectoryName(Application.ExecutablePath), "selbsttest.txt"), r, Encoding.UTF8);
            Close();
        }

        private async void QuitTest()
        {
            while (!webReady) await Task.Delay(100);
            await Task.Delay(1000);
            await web.CoreWebView2.ExecuteScriptAsync("S.muted=true; startApp(); setTimeout(()=>{const q=document.querySelector('#btnQuit'); q._onSelect(q); setTimeout(()=>{q._onSelect(q); setTimeout(()=>{const y=document.querySelector('#quitYes'); y._onSelect(y);},1000);}, 1500);}, 500);");
            await Task.Delay(9000);
            if (IsDisposed) return;
            File.WriteAllText(Path.Combine(Path.GetDirectoryName(Application.ExecutablePath), "selbsttest.txt"), "NICHT beendet", Encoding.UTF8);
            Close();
        }

        // ---------------- Selbsttest (nur für die Entwicklung) ----------------
        private void RunSelfTest(int sec)
        {
            var tm = new Timer { Interval = Math.Max(1, sec * 500) };
            tm.Tick += async (s, e) => { tm.Stop(); midState = await web.CoreWebView2.ExecuteScriptAsync("Native.n") + " (aktiv: " + active + ")"; };
            tm.Start();
            var t = new Timer { Interval = sec * 1000 };
            t.Tick += async (s, e) =>
            {
                t.Stop();
                string state = "?";
                try
                {
                    state = await web.CoreWebView2.ExecuteScriptAsync(
                        "JSON.stringify({native: Native.on, eye: Native.eye, msgs: Native.n, screen: document.querySelector('.screen.active').id, " +
                        "version: APP_VERSION, csp: window.CSP_VIOLATIONS||0, jsErrors: window.JS_ERRORS||0, storageOk: window.STORAGE_OK, sapi: NativeTTS.voices.map(v=>v.name)})");
                }
                catch (Exception ex) { state = "Fehler: " + ex.Message; }
                var sb = new StringBuilder();
                sb.AppendLine("Blickmeldungen zur Halbzeit: " + midState + ", am Ende aktiv: " + active);
                sb.AppendLine("Augensteuerung: " + eyeInfo + ", Blickpunkte empfangen: " + gazeCount);
                sb.AppendLine("Oberfläche: " + state);
                File.WriteAllText(Path.Combine(Path.GetDirectoryName(Application.ExecutablePath), "selbsttest.txt"), sb.ToString(), Encoding.UTF8);
                Close();
            };
            t.Start();
        }
    }
}
