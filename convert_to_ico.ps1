Add-Type -AssemblyName System.Drawing
$sourcePath = "C:\Users\Natha\.gemini\antigravity\scratch\scheduler_app\anime_girl_wed.png"
$destPath = "C:\Users\Natha\.gemini\antigravity\scratch\scheduler_app\app.ico"

try {
    $bitmap = [System.Drawing.Bitmap]::FromFile($sourcePath)
    $icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
    $fileStream = [System.IO.File]::OpenWrite($destPath)
    $icon.Save($fileStream)
    $fileStream.Close()
    $icon.Dispose()
    $bitmap.Dispose()
    Write-Host "Successfully created app.ico"
} catch {
    Write-Error "Failed to convert image: $_"
    exit 1
}
