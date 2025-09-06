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
  user?: string;
}

export interface GitHubOrg {
  login: string;
  id: number;
  avatar_url: string;
  description: string | null;
}

export interface CopilotSeat {
  created_at: string;
  updated_at: string;
  pending_cancellation_date?: string;
  last_activity_at?: string;
  last_activity_editor?: string;
  assignee: GitHubUser;
  assigning_team?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface CopilotBilling {
  seat_breakdown: {
    total: number;
    added_this_cycle: number;
    pending_invitation: number;
    pending_cancellation: number;
    active_this_cycle: number;
    inactive_this_cycle: number;
  };
  seat_management_setting: 'assign_all' | 'assign_selected' | 'disabled';
  public_code_suggestions: 'allow' | 'block' | 'unconfigured';
}

export interface CopilotUsageStats {
  day: string;
  total_suggestions_count?: number;
  total_acceptances_count?: number;
  total_lines_suggested?: number;
  total_lines_accepted?: number;
  total_active_users?: number;
  total_chat_acceptances?: number;
  total_chat_turns?: number;
  total_active_chat_users?: number;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token.trim() || null;
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

  // Helper method to get all paginated results with retry logic
  private async getAllPaginatedResultsWithRetry<T>(endpoint: string, maxRetries: number = 3): Promise<T[]> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.getAllPaginatedResults<T>(endpoint);
      } catch (error: unknown) {
        const err = error as Error;
        lastError = err;
        
        // Don't retry on auth/permission errors (401, 403)
        if (err.message?.includes('401') || err.message?.includes('forbidden') || err.message?.includes('invalid')) {
          throw err;
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          throw err;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.warn(`GitHub API attempt ${attempt} failed, retrying in ${delay}ms...`, err.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('Maximum retry attempts exceeded');
  }

  // Get authenticated user info
  async getAuthenticatedUser(): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>('/user');
  }

  // Get user's organizations with improved error handling
  async getUserOrganizations(): Promise<GitHubOrg[]> {
    try {
      // Try to get organizations with retry logic
      return await this.getAllPaginatedResultsWithRetry<GitHubOrg>('/user/orgs', 3);
    } catch (error: unknown) {
      const err = error as Error;
      // If organizations endpoint fails, try the memberships endpoint as fallback
      if (err.message?.includes('403') || err.message?.includes('forbidden')) {
        console.warn('Organization access limited, trying alternative endpoint...');
        try {
          return await this.getAllPaginatedResultsWithRetry<GitHubOrg>('/user/memberships/orgs?state=active', 2);
        } catch {
          console.warn('Alternative endpoint also failed, returning empty array');
          return [];
        }
      }
      
      // For other errors, still return empty array instead of crashing
      console.error('Failed to fetch organizations:', error);
      return [];
    }
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

    } catch {
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

  // GitHub Copilot Management Methods
  
  // Get Copilot billing information for an organization
  async getCopilotBilling(org: string): Promise<CopilotBilling> {
    return this.makeRequest<CopilotBilling>(`/orgs/${org}/copilot/billing`);
  }

  // Get Copilot seat assignments for an organization
  async getCopilotSeats(org: string): Promise<{ seats: CopilotSeat[] }> {
    const result = await this.getAllPaginatedCopilotSeats(`/orgs/${org}/copilot/billing/seats`);
    return { seats: result };
  }

  // Specialized pagination for Copilot seats API that returns { seats: [], total_seats: number }
  private async getAllPaginatedCopilotSeats(endpoint: string): Promise<CopilotSeat[]> {
    const results: CopilotSeat[] = [];
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

      const data: { seats: CopilotSeat[]; total_seats: number } = await response.json();
      results.push(...data.seats);

      // Check if there are more pages
      hasNextPage = data.seats.length === 100;
      page++;
    }

    return results;
  }

  // Add users to Copilot in an organization
  async addCopilotUsers(org: string, usernames: string[]): Promise<{ seats_created: CopilotSeat[] }> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/orgs/${org}/copilot/billing/selected_users`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selected_usernames: usernames
      })
    });

    if (!response.ok) {
      let errorMessage = `Failed to add Copilot users: ${response.status} ${response.statusText}`;
      
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

    return response.json();
  }

  // Remove users from Copilot in an organization
  async removeCopilotUsers(org: string, usernames: string[]): Promise<{ seats_cancelled: CopilotSeat[] }> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/orgs/${org}/copilot/billing/selected_users`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selected_usernames: usernames
      })
    });

    if (!response.ok) {
      let errorMessage = `Failed to remove Copilot users: ${response.status} ${response.statusText}`;
      
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

    return response.json();
  }

  // Get Copilot usage statistics for an organization
  async getCopilotUsage(org: string, since?: string, until?: string): Promise<CopilotUsageStats[]> {
    let endpoint = `/orgs/${org}/copilot/usage`;
    const params = new URLSearchParams();
    
    if (since) params.append('since', since);
    if (until) params.append('until', until);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const response = await this.makeRequest<CopilotUsageStats[]>(endpoint);
    return response;
  }

  // Check if user has Copilot access in organization
  async checkUserCopilotAccess(org: string, username: string): Promise<boolean> {
    try {
      const { seats } = await this.getCopilotSeats(org);
      return seats.some(seat => seat.assignee.login === username);
    } catch (error) {
      console.warn(`Failed to check Copilot access for ${username}:`, error);
      return false;
    }
  }

  // Check if user is a member of an organization
  async checkOrganizationMembership(org: string, username: string): Promise<boolean> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/orgs/${org}/members/${username}`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      // 204 means user is a public member, 404 means not a member or private membership
      return response.status === 204;
    } catch (error) {
      console.warn(`Failed to check organization membership for ${username}:`, error);
      return false;
    }
  }

  // Invite user to organization
  async inviteUserToOrganization(org: string, username: string, role: 'member' | 'admin' = 'member'): Promise<{ success: boolean; message: string; inviteUrl?: string }> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    try {
      let response: Response;
      
      // Check if the input is an email address
      if (this.isEmailAddress(username)) {
        // Use invitations endpoint for email addresses
        response = await fetch(`${this.baseUrl}/orgs/${org}/invitations`, {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: username,
            role: role
          })
        });
      } else {
        // Use memberships endpoint for GitHub usernames
        response = await fetch(`${this.baseUrl}/orgs/${org}/memberships/${username}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: role
          })
        });
      }

      if (!response.ok) {
        let errorMessage = 'Failed to invite user to organization';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }

        // Provide specific guidance for common errors
        if (response.status === 403) {
          if (this.isEmailAddress(username)) {
            errorMessage = `Insufficient permissions to invite users via email. Your GitHub token needs 'admin:org' scope and you must be an organization owner or have invitation permissions. Original error: ${errorMessage}`;
          } else {
            errorMessage = `Insufficient permissions to invite user to organization. Your GitHub token needs 'admin:org' scope and you must be an organization owner. Original error: ${errorMessage}`;
          }
        } else if (response.status === 404) {
          if (this.isEmailAddress(username)) {
            errorMessage = `Organization not found or you don't have access to invite users via email. Check the organization name and your permissions.`;
          } else {
            errorMessage = `User '${username}' not found or organization '${org}' not accessible. Check the username and organization name.`;
          }
        } else if (response.status === 422) {
          if (this.isEmailAddress(username)) {
            errorMessage = `Invalid email address or user is already a member of the organization: ${errorMessage}`;
          } else {
            errorMessage = `User '${username}' is already a member of the organization or invitation failed: ${errorMessage}`;
          }
        }

        return {
          success: false,
          message: errorMessage
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: `Successfully invited ${username} to ${org} as ${role}`,
        inviteUrl: data.url || data.html_url
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to invite user to organization'
      };
    }
  }

  // Helper method to check if input is an email address
  private isEmailAddress(input: string): boolean {
    return input.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  }

  // Check token permissions and provide guidance
  async checkTokenPermissions(): Promise<{
    hasOrgPermissions: boolean;
    scopes: string[];
    message: string;
  }> {
    if (!this.token) {
      return {
        hasOrgPermissions: false,
        scopes: [],
        message: 'No GitHub token provided'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return {
          hasOrgPermissions: false,
          scopes: [],
          message: 'Invalid or expired GitHub token'
        };
      }

      // Check token scopes from response headers
      const scopesHeader = response.headers.get('X-OAuth-Scopes');
      const scopes = scopesHeader ? scopesHeader.split(', ') : [];
      
      const hasOrgPermissions = scopes.includes('admin:org') || scopes.includes('write:org');
      
      let message = '';
      if (!hasOrgPermissions) {
        message = 'Token lacks organization permissions. For inviting users to organizations, your token needs "admin:org" scope. ';
        message += 'Create a new token at: https://github.com/settings/tokens with the required scopes.';
      } else {
        message = 'Token has sufficient organization permissions.';
      }

      return {
        hasOrgPermissions,
        scopes,
        message
      };
    } catch (error) {
      return {
        hasOrgPermissions: false,
        scopes: [],
        message: `Failed to check token permissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Enhanced method to add users to Copilot with automatic organization invitation
  // Supports both GitHub usernames and email addresses
  async addCopilotUsersWithInvite(org: string, usernames: string[]): Promise<{
    success: boolean;
    message: string;
    results: {
      username: string;
      status: 'added' | 'invited_and_added' | 'failed';
      message: string;
      inviteUrl?: string;
      isEmail?: boolean;
    }[];
    seats_created: CopilotSeat[];
  }> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const results: {
      username: string;
      status: 'added' | 'invited_and_added' | 'failed';
      message: string;
      inviteUrl?: string;
      isEmail?: boolean;
    }[] = [];

    const usersToInvite: string[] = [];
    const emailsToInvite: string[] = [];
    const usersToAddDirectly: string[] = [];

    // Separate usernames and emails, check membership status for usernames only
    for (const input of usernames) {
      if (this.isEmailAddress(input)) {
        // For email addresses, skip membership check and go straight to invitation
        emailsToInvite.push(input);
      } else {
        // For usernames, check membership status
        try {
          const isMember = await this.checkOrganizationMembership(org, input);
          if (isMember) {
            usersToAddDirectly.push(input);
          } else {
            usersToInvite.push(input);
          }
        } catch (error) {
          results.push({
            username: input,
            status: 'failed',
            message: `Failed to check membership: ${error instanceof Error ? error.message : 'Unknown error'}`,
            isEmail: false
          });
        }
      }
    }

    // Invite users by username who are not members
    for (const username of usersToInvite) {
      try {
        const inviteResult = await this.inviteUserToOrganization(org, username, 'member');
        if (inviteResult.success) {
          // After successful invitation, add to the list to add to Copilot
          usersToAddDirectly.push(username);
          results.push({
            username,
            status: 'invited_and_added',
            message: `Invited to organization and will be added to Copilot`,
            inviteUrl: inviteResult.inviteUrl,
            isEmail: false
          });
        } else {
          results.push({
            username,
            status: 'failed',
            message: `Failed to invite to organization: ${inviteResult.message}`,
            isEmail: false
          });
        }
      } catch (error) {
        results.push({
          username,
          status: 'failed',
          message: `Failed to invite to organization: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isEmail: false
        });
      }
    }

    // Invite users by email address
    for (const email of emailsToInvite) {
      try {
        const inviteResult = await this.inviteUserToOrganization(org, email, 'member');
        if (inviteResult.success) {
          results.push({
            username: email,
            status: 'invited_and_added',
            message: `Invited to organization via email. User will need to accept invitation and may then be added to Copilot.`,
            inviteUrl: inviteResult.inviteUrl,
            isEmail: true
          });
        } else {
          // Enhanced error message for email invitations
          let failureMessage = `Failed to invite via email: ${inviteResult.message}`;
          if (inviteResult.message.includes('Insufficient permissions')) {
            failureMessage += ' Note: Email invitations require admin:org token scope and organization owner permissions.';
          }
          results.push({
            username: email,
            status: 'failed',
            message: failureMessage,
            isEmail: true
          });
        }
      } catch (error) {
        results.push({
          username: email,
          status: 'failed',
          message: `Failed to invite via email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isEmail: true
        });
      }
    }

    // Now add users to Copilot (only existing members + newly invited usernames, not email invites)
    let seats_created: CopilotSeat[] = [];
    if (usersToAddDirectly.length > 0) {
      try {
        const copilotResult = await this.addCopilotUsers(org, usersToAddDirectly);
        seats_created = copilotResult.seats_created;

        // Update results for users who were successfully added to Copilot
        for (const seat of seats_created) {
          const existingResult = results.find(r => r.username === seat.assignee.login);
          if (existingResult) {
            if (existingResult.status === 'invited_and_added') {
              existingResult.message = `Successfully invited to organization and added to Copilot`;
            }
          } else {
            results.push({
              username: seat.assignee.login,
              status: 'added',
              message: 'Successfully added to Copilot',
              isEmail: false
            });
          }
        }

        // Handle users who failed to be added to Copilot
        for (const username of usersToAddDirectly) {
          if (!seats_created.some(seat => seat.assignee.login === username)) {
            const existingResult = results.find(r => r.username === username);
            if (existingResult && existingResult.status === 'invited_and_added') {
              existingResult.status = 'failed';
              existingResult.message = 'Invited to organization but failed to add to Copilot';
            } else if (!existingResult) {
              results.push({
                username,
                status: 'failed',
                message: 'Failed to add to Copilot',
                isEmail: false
              });
            }
          }
        }
      } catch (error) {
        // Handle Copilot assignment failure
        const errorMessage = error instanceof Error ? error.message : 'Failed to add users to Copilot';
        for (const username of usersToAddDirectly) {
          const existingResult = results.find(r => r.username === username);
          if (existingResult && existingResult.status === 'invited_and_added') {
            existingResult.status = 'failed';
            existingResult.message = `Invited to organization but failed to add to Copilot: ${errorMessage}`;
          } else if (!existingResult) {
            results.push({
              username,
              status: 'failed',
              message: `Failed to add to Copilot: ${errorMessage}`,
              isEmail: false
            });
          }
        }
      }
    }

    const successCount = results.filter(r => r.status === 'added' || r.status === 'invited_and_added').length;
    const inviteCount = results.filter(r => r.status === 'invited_and_added' && !r.isEmail).length;
    const emailInviteCount = results.filter(r => r.status === 'invited_and_added' && r.isEmail).length;
    
    let message = `Successfully processed ${successCount} user(s)`;
    if (inviteCount > 0) {
      message += ` (${inviteCount} invited to organization)`;
    }
    if (emailInviteCount > 0) {
      message += ` (${emailInviteCount} invited via email)`;
    }

    return {
      success: successCount > 0,
      message,
      results,
      seats_created
    };
  }
}

export default new GitHubService();
