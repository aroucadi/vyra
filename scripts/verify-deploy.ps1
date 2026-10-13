[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$ProjectId = "vyra-509011",

    [Parameter(Mandatory = $false)]
    [string]$ServiceName = "vyra-app",

    [Parameter(Mandatory = $false)]
    [string]$Region = "us-central1",

    [Parameter(Mandatory = $false)]
    [string]$ExpectedCommit = ""
)

$ErrorActionPreference = "Stop"

if (-not $env:CLOUDSDK_PYTHON) {
    if (Test-Path "C:\Users\rouca\python-sdk\python3.13.2\python.exe") {
        $env:CLOUDSDK_PYTHON = "C:\Users\rouca\python-sdk\python3.13.2\python.exe"
    }
}

$GcloudCmd = "gcloud"
if (Test-Path "D:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd") {
    $GcloudCmd = "D:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
} elseif (Test-Path "C:\Users\rouca\.stitch-mcp\google-cloud-sdk\bin\gcloud.cmd") {
    $GcloudCmd = "C:\Users\rouca\.stitch-mcp\google-cloud-sdk\bin\gcloud.cmd"
}

Write-Host "`n--- Cloud Run Verification ---" -ForegroundColor Cyan

# 1. Fetch live service URL
$ServiceUrl = (& $GcloudCmd run services describe $ServiceName --project $ProjectId --region $Region --format "value(status.url)").Trim()
Write-Host "Live Service URL: $ServiceUrl" -ForegroundColor Green

# 2. Fetch latest revision
$LatestRevision = (& $GcloudCmd run services describe $ServiceName --project $ProjectId --region $Region --format "value(status.latestReadyRevisionName)").Trim()
Write-Host "Latest Ready Revision: $LatestRevision" -ForegroundColor Green

# 3. Query /api/health
$HealthUrl = "$ServiceUrl/api/health"
Write-Host "Checking /api/health endpoint: $HealthUrl ..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 15
    Write-Host "Health Status:      $($health.status)" -ForegroundColor Green
    Write-Host "Deployed Commit SHA: $($health.commitHash)" -ForegroundColor Green
    Write-Host "Build Version:      $($health.buildVersion)" -ForegroundColor Green
    Write-Host "Uptime (seconds):   $($health.uptimeSeconds)" -ForegroundColor Green

    if ($ExpectedCommit -and $health.commitHash -ne $ExpectedCommit) {
        Write-Warning "MISMATCH: Expected commit '$ExpectedCommit', but live service reports '$($health.commitHash)'"
    } elseif ($ExpectedCommit) {
        Write-Host "PROVABLE MATCH: Live commit matches expected commit $ExpectedCommit" -ForegroundColor Green
    }
} catch {
    Write-Error "Health check failed: $_"
}
