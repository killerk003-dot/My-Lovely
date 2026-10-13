$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location ".."

$cssRaw = Get-Content "decor.css" -Raw
$cssNoComments = [regex]::Replace($cssRaw, '/\*[\s\S]*?\*/', '')

# classes defined in decor.css
$defined = [regex]::Matches($cssNoComments, '\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)') |
    ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

# gather class tokens actually present in html + js, split on whitespace/quotes
$files = Get-ChildItem -File | Where-Object { $_.Extension -in ".html", ".js" }
$tokens = New-Object System.Collections.Generic.HashSet[string]
foreach ($f in $files) {
    $t = Get-Content $f.FullName -Raw
    foreach ($m in [regex]::Matches($t, 'class="([^"]*)"')) {
        ($m.Groups[1].Value -split '\s+') | Where-Object { $_ } | ForEach-Object { [void]$tokens.Add($_) }
    }
    foreach ($m in [regex]::Matches($t, 'class="' )) { }
    # JS string literals that look like class names
    foreach ($m in [regex]::Matches($t, 'classList\.(?:add|remove|toggle|contains)\(\s*[''"]([^''"]+)[''"]')) {
        ($m.Groups[1].Value -split '\s+') | ForEach-Object { [void]$tokens.Add($_) }
    }
    foreach ($m in [regex]::Matches($t, 'className\s*=\s*[''"]([^''"]+)[''"]')) {
        ($m.Groups[1].Value -split '\s+') | Where-Object { $_ } | ForEach-Object { [void]$tokens.Add($_) }
    }
    foreach ($m in [regex]::Matches($t, '(?:element|createElement)[^\n]*?\[''"]([a-z][a-z0-9-]*(?:-[a-z0-9-]+)*)[''"]')) { }
    foreach ($m in [regex]::Matches($t, "[''"]([a-z][a-z0-9]*(?:-[a-z0-9]+)+)[''"]")) { }
}
$tokenList = $tokens | Sort-Object -Unique

# page css files
$pageCss = @{}
foreach ($p in Get-ChildItem -File -Filter "*.css" | Where-Object { $_.Name -ne "decor.css" }) {
    $c = [regex]::Replace((Get-Content $p.FullName -Raw), '/\*[\s\S]*?\*/', '')
    foreach ($m in [regex]::Matches($c, '\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)')) {
        $pageCss[$m.Groups[1].Value] = $p.Name
    }
}

Write-Output "================ USED IN MARKUP BUT NOT DEFINED IN decor.css ================"
foreach ($tk in $tokenList) {
    if ($tk -match '^(js|reveal-failsafe)$') { continue }
    $isWord = $tk -match '^[A-Za-z][A-Za-z0-9_-]*$'
    if (-not $isWord) { continue }
    if ($defined -notcontains $tk) {
        $where = if ($pageCss.ContainsKey($tk)) { "(defined in " + $pageCss[$tk] + ")" } else { "*** DEFINED NOWHERE ***" }
        Write-Output ("MISSING  {0,-32} {1}" -f $tk, $where)
    }
}

Write-Output ""
Write-Output "================ DEFINED IN decor.css BUT NEVER USED (word-boundary) ================"
$body = (($files | ForEach-Object { Get-Content $_.FullName -Raw }) -join " ")
$dead = @()
foreach ($d in $defined) {
    if ($d -match '^(js|reveal-failsafe)$') { continue }
    $pattern = '(?<![\w-])' + [regex]::Escape($d) + '(?![\w-])'
    if ($body -notmatch $pattern) { $dead += $d }
}
$dead | ForEach-Object { Write-Output ("DEAD  " + $_) }
Write-Output ""
Write-Output ("defined=" + $defined.Count + " usedTokens=" + $tokenList.Count + " dead=" + $dead.Count)

Write-Output ""
Write-Output "================ DUPLICATE SELECTORS WITHIN decor.css ================"
# top level rule prelude before {
$blocks = [regex]::Matches($cssNoComments, '(?<sel>[^{}@;]+)\{')
$counts = @{}
foreach ($b in $blocks) {
    $s = ($b.Groups['sel'].Value -replace '\s+', ' ').Trim()
    if ($s -match '^\s*$') { continue }
    if ($s.StartsWith('@')) { continue }
    if (-not $counts.ContainsKey($s)) { $counts[$s] = 0 }
    $counts[$s] += 1
}
$counts.GetEnumerator() | Where-Object { $_.Value -gt 1 -or ($_.Key -split ',').Count -gt 0 } |
    Sort-Object Name | ForEach-Object {
        if ($_.Value -gt 1) { Write-Output ("OCCURS " + $_.Value + "x  ::  " + $_.Key) }
    }
