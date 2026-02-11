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
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  clone_url?: string;
  created_at?: string;
  updated_at?: string;
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

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: GitHubUser;
  requested_reviewers: GitHubUser[];
  draft: boolean;
  head: { ref: string };
  base: { ref: string };
}

export interface PullRequestReview {
  id: number;
  user: GitHubUser;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  submitted_at: string;
}

export interface ActionsBilling {
  total_minutes_used: number;
  total_paid_minutes_used: number;
  included_minutes: number;
  minutes_used_breakdown: {
    UBUNTU: number;
    MACOS: number;
    WINDOWS: number;
  };
}

export interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  run_number: number;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_started_at: string;
  repository?: { name: string; full_name: string };
}

export interface GitHubTeam {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  permission: string;
  members_count?: number;
  repos_count?: number;
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
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');

        if (rateLimitRemaining === '0') {
          const resetTime = rateLimitReset
            ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString()
            : 'unknown';
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
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = response.headers.get('X-RateLimit-Reset');

          if (rateLimitRemaining === '0') {
            const resetTime = rateLimitReset
              ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString()
              : 'unknown';
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
          return await this.getAllPaginatedResults<GitHubOrg>(
            '/user/memberships/orgs?state=active'
          );
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
  async getUserPermissionForRepo(
    owner: string,
    repo: string,
    username: string
  ): Promise<RepoAccess> {
    try {
      // First check if user is a collaborator
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/collaborators/${username}/permission`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

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
          permissionColor: color,
        };
      }

      // If not a collaborator, check if repo is public
      const repoResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
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
            permissionColor: 'text-green-600 bg-green-50 border-green-200',
          };
        }
      }

      return {
        repo: `${owner}/${repo}`,
        hasAccess: false,
        permission: 'unknown',
        permissionIcon: '❓',
        permissionColor: 'text-gray-600 bg-gray-50 border-gray-200',
      };
    } catch {
      return {
        repo: `${owner}/${repo}`,
        hasAccess: false,
        permission: 'unknown',
        permissionIcon: '❓',
        permissionColor: 'text-gray-600 bg-gray-50 border-gray-200',
      };
    }
  }

  // Remove collaborator from repository
  async removeCollaborator(owner: string, repo: string, username: string): Promise<void> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/collaborators/${username}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

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
  private async getAllPaginatedCopilotSeats(
    endpoint: string
  ): Promise<{ seats: CopilotSeat[]; total_seats: number }> {
    const results: CopilotSeat[] = [];
    let totalSeats = 0;
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const separator = endpoint.includes('?') ? '&' : '?';
      const paginatedEndpoint = `${endpoint}${separator}per_page=100&page=${page}`;

      const response = await fetch(`${this.baseUrl}${paginatedEndpoint}`, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
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

  // Add users to Copilot in an organization
  async addCopilotUsers(
    org: string,
    usernames: string[]
  ): Promise<{ seats_created: CopilotSeat[] }> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/orgs/${org}/copilot/billing/selected_users`, {
      method: 'POST',
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selected_usernames: usernames,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          `Failed to add Copilot users: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // Remove users from Copilot in an organization
  async removeCopilotUsers(
    org: string,
    usernames: string[]
  ): Promise<{ seats_cancelled: CopilotSeat[] }> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/orgs/${org}/copilot/billing/selected_users`, {
      method: 'DELETE',
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selected_usernames: usernames,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          `Failed to remove Copilot users: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // Get user's recent activity events
  async getUserEvents(): Promise<Record<string, unknown>[]> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    try {
      // Try to fetch user events first
      const response = await fetch(`${this.baseUrl}/user/events`, {
        method: 'GET',
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
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
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
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
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
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
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch organization members: ${response.status} ${response.statusText}`
      );
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
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch repository collaborators: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // Add collaborator to repository
  async addRepoCollaborator(
    owner: string,
    repo: string,
    username: string,
    permission: 'pull' | 'push' | 'admin' = 'push'
  ): Promise<void> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/collaborators/${username}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permission }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add collaborator: ${response.status} ${response.statusText}`);
    }
  }

  // Remove collaborator from repository
  async removeRepoCollaborator(owner: string, repo: string, username: string): Promise<void> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/collaborators/${username}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove collaborator: ${response.status} ${response.statusText}`);
    }
  }

  // Add user to organization
  async addOrgMember(
    org: string,
    username: string,
    role: 'member' | 'admin' = 'member'
  ): Promise<void> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/orgs/${org}/memberships/${username}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: role,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to add organization member: ${response.status} ${response.statusText}`
      );
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
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to remove organization member: ${response.status} ${response.statusText}`
      );
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
      const removePromises = repos.map((repo) =>
        this.removeCollaborator(repo.owner.login, repo.name, username).catch((error) => {
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
  async getUserRepoPermission(
    owner: string,
    repo: string,
    username: string
  ): Promise<Record<string, unknown>> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/collaborators/${username}/permission`,
      {
        method: 'GET',
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { permission: 'none' };
      }
      throw new Error(`Failed to get user permission: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ==============================================
  // Convenience aliases & additional methods
  // ==============================================

  /** Alias for getUserOrganizations */
  async getOrganizations(): Promise<GitHubOrg[]> {
    return this.getUserOrganizations();
  }

  /** Alias for getUserRepositories */
  async getUserRepos(): Promise<GitHubRepo[]> {
    return this.getUserRepositories();
  }

  /** Alias for getOrgRepositories */
  async getOrgRepos(org: string): Promise<GitHubRepo[]> {
    return this.getOrgRepositories(org);
  }

  /** Get org members that have 2FA disabled (requires org admin) */
  async getOrgMembers2FADisabled(org: string): Promise<GitHubUser[]> {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    const response = await fetch(`${this.baseUrl}/orgs/${org}/members?filter=2fa_disabled`, {
      method: 'GET',
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      // 403 = not an org admin, return empty instead of crashing
      if (response.status === 403) {
        console.warn(`Cannot check 2FA status for ${org} — requires org admin`);
        return [];
      }
      throw new Error(`Failed to fetch 2FA disabled members: ${response.status}`);
    }

    return response.json();
  }

  /** Alias for addCopilotUsers (single user convenience) */
  async addCopilotSeat(org: string, username: string): Promise<{ seats_created: CopilotSeat[] }> {
    return this.addCopilotUsers(org, [username]);
  }

  /** Alias for removeCopilotUsers (single user convenience) */
  async removeCopilotSeat(
    org: string,
    username: string
  ): Promise<{ seats_cancelled: CopilotSeat[] }> {
    return this.removeCopilotUsers(org, [username]);
  }

  // ==============================================
  // Outside Collaborators
  // ==============================================

  /** Get outside collaborators for an org (non-members with repo access) */
  async getOutsideCollaborators(org: string): Promise<GitHubUser[]> {
    try {
      return await this.getAllPaginatedResults<GitHubUser>(`/orgs/${org}/outside_collaborators`);
    } catch {
      console.warn(`Cannot fetch outside collaborators for ${org}`);
      return [];
    }
  }

  /** Remove an outside collaborator from the org */
  async removeOutsideCollaborator(org: string, username: string): Promise<void> {
    if (!this.token) throw new Error('GitHub token not set');
    const response = await fetch(`${this.baseUrl}/orgs/${org}/outside_collaborators/${username}`, {
      method: 'DELETE',
      headers: { Authorization: `token ${this.token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) throw new Error(`Failed to remove outside collaborator: ${response.status}`);
  }

  /** Cancel a pending org invitation */
  async cancelOrgInvitation(org: string, invitationId: number): Promise<void> {
    if (!this.token) throw new Error('GitHub token not set');
    const response = await fetch(`${this.baseUrl}/orgs/${org}/invitations/${invitationId}`, {
      method: 'DELETE',
      headers: { Authorization: `token ${this.token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) throw new Error(`Failed to cancel invitation: ${response.status}`);
  }

  /** Get org membership details for a user (includes role) */
  async getOrgMembership(org: string, username: string): Promise<{ role: string; state: string }> {
    return this.makeRequest<{ role: string; state: string }>(`/orgs/${org}/memberships/${username}`);
  }

  /** Remove a user from a team */
  async removeTeamMember(org: string, teamSlug: string, username: string): Promise<void> {
    if (!this.token) throw new Error('GitHub token not set');
    const response = await fetch(`${this.baseUrl}/orgs/${org}/teams/${teamSlug}/memberships/${username}`, {
      method: 'DELETE',
      headers: { Authorization: `token ${this.token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) throw new Error(`Failed to remove team member: ${response.status}`);
  }

  /** Get members of a specific team */
  async getTeamMembers(org: string, teamSlug: string): Promise<GitHubUser[]> {
    return this.getAllPaginatedResults<GitHubUser>(`/orgs/${org}/teams/${teamSlug}/members`);
  }

  // ==============================================
  // Pending Invitations
  // ==============================================

  /** Get pending org invitations */
  async getOrgInvitations(org: string): Promise<OrgInvitation[]> {
    try {
      return await this.getAllPaginatedResults<OrgInvitation>(`/orgs/${org}/invitations`);
    } catch {
      console.warn(`Cannot fetch invitations for ${org}`);
      return [];
    }
  }

  // ==============================================
  // Repo Visibility
  // ==============================================

  /** Get all org repos with visibility info (for drift detection) */
  async getOrgReposWithVisibility(org: string): Promise<GitHubRepo[]> {
    return this.getAllPaginatedResults<GitHubRepo>(`/orgs/${org}/repos?type=all&sort=updated`);
  }

  /** Update repo visibility */
  async updateRepoVisibility(owner: string, repo: string, isPrivate: boolean): Promise<void> {
    if (!this.token) throw new Error('GitHub token not set');

    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ private: isPrivate }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        (err as Record<string, string>).message || `Failed to update repo visibility: ${response.status}`
      );
    }
  }

  // ── Pull Request methods ─────────────────────────────────────
  async getRepoPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<PullRequest[]> {
    return this.makeRequest<PullRequest[]>(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`);
  }

  async getPullRequestReviews(owner: string, repo: string, prNumber: number): Promise<PullRequestReview[]> {
    return this.makeRequest<PullRequestReview[]>(`/repos/${owner}/${repo}/pulls/${prNumber}/reviews`);
  }

  async getPullRequestRequestedReviewers(owner: string, repo: string, prNumber: number): Promise<{ users: GitHubUser[] }> {
    return this.makeRequest<{ users: GitHubUser[] }>(`/repos/${owner}/${repo}/pulls/${prNumber}/requested_reviewers`);
  }

  // ── Actions / Billing methods ────────────────────────────────
  async getActionsBilling(org: string): Promise<ActionsBilling> {
    return this.makeRequest<ActionsBilling>(`/orgs/${org}/settings/billing/actions`);
  }

  async getWorkflowRuns(owner: string, repo: string): Promise<{ workflow_runs: WorkflowRun[] }> {
    return this.makeRequest<{ workflow_runs: WorkflowRun[] }>(`/repos/${owner}/${repo}/actions/runs?per_page=100`);
  }

  // ── Team methods ─────────────────────────────────────────────
  async getOrgTeams(org: string): Promise<GitHubTeam[]> {
    return this.makeRequest<GitHubTeam[]>(`/orgs/${org}/teams?per_page=100`);
  }

  async addTeamMember(org: string, teamSlug: string, username: string): Promise<void> {
    if (!this.token) throw new Error('GitHub token not set');
    const response = await fetch(`${this.baseUrl}/orgs/${org}/teams/${teamSlug}/memberships/${username}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to add team member: ${response.status}`);
    }
  }
}

/** Org invitation shape from GitHub API */
export interface OrgInvitation {
  id: number;
  login: string | null;
  email: string | null;
  role: string;
  created_at: string;
  inviter: { login: string; avatar_url: string };
  team_count: number;
}

export default new GitHubService();
