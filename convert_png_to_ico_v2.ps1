Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\Natha\.gemini\antigravity\scratch\scheduler_app\anime_girl_wed.png"
$destPath = "C:\Users\Natha\.gemini\antigravity\scratch\scheduler_app\app_black.ico"

try {
    # Load original image
    $original = [System.Drawing.Image]::FromFile($sourcePath)
    
    # Resize to 256x256
    $resized = New-Object System.Drawing.Bitmap(256, 256)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($original, 0, 0, 256, 256)
    $g.Dispose()

    # Sample background color from top-left corner
    $bgColor = $resized.GetPixel(0, 0)
    $threshold = 50 # Tolerance for compression artifacts

    # Replace Background with Black
    for ($x = 0; $x -lt $resized.Width; $x++) {
        for ($y = 0; $y -lt $resized.Height; $y++) {
            $pixel = $resized.GetPixel($x, $y)
            
            # Calculate difference from background color
            $diffR = [Math]::Abs($pixel.R - $bgColor.R)
            $diffG = [Math]::Abs($pixel.G - $bgColor.G)
            $diffB = [Math]::Abs($pixel.B - $bgColor.B)
            
            # If pixel is close to background color, turn it black
            if ($diffR -lt $threshold -and $diffG -lt $threshold -and $diffB -lt $threshold) {
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
    $resized.Dispose()
    
    Write-Host "Successfully created app.ico with size: $([System.IO.FileInfo]::new($destPath).Length)"
} catch {
    Write-Error "Failed to convert: $_"
    exit 1
}
