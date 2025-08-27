# GitSecureOps Azure Deployment Script (PowerShell)
# This script deploys the GitSecureOps application to Azure Static Web Apps

param(
    [string]$EnvironmentName,
    [string]$Region = "eastus",
    [string]$GitHubClientId,
    [string]$GitHubClientSecret,
    [string]$GitHubRedirectUri
)

Write-Host "🚀 GitSecureOps Azure Deployment Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Azure CLI
try {
    $azVersion = az version --query "\"azure-cli\"" -o tsv 2>$null
    Write-Host "✅ Azure CLI found (version: $azVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install Azure CLI and try again." -ForegroundColor Red
    Write-Host "   Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    Write-Host "✅ npm found (version: $npmVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install Node.js and npm." -ForegroundColor Red
    exit 1
}

# Check Azure login
try {
    $account = az account show 2>$null | ConvertFrom-Json
    Write-Host "✅ Logged into Azure as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Please login to Azure CLI first:" -ForegroundColor Red
    Write-Host "   az login" -ForegroundColor Yellow
    exit 1
}

# Get configuration if not provided
if (-not $EnvironmentName) {
    $EnvironmentName = Read-Host "Enter environment name (dev/staging/prod)"
}

if (-not $GitHubClientId) {
    $GitHubClientId = Read-Host "Enter GitHub OAuth Client ID"
}

if (-not $GitHubClientSecret) {
    $GitHubClientSecret = Read-Host "Enter GitHub OAuth Client Secret" -AsSecureString
    $GitHubClientSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($GitHubClientSecret))
}

if (-not $GitHubRedirectUri) {
    $GitHubRedirectUri = Read-Host "Enter GitHub Redirect URI"
}

$ResourceGroup = "rg-gitsecureops-$EnvironmentName"

Write-Host ""
Write-Host "📋 Deployment Configuration:" -ForegroundColor Cyan
Write-Host "   Environment: $EnvironmentName" -ForegroundColor White
Write-Host "   Region: $Region" -ForegroundColor White
Write-Host "   Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "   GitHub Client ID: $GitHubClientId" -ForegroundColor White
Write-Host "   Redirect URI: $GitHubRedirectUri" -ForegroundColor White
Write-Host ""

$Confirm = Read-Host "Continue with deployment? (y/N)"
if ($Confirm -notmatch '^[Yy]$') {
    Write-Host "❌ Deployment cancelled." -ForegroundColor Red
    exit 0
}

# Deploy infrastructure
Write-Host ""
Write-Host "🏗️  Deploying Infrastructure with Complete Configuration..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow

try {
    $deploymentOutput = az deployment sub create `
        --location $Region `
        --template-file infra/main.bicep `
        --parameters `
        environmentName=$EnvironmentName `
        location=$Region `
        resourceGroupName=$ResourceGroup `
        githubClientId=$GitHubClientId `
        githubRedirectUri="https://placeholder.azurestaticapps.net/oauth-callback" `
        githubClientSecret=$GitHubClientSecret `
        --query 'properties.outputs' -o json | ConvertFrom-Json

    $swaUrl = $deploymentOutput.STATICWEBAPP_URL.value
    $swaName = $deploymentOutput.STATICWEBAPP_NAME.value
    $functionName = $deploymentOutput.FUNCTIONAPP_NAME.value
    $dynamicRedirectUri = "https://$swaUrl/oauth-callback"

    Write-Host "✅ Infrastructure deployed with complete configuration!" -ForegroundColor Green
    Write-Host "📍 Static Web App URL: https://$swaUrl" -ForegroundColor White
    Write-Host "🔧 Function App Name: $functionName" -ForegroundColor White
    Write-Host "🔗 OAuth Redirect URI: $dynamicRedirectUri" -ForegroundColor White
} catch {
    Write-Host "❌ Infrastructure deployment failed!" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing Dependencies..." -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

npm ci

Write-Host "✅ Dependencies installed!" -ForegroundColor Green

# Build application
Write-Host ""
Write-Host "🔨 Building Application..." -ForegroundColor Yellow
Write-Host "==========================" -ForegroundColor Yellow

$env:VITE_GITHUB_CLIENT_ID = $GitHubClientId
$env:VITE_GITHUB_REDIRECT_URI = $dynamicRedirectUri

try {
    npm run build
    Write-Host "✅ Application built successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Install API dependencies
Write-Host ""
Write-Host "📦 Installing API Dependencies..." -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

Push-Location api
npm ci
Pop-Location

Write-Host "✅ API dependencies installed!" -ForegroundColor Green

# Install SWA CLI for deployment
Write-Host ""
Write-Host "🔧 Installing SWA CLI..." -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow

npm install -g @azure/static-web-apps-cli

Write-Host "✅ SWA CLI installed!" -ForegroundColor Green

# Deploy to Static Web App
Write-Host ""
Write-Host "🚀 Deploying to Static Web App..." -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

try {
    # Get the SWA deployment token
    $swaToken = az staticwebapp secrets list `
        --resource-group $ResourceGroup `
        --name $swaName `
        --query "properties.apiKey" -o tsv

    # Deploy using SWA CLI
    swa deploy ./dist `
        --api-location ./api `
        --deployment-token "$swaToken" `
        --verbose

    Write-Host "✅ Application deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

# Get Static Web App details
Write-Host ""
Write-Host "🔍 Deployment Summary..." -ForegroundColor Yellow

Write-Host "   Static Web App: $swaName" -ForegroundColor White
Write-Host "   Function App: $functionName" -ForegroundColor White
Write-Host "   URL: https://$swaUrl" -ForegroundColor White

# Final instructions
Write-Host ""
Write-Host "🎉 Deployment Completed!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update your GitHub OAuth App settings:" -ForegroundColor White
Write-Host "   - Homepage URL: https://$swaUrl" -ForegroundColor Yellow
Write-Host "   - Authorization callback URL: $dynamicRedirectUri" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. To enable automated deployments:" -ForegroundColor White
Write-Host "   - Get the Static Web App deployment token from Azure Portal" -ForegroundColor Yellow
Write-Host "   - Add it as AZURE_STATIC_WEB_APPS_API_TOKEN in GitHub repository secrets" -ForegroundColor Yellow
Write-Host "   - Configure other GitHub secrets as documented in README.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Your application is now live at:" -ForegroundColor White
Write-Host "   🌐 https://$swaUrl" -ForegroundColor Cyan
Write-Host "4. Monitor your deployment:" -ForegroundColor White
Write-Host "   📊 Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "   🔧 Function App logs available in Azure Portal" -ForegroundColor Yellow
Write-Host ""
Write-Host "Happy GitOps! 🚀" -ForegroundColor Green
