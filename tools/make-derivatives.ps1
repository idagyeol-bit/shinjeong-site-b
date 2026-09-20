# 원본 JPG(source/assets)에서 웹용 파생 이미지를 만든다.
# 비율 유지 축소 + JPEG 재인코딩만 수행한다. 크롭·색 보정·합성은 하지 않는다.
# 원본에 ICC 프로파일(Adobe RGB 등)이 있으면 파생본에 그대로 옮겨 브라우저 색이 달라지지 않게 한다.
param(
  [string]$Source = (Join-Path $PSScriptRoot '..\..\source\assets'),
  [string]$Out    = (Join-Path $PSScriptRoot '..\assets\photos'),
  [int]$Quality   = 84
)
Add-Type -AssemblyName System.Drawing

$plan = [ordered]@{
  M08 = 2400, 1600, 960
  W10 = 1600, 1000, 640
  W01 = 1600, 1000, 640
  W05 = 1600, 1000, 640
  R07 = 1600, 1000, 640
  R27 = 1600, 1000, 640
  M02 = 1200, 720
  M05 = 1400, 800
  W03 = 1000, 600
}

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

New-Item -ItemType Directory -Force $Out | Out-Null
$missing = @()
foreach ($id in $plan.Keys) {
  $file = Join-Path $Source "$id.jpg"
  if (-not (Test-Path $file)) { $missing += $id; continue }
  $img = [System.Drawing.Image]::FromFile($file)
  try {
    $icc = $null
    if ($img.PropertyIdList -contains 34675) { $icc = $img.GetPropertyItem(34675) }
    foreach ($w in $plan[$id]) {
      if ($w -gt $img.Width) { $w = $img.Width }
      $h = [int][math]::Round($img.Height * $w / $img.Width)
      $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $attr = New-Object System.Drawing.Imaging.ImageAttributes
      $attr.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
      $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
      $g.DrawImage($img, $rect, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $attr)
      $g.Dispose(); $attr.Dispose()
      if ($icc) { $bmp.SetPropertyItem($icc) }
      $target = Join-Path $Out "$id-$w.jpg"
      $bmp.Save($target, $codec, $encParams)
      $bmp.Dispose()
      '{0}-{1}.jpg  {2}x{3}  {4:N0} KB' -f $id, $w, $w, $h, ((Get-Item $target).Length / 1KB)
    }
  } finally { $img.Dispose() }
}
if ($missing.Count) { "MISSING originals: $($missing -join ', ')" } else { 'All originals found.' }
