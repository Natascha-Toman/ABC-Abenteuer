# ABC-Abenteuer – Paket für den Microsoft Store erstellen (.msix)
#
# Voraussetzung: vorher erstellen.ps1 ausführen (baut ..\ABC-Lernprogramm).
# Ergebnis:      ..\ABC-Abenteuer-<Version>.msix  → im Partner Center hochladen.
#                Der Store signiert das Paket selbst, ein eigenes Zertifikat ist nicht nötig.
#
# Aufruf:  powershell -ExecutionPolicy Bypass -File erstellen-store.ps1
$ErrorActionPreference = "Stop"
$src    = $PSScriptRoot
$parent = Split-Path $src -Parent
$prog   = Join-Path $parent "ABC-Lernprogramm"
$layout = Join-Path $parent "ABC-Store-Paket"

# --- Werkzeug MakeAppx (aus dem offiziellen NuGet-Paket Microsoft.Windows.SDK.BuildTools) ---
$btVer = "10.0.28000.2526"
$bt    = Join-Path $env:USERPROFILE ".nuget\packages\microsoft.windows.sdk.buildtools\$btVer"
if (-not (Test-Path $bt)) {
    Write-Host "MakeAppx herunterladen (Microsoft.Windows.SDK.BuildTools $btVer) ..."
    $tmp = Join-Path $env:TEMP "sdkbuildtools.zip"
    Invoke-WebRequest "https://api.nuget.org/v3-flatcontainer/microsoft.windows.sdk.buildtools/$btVer/microsoft.windows.sdk.buildtools.$btVer.nupkg" -OutFile $tmp -UseBasicParsing
    Expand-Archive $tmp $bt -Force
    Remove-Item $tmp
}
$makeappx = Get-ChildItem $bt -Recurse -Filter makeappx.exe | Where-Object { $_.FullName -match "\\x64\\" } | Select-Object -First 1
if (-not $makeappx) { throw "makeappx.exe nicht gefunden" }

# --- Identität aus dem Partner Center ---
$id = @{}
Get-Content (Join-Path $src "store\store-identitaet.txt") -Encoding UTF8 | Where-Object { $_ -match "^\s*([A-Z_]+)\s*=\s*(.+?)\s*$" } | ForEach-Object { $id[$Matches[1]] = $Matches[2] }
foreach ($k in "IDENTITY_NAME", "PUBLISHER", "PUBLISHER_DISPLAY_NAME") { if (-not $id[$k]) { throw "store-identitaet.txt: $k fehlt" } }
$test = $id["PUBLISHER"] -match "PLATZHALTER"

# --- Version aus dem fertigen Programm (Store verlangt x.y.z.0) ---
$exe = Join-Path $prog "files\ABC-Abenteuer.exe"
if (-not (Test-Path $exe)) { throw "Erst erstellen.ps1 ausführen – $exe fehlt" }
$v = [Version](Get-Item $exe).VersionInfo.ProductVersion.Split("+")[0]
$version = "{0}.{1}.{2}.0" -f $v.Major, $v.Minor, [Math]::Max(0, $v.Build)

Write-Host "1/3  Paketinhalt zusammenstellen ..."
if (-not $layout.EndsWith("ABC-Store-Paket")) { throw "Unerwarteter Zielordner: $layout" }
if (Test-Path $layout) { Remove-Item $layout -Recurse -Force }
New-Item -ItemType Directory $layout | Out-Null
robocopy (Join-Path $prog "files") (Join-Path $layout "files") /E /NFL /NDL /NJH /NJS /NP /XF selbsttest.txt | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Kopieren fehlgeschlagen" }
robocopy (Join-Path $prog "lizenzen") (Join-Path $layout "lizenzen") /E /NFL /NDL /NJH /NJS /NP | Out-Null
foreach ($f in "Anleitung.html", "THIRD-PARTY-LICENSES.md", "LICENSE", "CHANGELOG.md") { Copy-Item (Join-Path $prog $f) $layout }
New-Item -ItemType Directory (Join-Path $layout "Bilder") | Out-Null
Copy-Item (Join-Path $src "store\Bilder\*Logo.png") (Join-Path $layout "Bilder")

$m = Get-Content (Join-Path $src "store\AppxManifest-Vorlage.xml") -Raw -Encoding UTF8
$m = $m.Replace("{{IDENTITY_NAME}}", [Security.SecurityElement]::Escape($id["IDENTITY_NAME"])).
        Replace("{{PUBLISHER}}", [Security.SecurityElement]::Escape($id["PUBLISHER"])).
        Replace("{{PUBLISHER_DISPLAY_NAME}}", [Security.SecurityElement]::Escape($id["PUBLISHER_DISPLAY_NAME"])).
        Replace("{{VERSION}}", $version)
[IO.File]::WriteAllText((Join-Path $layout "AppxManifest.xml"), $m, (New-Object Text.UTF8Encoding($false)))

Write-Host "2/3  Paket packen ..."
$msix = Join-Path $parent ("ABC-Abenteuer-{0}{1}.msix" -f $version, $(if ($test) { "-TEST" } else { "" }))
& $makeappx.FullName pack /d $layout /p $msix /o | Out-Null
if ($LASTEXITCODE -ne 0) { & $makeappx.FullName pack /d $layout /p $msix /o; throw "MakeAppx fehlgeschlagen" }

Write-Host "3/3  Fertig."
Write-Host ("Paket: {0} ({1:N1} MB), Version {2}" -f $msix, ((Get-Item $msix).Length / 1MB), $version)
if ($test) {
    Write-Host ""
    Write-Host "HINWEIS: store\store-identitaet.txt enthält noch PLATZHALTER." -ForegroundColor Yellow
    Write-Host "Dieses Paket ist nur ein Test und wird vom Store abgelehnt. Erst die Werte aus dem Partner Center eintragen." -ForegroundColor Yellow
}
