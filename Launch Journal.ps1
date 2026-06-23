Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$AppDir = "C:\Users\ICrea\Claude\Travel Journal"
$Port   = 5173

# ── Install Start Menu shortcut (once) ───────────────────────────────────────
$shortcutPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Travel Journal.lnk"
if (-not (Test-Path $shortcutPath)) {
    $wsh = New-Object -ComObject WScript.Shell
    $sc  = $wsh.CreateShortcut($shortcutPath)
    $sc.TargetPath       = "$AppDir\Launch Journal.vbs"
    $sc.WorkingDirectory = $AppDir
    $sc.Description      = "Travel Journal"
    $sc.Save()
}

# ── Start Vite server (skip if already running) ───────────────────────────────
$server = $null
$alreadyUp = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $alreadyUp) {
    $env:PATH = "C:\Program Files\nodejs;" + $env:PATH
    $server = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c npm run dev" `
        -WorkingDirectory $AppDir `
        -WindowStyle Hidden `
        -PassThru
    Start-Sleep -Seconds 3
}

Start-Process "http://localhost:$Port"

# ── Build tray icon (amber square, white J) ───────────────────────────────────
$bmp = New-Object System.Drawing.Bitmap(32, 32)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.FillRectangle(
    (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(192, 129, 58))),
    0, 0, 32, 32
)
$font = New-Object System.Drawing.Font("Georgia", 17, [System.Drawing.FontStyle]::Bold)
$g.DrawString("J", $font, [System.Drawing.Brushes]::White, 4, 3)
$g.Dispose()
$trayIcon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())

# ── Tray icon ─────────────────────────────────────────────────────────────────
$tray      = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = $trayIcon
$tray.Text    = "Travel Journal"
$tray.Visible = $true
$tray.BalloonTipTitle = "Travel Journal"
$tray.BalloonTipText  = "Running at localhost:$Port"
$tray.ShowBalloonTip(2000)

# ── Context menu ─────────────────────────────────────────────────────────────
$menu = New-Object System.Windows.Forms.ContextMenuStrip

$openItem      = New-Object System.Windows.Forms.ToolStripMenuItem "Open Travel Journal"
$openItem.Font = New-Object System.Drawing.Font($openItem.Font, [System.Drawing.FontStyle]::Bold)
$openItem.add_Click({ Start-Process "http://localhost:$Port" })
[void]$menu.Items.Add($openItem)

[void]$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$quitItem = New-Object System.Windows.Forms.ToolStripMenuItem "Quit"
$quitItem.add_Click({
    $tray.Visible = $false
    $tray.Dispose()
    # Kill the server process we started
    if ($server -and -not $server.HasExited) {
        Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    }
    # Also kill any node process holding our port
    $pids = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique
    $pids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    [System.Windows.Forms.Application]::Exit()
})
[void]$menu.Items.Add($quitItem)

$tray.ContextMenuStrip = $menu
$tray.add_DoubleClick({ Start-Process "http://localhost:$Port" })

[System.Windows.Forms.Application]::Run()
