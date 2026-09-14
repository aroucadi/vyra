[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$ProjectId = $env:GCP_PROJECT,

    [Parameter(Mandatory = $false)]
    [string]$ServiceName = "newme-app",

    [Parameter(Mandatory = $false)]
    [string]$Region = "us-central1",

    [Parameter(Mandatory = $false)]
    [switch]$AllowUnauthenticated = $true
)

$ErrorActionPreference = "Stop"

Write-Host "\n =========================================" -ForegroundColor Cyan
Write-Host "  NewME Cloud Run Deployment Automation  " -ForegroundColor Cyan
Write-Host " =========================================\n" -ForegroundColor Cyan

if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Error "Google Cloud SDK (gcloud) is not installed or not in PATH."
}

if ([string]::IsNullOrWhiteSpace($ProjectId)) {
    $currentProject = (gcloud config get-value project 2>$null)
    if (-not [string]::IsNullOrWhiteSpace($currentProject) -and $currentProject -notmatch "unset") {
        $ProjectId = $currentProject.Trim()
    } else {
        Write-Error "No GCP Project specified. Pass -ProjectId or set 'gcloud config set project <PROJECT_ID>'."
    }
}

Write-Host "[1/4] Targeted GCP Project: $ProjectId" -ForegroundColor Green
Write-Host "[1/4] Service Name:         $ServiceName" -ForegroundColor Green
Write-Host "[1/4] Target Region:        $Region" -ForegroundColor Green

$ImageUri = "gcr.io/$ProjectId/$ServiceName:latest"
Write-Host "`f[2/4] Building image with Cloud Build: $ImageUri ..." -ForegroundColor Yellow
gcloud builds submit --project $ProjectId --tag $ImageUri .

Write-Host "`f[3/4] Deploying to Cloud Run ..." -ForegroundColor Yellow
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

gcloud @DeployArgs

 Write-Host "`f[4/4] Verifying Deployment Health ..." -ForegroundColor Yellow
$ServiceUrl = (gcloud run services describe $ServiceName --project $ProjectId --region $Region --format "value(status.url)").Trim()

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
