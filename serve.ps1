# Local preview server for the website folder (no install required).
# Usage:  powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 4173]
param([int]$Port = 4173)

$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.png' = 'image/png'
  '.svg' = 'image/svg+xml'; '.woff2' = 'font/woff2'; '.txt' = 'text/plain; charset=utf-8'; '.ico' = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/  (Ctrl+C to stop)"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
      if ($rel -eq '') { $rel = 'index.html' }
      $path = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
      if ((Test-Path $path -PathType Container)) { $path = Join-Path $path 'index.html' }
      $status = 200
      if (-not $path.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $path -PathType Leaf)) {
        $status = 404
        $path = Join-Path $root '404.html'
      }
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      $res.StatusCode = $status
      if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] } else { $res.ContentType = 'application/octet-stream' }
      $res.ContentLength64 = $bytes.Length
      if ($ctx.Request.HttpMethod -ne 'HEAD') { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
      Write-Host "$status $($ctx.Request.HttpMethod) /$rel"
    } catch {
      try { $res.StatusCode = 500 } catch {}
      Write-Host "500 $($_.Exception.Message)"
    } finally {
      try { $res.OutputStream.Close() } catch {}
    }
  }
} finally {
  $listener.Stop()
}
