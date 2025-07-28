// GitHub OAuth Service
import environmentService from './environmentService';

export class GitHubOAuthService {
  private clientId: string;
  private redirectUri: string;
  private scopes: string[];

  constructor() {
    // Use environment service for configuration
    this.clientId = environmentService.getGitHubClientId();
    this.redirectUri = environmentService.getGitHubRedirectUri();
    this.scopes = ['repo', 'read:org', 'user:email'];
  }

  /**
   * Initiates the GitHub OAuth flow by redirecting to GitHub's authorization URL
   */
  initiateOAuthFlow(): void {
    const state = this.generateState();
    localStorage.setItem('oauth_state', state);

    const authUrl = this.buildAuthUrl(state);
    window.location.href = authUrl;
  }

  /**
   * Builds the GitHub authorization URL
   */
  private buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state: state,
      response_type: 'code'
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Generates a random state parameter for CSRF protection
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Handles the OAuth callback and exchanges code for access token
   */
  async handleCallback(code: string, state: string): Promise<{ token: string; user: any }> {
    // Verify state parameter
    const storedState = localStorage.getItem('oauth_state');
    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter. Possible CSRF attack.');
    }

    // Clean up stored state
    localStorage.removeItem('oauth_state');

    try {
      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);
      
      // Get user information
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenResponse.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user information');
      }

      const user = await userResponse.json();

      return {
        token: tokenResponse.access_token,
        user: user
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new Error('Failed to complete OAuth authentication');
    }
  }

  /**
   * Exchanges authorization code for access token
   * Note: In production, this should be done on your backend server for security
   */
  private async exchangeCodeForToken(code: string): Promise<any> {
    // For development/demo purposes, we'll use GitHub's CORS-enabled endpoint
    // In production, this should be handled by your backend server
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: environmentService.getGitHubClientSecret(),
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return data;
  }

  /**
   * Parses OAuth callback URL parameters
   */
  parseCallbackUrl(url: string): { code?: string; state?: string; error?: string } {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    return {
      code: params.get('code') || undefined,
      state: params.get('state') || undefined,
      error: params.get('error') || undefined,
    };
  }

  /**
   * Checks if OAuth is properly configured
   */
  isConfigured(): boolean {
    return this.clientId !== 'your-github-client-id' && !!this.clientId;
  }
}

export const oauthService = new GitHubOAuthService();
