// GitHub API service for repository and collaborator management
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name?: string;
  email?: string;
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

  // Get authenticated user info
  async getAuthenticatedUser(): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>('/user');
  }

  // Get user's organizations with improved error handling
  async getUserOrganizations(): Promise<GitHubOrg[]> {
    try {
      return await this.getAllPaginatedResults<GitHubOrg>('/user/orgs');
    } catch (error: unknown) {
      const err = error as Error;
      // If organizations endpoint fails, try the memberships endpoint as fallback
      if (err.message?.includes('403') || err.message?.includes('forbidden')) {
        console.warn('Organization access limited, trying alternative endpoint...');
        try {
          return await this.getAllPaginatedResults<GitHubOrg>('/user/memberships/orgs?state=active');
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

  // Get Copilot billing information for an organization
  async getCopilotBilling(org: string): Promise<CopilotBilling> {
    return this.makeRequest<CopilotBilling>(`/orgs/${org}/copilot/billing`);
  }

  // Get Copilot seat assignments for an organization
  async getCopilotSeats(org: string): Promise<{ seats: CopilotSeat[]; total_seats: number }> {
    const result = await this.getAllPaginatedCopilotSeats(`/orgs/${org}/copilot/billing/seats`);
    return result;
  }

  // Specialized pagination for Copilot seats API that returns { seats: [], total_seats: number }
  private async getAllPaginatedCopilotSeats(endpoint: string): Promise<{ seats: CopilotSeat[]; total_seats: number }> {
    const results: CopilotSeat[] = [];
    let totalSeats = 0;
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
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data: { seats: CopilotSeat[]; total_seats: number } = await response.json();
      results.push(...data.seats);
      
      // Keep track of total_seats from the first response
      if (page === 1) {
        totalSeats = data.total_seats;
      }

      // Check if there are more pages
      hasNextPage = data.seats.length === 100;
      page++;
    }

    return { seats: results, total_seats: totalSeats };
  }

  // Add users to Copilot in an organization (simplified approach)
  async addCopilotUsers(org: string, usernames: string[]): Promise<{ seats_created: CopilotSeat[] }> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/orgs/${org}/copilot/billing/selected_users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_usernames: usernames
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404) {
          if (errorData.message?.includes('do not exist in this organization')) {
            // Extract the username from the error if possible
            const match = errorData.message.match(/One or more users do not exist in this organization: (.+)/);
            const missingUsers = match ? match[1].split(', ') : usernames;
            
            // For each missing user, try to invite them
            const invitePromises = missingUsers.map(async (username: string) => {
              try {
                // First check if user exists on GitHub
                const userCheck = await fetch(`${this.baseUrl}/users/${username}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                  }
                });

                if (!userCheck.ok) {
                  return { username, status: 'user_not_found', error: `User ${username} does not exist on GitHub` };
                }

                // Try to invite to organization
                const inviteResponse = await fetch(`${this.baseUrl}/orgs/${org}/invitations`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    invitee_id: username,
                    role: 'direct_member'
                  })
                });

                if (inviteResponse.ok) {
                  return { username, status: 'invited', error: null };
                } else {
                  // Try by email
                  const emailInviteResponse = await fetch(`${this.baseUrl}/orgs/${org}/invitations`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${this.token}`,
                      'Accept': 'application/vnd.github.v3+json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      email: username,
                      role: 'direct_member'
                    })
                  });

                  if (emailInviteResponse.ok) {
                    return { username, status: 'invited_by_email', error: null };
                  } else {
                    const inviteError = await emailInviteResponse.json().catch(() => ({}));
                    return { username, status: 'invite_failed', error: inviteError.message || 'Failed to invite user' };
                  }
                }
              } catch (error) {
                return { username, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
              }
            });

            const inviteResults = await Promise.all(invitePromises);
            const successfulInvites = inviteResults.filter(r => r.status === 'invited' || r.status === 'invited_by_email');
            const userNotFound = inviteResults.filter(r => r.status === 'user_not_found');
            const failedInvites = inviteResults.filter(r => r.status === 'invite_failed' || r.status === 'error');

            let errorMessage = '';
            
            if (userNotFound.length > 0) {
              errorMessage += `❌ Users not found on GitHub: ${userNotFound.map(r => r.username).join(', ')}\n`;
            }
            
            if (successfulInvites.length > 0) {
              errorMessage += `📧 Organization invitations sent to: ${successfulInvites.map(r => r.username).join(', ')}\n`;
              errorMessage += `These users will receive Copilot access once they accept the organization invitation.\n`;
            }
            
            if (failedInvites.length > 0) {
              errorMessage += `⚠️ Could not invite: ${failedInvites.map(r => r.username).join(', ')}\n`;
              errorMessage += `Please manually invite these users to the organization first.\n`;
            }

            throw new Error(errorMessage);
          }
          
          throw new Error(errorData.message || `Resource not found: ${response.status}`);
        }
        
        throw new Error(errorData.message || `Failed to add Copilot users: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error adding Copilot users:', error);
      throw error;
    }
  }

  // Validate that usernames exist on GitHub
  async validateGitHubUsers(usernames: string[]): Promise<{
    valid: string[];
    invalid: string[];
  }> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const results = {
      valid: [] as string[],
      invalid: [] as string[]
    };

    for (const username of usernames) {
      try {
        // Check if user exists on GitHub
        const response = await fetch(`${this.baseUrl}/users/${username}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        });

        if (response.ok) {
          results.valid.push(username);
        } else {
          results.invalid.push(username);
        }
      } catch (error) {
        results.invalid.push(username);
      }
    }

    return results;
  }

  // Invite users to organization
  async inviteUsersToOrg(org: string, usernames: string[]): Promise<{
    invitedUsers: string[];
    alreadyMembers: string[];
    errors: Array<{ username: string; error: string }>;
  }> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const results = {
      invitedUsers: [] as string[],
      alreadyMembers: [] as string[],
      errors: [] as Array<{ username: string; error: string }>
    };

    for (const username of usernames) {
      try {
        // Check if user is already a member
        const membershipResponse = await fetch(`${this.baseUrl}/orgs/${org}/members/${username}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        });

        if (membershipResponse.status === 204) {
          // User is already a member
          results.alreadyMembers.push(username);
          continue;
        }

        // User is not a member, try to invite them with username
        const inviteResponse = await fetch(`${this.baseUrl}/orgs/${org}/invitations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invitee_id: username,
            role: 'direct_member'
          })
        });

        if (inviteResponse.ok) {
          results.invitedUsers.push(username);
        } else {
          // If username invitation fails, try by user ID
          try {
            const userResponse = await fetch(`${this.baseUrl}/users/${username}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
              }
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              const userIdInviteResponse = await fetch(`${this.baseUrl}/orgs/${org}/invitations`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${this.token}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  invitee_id: userData.id,
                  role: 'direct_member'
                })
              });

              if (userIdInviteResponse.ok) {
                results.invitedUsers.push(username);
              } else {
                const errorData = await userIdInviteResponse.json().catch(() => ({}));
                results.errors.push({
                  username,
                  error: errorData.message || `Failed to invite by user ID: ${userIdInviteResponse.status}`
                });
              }
            } else {
              results.errors.push({
                username,
                error: 'User not found on GitHub'
              });
            }
          } catch (error) {
            results.errors.push({
              username,
              error: error instanceof Error ? error.message : 'Unknown error during invitation'
            });
          }
        }
      } catch (error) {
        results.errors.push({
          username,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Check organization membership for a user
  async checkOrgMembership(org: string, username: string): Promise<'member' | 'pending' | 'not_member'> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    try {
      // Check if user is a member
      const memberResponse = await fetch(`${this.baseUrl}/orgs/${org}/members/${username}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (memberResponse.status === 204) {
        return 'member';
      }

      // Check if user has pending invitation
      const invitationsResponse = await fetch(`${this.baseUrl}/orgs/${org}/invitations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (invitationsResponse.ok) {
        const invitations = await invitationsResponse.json();
        const hasPendingInvite = invitations.some((inv: any) => 
          inv.login === username || inv.email === username
        );
        
        if (hasPendingInvite) {
          return 'pending';
        }
      }

      return 'not_member';
    } catch (error) {
      console.error('Error checking membership:', error);
      return 'not_member';
    }
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
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to remove Copilot users: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get user's recent activity events
  async getUserEvents(): Promise<any[]> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    try {
      // Try to fetch user events first
      const response = await fetch(`${this.baseUrl}/user/events`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        return response.json();
      }

      // If user events fail (404, permissions), try to get received events as fallback
      if (response.status === 404 || response.status === 403) {
        console.warn('User events not accessible, trying received events...');
        const receivedResponse = await fetch(`${this.baseUrl}/user/received_events`, {
          method: 'GET',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (receivedResponse.ok) {
          return receivedResponse.json();
        }
      }

      // If both fail, try to get public events for the user
      const user = await this.getAuthenticatedUser();
      const publicResponse = await fetch(`${this.baseUrl}/users/${user.login}/events/public`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (publicResponse.ok) {
        return publicResponse.json();
      }

      // If all fail, return empty array instead of throwing
      console.warn('Could not fetch any user events, returning empty array');
      return [];

    } catch (error) {
      console.warn('Error fetching user events:', error);
      return [];
    }
  }

  // Get organization members
  async getOrgMembers(org: string): Promise<GitHubUser[]> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/orgs/${org}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch organization members: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get repository collaborators
  async getRepoCollaborators(owner: string, repo: string): Promise<GitHubUser[]> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/collaborators`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch repository collaborators: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Add collaborator to repository
  async addRepoCollaborator(owner: string, repo: string, username: string, permission: 'pull' | 'push' | 'admin' = 'push'): Promise<void> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/collaborators/${username}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permission }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add collaborator: ${response.status} ${response.statusText}`);
    }
  }

  // Remove collaborator from repository
  async removeRepoCollaborator(owner: string, repo: string, username: string): Promise<void> {
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
      throw new Error(`Failed to remove collaborator: ${response.status} ${response.statusText}`);
    }
  }

  // Add user to organization
  async addOrgMember(org: string, username: string, role: 'member' | 'admin' = 'member'): Promise<void> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/orgs/${org}/memberships/${username}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: role
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add organization member: ${response.status} ${response.statusText}`);
    }
  }

  // Remove user from organization
  async removeOrgMember(org: string, username: string): Promise<void> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/orgs/${org}/members/${username}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to remove organization member: ${response.status} ${response.statusText}`);
    }
  }

  // Remove user from all repositories in organization
  async removeUserFromAllOrgRepos(org: string, username: string): Promise<void> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    try {
      // Get all organization repositories
      const repos = await this.getOrgRepositories(org);
      
      // Remove user from each repository
      const removePromises = repos.map(repo => 
        this.removeCollaborator(repo.owner.login, repo.name, username)
          .catch(error => {
            // Log error but don't fail the entire operation
            console.warn(`Failed to remove ${username} from ${repo.name}:`, error.message);
          })
      );

      await Promise.all(removePromises);
    } catch (error) {
      throw new Error(`Failed to remove user from organization repositories: ${error}`);
    }
  }

  // Get user's repository permissions
  async getUserRepoPermission(owner: string, repo: string, username: string): Promise<any> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/collaborators/${username}/permission`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { permission: 'none' };
      }
      throw new Error(`Failed to get user permission: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export default new GitHubService();
