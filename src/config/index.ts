// ==============================================
// Centralized Application Configuration
// ==============================================
// All environment variables and app constants in one place

// ---------------------
// Environment Variables
// ---------------------

const getEnv = (key: string, fallback: string = ''): string => {
  if (import.meta.env && (import.meta.env as Record<string, string>)[key]) {
    return (import.meta.env as Record<string, string>)[key];
  }
  return fallback;
};

export const config = {
  // GitHub OAuth
  github: {
    clientId: getEnv('VITE_GITHUB_CLIENT_ID', 'your-github-client-id'),
    redirectUri: getEnv(
      'VITE_GITHUB_REDIRECT_URI',
      `${getEnv('VITE_FUNCTION_APP_URL', 'http://localhost:7071')}/api/github-callback`
    ),
    scopes: ['repo', 'read:org', 'admin:org', 'user:email', 'manage_billing:copilot'],
    apiBaseUrl: 'https://api.github.com',
    oauthUrl: 'https://github.com/login/oauth/authorize',
  },

  // Azure / API
  api: {
    functionAppUrl: getEnv('VITE_FUNCTION_APP_URL', 'http://localhost:7071'),
    staticWebAppUrl: getEnv('VITE_STATIC_WEB_APP_URL', window.location.origin),
  },

  // Application
  app: {
    name: 'GitSecureOps',
    version: '2.0.0',
    description: 'GitHub Organization Security Management',
  },

  // Storage keys
  storageKeys: {
    oauthState: 'oauth_state',
    lastScanTime: 'gitsecureops_last_scan',
    orgData: 'gitsecureops_org_data',
    scanProgress: 'gitsecureops_scan_progress',
    auditLog: 'gitsecureops-audit-log',
    notifications: 'gitsecureops-notifications',
    theme: 'gitsecureops-theme',
  },

  // Pagination
  pagination: {
    defaultPerPage: 100,
    maxPerPage: 100,
  },

  // Cache durations (ms)
  cache: {
    orgData: 5 * 60 * 1000, // 5 minutes
    memberData: 5 * 60 * 1000, // 5 minutes
    repoData: 5 * 60 * 1000, // 5 minutes
    staleThreshold: 30 * 60 * 1000, // 30 minutes
  },
} as const;

export default config;
