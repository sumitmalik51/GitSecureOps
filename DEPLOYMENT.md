# Azure Deployment Guide

This guide will help you deploy the GitHub Repository Manager application to Azure using GitHub Actions and Azure Static Web Apps.

## Prerequisites

1. **Azure Account**: You need an active Azure subscription
2. **GitHub Account**: Repository should be hosted on GitHub
3. **Azure CLI**: Install from [https://docs.microsoft.com/en-us/cli/azure/install-azure-cli](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
4. **GitHub OAuth App**: Create at [https://github.com/settings/applications/new](https://github.com/settings/applications/new)

## Setup Steps

### 1. Clone and Prepare Repository

```bash
git clone <your-repo-url>
cd GitSecureOps
```

### 2. Install Azure Developer CLI (azd)

```bash
# Windows (PowerShell)
powershell -ex AllSigned -c "Invoke-RestMethod 'https://aka.ms/install-azd.ps1' | Invoke-Expression"

# macOS/Linux
curl -fsSL https://aka.ms/install-azd.sh | bash
```

### 3. Initialize Azure Deployment

```bash
# Login to Azure
azd auth login

# Initialize the project (if not already done)
azd init

# Set up environment
azd env new <environment-name>
```

### 4. Configure Environment Variables

Set the required environment variables:

```bash
azd env set REACT_APP_GITHUB_CLIENT_ID "your-github-client-id"
azd env set REACT_APP_GITHUB_REDIRECT_URI "https://your-app-url.azurestaticapps.net/auth/callback"
```

### 5. Deploy to Azure

```bash
# Deploy infrastructure and application
azd up
```

This will:
- Create a resource group
- Deploy Azure Static Web Apps
- Set up Application Insights
- Configure the GitHub Actions workflow

### 6. Configure GitHub Secrets

After deployment, you need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`: Found in Azure Portal → Static Web Apps → Manage deployment token
   - `REACT_APP_GITHUB_CLIENT_ID`: Your GitHub OAuth app client ID
   - `REACT_APP_GITHUB_REDIRECT_URI`: Your production callback URL

### 7. Update GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/applications)
2. Update your OAuth app settings:
   - **Homepage URL**: `https://<your-static-web-app-url>.azurestaticapps.net`
   - **Authorization callback URL**: `https://<your-static-web-app-url>.azurestaticapps.net/auth/callback`

## GitHub Actions Workflow

The deployment includes an automated GitHub Actions workflow (`.github/workflows/azure-static-web-apps.yml`) that:

- Triggers on pushes to main/master branch
- Builds the React application
- Deploys to Azure Static Web Apps
- Handles pull request previews

## Environment Variables

The application uses these environment variables:

- `REACT_APP_GITHUB_CLIENT_ID`: GitHub OAuth app client ID
- `REACT_APP_GITHUB_REDIRECT_URI`: OAuth callback URL
- `APPLICATIONINSIGHTS_CONNECTION_STRING`: Application Insights (automatically configured)

## Monitoring

The deployment includes Application Insights for monitoring:
- Performance metrics
- Error tracking
- User analytics

Access monitoring through Azure Portal → Application Insights.

## Troubleshooting

### Common Issues

1. **Deployment fails**: Check Azure subscription permissions
2. **OAuth errors**: Verify GitHub app configuration and secrets
3. **Build errors**: Ensure all dependencies are in package.json

### Useful Commands

```bash
# Check deployment status
azd show

# View application logs
azd logs

# Update environment variables
azd env set VARIABLE_NAME "value"

# Redeploy
azd deploy
```

## Cost Optimization

This deployment uses:
- **Azure Static Web Apps (Free tier)**: No cost for small applications
- **Application Insights**: Pay-per-use (minimal cost for small apps)
- **Log Analytics**: 5GB free per month

## Security Considerations

- Secrets are stored in GitHub repository secrets
- Environment variables are injected at build time
- Application Insights connection string is automatically configured
- No hardcoded credentials in the codebase

## Next Steps

1. Monitor application performance in Azure Portal
2. Set up custom domain (optional)
3. Configure additional environments (staging, etc.)
4. Set up alerts and monitoring rules
