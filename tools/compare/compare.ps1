# 신정개발 홈페이지 — 나란히 비교 화면 서버 (44차)
# 켜기: 작업 폴더의 비교보기.bat 더블클릭 (또는 바탕화면 "신정개발 비교보기"). 설치하는 프로그램 없음.
# - 이 컴퓨터(localhost)에서 오는 요청만 받고, 읽기만 한다(파일을 쓰거나 지우는 요청은 없다).
#     /            비교 화면 (tools/compare/index.html)
#     /ui/…        비교 화면의 파일 (tools/compare/ 폴더)
#     /final/…     최종본 사본 ../_최종본_보기 (origin/main, 읽기 전용)
#     /work/…      작업 폴더 (지금 갈래 그대로)
#     /api/branch  작업 폴더의 지금 갈래 이름
#     /api/stamp   작업 폴더 HTML·CSS 가운데 가장 최근에 고친 시각 (자동 새로 고침용)
param([int]$Port = 4180, [switch]$NoBrowser, [switch]$NoFetch)

$ErrorActionPreference = 'Stop'
$work = [System.IO.Path]::GetFullPath((Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)).TrimEnd('\') + '\'
$final = [System.IO.Path]::GetFullPath((Join-Path $work '..\_최종본_보기')).TrimEnd('\') + '\'
$ui = [System.IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.png' = 'image/png'
  '.svg' = 'image/svg+xml'; '.woff2' = 'font/woff2'; '.woff' = 'font/woff'; '.txt' = 'text/plain; charset=utf-8'
  '.ico' = 'image/x-icon'; '.pdf' = 'application/pdf'
}

Write-Host ''
# 1) 최종본 사본을 origin/main 으로 새로 받기 (인터넷이 안 되면 건너뛰고 알린다)
if (-not (Test-Path (Join-Path $final 'index.html'))) {
  Write-Host '최종본 사본(../_최종본_보기)이 없습니다. Claude Code 에 "비교 보기가 안 열려. 확인해 줘" 라고 말해 주세요.' -ForegroundColor Yellow
}
elseif (-not $NoFetch) {
  Write-Host '최종본(main)을 새로 받는 중…'
  & git -C $work fetch origin --quiet 2>$null
  if ($LASTEXITCODE -ne 0) { Write-Host '인터넷 저장소에 연결하지 못해 새로 받기를 건너뜁니다. 왼쪽은 마지막으로 받은 최종본입니다.' -ForegroundColor Yellow }
  else {
    & git -C $final checkout --detach origin/main --quiet 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host '최종본 사본을 바꾸지 못했습니다. 왼쪽은 마지막으로 받은 최종본입니다.' -ForegroundColor Yellow }
  }
}
$finalRev = (& git -C $final log -1 --format='%h %ci' 2>$null)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() }
catch {
  Write-Host "비교 화면을 켜지 못했습니다. 포트 $Port 를 다른 프로그램이 쓰고 있습니다." -ForegroundColor Yellow
  Write-Host '이미 켜 둔 비교 화면 창이 있으면 그 창을 쓰거나 닫은 뒤 다시 켜 주세요.'
  exit 1
}
Write-Host '비교 화면이 켜졌습니다. 이 창을 닫으면 꺼집니다.' -ForegroundColor Green
Write-Host "주소: http://localhost:$Port/"
Write-Host "왼쪽 최종본: $final ($finalRev)"
Write-Host "오른쪽 작업 폴더: $work"
if (-not $NoBrowser) { Start-Process "http://localhost:$Port/" }

function Send($res, [int]$status, [byte[]]$bytes, [string]$type, [bool]$head) {
  $res.StatusCode = $status
  $res.Headers.Add('Cache-Control', 'no-store')
  $res.ContentType = $type
  $res.ContentLength64 = $bytes.Length
  if (-not $head -and $bytes.Length) { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
}
function SendText($res, [int]$status, [string]$text, [string]$type = 'text/plain; charset=utf-8') { Send $res $status ($utf8.GetBytes($text)) $type $false }
function Branch() {
  $h = Join-Path $work '.git\HEAD'
  if (-not (Test-Path $h)) { return '' }
  $t = [System.IO.File]::ReadAllText($h).Trim()
  if ($t.StartsWith('ref: refs/heads/')) { return $t.Substring(16) }
  return '(갈래 없음 ' + $t.Substring(0, [Math]::Min(7, $t.Length)) + ')'
}
function Stamp() {
  $max = [DateTime]::MinValue
  foreach ($pat in @('*.html', 'en\*.html', 'css\*.css')) {
    $dir = Join-Path $work (Split-Path $pat -Parent)
    if (-not (Test-Path $dir)) { continue }
    foreach ($f in [System.IO.Directory]::GetFiles($dir, (Split-Path $pat -Leaf))) {
      $t = [System.IO.File]::GetLastWriteTimeUtc($f)
      if ($t -gt $max) { $max = $t }
    }
  }
  return $max.Ticks.ToString()
}
function ServeFile($res, [string]$base, [string]$rel, [bool]$head) {
  if ($rel -match '(^|/)\.git(/|$)') { SendText $res 403 '읽을 수 없는 폴더입니다.'; return }
  if ($rel -eq '' -or $rel.EndsWith('/')) { $rel = $rel + 'index.html' }
  $path = [System.IO.Path]::GetFullPath((Join-Path $base $rel))
  if (-not $path.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $path -PathType Leaf)) { SendText $res 404 '파일이 없습니다.'; return }
  $ext = [System.IO.Path]::GetExtension($path).ToLower()
  $type = 'application/octet-stream'; if ($mime.ContainsKey($ext)) { $type = $mime[$ext] }
  Send $res 200 ([System.IO.File]::ReadAllBytes($path)) $type $head
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    if (-not $req.IsLocal -or -not [System.Net.IPAddress]::IsLoopback($req.RemoteEndPoint.Address)) { SendText $res 403 '이 컴퓨터에서만 쓸 수 있습니다.'; continue }
    if ($req.HttpMethod -ne 'GET' -and $req.HttpMethod -ne 'HEAD') { SendText $res 405 '읽기만 할 수 있습니다.'; continue }
    $head = $req.HttpMethod -eq 'HEAD'
    $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
    if ($rel -match '(^|[\\/])\.\.([\\/]|$)' -or $rel.Contains('\') -or $rel.Contains(':')) { SendText $res 400 '허용하지 않는 경로입니다.'; continue }
    if ($rel -eq '' -or $rel -eq 'index.html') { ServeFile $res $ui 'index.html' $head; continue }
    if ($rel.StartsWith('ui/')) { ServeFile $res $ui $rel.Substring(3) $head; continue }
    if ($rel -eq 'final' -or $rel -eq 'work') { $res.Redirect("/$rel/"); continue }
    if ($rel.StartsWith('final/')) { ServeFile $res $final $rel.Substring(6) $head; continue }
    if ($rel.StartsWith('work/')) { ServeFile $res $work $rel.Substring(5) $head; continue }
    if ($rel -eq 'api/branch') { SendText $res 200 (Branch); continue }
    if ($rel -eq 'api/stamp') { SendText $res 200 (Stamp); continue }
    if ($rel -eq 'api/final') { SendText $res 200 ([string]$finalRev); continue }
    SendText $res 404 '없는 주소입니다.'
  }
  catch { try { SendText $res 500 ('서버 오류: ' + $_.Exception.Message) } catch {} }
  finally { try { $res.OutputStream.Close() } catch {} }
}
