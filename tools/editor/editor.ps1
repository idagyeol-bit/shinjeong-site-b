# 신정개발 홈페이지 — 시안 편집기 서버 (42차)
# 켜기: 홈페이지 폴더의 시안편집기.bat 더블클릭 (설치하는 프로그램 없음, 윈도우 PowerShell 만 쓴다)
# - 이 컴퓨터(localhost)에서 오는 요청만 받는다. 다른 컴퓨터에서는 접속할 수 없다.
# - 읽기: 홈페이지 폴더 안 파일(.git 제외). 쓰기: 아래 다섯 가지뿐이고 그 밖의 요청은 모두 거절한다.
#     PUT /__api/variant/<시안>        → tools/variants/<시안>.js (쓰기 직전 판을 tools/variants/_보관/ 에 복사, 시안마다 최근 30개)
#     PUT /__api/out/<시안>/<쪽>.html  → <시안>/<쪽>.html
#     PUT /__api/tokens/<시안>         → css/tokens.<시안>.css
#     GET /__api/variants              → 시안 목록
#     GET /__api/backups?name=<시안>   → 보관 목록
param([int]$Port = 4174, [string]$Root = '', [switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
if (-not $Root) { $Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent }
$root = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$varDir = Join-Path $root 'tools\variants'
$bakDir = Join-Path $varDir '_보관'
$reserved = @('assets', 'css', 'en', 'guide', 'js', 'tools')
$keep = 30
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.png' = 'image/png'
  '.svg' = 'image/svg+xml'; '.woff2' = 'font/woff2'; '.woff' = 'font/woff'; '.txt' = 'text/plain; charset=utf-8'
  '.ico' = 'image/x-icon'; '.pdf' = 'application/pdf'; '.md' = 'text/plain; charset=utf-8'
}

function Test-VariantName([string]$n) {
  return ($n -cmatch '^[a-z0-9-]+$') -and ($reserved -notcontains $n)
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() }
catch {
  Write-Host ''
  Write-Host "편집기를 켜지 못했습니다. 포트 $Port 를 다른 프로그램이 쓰고 있습니다." -ForegroundColor Yellow
  Write-Host '이미 켜 둔 시안 편집기 창이 있으면 그 창을 쓰거나 닫은 뒤 다시 켜 주세요.'
  exit 1
}

Write-Host ''
Write-Host '편집기가 켜졌습니다. 이 창을 닫으면 편집기가 꺼집니다.' -ForegroundColor Green
Write-Host "주소: http://localhost:$Port/tools/editor/"
Write-Host "폴더: $root"
if (-not $NoBrowser) { Start-Process "http://localhost:$Port/tools/editor/" }

function Send($res, [int]$status, [byte[]]$bytes, [string]$type, [bool]$head) {
  $res.StatusCode = $status
  $res.Headers.Add('Cache-Control', 'no-store')
  $res.ContentType = $type
  $res.ContentLength64 = $bytes.Length
  if (-not $head -and $bytes.Length) { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
}
function SendText($res, [int]$status, [string]$text) { Send $res $status ($utf8.GetBytes($text)) 'text/plain; charset=utf-8' $false }
function SendJson($res, $obj) { Send $res 200 ($utf8.GetBytes((ConvertTo-Json -InputObject $obj -Depth 4 -Compress))) 'application/json; charset=utf-8' $false }
function Write-Under([string]$full, [string]$body) {
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($full)) | Out-Null
  [System.IO.File]::WriteAllText($full, $body, $utf8)
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    # 이 컴퓨터에서 온 요청만
    if (-not $req.IsLocal -or -not [System.Net.IPAddress]::IsLoopback($req.RemoteEndPoint.Address)) { SendText $res 403 '이 컴퓨터에서만 쓸 수 있습니다.'; continue }
    $raw = $req.Url.AbsolutePath
    $rel = [System.Uri]::UnescapeDataString($raw).TrimStart('/')
    if ($rel -match '(^|[\\/])\.\.([\\/]|$)' -or $rel.Contains('\') -or $rel.Contains(':')) { SendText $res 400 '허용하지 않는 경로입니다.'; continue }
    $method = $req.HttpMethod

    if ($rel.StartsWith('__api/')) {
      $api = $rel.Substring(6)
      if ($method -eq 'PUT') {
        # 쓰기는 편집기 화면에서 온 것만 (다른 사이트가 몰래 보내는 요청 차단)
        $origin = $req.Headers['Origin']
        if ($req.Headers['X-Sian-Editor'] -ne '1' -or ($origin -and $origin -ne "http://localhost:$Port")) { SendText $res 403 '편집기 화면에서 온 요청이 아닙니다.'; continue }
        $sr = New-Object System.IO.StreamReader($req.InputStream, $utf8)
        $body = $sr.ReadToEnd()
        if ($api -match '^variant/([^/]+)$') {
          $n = $Matches[1]
          if (-not (Test-VariantName $n)) { SendText $res 400 "시안 이름 '$n' 은 쓸 수 없습니다."; continue }
          $file = Join-Path $varDir "$n.js"
          if (Test-Path $file -PathType Leaf) {
            [System.IO.Directory]::CreateDirectory($bakDir) | Out-Null
            $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
            Copy-Item -LiteralPath $file -Destination (Join-Path $bakDir "$n-$stamp.js") -Force
            $old = @(Get-ChildItem -LiteralPath $bakDir -File | Where-Object { $_.Name -cmatch ('^' + [regex]::Escape($n) + '-\d{8}-\d{6}\.js$') } | Sort-Object Name -Descending)
            if ($old.Count -gt $keep) { $old[$keep..($old.Count - 1)] | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force } }
          }
          Write-Under $file $body
          SendText $res 200 'ok'; continue
        }
        if ($api -match '^out/([^/]+)/([a-z0-9-]+\.html)$') {
          $n = $Matches[1]; $pg = $Matches[2]
          if (-not (Test-VariantName $n) -or $pg -eq '404.html') { SendText $res 400 '허용하지 않는 파일입니다.'; continue }
          Write-Under (Join-Path $root "$n\$pg") $body
          SendText $res 200 'ok'; continue
        }
        if ($api -match '^tokens/([^/]+)$') {
          $n = $Matches[1]
          if (-not (Test-VariantName $n)) { SendText $res 400 '허용하지 않는 파일입니다.'; continue }
          Write-Under (Join-Path $root "css\tokens.$n.css") $body
          SendText $res 200 'ok'; continue
        }
        SendText $res 403 '허용하지 않는 쓰기 요청입니다.'; continue
      }
      if ($method -eq 'GET' -and $api -eq 'variants') {
        $list = @()
        if (Test-Path $varDir) { $list = @(Get-ChildItem -LiteralPath $varDir -File -Filter '*.js' | Where-Object { -not $_.Name.StartsWith('_') } | ForEach-Object { $_.BaseName } | Sort-Object) }
        SendJson $res $list; continue
      }
      if ($method -eq 'GET' -and $api -eq 'backups') {
        $n = $req.QueryString['name']
        if (-not (Test-VariantName $n)) { SendText $res 400 '시안 이름이 맞지 않습니다.'; continue }
        $list = @()
        if (Test-Path $bakDir) { $list = @(Get-ChildItem -LiteralPath $bakDir -File | Where-Object { $_.Name -cmatch ('^' + [regex]::Escape($n) + '-\d{8}-\d{6}\.js$') } | Sort-Object Name -Descending | ForEach-Object { $_.Name }) }
        SendJson $res $list; continue
      }
      SendText $res 403 '허용하지 않는 요청입니다.'; continue
    }

    if ($method -ne 'GET' -and $method -ne 'HEAD') { SendText $res 405 '읽기만 할 수 있습니다.'; continue }
    if ($rel -match '(^|/)\.git(/|$)') { SendText $res 403 '읽을 수 없는 폴더입니다.'; continue }
    if ($rel -eq '' -or $rel.EndsWith('/')) { $rel = $rel + 'index.html' }
    $path = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
    if (-not $path.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $path -PathType Leaf)) { SendText $res 404 '파일이 없습니다.'; continue }
    $ext = [System.IO.Path]::GetExtension($path).ToLower()
    $type = 'application/octet-stream'; if ($mime.ContainsKey($ext)) { $type = $mime[$ext] }
    Send $res 200 ([System.IO.File]::ReadAllBytes($path)) $type ($method -eq 'HEAD')
  }
  catch {
    try { SendText $res 500 ('서버 오류: ' + $_.Exception.Message) } catch {}
  }
  finally {
    try { $res.OutputStream.Close() } catch {}
  }
}
