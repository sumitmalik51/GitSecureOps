// GitHub OAuth Service
import environmentService from './environmentService';

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

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
   * Generates a cryptographically secure random state parameter for CSRF protection
   */
  private generateState(): string {
    // Use crypto.getRandomValues for cryptographically secure random generation
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for environments without crypto.getRandomValues
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    const random3 = Math.random().toString(36).substring(2, 15);
    
    return `${timestamp}-${random1}-${random2}-${random3}`;
  }

  /**
   * Handles the OAuth callback and exchanges code for access token
   * This now works with Azure Function backend with improved security
   */
  async handleOAuthSuccess(sessionToken: string): Promise<{ token: string; user: GitHubUser }> {
    try {
      // Decode session token from Azure Function (browser-compatible)
      const sessionData = JSON.parse(atob(sessionToken));
      
      // Validate session data structure
      if (!sessionData || typeof sessionData !== 'object') {
        throw new Error('Invalid session data format');
      }
      
      // Validate required fields
      if (!sessionData.token || !sessionData.username) {
        throw new Error('Invalid session data - missing required fields');
      }

      // SECURITY: Check if session is not too old
      const sessionAge = Date.now() - (sessionData.timestamp || 0);
      const maxAge = 10 * 60 * 1000; // 10 minutes maximum session age
      
      if (sessionAge > maxAge) {
        throw new Error('Session expired - please authenticate again');
      }

      // SECURITY: Validate token format (basic GitHub token validation)
      if (!this.isValidGitHubToken(sessionData.token)) {
        throw new Error('Invalid token format');
      }

      const user: GitHubUser = {
        id: sessionData.id || 0,
        login: sessionData.username,
        name: sessionData.name || sessionData.username,
        email: sessionData.email || '', 
        avatar_url: sessionData.avatar || ''
      };

      return {
        token: sessionData.token,
        user: user
      };
    } catch (error) {
      console.error('OAuth session processing error:', error);
      throw new Error('Failed to process authentication session');
    }
  }

  /**
   * Basic validation for GitHub token format
   */
  private isValidGitHubToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // GitHub tokens are typically 40+ characters for PATs
    // OAuth tokens can vary but should be reasonable length
    if (token.length < 20 || token.length > 200) {
      return false;
    }
    
    // Should not contain suspicious characters
    if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
      return false;
    }
    
    return true;
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
export type { GitHubUser };
