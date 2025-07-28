// GitHub API service for repository and collaborator management
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  description: string | null;
  collaborators?: GitHubUser[];
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface RepoAccess {
  repo: string;
  hasAccess: boolean;
  permission: 'admin' | 'write' | 'read' | 'public' | 'unknown';
  permissionIcon: string;
  permissionColor: string;
}

export interface GitHubOrg {
  login: string;
  id: number;
  avatar_url: string;
  description: string | null;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        
        if (rateLimitRemaining === '0') {
          const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'unknown';
          throw new Error(`GitHub API rate limit exceeded. Rate limit resets at ${resetTime}`);
        }
        
        throw new Error(`GitHub API access forbidden. Please check your token permissions.`);
      }
      
      if (response.status === 401) {
        throw new Error('GitHub token is invalid or expired');
      }
      
      if (response.status === 404) {
        throw new Error(`Resource not found: ${endpoint}`);
      }
      
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Helper method to get all paginated results
  private async getAllPaginatedResults<T>(endpoint: string): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const separator = endpoint.includes('?') ? '&' : '?';
      const paginatedEndpoint = `${endpoint}${separator}per_page=100&page=${page}`;
      
      const response = await fetch(`${this.baseUrl}${paginatedEndpoint}`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = response.headers.get('X-RateLimit-Reset');
          
          if (rateLimitRemaining === '0') {
            const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'unknown';
            throw new Error(`GitHub API rate limit exceeded. Rate limit resets at ${resetTime}`);
          }
          
          throw new Error(`GitHub API access forbidden. Please check your token permissions.`);
        }
        
        if (response.status === 401) {
          throw new Error('GitHub token is invalid or expired');
        }
        
        if (response.status === 404) {
          throw new Error(`Resource not found: ${endpoint}`);
        }
        
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data: T[] = await response.json();
      results.push(...data);

      // Check if there are more pages
      hasNextPage = data.length === 100;
      page++;
    }

    return results;
  }

  // Get authenticated user info
  async getAuthenticatedUser(): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>('/user');
  }

  // Get user's organizations
  async getUserOrganizations(): Promise<GitHubOrg[]> {
    return this.getAllPaginatedResults<GitHubOrg>('/user/orgs');
  }

  // Get user's repositories
  async getUserRepositories(): Promise<GitHubRepo[]> {
    return this.getAllPaginatedResults<GitHubRepo>('/user/repos');
  }

  // Get organization repositories
  async getOrgRepositories(org: string): Promise<GitHubRepo[]> {
    return this.getAllPaginatedResults<GitHubRepo>(`/orgs/${org}/repos`);
  }

  // Get repository collaborators with permissions
  async getRepositoryCollaborators(owner: string, repo: string): Promise<GitHubUser[]> {
    return this.getAllPaginatedResults<GitHubUser>(`/repos/${owner}/${repo}/collaborators`);
  }

  // Get user's permission level for a specific repository
  async getUserPermissionForRepo(owner: string, repo: string, username: string): Promise<RepoAccess> {
    try {
      // First check if user is a collaborator
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/collaborators/${username}/permission`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const permission = data.permission;
        
        let permissionLevel: 'admin' | 'write' | 'read' | 'public' | 'unknown';
        let icon: string;
        let color: string;

        switch (permission) {
          case 'admin':
            permissionLevel = 'admin';
            icon = '🟢';
            color = 'text-green-600 bg-green-50 border-green-200';
            break;
          case 'write':
          case 'maintain':
            permissionLevel = 'write';
            icon = '🟡';
            color = 'text-yellow-600 bg-yellow-50 border-yellow-200';
            break;
          case 'read':
          case 'triage':
            permissionLevel = 'read';
            icon = '🔵';
            color = 'text-blue-600 bg-blue-50 border-blue-200';
            break;
          default:
            permissionLevel = 'unknown';
            icon = '⚪';
            color = 'text-gray-600 bg-gray-50 border-gray-200';
        }

        return {
          repo: `${owner}/${repo}`,
          hasAccess: true,
          permission: permissionLevel,
          permissionIcon: icon,
          permissionColor: color
        };
      }

      // If not a collaborator, check if repo is public
      const repoResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (repoResponse.ok) {
        const repoData = await repoResponse.json();
        if (!repoData.private) {
          return {
            repo: `${owner}/${repo}`,
            hasAccess: false,
            permission: 'public',
            permissionIcon: '🌍',
            permissionColor: 'text-green-600 bg-green-50 border-green-200'
          };
        }
      }

      return {
        repo: `${owner}/${repo}`,
        hasAccess: false,
        permission: 'unknown',
        permissionIcon: '❓',
        permissionColor: 'text-gray-600 bg-gray-50 border-gray-200'
      };

    } catch (error) {
      return {
        repo: `${owner}/${repo}`,
        hasAccess: false,
        permission: 'unknown',
        permissionIcon: '❓',
        permissionColor: 'text-gray-600 bg-gray-50 border-gray-200'
      };
    }
  }

  // Remove collaborator from repository
  async removeCollaborator(owner: string, repo: string, username: string): Promise<void> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/collaborators/${username}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      let errorMessage = `Failed to remove collaborator: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = `${response.status}: ${errorData.message}`;
        }
        if (errorData.documentation_url) {
          errorMessage += ` (See: ${errorData.documentation_url})`;
        }
      } catch {
        // If we can't parse the error response, use the basic error message
      }
      
      throw new Error(errorMessage);
    }
  }
}

export default new GitHubService();
