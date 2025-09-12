// Environment configuration utility
// Handles both Vite build-time variables and runtime environment variables

interface EnvironmentConfig {
  githubClientId: string;
  githubRedirectUri: string;
  functionAppUrl: string;
  staticWebAppUrl: string;
}

class EnvironmentService {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): EnvironmentConfig {
    // For Azure Static Web Apps, environment variables are injected at build time
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
      functionAppUrl: getEnvVar(
        'VITE_FUNCTION_APP_URL',
        'http://localhost:7071' // Default to Azure Functions local development
      ),
      staticWebAppUrl: getEnvVar(
        'VITE_STATIC_WEB_APP_URL',
        window.location.origin
      ),
      githubRedirectUri: getEnvVar(
        'VITE_GITHUB_REDIRECT_URI',
        `${getEnvVar('VITE_FUNCTION_APP_URL', 'http://localhost:7071')}/api/github-callback`
      )
    };
  }

  getGitHubClientId(): string {
    return this.config.githubClientId;
  }

  getGitHubRedirectUri(): string {
    return this.config.githubRedirectUri;
  }

  getFunctionAppUrl(): string {
    return this.config.functionAppUrl;
  }

  getStaticWebAppUrl(): string {
    return this.config.staticWebAppUrl;
  }

  // Debug method to check configuration (removed sensitive data)
  getConfiguration(): EnvironmentConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const environmentService = new EnvironmentService();
export default environmentService;
