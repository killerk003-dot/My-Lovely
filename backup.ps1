<#
=========================================================
MY LOVELY - CRITICAL FILE SNAPSHOT BACKUP
=========================================================

Creates a timestamped zip of the project inside a
"backups" folder, then prunes old snapshots so only the
most recent ones are kept.

This covers the "Critical Dependencies" from
PROJECT-STATUS.md:

    shared.js, decor.css, khalilpfp.jpg, ilhampfp.jpg,
    Chat.json / Chat2.0.json / Chat3.0.json, story-data.js

...plus every other source file, so a snapshot can fully
restore the site on its own.

USAGE
-----
    # from the project folder
    powershell -ExecutionPolicy Bypass -File .\backup.ps1

    # keep the last 15 snapshots instead of the default 10
    powershell -ExecutionPolicy Bypass -File .\backup.ps1 -Keep 15

    # skip the large chat exports (smaller, faster snapshots)
    powershell -ExecutionPolicy Bypass -File .\backup.ps1 -SkipChatData

NOTE
----
localStorage data (Quran log, watchlist, dates, secret
drafts, starred moments) does NOT live in these files. Use
backup.html in the browser to export those.
=========================================================
#>

[CmdletBinding()]
param(

    # How many snapshots to keep before pruning the oldest.
    [int]$Keep = 10,

    # Leave out the multi-megabyte chat exports when you just
    # want a quick snapshot of the code.
    [switch]$SkipChatData

)

$ErrorActionPreference = "Stop"

# The folder this script sits in is the project root.
$root = $PSScriptRoot
$backupDir = Join-Path $root "backups"

if (-not (Test-Path -LiteralPath $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$zipName = "my-lovely-$stamp.zip"
$zipPath = Join-Path $backupDir $zipName

# Everything except the backups folder, the .git database
# and editor junk. The critical dependencies are all in here.
$excludeNames = @("backups", ".git", ".vscode", ".idea", "node_modules")

$chatFiles = @("Chat.json", "Chat2.0.json", "Chat3.0.json", "whatsapp-export.txt")

Write-Host ""
Write-Host "My Lovely - snapshot backup" -ForegroundColor Magenta
Write-Host "Project : $root"
Write-Host "Output  : $zipPath"
Write-Host ""

# Collect the files to archive.
$files = Get-ChildItem -LiteralPath $root -File -Recurse | Where-Object {

    $relative = $_.FullName.Substring($root.Length).TrimStart('\', '/')

    # Skip anything inside an excluded folder.
    $inExcluded = $false
    foreach ($name in $excludeNames) {
        if ($relative -like "$name\*" -or $relative -eq $name) {
            $inExcluded = $true
            break
        }
    }

    if ($inExcluded) { return $false }

    # Optionally skip the heavy chat data.
    if ($SkipChatData -and ($chatFiles -contains $_.Name)) { return $false }

    return $true
}

if (-not $files) {
    Write-Warning "No files found to back up."
    exit 1
}

$totalMb = [math]::Round((($files | Measure-Object -Property Length -Sum).Sum) / 1MB, 1)
Write-Host ("Archiving {0} files ({1} MB)..." -f $files.Count, $totalMb)

# Build a staging list of relative paths so the zip keeps
# the folder structure intact.
$relativePaths = $files | ForEach-Object {
    $_.FullName.Substring($root.Length).TrimStart('\', '/')
}

# Compress into the snapshot zip.
Compress-Archive -Path $relativePaths -DestinationPath $zipPath -Force

$zipKb = [math]::Round((Get-Item -LiteralPath $zipPath).Length / 1KB, 1)
Write-Host ("Done: {0} ({1} KB)" -f $zipName, $zipKb) -ForegroundColor Green

# --- Prune old snapshots ---------------------------------

$snapshots = Get-ChildItem -LiteralPath $backupDir -Filter "my-lovely-*.zip" |
    Sort-Object LastWriteTime -Descending

if ($snapshots.Count -gt $Keep) {

    $stale = $snapshots | Select-Object -Skip $Keep

    foreach ($old in $stale) {
        Remove-Item -LiteralPath $old.FullName -Force
        Write-Host ("Pruned old snapshot: {0}" -f $old.Name) -ForegroundColor DarkGray
    }
}

Write-Host ("Snapshots kept: {0} of {1}" -f ([math]::Min($snapshots.Count, $Keep)), $Keep) -ForegroundColor Magenta
Write-Host ""