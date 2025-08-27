// Environment configuration utility
// Handles both Vite build-time variables and runtime environment variables

interface EnvironmentConfig {
  githubClientId: string;
  githubClientSecret: string;
  githubRedirectUri: string;
}

class EnvironmentService {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): EnvironmentConfig {
    // For Azure Static Web Apps, environment variables are injected at build time with REACT_APP_ prefix
    // For local development, we use Vite's import.meta.env with VITE_ prefix
    
    const getEnvVar = (viteKey: string, fallback: string = ''): string => {
      // Try Vite environment (development and production builds)
      if (import.meta.env && (import.meta.env as any)[viteKey]) {
        return (import.meta.env as any)[viteKey];
      }
      
      return fallback;
    };

    return {
      githubClientId: getEnvVar(
        'VITE_GITHUB_CLIENT_ID', 
        'your-github-client-id'
      ),
      githubClientSecret: getEnvVar(
        'VITE_GITHUB_CLIENT_SECRET',
        ''
      ),
      githubRedirectUri: getEnvVar(
        'VITE_GITHUB_REDIRECT_URI',
        `${window.location.origin}/api/github-callback`
      )
    };
  }

  getGitHubClientId(): string {
    return this.config.githubClientId;
  }

  getGitHubClientSecret(): string {
    return this.config.githubClientSecret;
  }

  getGitHubRedirectUri(): string {
    return this.config.githubRedirectUri;
  }

  // Debug method to check configuration
  getConfiguration(): EnvironmentConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const environmentService = new EnvironmentService();
export default environmentService;
