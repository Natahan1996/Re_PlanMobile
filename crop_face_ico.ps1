Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\Natha\.gemini\antigravity\scratch\scheduler_app\anime_mascot.png"
$destPath = "C:\Users\Natha\.gemini\antigravity\scratch\scheduler_app\app_face.ico"

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

    # Resize to 256x256 for Icon
    $resized = New-Object System.Drawing.Bitmap(256, 256)
    $g2 = [System.Drawing.Graphics]::FromImage($resized)
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.DrawImage($cropped, 0, 0, 256, 256)
    $g2.Dispose()

    # Replace White Background with Black
    for ($x = 0; $x -lt $resized.Width; $x++) {
        for ($y = 0; $y -lt $resized.Height; $y++) {
            $pixel = $resized.GetPixel($x, $y)
            
            # Check for White-ish background
            if ($pixel.R -gt 240 -and $pixel.G -gt 240 -and $pixel.B -gt 240) {
                $resized.SetPixel($x, $y, [System.Drawing.Color]::Black)
            }
        }
    }
    
    # Save resized image to memory stream as PNG
    $ms = New-Object System.IO.MemoryStream
    $resized.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $ms.ToArray()
    $ms.Close()
    
    # Create ICO file stream
    $fs = [System.IO.File]::Create($destPath)
    $bw = New-Object System.IO.BinaryWriter($fs)
    
    # Write ICO Header
    $bw.Write([int16]0)  # Reserved
    $bw.Write([int16]1)  # Type (1=Icon)
    $bw.Write([int16]1)  # Count (1 image)
    
    # Write Icon Directory Entry
    $bw.Write([byte]0)   # Width (0=256)
    $bw.Write([byte]0)   # Height (0=256)
    $bw.Write([byte]0)   # ColorCount
    $bw.Write([byte]0)   # Reserved
    $bw.Write([int16]1)  # Planes
    $bw.Write([int16]32) # BitCount
    $bw.Write([int]$pngBytes.Length) # Size
    $bw.Write([int]22)   # Offset (6 header + 16 entry)
    
    # Write PNG Data
    $bw.Write($pngBytes)
    
    $bw.Close()
    $fs.Close()
    $original.Dispose()
    $cropped.Dispose()
    $resized.Dispose()
    
    Write-Host "Successfully created app_face.ico"
} catch {
    Write-Error "Failed to convert: $_"
    exit 1
}
