<#
.SYNOPSIS
    TrendMotion Studio - Desktop App Launcher & Watchdog
    Chay ung dung TrendMotion Studio duoi dang Desktop App tren Windows
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "TrendMotion Studio - Desktop App Server & Watchdog"

# 1. Xac dinh thu muc goc cua du an
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (Test-Path (Join-Path $ScriptDir "trendmotion-studio\apps\web")) {
    $ProjectRoot = (Join-Path $ScriptDir "trendmotion-studio")
} elseif (Test-Path (Join-Path $ScriptDir "apps\web")) {
    $ProjectRoot = $ScriptDir
} else {
    $ProjectRoot = "D:\Work\Freelance\ToolFashion\trendmotion-studio"
}

$ApiDir = Join-Path $ProjectRoot "apps\api"
$WebDir = Join-Path $ProjectRoot "apps\web"

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             TRENDMOTION STUDIO - DESKTOP APP             " -ForegroundColor White -BackgroundColor DarkCyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 2. Tu dong tao Shortcut tren Desktop neu chua co
try {
    $desktopFolder = [Environment]::GetFolderPath('Desktop')
    $shortcutFile = Join-Path $desktopFolder "TrendMotion Studio.lnk"
    if (-not (Test-Path $shortcutFile)) {
        $wsh = New-Object -ComObject WScript.Shell
        $sc = $wsh.CreateShortcut($shortcutFile)
        $batPath = Join-Path $ScriptDir "desktop.bat"
        if (-not (Test-Path $batPath)) {
            $batPath = "D:\Work\Freelance\ToolFashion\desktop.bat"
        }
        $sc.TargetPath = $batPath
        $sc.WorkingDirectory = $ScriptDir
        $sc.Description = "TrendMotion Studio Desktop App"
        
        $edgePath = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
        if (-not (Test-Path $edgePath)) {
            $edgePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
        }
        if (Test-Path $edgePath) {
            $sc.IconLocation = "$edgePath,0"
        }
        $sc.Save()
        Write-Host "[INFO] Da tao loi tat Desktop: 'TrendMotion Studio.lnk'" -ForegroundColor DarkGray
    }
} catch {}

# Ham kiem tra port (ho tro ca localhost va 127.0.0.1)
function Test-PortOpen([int]$port) {
    foreach ($hostName in @("localhost", "127.0.0.1")) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $async = $tcp.BeginConnect($hostName, $port, $null, $null)
            $wait = $async.AsyncWaitHandle.WaitOne(400, $false)
            if ($wait) {
                $tcp.EndConnect($async)
                $tcp.Close()
                return $true
            }
            $tcp.Close()
        } catch {}
    }
    return $false
}

# Ham tim Python hop le (co du OpenCV, FastAPI, Uvicorn)
function Get-WorkingPython {
    $candidates = @(
        "D:\Application\Python\Python313\python.exe",
        (Join-Path $ApiDir ".venv\Scripts\python.exe"),
        "python.exe"
    )
    foreach ($cand in $candidates) {
        if (Test-Path $cand) {
            try {
                $test = & $cand -c "import cv2, fastapi, uvicorn; print('VALID_PYTHON')" 2>$null
                if ($test -match "VALID_PYTHON") {
                    return $cand
                }
            } catch {}
        }
    }
    return "python.exe"
}

# Ham tat toan bo cay tien trinh (process tree)
function Stop-ProcessTree([int]$pidToKill) {
    if ($pidToKill -gt 0) {
        try {
            cmd.exe /c "taskkill /PID $pidToKill /T /F >nul 2>&1"
        } catch {}
    }
}

$startedApiPid = 0
$startedWebPid = 0
$pythonExe = Get-WorkingPython

try {
    # 3. Kiem tra va khoi dong Backend API (Port 8000)
    Write-Host "[1/3] Kiem tra Backend API (port 8000)..." -NoNewline
    if (Test-PortOpen 8000) {
        Write-Host " [DA SAN SANG]" -ForegroundColor Green
    } else {
        Write-Host " Dang khoi dong..." -ForegroundColor Yellow
        Write-Host "      -> Su dung Python: $pythonExe" -ForegroundColor DarkGray
        
        $apiProc = Start-Process -FilePath $pythonExe `
            -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000") `
            -WorkingDirectory $ApiDir `
            -WindowStyle Hidden `
            -PassThru
        
        if ($apiProc) {
            $startedApiPid = $apiProc.Id
        }
        
        # Doi toi da 15 giay cho API san sang
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Milliseconds 500
            if (Test-PortOpen 8000) {
                break
            }
        }
        if (Test-PortOpen 8000) {
            Write-Host "      -> Backend API da san sang (PID: $startedApiPid)!" -ForegroundColor Green
        } else {
            Write-Host "      -> Canh bao: Backend API mat nhieu thoi gian hon du kien..." -ForegroundColor DarkYellow
        }
    }

    # 4. Kiem tra va khoi dong Frontend Web (Port 5173)
    Write-Host "[2/3] Kiem tra Frontend Web (port 5173)..." -NoNewline
    $webReady = $false
    if (Test-PortOpen 5173) {
        Write-Host " [DA SAN SANG]" -ForegroundColor Green
        $webReady = $true
    } else {
        Write-Host " Dang khoi dong..." -ForegroundColor Yellow
        
        $webProc = Start-Process -FilePath "cmd.exe" `
            -ArgumentList @("/c", "pnpm --filter @trendmotion/web dev") `
            -WorkingDirectory $ProjectRoot `
            -WindowStyle Hidden `
            -PassThru
            
        if ($webProc) {
            $startedWebPid = $webProc.Id
        }
        
        # Doi frontend phan hoi
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Milliseconds 500
            if (Test-PortOpen 5173) {
                $webReady = $true
                break
            }
        }
        
        if ($webReady) {
            Write-Host "      -> Frontend Web da san sang (PID: $startedWebPid)!" -ForegroundColor Green
        } else {
            Write-Host "      -> Dang mo giao dien desktop..." -ForegroundColor Yellow
        }
    }

    # 5. Tim Trinh duyet de chay che do Desktop App (Edge hoac Chrome)
    $candidateBrowsers = @(
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
        "${env:Google\Chrome\Application\chrome.exe}",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LocalAppData}\Google\Chrome\Application\chrome.exe",
        "${env:LocalAppData}\Microsoft\Edge\Application\msedge.exe"
    )
    $browserExe = $null
    foreach ($b in $candidateBrowsers) {
        if (Test-Path $b) {
            $browserExe = $b
            break
        }
    }

    # 6. Khoi chay cua so Desktop App
    Write-Host "[3/3] Dang mo ung dung desktop..." -ForegroundColor Cyan
    $appProfileDir = Join-Path $env:LOCALAPPDATA "TrendMotionStudio\browser-profile"
    if (-not (Test-Path $appProfileDir)) {
        New-Item -ItemType Directory -Path $appProfileDir -Force | Out-Null
    }

    if ($browserExe) {
        $appArgs = @(
            "--app=http://localhost:5173",
            "--user-data-dir=$appProfileDir",
            "--window-size=1440,900"
        )
        Start-Process -FilePath $browserExe -ArgumentList $appArgs | Out-Null
    } else {
        Start-Process "http://localhost:5173" | Out-Null
    }

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  TRENDMOTION STUDIO DANG CHAY ON DINH!" -ForegroundColor Green
    Write-Host "  - Backend API:  http://127.0.0.1:8000" -ForegroundColor Gray
    Write-Host "  - Frontend Web: http://localhost:5173" -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "[WATCHDOG] He thong giam sat tu dong dang hoat dong:" -ForegroundColor Cyan
    Write-Host "  - Giu cho Backend & Frontend luon luon chay ngam on dinh." -ForegroundColor DarkGray
    Write-Host "  - Tu dong khoi dong lai Backend ngay lap tuc neu gap su co." -ForegroundColor DarkGray
    Write-Host "  * Nhan 'Q' roi Enter hoac Ctrl+C tai day de tat ung dung." -ForegroundColor Yellow
    Write-Host ""

    # 7. Vong lap giam sat (Watchdog loop) - Giu Backend va Frontend luon song
    while ($true) {
        Start-Sleep -Seconds 2

        # Kiem tra Backend, tu dong hoi sinh neu rot
        if (-not (Test-PortOpen 8000)) {
            Write-Host "[WATCHDOG] Backend API bi ngat. Dang tu dong khoi dong lai..." -ForegroundColor Red
            $apiProc = Start-Process -FilePath $pythonExe `
                -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000") `
                -WorkingDirectory $ApiDir `
                -WindowStyle Hidden `
                -PassThru
            if ($apiProc) {
                $startedApiPid = $apiProc.Id
                Write-Host "      -> Da khoi dong lai Backend thanh cong (PID: $startedApiPid)!" -ForegroundColor Green
            }
        }

        # Kiem tra phim Q de thoat
        if ([Console]::KeyAvailable) {
            $key = [Console]::ReadKey($true)
            if ($key.Key -eq [ConsoleKey]::Q) {
                Write-Host "Dang tat ung dung theo yeu cau cua ban..." -ForegroundColor Yellow
                break
            }
        }
    }

} finally {
    Write-Host ""
    Write-Host "Dang don dep va dong cac tien trinh nen..." -ForegroundColor Yellow
    if ($startedApiPid -gt 0) {
        Stop-ProcessTree $startedApiPid
        Write-Host "  - Da dong Backend API (PID: $startedApiPid)" -ForegroundColor Gray
    }
    if ($startedWebPid -gt 0) {
        Stop-ProcessTree $startedWebPid
        Write-Host "  - Da dong Frontend Web (PID: $startedWebPid)" -ForegroundColor Gray
    }
    Write-Host "Da dong ung dung hoan toan." -ForegroundColor Green
    Start-Sleep -Seconds 1
}
