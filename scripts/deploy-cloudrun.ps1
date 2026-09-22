[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$ProjectId = "vyra-509011",

    [Parameter(Mandatory = $false)]
    [string]$ServiceName = "newme-app",

    [Parameter(Mandatory = $false)]
    [string]$Region = "us-central1",

    [Parameter(Mandatory = $false)]
    [switch]$AllowUnauthenticated = $true
)

$ErrorActionPreference = "Stop"

Write-Host "`n =========================================" -ForegroundColor Cyan
Write-Host "   VYRA Life OS Cloud Run Deployment    " -ForegroundColor Cyan
Write-Host " =========================================`n" -ForegroundColor Cyan

# Ensure CLOUDSDK_PYTHON is set
if (-not $env:CLOUDSDK_PYTHON) {
    if (Test-Path "C:\Users\rouca\python-sdk\python3.13.2\python.exe") {
        $env:CLOUDSDK_PYTHON = "C:\Users\rouca\python-sdk\python3.13.2\python.exe"
    }
}

# Resolve gcloud command
$GcloudCmd = "gcloud"
if (Test-Path "C:\Users\rouca\.stitch-mcp\google-cloud-sdk\bin\gcloud.cmd") {
    $GcloudCmd = "C:\Users\rouca\.stitch-mcp\google-cloud-sdk\bin\gcloud.cmd"
}

if ([string]::IsNullOrWhiteSpace($ProjectId)) {
    $currentProject = (& $GcloudCmd config get-value project 2>$null)
    if (-not [string]::IsNullOrWhiteSpace($currentProject) -and $currentProject -notmatch "unset") {
        $ProjectId = $currentProject.Trim()
    } else {
        $ProjectId = "vyra-509011"
    }
}

Write-Host "[1/4] Targeted GCP Project: $ProjectId" -ForegroundColor Green
Write-Host "[1/4] Service Name:         $ServiceName" -ForegroundColor Green
Write-Host "[1/4] Target Region:        $Region" -ForegroundColor Green

# Use Artifact Registry in us-central1
$ImageUri = "us-central1-docker.pkg.dev/${ProjectId}/newme-repo/${ServiceName}:latest"
Write-Host "`n[2/4] Building image with Cloud Build: $ImageUri ..." -ForegroundColor Yellow
& $GcloudCmd builds submit --project $ProjectId --tag $ImageUri .

Write-Host "`n[3/4] Deploying to Cloud Run ..." -ForegroundColor Yellow
$DeployArgs = @(
    "run", "deploy", $ServiceName,
    "--project", $ProjectId,
    "--image", $ImageUri,
    "--platform", "managed",
    "--region", $Region,
    "--port", "8080",
    "--memory", "512Mi",
    "--cpu", "1",
    "--min-instances", "0",
    "--max-instances", "10",
    "--set-env-vars", "NODE_ENV=production"
)

if ($AllowUnauthenticated) {
    $DeployArgs += "--allow-unauthenticated"
}

& $GcloudCmd @DeployArgs

 Write-Host "`f[4/4] Verifying Deployment Health ..." -ForegroundColor Yellow
$ServiceUrl = (& $GcloudCmd run services describe $ServiceName --project $ProjectId --region $Region --format "value(status.url)").Trim()

if ($ServiceUrl) {
    Write-Host "`n[success] Service deployed successfully!" -ForegroundColor Green
    Write-Host "Service URL:    $ServiceUrl" -ForegroundColor Cyan
    Write-Host "Health Check:  $ServiceUrl/api/health" -ForegroundColor Cyan

    try {
        $HealthResponse = Invoke-RestMethod -Uri "$ServiceUrl/api/health" -TimeoutSec 15
        Write-Host "`p[Probe] Health Response:" -ForegroundColor Green
        $HealthResponse | ConvertTo-Json -Depth 3 | Write-Host
    } catch {
        Write-Warning "Unresolved health check: $_"
    }
}
