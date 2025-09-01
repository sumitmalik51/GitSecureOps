// User Profile Service
// Manages GitHub user profile data and avatar caching

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

class UserService {
  private readonly CACHE_KEY = 'github_user_profile';
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private currentProfile: GitHubUserProfile | null = null;

  /**
   * Fetches complete user profile from GitHub API
   */
  async fetchUserProfile(accessToken: string): Promise<GitHubUserProfile> {
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    // Check cache first
    const cached = this.getCachedProfile();
    if (cached && this.isCacheValid(cached.timestamp)) {
      this.currentProfile = cached.profile;
      return cached.profile;
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitSecureOps/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const profile: GitHubUserProfile = await response.json();
      
      // Cache the profile
      this.cacheProfile(profile);
      this.currentProfile = profile;
      
      console.log('User profile loaded:', { 
        login: profile.login, 
        name: profile.name,
        avatar: profile.avatar_url ? 'available' : 'none'
      });

      return profile;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw new Error('Failed to load user profile');
    }
  }

  /**
   * Gets the currently cached user profile
   */
  getCurrentProfile(): GitHubUserProfile | null {
    if (!this.currentProfile) {
      const cached = this.getCachedProfile();
      if (cached && this.isCacheValid(cached.timestamp)) {
        this.currentProfile = cached.profile;
      }
    }
    return this.currentProfile;
  }

  /**
   * Gets the user's display name (name or login)
   */
  getDisplayName(): string {
    const profile = this.getCurrentProfile();
    if (!profile) return '';
    return profile.name || profile.login || '';
  }

  /**
   * Gets the user's avatar URL
   */
  getAvatarUrl(): string {
    const profile = this.getCurrentProfile();
    return profile?.avatar_url || '';
  }

  /**
   * Gets the user's login/username
   */
  getLogin(): string {
    const profile = this.getCurrentProfile();
    return profile?.login || '';
  }

  /**
   * Caches user profile to localStorage
   */
  private cacheProfile(profile: GitHubUserProfile): void {
    try {
      const cacheData = {
        profile,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache user profile:', error);
    }
  }

  /**
   * Gets cached profile from localStorage
   */
  private getCachedProfile(): { profile: GitHubUserProfile; timestamp: number } | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to retrieve cached profile:', error);
    }
    return null;
  }

  /**
   * Checks if cached data is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Clears cached user data (useful for logout)
   */
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    this.currentProfile = null;
  }

  /**
   * Pre-loads user profile data from OAuth response
   * This is used when we get user data from the OAuth callback
   */
  setProfileFromOAuth(userData: Partial<GitHubUserProfile>): void {
    if (userData.login) {
      // Create a minimal profile from OAuth data
      const profile: GitHubUserProfile = {
        id: userData.id || 0,
        login: userData.login,
        name: userData.name || null,
        email: userData.email || null,
        avatar_url: userData.avatar_url || '',
        bio: null,
        company: null,
        location: null,
        blog: null,
        twitter_username: null,
        public_repos: 0,
        public_gists: 0,
        followers: 0,
        following: 0,
        created_at: '',
        updated_at: ''
      };
      
      this.currentProfile = profile;
      this.cacheProfile(profile);
    }
  }
}

// Export singleton instance
const userService = new UserService();
export default userService;
