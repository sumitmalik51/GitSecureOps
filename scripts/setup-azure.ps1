# Azure Deployment Setup Script for Windows

Write-Host "🚀 Setting up Azure deployment for GitHub Repository Manager" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

# Check if azd is installed
try {
    azd version | Out-Null
    Write-Host "✅ Azure Developer CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure Developer CLI (azd) is not installed." -ForegroundColor Red
    Write-Host "📥 Please install it from: https://aka.ms/install-azd" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
Write-Host "🔐 Checking Azure authentication..." -ForegroundColor Cyan
try {
    azd auth login --check-status 2>$null
    Write-Host "✅ Already authenticated with Azure" -ForegroundColor Green
} catch {
    Write-Host "🔑 Please log in to Azure:" -ForegroundColor Yellow
    azd auth login
}

# Initialize project if not already done
if (!(Test-Path ".azure/config.json")) {
    Write-Host "🏗️  Initializing Azure project..." -ForegroundColor Cyan
    azd init --template minimal
} else {
    Write-Host "✅ Azure project already initialized" -ForegroundColor Green
}

# Set up environment
Write-Host "🌍 Setting up environment..." -ForegroundColor Cyan
$envName = Read-Host "Enter environment name (e.g., dev, staging, prod)"

if ($envName) {
    azd env new $envName
    azd env select $envName
    
    Write-Host "🔧 Configuring environment variables..." -ForegroundColor Cyan
    
    # GitHub OAuth Configuration
    $githubClientId = Read-Host "Enter GitHub OAuth Client ID"
    $githubRedirectUri = Read-Host "Enter GitHub OAuth Redirect URI (or press Enter for auto)"
    
    if (!$githubRedirectUri) {
        $githubRedirectUri = "https://your-app-url.azurestaticapps.net/auth/callback"
        Write-Host "📋 Using default redirect URI: $githubRedirectUri" -ForegroundColor Yellow
        Write-Host "⚠️  You'll need to update this after deployment" -ForegroundColor Yellow
    }
    
    azd env set REACT_APP_GITHUB_CLIENT_ID $githubClientId
    azd env set REACT_APP_GITHUB_REDIRECT_URI $githubRedirectUri
    
    Write-Host "✅ Environment variables configured" -ForegroundColor Green
    
    # Deploy
    Write-Host "🚀 Ready to deploy!" -ForegroundColor Green
    $deployNow = Read-Host "Deploy now? (y/N)"
    
    if ($deployNow -match "^[Yy]$") {
        Write-Host "🏗️  Deploying to Azure..." -ForegroundColor Cyan
        azd up
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🎉 Deployment successful!" -ForegroundColor Green
            Write-Host "📋 Next steps:" -ForegroundColor Cyan
            Write-Host "1. Update your GitHub OAuth app with the actual redirect URI" -ForegroundColor White
            Write-Host "2. Add GitHub repository secrets for CI/CD" -ForegroundColor White
            Write-Host "3. Configure your GitHub OAuth app settings" -ForegroundColor White
            
            # Show the deployed URL
            azd show --output table
        } else {
            Write-Host "❌ Deployment failed. Check the logs above." -ForegroundColor Red
        }
    } else {
        Write-Host "⏳ Deployment skipped. Run 'azd up' when ready." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Environment name is required" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
