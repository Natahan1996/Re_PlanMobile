Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\Natha\.gemini\antigravity\scratch\scheduler_app\anime_mascot.png"
$destPath = "C:\Users\Natha\.gemini\antigravity\scratch\scheduler_app\mascot_face.png"

try {
    # Load original image
    $original = [System.Drawing.Image]::FromFile($sourcePath)
    
    # Define Crop Rectangle (Face focus)
    # 1024x1024 -> Crop 512x512 from Top-Center
    $cropRect = New-Object System.Drawing.Rectangle(256, 100, 512, 512)
    
    # Create Cropped Bitmap
    $cropped = New-Object System.Drawing.Bitmap($cropRect.Width, $cropRect.Height)
    $g = [System.Drawing.Graphics]::FromImage($cropped)
    $g.DrawImage($original, [System.Drawing.Rectangle]::new(0, 0, $cropped.Width, $cropped.Height), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # Replace White Background with Transparent
    for ($x = 0; $x -lt $cropped.Width; $x++) {
        for ($y = 0; $y -lt $cropped.Height; $y++) {
            $pixel = $cropped.GetPixel($x, $y)
            
            # Check for White-ish background
            if ($pixel.R -gt 240 -and $pixel.G -gt 240 -and $pixel.B -gt 240) {
                $cropped.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
            }
        }
    }
    
    # Save as PNG
    $cropped.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $original.Dispose()
    $cropped.Dispose()
    
    Write-Host "Successfully created mascot_face.png"
} catch {
    Write-Error "Failed to create image: $_"
    exit 1
}
