Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("anime_mascot.png")
Write-Host "Width: $($img.Width)"
Write-Host "Height: $($img.Height)"
$img.Dispose()
