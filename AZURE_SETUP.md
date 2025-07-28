# Azure Static Web App Deployment Setup

This guide will help you deploy your GitHub Repository Manager to your existing Azure Static Web App using GitHub Actions.

## Prerequisites

✅ **Existing Azure Static Web App** (already created in Azure Portal)  
✅ **GitHub Repository** (this repository)  
✅ **GitHub OAuth App** (for authentication)

## Step 1: Get Azure Static Web App Deployment Token

1. Go to the **Azure Portal** → **Static Web Apps**
2. Select your existing Static Web App
3. Go to **Overview** → **Manage deployment token**
4. **Copy** the deployment token (you'll need this for GitHub secrets)

## Step 2: Configure GitHub Repository Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these **Repository Secrets**:

| Secret Name | Value | Description |
|-------------|--------|-------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_YELLOW_PEBBLE_03A66440F` | `<deployment-token-from-step-1>` | Azure Static Web App deployment token |
| `VITE_GITHUB_CLIENT_ID` | `<your-github-oauth-client-id>` | GitHub OAuth App Client ID |
| `VITE_GITHUB_REDIRECT_URI` | `https://<your-swa-url>/auth/callback` | OAuth callback URL |
| `VITE_GITHUB_CLIENT_SECRET` | `<your-github-oauth-secret>` | GitHub OAuth App Client Secret |

### How to get your Static Web App URL:
- Azure Portal → Your Static Web App → **Overview** → **URL**
- Example: `https://happy-ocean-12345.azurestaticapps.net`

## Step 3: Configure GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/applications)
2. Select your OAuth App (or create one if needed)
3. Update these settings:
   - **Homepage URL**: `https://<your-swa-url>`
   - **Authorization callback URL**: `https://<your-swa-url>/auth/callback`

### Creating a new GitHub OAuth App (if needed):
1. Go to https://github.com/settings/applications/new
2. Fill in:
   - **Application name**: `GitHub AccessOps`
   - **Homepage URL**: `https://<your-swa-url>`
   - **Authorization callback URL**: `https://<your-swa-url>/auth/callback`
3. Save and copy the **Client ID** and **Client Secret**

## Step 4: Test the Deployment

1. **Push to your repository** (main branch)
2. **Check GitHub Actions**: Go to **Actions** tab in your repository
3. **Monitor deployment**: The workflow should trigger automatically
4. **Verify deployment**: Check your Static Web App URL

## Step 5: Configure Static Web App Settings (Optional)

In Azure Portal → Your Static Web App → **Configuration**:

Add these **Application Settings** for runtime configuration:

| Name | Value |
|------|--------|
| `VITE_GITHUB_CLIENT_ID` | `<your-github-oauth-client-id>` |
| `VITE_GITHUB_REDIRECT_URI` | `https://<your-swa-url>/auth/callback` |

## Troubleshooting

### Common Issues:

1. **Deployment fails with "unauthorized"**
   - ✅ Check `AZURE_STATIC_WEB_APPS_API_TOKEN_YELLOW_PEBBLE_03A66440F` secret is correct
   - ✅ Verify the token is from the correct Static Web App

2. **OAuth errors after deployment**
   - ✅ Verify GitHub OAuth app callback URL matches deployed URL
   - ✅ Check `VITE_GITHUB_CLIENT_ID` and redirect URI secrets

3. **Build fails**
   - ✅ Ensure all environment variable secrets are set
   - ✅ Check GitHub Actions logs for specific errors

4. **App loads but OAuth doesn't work**
   - ✅ Open browser developer tools and check console for errors
   - ✅ Verify OAuth app settings in GitHub

### Useful Commands:

```bash
# Test build locally
npm run build

# Check environment variables in build
npm run build -- --mode production

# Preview production build locally
npm run preview
```

## Workflow Triggers

The GitHub Actions workflow will trigger on:
- ✅ **Push** to `main` branch
- ✅ **Pull requests** to `main` branch
- ✅ **PR closure** (cleans up preview deployments)

## Security Notes

- 🔐 **Never commit secrets** to the repository
- 🔐 **Use GitHub repository secrets** for sensitive data
- 🔐 **OAuth secrets** are only needed if doing server-side token exchange
- 🔐 **Deployment token** has limited scope to your specific Static Web App

## Next Steps After Successful Deployment

1. **Test the application** thoroughly
2. **Configure custom domain** (optional)
3. **Set up monitoring** in Azure
4. **Configure staging slots** for preview deployments
5. **Set up alerts** for deployment failures

---

## Quick Checklist

- [ ] Copied deployment token from Azure Static Web App
- [ ] Added all required GitHub repository secrets
- [ ] Updated GitHub OAuth app callback URL
- [ ] Pushed code to trigger first deployment
- [ ] Verified application loads and OAuth works
- [ ] Tested core functionality

Need help? Check the GitHub Actions logs in your repository's **Actions** tab for detailed error messages.
