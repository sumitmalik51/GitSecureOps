# GitHub Actions Workflows Documentation

## 🏗️ Two-Workflow Architecture

This repository uses a **separation of concerns** approach with two distinct GitHub Actions workflows:

### 1. Deploy Infrastructure (`deploy-infrastructure.yml`)

**Purpose:** Sets up Azure resources and infrastructure

**Triggers:**
- ✅ Manual workflow dispatch only
- ✅ Environment selection (dev/staging/prod)
- ✅ Region selection

**What it does:**
- Deploys Bicep templates to create Azure resources
- Creates Static Web App, Function App, Key Vault, Storage Account
- Configures all Azure resources with proper settings
- Generates dynamic redirect URIs
- Outputs deployment information for OAuth configuration

**When to use:**
- First-time setup for any environment
- Infrastructure updates or changes
- New environment provisioning

**Required secrets:**
- `AZURE_CREDENTIALS` - Service Principal for Azure
- `GH_WEB_APP` - GitHub OAuth App Client ID
- `GH_WEB_APP_SECRET` - GitHub OAuth App Secret

### 2. Deploy Application (`deploy-application.yml`)

**Purpose:** Builds and deploys application code to existing infrastructure

**Triggers:**
- ✅ **Automatic:** Push to main branch (deploys to dev)
- ✅ **Manual:** Workflow dispatch with environment selection
- ✅ **Smart filtering:** Only runs on app code changes (ignores infra/, *.md, scripts/)

**What it does:**
- Builds React application with environment-specific variables
- Installs dependencies for both frontend and API
- Retrieves SWA deployment token automatically
- Deploys using SWA CLI to target environment

**When to use:**
- Regular code deployments
- Feature releases
- Bug fixes and updates

**Required secrets:**
- `AZURE_CREDENTIALS` - Service Principal for Azure
- `GH_WEB_APP` - GitHub OAuth App Client ID

## 🚀 Usage Guide

### Initial Setup (One-time per environment)

1. **Run Deploy Infrastructure Workflow**
   ```
   GitHub → Actions → Deploy Infrastructure → Run workflow
   ```

2. **Configure GitHub OAuth App**
   ```
   Use URLs from workflow output to update OAuth App settings
   ```

3. **Test Application Deployment**
   ```
   GitHub → Actions → Deploy Application → Run workflow
   ```

### Regular Development

1. **Make code changes**
2. **Push to main branch** → Auto-deploys to dev environment
3. **Manual deployment to staging/prod** → Use Deploy Application workflow

## 📋 Required GitHub Secrets

```bash
AZURE_CREDENTIALS          # Service Principal JSON
GH_WEB_APP                 # GitHub OAuth Client ID  
GH_WEB_APP_SECRET         # GitHub OAuth Client Secret
```

## 🎯 Benefits of Two-Workflow Approach

✅ **Separation of Concerns** - Infrastructure vs Application  
✅ **Faster Deployments** - No infrastructure overhead for app changes  
✅ **Environment Control** - Deploy to specific environments easily  
✅ **Resource Efficiency** - Only run what you need  
✅ **Better Debugging** - Isolated failure points  
✅ **Flexible Deployment** - Mix automatic and manual triggers
