# GitHub Token Permissions for GitSecureOps

This document explains the required GitHub token permissions for different features in GitSecureOps.

## Token Requirements

### Basic Repository Access
For basic repository and collaborator management:
- `repo` - Full control of private repositories
- `read:org` - Read org and team membership

### Organization Management
For inviting users to organizations (especially via email):
- `admin:org` - Full control of orgs and teams, read and write org projects
- Organization owner permissions in the target organization

### Copilot Management
For managing GitHub Copilot seats:
- `admin:org` - Required to manage Copilot billing and seats
- `copilot` - Access to GitHub Copilot (if available)

## Creating a GitHub Token

1. Go to [GitHub Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Select the required scopes based on your needs:
   - **For full GitSecureOps functionality**: `repo`, `admin:org`, `read:org`
   - **For basic usage**: `repo`, `read:org`
4. Copy the generated token and use it in GitSecureOps

## Common Issues

### 403 Forbidden Error
- **Cause**: Token lacks required permissions or SSO authorization required
- **Solution**: 
  1. Regenerate token with `admin:org` scope
  2. If your organization uses SSO, authorize your token for SSO use
  3. Ensure you are an organization owner
- **SSO Note**: Even with correct permissions, tokens need explicit SSO authorization

### SSO (Single Sign-On) Organizations
If your organization requires SSO:
1. **Create token**: Generate a personal access token with required scopes
2. **Authorize for SSO**: Go to [Token Settings](https://github.com/settings/tokens)
3. **Enable SSO**: Click "Enable SSO" next to your organization
4. **Complete authorization**: Follow the SSO authorization flow
5. **Note**: SSO authorization is separate from having organizational permissions

### 404 Not Found Error
- **Cause**: User/organization not found or insufficient access
- **Solution**: Verify organization name and check if you have access

### 422 Unprocessable Entity
- **Cause**: Invalid email address or user already a member
- **Solution**: Check email format and membership status

## Security Best Practices

1. **Use minimal permissions**: Only grant scopes you actually need
2. **Regular rotation**: Regenerate tokens periodically
3. **Secure storage**: Never commit tokens to version control
4. **Environment variables**: Store tokens in environment variables or secure vaults
5. **Monitor usage**: Review token usage in GitHub settings

## Troubleshooting

If you continue to experience permission issues:

1. **Check token scopes**: Verify your token has the correct scopes at [GitHub Token Settings](https://github.com/settings/tokens)
2. **SSO authorization**: If your organization uses SSO, ensure your token is authorized:
   - Click "Enable SSO" next to your organization in token settings
   - Complete the SSO authorization process
3. **Organization role**: Check your role in the organization (Settings → Member privileges)
4. **Invitation permissions**: Ensure the organization allows member invitations (Organization Settings → Member privileges)
5. **Token validation**: Use the "Check Token Permissions" feature in GitSecureOps to verify your token setup

### Debugging 403 Errors in SSO Environments

If you're getting 403 errors despite having permissions and using SSO:

1. **Verify SSO authorization status**: Check if your token shows "Authorized" next to your organization
2. **Re-authorize if needed**: SSO authorization can expire; re-authorize your token
3. **Check organization SSO policy**: Some organizations have strict SSO policies that may affect API access
4. **Contact organization admins**: They may need to adjust SSO settings or grant additional permissions

## Support

For additional help with GitHub token setup, refer to:
- [GitHub Personal Access Tokens Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Organization Permissions](https://docs.github.com/en/organizations/managing-membership-in-your-organization/roles-in-an-organization)