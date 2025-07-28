#!/bin/bash

# Azure Deployment Setup Script

echo "🚀 Setting up Azure deployment for GitHub Repository Manager"
echo "============================================================"

# Check if azd is installed
if ! command -v azd &> /dev/null; then
    echo "❌ Azure Developer CLI (azd) is not installed."
    echo "📥 Please install it from: https://aka.ms/install-azd"
    exit 1
fi

echo "✅ Azure Developer CLI found"

# Check if user is logged in
echo "🔐 Checking Azure authentication..."
if ! azd auth login --check-status &> /dev/null; then
    echo "🔑 Please log in to Azure:"
    azd auth login
else
    echo "✅ Already authenticated with Azure"
fi

# Initialize project if not already done
if [ ! -f ".azure/config.json" ]; then
    echo "🏗️  Initializing Azure project..."
    azd init --template minimal
else
    echo "✅ Azure project already initialized"
fi

# Set up environment
echo "🌍 Setting up environment..."
read -p "Enter environment name (e.g., dev, staging, prod): " ENV_NAME

if [ ! -z "$ENV_NAME" ]; then
    azd env new $ENV_NAME
    azd env select $ENV_NAME
    
    echo "🔧 Configuring environment variables..."
    
    # GitHub OAuth Configuration
    read -p "Enter GitHub OAuth Client ID: " GITHUB_CLIENT_ID
    read -p "Enter GitHub OAuth Redirect URI (or press Enter for auto): " GITHUB_REDIRECT_URI
    
    if [ -z "$GITHUB_REDIRECT_URI" ]; then
        GITHUB_REDIRECT_URI="https://your-app-url.azurestaticapps.net/auth/callback"
        echo "📋 Using default redirect URI: $GITHUB_REDIRECT_URI"
        echo "⚠️  You'll need to update this after deployment"
    fi
    
    azd env set REACT_APP_GITHUB_CLIENT_ID "$GITHUB_CLIENT_ID"
    azd env set REACT_APP_GITHUB_REDIRECT_URI "$GITHUB_REDIRECT_URI"
    
    echo "✅ Environment variables configured"
    
    # Deploy
    echo "🚀 Ready to deploy!"
    read -p "Deploy now? (y/N): " DEPLOY_NOW
    
    if [[ $DEPLOY_NOW =~ ^[Yy]$ ]]; then
        echo "🏗️  Deploying to Azure..."
        azd up
        
        if [ $? -eq 0 ]; then
            echo "🎉 Deployment successful!"
            echo "📋 Next steps:"
            echo "1. Update your GitHub OAuth app with the actual redirect URI"
            echo "2. Add GitHub repository secrets for CI/CD"
            echo "3. Configure your GitHub OAuth app settings"
            
            # Show the deployed URL
            azd show --output table
        else
            echo "❌ Deployment failed. Check the logs above."
        fi
    else
        echo "⏳ Deployment skipped. Run 'azd up' when ready."
    fi
else
    echo "❌ Environment name is required"
    exit 1
fi

echo "✅ Setup complete!"
