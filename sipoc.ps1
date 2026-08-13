[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet("start", "stop", "status")]
    [string]$Action = ""
    ,
    [switch]$NoSeed
)

$ErrorActionPreference = "Stop"

$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$RUN_DIR = Join-Path $ROOT_DIR ".run"
$BACKEND_DIR = Join-Path $ROOT_DIR "backend\server"
$FRONTEND_DIR = Join-Path $ROOT_DIR "frontend\sipoc-ui"
$TESTS_DIR = Join-Path $ROOT_DIR "tests"

$BACKEND_PORT = 8080
$FRONTEND_PORT = 4200
$BACKEND_URL = "http://localhost:$BACKEND_PORT"
$FRONTEND_URL = "http://localhost:$FRONTEND_PORT"

$BACKEND_LOG = Join-Path $RUN_DIR "backend.log"
$FRONTEND_LOG = Join-Path $RUN_DIR "frontend.log"

function Get-PortPid {
    param([int]$Port)

    $netstatOutput = netstat -ano -p tcp 2>$null
    foreach ($line in $netstatOutput) {
        if ($line -match "LISTENING" -and $line -match ":$Port\s") {
            $parts = $line.Trim() -split '\s+'
            if ($parts.Count -ge 5) {
                return [int]$parts[-1]
            }
        }
    }

    return $null
}

function Wait-ForUrl {
    param(
        [string]$Url,
        [string]$Label,
        [int]$Attempts = 40
    )

    for ($i = 1; $i -le $Attempts; $i++) {
        try {
            $null = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            return $true
        }
        catch {
            Start-Sleep -Seconds 3
        }
    }

    Write-Error "Timed out waiting for $Label ($Url)"
    return $false
}

function Resolve-JavaHome {
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
        return $true
    }

    $javaCommand = Get-Command java -ErrorAction SilentlyContinue
    if ($javaCommand) {
        $javaExe = $javaCommand.Source
        $javaExeLower = $javaExe.ToLowerInvariant()

        if ($javaExeLower -notmatch 'javapath\\java\.exe$') {
            $candidateRoot = Split-Path -Parent $javaExe
            if (Test-Path (Join-Path $candidateRoot "bin\java.exe")) {
                $env:JAVA_HOME = $candidateRoot
                return $true
            }
        }
    }

    $roots = @(
        "$env:ProgramFiles\Java",
        "$env:ProgramFiles\Eclipse Adoptium",
        "$env:ProgramFiles\Microsoft",
        "$env:LOCALAPPDATA\Programs\Java",
        "$env:LOCALAPPDATA\Programs\Eclipse Adoptium",
        "$env:LOCALAPPDATA\Programs\Microsoft"
    )

    foreach ($root in $roots) {
        if (-not (Test-Path $root)) {
            continue
        }

        foreach ($candidate in Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue) {
            $name = $candidate.Name.ToLowerInvariant()
            if ($name -match 'jdk-?26|openjdk-?26|jdk26|jdk-?27|openjdk-?27|jdk27|latest') {
                $javaExe = Join-Path $candidate.FullName "bin\java.exe"
                if (Test-Path $javaExe) {
                    $env:JAVA_HOME = $candidate.FullName
                    return $true
                }
            }
        }
    }

    Write-Error "Could not find a Java 26 runtime. Install JDK 26 and set JAVA_HOME."
    return $false
}

function Start-Backend {
    $existing = Get-PortPid -Port $BACKEND_PORT
    if ($existing) {
        Write-Host "Backend already running on port $BACKEND_PORT (pid $existing)"
        return $true
    }

    if (-not (Resolve-JavaHome)) {
        return $false
    }

    New-Item -ItemType Directory -Force -Path $RUN_DIR | Out-Null
    Write-Host "Starting backend (JAVA_HOME=$env:JAVA_HOME) ..."

    $cmdArgs = @(
        "/c",
        "cd /d `"$BACKEND_DIR`" && .\mvnw.cmd spring-boot:run > `"$BACKEND_LOG`" 2>&1"
    )
    $process = Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -PassThru -WindowStyle Hidden

    if (-not (Wait-ForUrl -Url "$BACKEND_URL/api/business-partners" -Label "backend" -Attempts 40)) {
        Write-Error "Backend failed to start, see $BACKEND_LOG"
        return $false
    }

    Write-Host "Backend is up at $BACKEND_URL"
    return $true
}

function Seed-MockData {
    Write-Host "Seeding mock data ..."
    Push-Location $TESTS_DIR
    try {
        if (-not (Test-Path "$TESTS_DIR\node_modules")) {
            & npm install
        }
        & npm run seed
    }
    finally {
        Pop-Location
    }
}

function Start-Frontend {
    $existing = Get-PortPid -Port $FRONTEND_PORT
    if ($existing) {
        Write-Host "Frontend already running on port $FRONTEND_PORT (pid $existing)"
        return $true
    }

    Write-Host "Starting frontend ..."

    if (-not (Test-Path "$FRONTEND_DIR\node_modules")) {
        Push-Location $FRONTEND_DIR
        try {
            & npm install
        }
        finally {
            Pop-Location
        }
    }

    $cmdArgs = @(
        "/c",
        "cd /d `"$FRONTEND_DIR`" && npm start > `"$FRONTEND_LOG`" 2>&1"
    )
    Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -PassThru -WindowStyle Hidden | Out-Null

    if (-not (Wait-ForUrl -Url $FRONTEND_URL -Label "frontend" -Attempts 60)) {
        Write-Error "Frontend failed to start, see $FRONTEND_LOG"
        return $false
    }

    Write-Host "Frontend is up at $FRONTEND_URL"
    return $true
}

function Stop-Port {
    param([int]$Port, [string]$Label)

    $pid = Get-PortPid -Port $Port
    if (-not $pid) {
        Write-Host "$Label not running"
        return
    }

    Write-Host "Stopping $Label (pid $pid, port $Port) ..."
    Stop-Process -Id $pid -ErrorAction SilentlyContinue -Force

    for ($i = 1; $i -le 10; $i++) {
        if (-not (Get-PortPid -Port $Port)) { break }
        Start-Sleep -Seconds 1
    }

    if (Get-PortPid -Port $Port) {
        Write-Host "$Label did not stop gracefully, forcing ..."
        Stop-Process -Id $pid -ErrorAction SilentlyContinue -Force
    }
}

function Invoke-Start {
    New-Item -ItemType Directory -Force -Path $RUN_DIR | Out-Null
    $seededBackend = $false

    # Honor -NoSeed switch or environment variables SIPOC_SKIP_SEED / SKIP_SEED
    $skipSeed = $false
    if ($env:SIPOC_SKIP_SEED -and $env:SIPOC_SKIP_SEED -match '^(1|true)$') { $skipSeed = $true }
    if ($env:SKIP_SEED -and $env:SKIP_SEED -match '^(1|true)$') { $skipSeed = $true }
    if ($NoSeed) { $skipSeed = $true }

    if (-not (Start-Backend)) {
        exit 1
    }

    $seededBackend = $true
    if (-not $skipSeed) {
        Seed-MockData
    }
    else {
        Write-Host "Skipping mock data seeding (disabled by -NoSeed or env)"
    }

    if (-not (Start-Frontend)) {
        exit 1
    }

    Write-Host ""
    Write-Host "SIPOCs is up:"
    Write-Host "  Frontend: $FRONTEND_URL"
    Write-Host "  Backend:  $BACKEND_URL (Swagger UI: $BACKEND_URL/swagger-ui/index.html)"
}

function Invoke-Stop {
    Stop-Port -Port $FRONTEND_PORT -Label "Frontend"
    Stop-Port -Port $BACKEND_PORT -Label "Backend"
}

function Invoke-Status {
    $backendPid = Get-PortPid -Port $BACKEND_PORT
    $frontendPid = Get-PortPid -Port $FRONTEND_PORT

    if ($backendPid) {
        Write-Host "Backend:  running (pid $backendPid, $BACKEND_URL)"
    }
    else {
        Write-Host "Backend:  stopped"
    }

    if ($frontendPid) {
        Write-Host "Frontend: running (pid $frontendPid, $FRONTEND_URL)"
    }
    else {
        Write-Host "Frontend: stopped"
    }
}

switch ($Action) {
    "start" { Invoke-Start }
    "stop" { Invoke-Stop }
    "status" { Invoke-Status }
    default {
        Write-Host "Usage: powershell -File .\sipoc.ps1 {start|stop|status} [-NoSeed]"
        exit 1
    }
}
