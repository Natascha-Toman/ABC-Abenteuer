# ABC-Abenteuer – fertiges Programm aus dem Quellcode erstellen
#
#   Quellcode (hier bearbeiten):                Fertiges Programm (wird erzeugt, nicht von Hand ändern):
#     web\            Oberfläche (HTML/JS/CSS,    ..\ABC-Lernprogramm\
#                     Schrift, Silben-Töne)          ABC-Abenteuer.exe   (Start-Symbol)
#     ABC-Abenteuer\  Hauptprogramm (C#)             Anleitung.html      (Bilder eingebettet)
#     Starter\        Start-Symbol (C#)              files\              (Oberfläche + Hauptprogramm)
#     Anleitung-Vorlage.html, anleitung-bilder\    ..\ABC-Abenteuer.zip  (zum Weitergeben)
#
# Aufruf:  powershell -ExecutionPolicy Bypass -File erstellen.ps1
$ErrorActionPreference = "Stop"
$src    = $PSScriptRoot
$target = Join-Path (Split-Path $src -Parent) "ABC-Lernprogramm"
$files  = Join-Path $target "files"
$zip    = Join-Path (Split-Path $src -Parent) "ABC-Abenteuer.zip"
$dotnet = "C:\Program Files\dotnet\dotnet.exe"

Write-Host "1/5  Programme bauen ..."
foreach ($p in "ABC-Abenteuer\ABC-Abenteuer.csproj", "Starter\Starter.csproj") {
    & $dotnet build (Join-Path $src $p) -c Release --nologo -v q
    if ($LASTEXITCODE -ne 0) { throw "Build fehlgeschlagen: $p" }
}

Write-Host "2/5  Oberfläche kopieren ..."
# Silben-Tondateien fehlen (z. B. frisch aus dem Repository)? Dann aus der Lautschrift erzeugen.
if (-not (Get-ChildItem (Join-Path $src "web\silben") -Filter *.wav -ErrorAction SilentlyContinue)) {
    Write-Host "     Silben-Tondateien erzeugen ..."
    & python (Join-Path $src "silben-erzeugen.py")
    if ($LASTEXITCODE -ne 0) { throw "Silben-Tondateien konnten nicht erzeugt werden" }
}
if (-not $files.EndsWith("ABC-Lernprogramm\files")) { throw "Unerwarteter Zielordner: $files" }
New-Item -ItemType Directory -Force $files | Out-Null
# Spiegeln: im Zielordner wird alles entfernt, was es im Quellcode nicht (mehr) gibt –
# Programmdateien (exe/dll/config) sind davon ausgenommen und werden in Schritt 3 erneuert.
robocopy (Join-Path $src "web") $files /MIR /NFL /NDL /NJH /NJS /NP /XF *.exe *.dll *.config selbsttest.txt | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Kopieren der Oberfläche fehlgeschlagen" }

Write-Host "3/5  Programmdateien kopieren ..."
$bin = Join-Path $src "ABC-Abenteuer\bin\Release\net48"
foreach ($f in "ABC-Abenteuer.exe", "ABC-Abenteuer.exe.config", "Microsoft.Web.WebView2.Core.dll", "Microsoft.Web.WebView2.WinForms.dll",
               "WebView2Loader.dll", "Tobii.EyeX.Client.dll", "Tobii.Interaction.Model.dll", "Tobii.Interaction.Net.dll") {
    Copy-Item (Join-Path $bin $f) $files -Force
}
Copy-Item (Join-Path $src "Starter\bin\Release\net48\ABC-Abenteuer.exe") (Join-Path $target "ABC-Abenteuer.exe") -Force
# Lizenzhinweise gehören zum weitergegebenen Programm
robocopy (Join-Path $src "lizenzen") (Join-Path $target "lizenzen") /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Kopieren der Lizenztexte fehlgeschlagen" }
foreach ($f in "THIRD-PARTY-LICENSES.md", "LICENSE") {
    if (Test-Path (Join-Path $src $f)) { Copy-Item (Join-Path $src $f) $target -Force }
}

Write-Host "4/5  Anleitung erstellen ..."
& python (Join-Path $src "anleitung-einbetten.py")
if ($LASTEXITCODE -ne 0) { throw "Anleitung konnte nicht erstellt werden" }

Write-Host "5/5  ZIP erstellen ..."
Compress-Archive -Path $target -DestinationPath $zip -Force
$v = (Get-Item (Join-Path $files "ABC-Abenteuer.exe")).VersionInfo.ProductVersion
Write-Host ("Fertig: Version {0}, ZIP {1:N1} MB" -f $v, ((Get-Item $zip).Length / 1MB))
