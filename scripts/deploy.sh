#!/bin/bash

# GitSecureOps Azure Deployment Script
# This script deploys the GitSecureOps application to Azure Static Web Apps

set -e

echo "🚀 GitSecureOps Azure Deployment Script"
echo "========================================"

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install Azure CLI and try again."
    echo "   Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js and npm."
    exit 1
fi

# Check if logged into Azure
if ! az account show &> /dev/null; then
    echo "❌ Please login to Azure CLI first:"
    echo "   az login"
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Get configuration
echo ""
echo "🔧 Configuration Setup"
echo "======================"

read -p "Enter environment name (dev/staging/prod): " ENV_NAME
read -p "Enter Azure region (default: eastus): " REGION
REGION=${REGION:-eastus}

read -p "Enter GitHub OAuth Client ID: " GH_CLIENT_ID
read -s -p "Enter GitHub OAuth Client Secret: " GH_CLIENT_SECRET
echo ""

# We'll generate the redirect URI dynamically after deployment
PLACEHOLDER_REDIRECT_URI="https://placeholder.com/oauth-callback"

RESOURCE_GROUP="rg-gitsecureops-${ENV_NAME}"

echo ""
echo "📋 Deployment Configuration:"
echo "   Environment: ${ENV_NAME}"
echo "   Region: ${REGION}"
echo "   Resource Group: ${RESOURCE_GROUP}"
echo "   GitHub Client ID: ${GH_CLIENT_ID}"
echo "   Redirect URI: Will be generated dynamically"
echo ""

read -p "Continue with deployment? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

# Deploy infrastructure
echo ""
echo "🏗️  Deploying Infrastructure with Complete Configuration..."
echo "=========================================================="

DEPLOYMENT_OUTPUT=$(az deployment sub create \
    --location "$REGION" \
    --template-file infra/main.bicep \
    --parameters \
        environmentName="$ENV_NAME" \
        location="$REGION" \
        resourceGroupName="$RESOURCE_GROUP" \
        githubClientId="$GH_CLIENT_ID" \
        githubRedirectUri="$PLACEHOLDER_REDIRECT_URI" \
        githubClientSecret="$GH_CLIENT_SECRET" \
    --query 'properties.outputs' -o json)

if [ $? -ne 0 ]; then
    echo "❌ Infrastructure deployment failed!"
    exit 1
fi

# Extract outputs and generate dynamic redirect URI
SWA_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.STATICWEBAPP_URL.value')
SWA_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.STATICWEBAPP_NAME.value')
FUNCTION_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.FUNCTIONAPP_NAME.value')
DYNAMIC_REDIRECT_URI="https://${SWA_URL}/oauth-callback"

echo "✅ Infrastructure deployed with complete configuration!"
echo "📍 Static Web App URL: https://${SWA_URL}"
echo "� Function App Name: ${FUNCTION_NAME}" 
echo "🔗 OAuth Redirect URI: ${DYNAMIC_REDIRECT_URI}"

# Install dependencies
echo ""
echo "📦 Installing Dependencies..."
echo "============================="

npm ci

echo "✅ Dependencies installed!"

# Build application
echo ""
echo "🔨 Building Application..."
echo "=========================="

export VITE_GITHUB_CLIENT_ID="$GH_CLIENT_ID"
export VITE_GITHUB_REDIRECT_URI="$DYNAMIC_REDIRECT_URI"

npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Application built successfully!"

# Install API dependencies
echo ""
echo "📦 Installing API Dependencies..."
echo "================================="

cd api
npm ci
cd ..

echo "✅ API dependencies installed!"

# Install SWA CLI for deployment
echo ""
echo "🔧 Installing SWA CLI..."
echo "========================"

npm install -g @azure/static-web-apps-cli

echo "✅ SWA CLI installed!"

# Deploy to Static Web App
echo ""
echo "🚀 Deploying to Static Web App..."
echo "================================="

# Get the SWA deployment token
SWA_TOKEN=$(az staticwebapp secrets list \
    --resource-group "$RESOURCE_GROUP" \
    --name "$SWA_NAME" \
    --query "properties.apiKey" -o tsv)

# Deploy using SWA CLI
swa deploy ./dist \
    --api-location ./api \
    --deployment-token "$SWA_TOKEN" \
    --verbose

if [ $? -eq 0 ]; then
    echo "✅ Application deployed successfully!"
else
    echo "❌ Deployment failed!"
    exit 1
fi

# Get Static Web App details
echo ""
echo "🔍 Deployment Summary..."

echo "   Static Web App: ${SWA_NAME}"
echo "   Function App: ${FUNCTION_NAME}"
echo "   URL: https://${SWA_URL}"

# Final instructions
echo ""
echo "🎉 Deployment Completed!"
echo "========================"
echo ""
echo "Next Steps:"
echo "1. Update your GitHub OAuth App settings:"
echo "   - Homepage URL: https://${SWA_URL}"
echo "   - Authorization callback URL: ${DYNAMIC_REDIRECT_URI}"
echo ""
echo "2. To enable automated deployments:"
echo "   - Get the Static Web App deployment token from Azure Portal"
echo "   - Add it as AZURE_STATIC_WEB_APPS_API_TOKEN in GitHub repository secrets"
echo "   - Configure other GitHub secrets as documented in README.md"
echo ""
echo "3. Your application is now live at:"
echo "   🌐 https://${SWA_URL}"
echo ""
echo "4. Monitor your deployment:"
echo "   📊 Resource Group: ${RESOURCE_GROUP}"
echo "   🔧 Function App logs available in Azure Portal"
echo ""
echo "Happy GitOps! 🚀"
