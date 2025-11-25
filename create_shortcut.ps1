$DesktopPath = [Environment]::GetFolderPath("Desktop")
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Re-Plan.lnk")
$Shortcut.TargetPath = "C:\Users\Natha\.gemini\antigravity\scratch\scheduler_app\index.html"
$Shortcut.IconLocation = "C:\Users\Natha\.gemini\antigravity\scratch\scheduler_app\app_face_transparent.ico"
$Shortcut.Save()
