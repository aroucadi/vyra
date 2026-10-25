[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$ProjectId = "vyra-509011",

    [Parameter(Mandatory = $false)]
    [string]$ServiceName = "vyra-app",

    [Parameter(Mandatory = $false)]
    [string]$Region = "us-central1",

    [Parameter(Mandatory = $false)]
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "   VYRA Provable Cloud Run Deployer       " -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# 1. Pre-flight Check: Dirty Working Tree (tracked modifications)
$gitStatus = (git status --porcelain -uno)
if ($gitStatus) {
    Write-Error "DEPLOY REFUSED: Git working tree has uncommitted modifications. Stash or commit all changes before deploying."
    exit 1
}

# 2. Pre-flight Check: Unpushed Commits
$currentBranch = (git branch --show-current).Trim()
$unpushed = (git log "origin/$currentBranch..HEAD" --oneline 2>$null)
if ($unpushed) {
    Write-Warning "Unpushed commits detected on $currentBranch:"
    $unpushed | Write-Host -ForegroundColor Yellow
    Write-Error "DEPLOY REFUSED: Local commits must be pushed to origin/$currentBranch before deploying."
    exit 1
}

# 3. Resolve Current Commit SHA
$commitSha = (git rev-parse --short HEAD).Trim()
$fullSha = (git rev-parse HEAD).Trim()
Write-Host "Deploying verified commit: $commitSha ($fullSha)" -ForegroundColor Green

# 4. Resolve gcloud & python environment
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

Write-Host "Submitting Cloud Build with substitutions _COMMIT_SHA=$commitSha..." -ForegroundColor Cyan
$buildCommand = "$GcloudCmd builds submit --project $ProjectId --config cloudbuild.yaml --substitutions `"_COMMIT_SHA=$commitSha`" ."

if ($DryRun) {
    Write-Host "`n[DRY RUN MODE ENABLED]" -ForegroundColor Magenta
    Write-Host "All pre-flight checks passed." -ForegroundColor Green
    Write-Host "Resolved Commit SHA: $commitSha ($fullSha)" -ForegroundColor Green
    Write-Host "Substitutions:        _COMMIT_SHA=$commitSha" -ForegroundColor Green
    Write-Host "Build Command:        $buildCommand" -ForegroundColor Green
    Write-Host "Dry run completed successfully. No build was submitted." -ForegroundColor Magenta
    exit 0
}

& $GcloudCmd builds submit `
    --project $ProjectId `
    --config cloudbuild.yaml `
    --substitutions "_COMMIT_SHA=$commitSha" `
    .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Build failed with exit code $LASTEXITCODE."
    exit $LASTEXITCODE
}

Write-Host "`nDeployment finished. Running verification..." -ForegroundColor Green
& "$PSScriptRoot\verify-deploy.ps1" -ProjectId $ProjectId -ServiceName $ServiceName -Region $Region -ExpectedCommit $commitSha
