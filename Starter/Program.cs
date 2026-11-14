// Start-Symbol (Eule) im Hauptordner: startet das eigentliche Programm im Unterordner (z. B. "files").
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows.Forms;

internal static class Starter
{
    [STAThread]
    private static void Main(string[] args)
    {
        string dir = Path.GetDirectoryName(Application.ExecutablePath);
        // Das Programm liegt in einem Unterordner – der Name ist egal (z. B. "files" oder "programm")
        string exe = new[] { "files", "programm" }.Select(f => Path.Combine(dir, f, "ABC-Abenteuer.exe")).FirstOrDefault(File.Exists);
        if (exe == null)
        {
            try
            {
                exe = Directory.GetDirectories(dir)
                    .Select(d => Path.Combine(d, "ABC-Abenteuer.exe"))
                    .FirstOrDefault(f => File.Exists(f) && File.Exists(Path.Combine(Path.GetDirectoryName(f), "index.html")));
            }
            catch { }
        }
        if (exe == null)
        {
            MessageBox.Show("Das Programm wurde nicht gefunden.\n\nBitte den Programm-Ordner (z. B. \"files\") neben diese Datei kopieren.",
                "ABC-Abenteuer", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }
        try
        {
            var psi = new ProcessStartInfo(exe, string.Join(" ", args.Select(QuoteArg)))
            {
                WorkingDirectory = Path.GetDirectoryName(exe),
                UseShellExecute = false,
            };
            Process.Start(psi);
        }
        catch (Exception ex)
        {
            MessageBox.Show("Das Programm konnte nicht gestartet werden:\n" + ex.Message, "ABC-Abenteuer", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    // Startparameter korrekt nach den Windows-Regeln einschließen (Leerzeichen, Anführungszeichen,
    // abschließende Backslashes) – damit kommen sie im Programm unverändert an.
    internal static string QuoteArg(string a)
    {
        if (a == null) return "\"\"";
        if (a.Length > 0 && a.IndexOfAny(new[] { ' ', '\t', '\n', '\v', '"' }) < 0) return a;
        var sb = new StringBuilder("\"");
        int backslashes = 0;
        foreach (char c in a)
        {
            if (c == '\\') { backslashes++; continue; }
            if (c == '"') { sb.Append('\\', backslashes * 2 + 1).Append('"'); backslashes = 0; continue; }
            sb.Append('\\', backslashes).Append(c);
            backslashes = 0;
        }
        sb.Append('\\', backslashes * 2).Append('"');
        return sb.ToString();
    }
}
