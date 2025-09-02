// Unified GitHub data service - handles both recent activity and search functionality
// Consolidates activityService and universalSearchService to eliminate overlap

import environmentService from './environmentService';

// Unified data item interface
export interface GitHubDataItem {
  id: string;
  type: 'repo' | 'code' | 'pr' | 'issue' | 'commit' | 'user' | 'discussion' | 'release';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  organization: string;
  repository?: string;
  author?: string;
  avatar?: string;
  state?: 'open' | 'closed' | 'merged' | 'draft';
  language?: string;
  created_at?: string;
  updated_at?: string;
  timestamp?: string;
  score: number;
  important?: boolean;
  metadata?: {
    line_number?: number;
    file_path?: string;
    commit_sha?: string;
    labels?: string[];
    assignees?: string[];
    reviewers?: string[];
    branch?: string;
    size?: number;
    downloads?: number;
    number?: number;
    merged?: boolean;
    sha?: string;
  };
  preview?: string;
}

// Query options for the unified service
export interface GitHubDataOptions {
  // Query type
  mode: 'recent' | 'search';
  
  // Common options
  organizations: string[];
  accessToken: string;
  
  // Search-specific options
  query?: string;
  types?: Array<'repo' | 'code' | 'pr' | 'issue' | 'commit' | 'user'>;
  language?: string;
  state?: string;
  author?: string;
  sort?: 'best-match' | 'created' | 'updated';
  limit?: number;
  
  // Recent activity specific options
  daysBack?: number;
  filter?: 'all' | 'pull_request' | 'commit' | 'issue';
  
  // Advanced options
  includeImportant?: boolean;
  faceted?: boolean;
}

// Response interface
export interface GitHubDataResponse {
  success: boolean;
  items: GitHubDataItem[];
  metadata: {
    total_count: number;
    query?: string;
    organizations: string[];
    mode: 'recent' | 'search';
    search_time?: string;
    days_back?: number;
    facets?: {
      organizations: Array<{ name: string; count: number }>;
      types: Array<{ type: string; count: number }>;
      languages: Array<{ language: string; count: number }>;
      repositories: Array<{ repo: string; count: number }>;
    };
  };
  error?: string;
}

// Faceted search results
export interface FacetedSearchResult {
  repositories: GitHubDataItem[];
  code: GitHubDataItem[];
  pullRequests: GitHubDataItem[];
  issues: GitHubDataItem[];
  commits: GitHubDataItem[];
}

class GitHubDataService {
  private cache: Map<string, { data: GitHubDataResponse; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private baseUrl = 'https://api.github.com';

  /**
   * Unified method to get GitHub data - handles both recent activity and search
   */
  async getData(
    options: GitHubDataOptions,
    onProgress?: (results: Partial<GitHubDataResponse>) => void
  ): Promise<GitHubDataResponse> {
    const cacheKey = this.generateCacheKey(options);
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still fresh (except for streaming searches)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION && !onProgress) {
      return cached.data;
    }

    try {
      let response: GitHubDataResponse;

      if (options.mode === 'recent') {
        response = await this.getRecentActivity(options);
      } else {
        response = await this.performSearch(options, onProgress);
      }

      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error('[GitHubDataService] Error:', error);
      return {
        success: false,
        items: [],
        metadata: {
          total_count: 0,
          organizations: options.organizations,
          mode: options.mode
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get recent activity using the existing Azure Function
   */
  private async getRecentActivity(options: GitHubDataOptions): Promise<GitHubDataResponse> {
    const apiUrl = environmentService.getFunctionAppUrl();
    const url = `${apiUrl}/api/recent-activity?organizations=${options.organizations.join(',')}&days=${options.daysBack || 1}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Convert activity items to unified format
    const unifiedItems: GitHubDataItem[] = data.activities.map((activity: any) => ({
      id: activity.id,
      type: activity.type === 'pull_request' ? 'pr' : activity.type,
      title: activity.title,
      description: activity.repo,
      url: activity.url,
      organization: activity.repo.split('/')[0],
      repository: activity.repo,
      author: activity.user,
      avatar: activity.avatar,
      state: activity.state,
      created_at: activity.created_at,
      updated_at: activity.updated_at,
      timestamp: activity.timestamp,
      score: activity.important ? 100 : 50,
      important: activity.important,
      metadata: {
        number: activity.number,
        merged: activity.merged,
        sha: activity.sha
      }
    }));

    // Apply filters if specified
    let filteredItems = unifiedItems;
    if (options.filter && options.filter !== 'all') {
      const filterType = options.filter === 'pull_request' ? 'pr' : options.filter;
      filteredItems = unifiedItems.filter(item => item.type === filterType);
    }

    return {
      success: true,
      items: filteredItems,
      metadata: {
        total_count: filteredItems.length,
        organizations: options.organizations,
        mode: 'recent',
        days_back: options.daysBack || 1
      }
    };
  }

  /**
   * Perform search using GitHub API directly
   */
  private async performSearch(
    options: GitHubDataOptions,
    onProgress?: (results: Partial<GitHubDataResponse>) => void
  ): Promise<GitHubDataResponse> {
    if (!options.query?.trim()) {
      throw new Error('Search query is required');
    }

    const startTime = Date.now();
    const allResults: GitHubDataItem[] = [];
    const facets = {
      organizations: new Map<string, number>(),
      types: new Map<string, number>(),
      languages: new Map<string, number>(),
      repositories: new Map<string, number>()
    };

    const searchTypes = options.types || ['repo', 'code', 'pr', 'issue', 'commit'];
    const limit = Math.floor((options.limit || 100) / searchTypes.length);

    // Execute searches in parallel for different content types
    const searchPromises = searchTypes.map(type => 
      this.searchByType(type, options, limit)
    );

    // Handle streaming results if onProgress callback is provided
    if (onProgress) {
      searchPromises.forEach((promise, index) => {
        promise.then(typeResults => {
          // Merge results immediately when each search completes
          allResults.push(...typeResults);
          
          // Update facets
          typeResults.forEach(item => {
            facets.organizations.set(item.organization, (facets.organizations.get(item.organization) || 0) + 1);
            facets.types.set(item.type, (facets.types.get(item.type) || 0) + 1);
            if (item.language) {
              facets.languages.set(item.language, (facets.languages.get(item.language) || 0) + 1);
            }
            if (item.repository) {
              facets.repositories.set(item.repository, (facets.repositories.get(item.repository) || 0) + 1);
            }
          });

          // Send immediate progress update for real-time streaming
          const currentResult: Partial<GitHubDataResponse> = {
            items: this.sortAndLimitResults([...allResults], options.sort, options.limit),
            metadata: {
              total_count: allResults.length,
              organizations: options.organizations,
              mode: 'search',
              query: options.query,
              facets: {
                organizations: Array.from(facets.organizations.entries()).map(([name, count]) => ({ name, count })),
                types: Array.from(facets.types.entries()).map(([type, count]) => ({ type, count })),
                languages: Array.from(facets.languages.entries()).map(([language, count]) => ({ language, count })),
                repositories: Array.from(facets.repositories.entries()).map(([repo, count]) => ({ repo, count }))
              }
            }
          };

          // Call progress callback immediately for streaming
          onProgress(currentResult);
          
        }).catch(error => {
          console.error(`Search failed for type ${searchTypes[index]}:`, error);
          
          // Still send progress update even on partial failures
          if (allResults.length > 0) {
            const currentResult: Partial<GitHubDataResponse> = {
              items: this.sortAndLimitResults([...allResults], options.sort, options.limit),
              metadata: {
                total_count: allResults.length,
                organizations: options.organizations,
                mode: 'search',
                query: options.query
              }
            };
            onProgress(currentResult);
          }
        });
      });
    }

    // Wait for all searches to complete
    const typeResults = await Promise.allSettled(searchPromises);
    
    // Collect successful results
    typeResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        result.value.forEach(item => {
          facets.organizations.set(item.organization, (facets.organizations.get(item.organization) || 0) + 1);
          facets.types.set(item.type, (facets.types.get(item.type) || 0) + 1);
          if (item.language) {
            facets.languages.set(item.language, (facets.languages.get(item.language) || 0) + 1);
          }
          if (item.repository) {
            facets.repositories.set(item.repository, (facets.repositories.get(item.repository) || 0) + 1);
          }
        });
      }
    });

    // Sort and limit final results with deduplication
    const finalResults = this.sortAndLimitResults(allResults, options.sort, options.limit);

    return {
      success: true,
      items: finalResults,
      metadata: {
        total_count: allResults.length,
        query: options.query,
        organizations: options.organizations,
        mode: 'search',
        search_time: `${Date.now() - startTime}ms`,
        facets: {
          organizations: Array.from(facets.organizations.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count),
          types: Array.from(facets.types.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count),
          languages: Array.from(facets.languages.entries())
            .map(([language, count]) => ({ language, count }))
            .sort((a, b) => b.count - a.count),
          repositories: Array.from(facets.repositories.entries())
            .map(([repo, count]) => ({ repo, count }))
            .sort((a, b) => b.count - a.count)
        }
      }
    };
  }

  /**
   * Search for specific content type
   */
  private async searchByType(
    type: string,
    options: GitHubDataOptions,
    limit: number
  ): Promise<GitHubDataItem[]> {
    const queryParams = new URLSearchParams();
    
    // Build query based on type
    let query: string;
    switch (type) {
      case 'repo':
        query = this.buildRepositoryQuery(options);
        queryParams.set('q', query);
        queryParams.set('sort', options.sort === 'created' ? 'created' : 'updated');
        queryParams.set('order', 'desc');
        queryParams.set('per_page', limit.toString());
        break;
        
      case 'code':
        query = this.buildCodeQuery(options);
        queryParams.set('q', query);
        queryParams.set('sort', 'indexed');
        queryParams.set('order', 'desc');
        queryParams.set('per_page', limit.toString());
        break;
        
      case 'pr':
        query = this.buildPRQuery(options);
        queryParams.set('q', query);
        queryParams.set('sort', options.sort === 'created' ? 'created' : 'updated');
        queryParams.set('order', 'desc');
        queryParams.set('per_page', limit.toString());
        break;
        
      case 'issue':
        query = this.buildIssueQuery(options);
        queryParams.set('q', query);
        queryParams.set('sort', options.sort === 'created' ? 'created' : 'updated');
        queryParams.set('order', 'desc');
        queryParams.set('per_page', limit.toString());
        break;
        
      case 'commit':
        query = this.buildCommitQuery(options);
        queryParams.set('q', query);
        queryParams.set('sort', 'committer-date');
        queryParams.set('order', 'desc');
        queryParams.set('per_page', limit.toString());
        break;
        
      default:
        return [];
    }

    const endpoint = type === 'repo' ? 'repositories' : 
                    type === 'code' ? 'code' :
                    type === 'commit' ? 'commits' : 'issues';
                    
    const url = `${this.baseUrl}/search/${endpoint}?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${options.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
    });

    if (!response.ok) {
      // Handle common API errors gracefully
      if (response.status === 403) {
        console.warn(`GitHub API rate limit or permission issue for ${type} search. Status: ${response.status}`);
        return []; // Return empty array instead of throwing
      }
      if (response.status === 422) {
        console.warn(`GitHub API validation error for ${type} search. Query may be too complex.`);
        return [];
      }
      console.error(`GitHub API error for ${type} search: ${response.status} ${response.statusText}`);
      return []; // Return empty array for other errors too
    }

    const data = await response.json();
    const items = data.items || [];

    // Transform GitHub API response to unified format
    return items.map((item: any) => this.transformToUnifiedFormat(item, type));
  }

  // Helper methods for query building (using existing logic from universalSearchService)
  private buildRepositoryQuery(options: GitHubDataOptions): string {
    let query = options.query!.includes(' ') ? `"${options.query}"` : options.query!;
    
    if (options.organizations?.length) {
      // Limit to first 3 organizations to prevent complex queries that hit rate limits
      const limitedOrgs = options.organizations.slice(0, 3);
      const orgQuery = limitedOrgs.map(org => `org:${org}`).join(' OR ');
      query += ` (${orgQuery})`;
    }
    
    if (options.language) {
      query += ` language:${options.language}`;
    }

    return query;
  }

  private buildCodeQuery(options: GitHubDataOptions): string {
    let query = options.query!.includes(' ') ? `"${options.query}"` : options.query!;
    
    if (options.organizations?.length) {
      // Limit to first 3 organizations to prevent complex queries
      const limitedOrgs = options.organizations.slice(0, 3);
      const orgQuery = limitedOrgs.map(org => `org:${org}`).join(' OR ');
      query += ` (${orgQuery})`;
    }
    
    if (options.language) {
      query += ` language:${options.language}`;
    }

    return query;
  }

  private buildPRQuery(options: GitHubDataOptions): string {
    const baseQuery = options.query!.includes(' ') ? `"${options.query}"` : options.query!;
    let query = `${baseQuery} type:pr`;
    
    if (options.organizations?.length) {
      // Limit to first 3 organizations to prevent complex queries
      const limitedOrgs = options.organizations.slice(0, 3);
      const orgQuery = limitedOrgs.map(org => `org:${org}`).join(' OR ');
      query += ` (${orgQuery})`;
    }
    
    if (options.state) {
      query += ` state:${options.state}`;
    }
    
    if (options.author) {
      query += ` author:${options.author}`;
    }

    return query;
  }

  private buildIssueQuery(options: GitHubDataOptions): string {
    const baseQuery = options.query!.includes(' ') ? `"${options.query}"` : options.query!;
    let query = `${baseQuery} type:issue`;
    
    if (options.organizations?.length) {
      // Limit to first 3 organizations to prevent complex queries
      const limitedOrgs = options.organizations.slice(0, 3);
      const orgQuery = limitedOrgs.map(org => `org:${org}`).join(' OR ');
      query += ` (${orgQuery})`;
    }
    
    if (options.state) {
      query += ` state:${options.state}`;
    }
    
    if (options.author) {
      query += ` author:${options.author}`;
    }

    return query;
  }

  private buildCommitQuery(options: GitHubDataOptions): string {
    let query = options.query!.includes(' ') ? `"${options.query}"` : options.query!;
    
    if (options.organizations?.length) {
      // Limit to first 3 organizations to prevent complex queries
      const limitedOrgs = options.organizations.slice(0, 3);
      const orgQuery = limitedOrgs.map(org => `org:${org}`).join(' OR ');
      query += ` (${orgQuery})`;
    }
    
    if (options.author) {
      query += ` author:${options.author}`;
    }

    return query;
  }

  // Transform GitHub API responses to unified format
  private transformToUnifiedFormat(item: any, type: string): GitHubDataItem {
    const baseItem: GitHubDataItem = {
      id: item.id?.toString() || item.sha || item.node_id,
      type: type as any,
      title: '',
      url: item.html_url || item.url,
      organization: '',
      score: item.score || 1,
    };

    switch (type) {
      case 'repo':
        return {
          ...baseItem,
          title: item.full_name,
          description: item.description || 'No description available',
          organization: item.owner.login,
          repository: item.full_name,
          language: item.language,
          created_at: item.created_at,
          updated_at: item.updated_at,
          metadata: {
            size: item.size,
            downloads: item.watchers_count
          }
        };
        
      case 'code':
        return {
          ...baseItem,
          title: item.name,
          subtitle: item.repository?.full_name,
          description: `Found in ${item.repository?.full_name}`,
          organization: item.repository?.owner?.login || '',
          repository: item.repository?.full_name,
          language: item.language,
          url: item.html_url,
          metadata: {
            file_path: item.path,
            line_number: 1
          },
          preview: item.text_matches?.[0]?.fragment
        };
        
      case 'pr':
        return {
          ...baseItem,
          title: item.title,
          subtitle: `#${item.number}`,
          description: item.body?.substring(0, 100) || 'No description',
          organization: item.repository_url?.split('/')[4] || '',
          repository: item.repository_url?.split('/').slice(4, 6).join('/') || '',
          author: item.user?.login,
          state: item.state === 'open' ? 'open' : item.merged ? 'merged' : 'closed',
          created_at: item.created_at,
          updated_at: item.updated_at,
          metadata: {
            number: item.number,
            merged: item.merged,
            labels: item.labels?.map((l: any) => l.name) || [],
            assignees: item.assignees?.map((a: any) => a.login) || []
          }
        };
        
      case 'issue':
        return {
          ...baseItem,
          title: item.title,
          subtitle: `#${item.number}`,
          description: item.body?.substring(0, 100) || 'No description',
          organization: item.repository_url?.split('/')[4] || '',
          repository: item.repository_url?.split('/').slice(4, 6).join('/') || '',
          author: item.user?.login,
          state: item.state,
          created_at: item.created_at,
          updated_at: item.updated_at,
          metadata: {
            number: item.number,
            labels: item.labels?.map((l: any) => l.name) || [],
            assignees: item.assignees?.map((a: any) => a.login) || []
          }
        };
        
      case 'commit':
        return {
          ...baseItem,
          title: item.commit?.message?.split('\n')[0] || 'No commit message',
          description: item.repository?.full_name || '',
          organization: item.repository?.owner?.login || '',
          repository: item.repository?.full_name,
          author: item.commit?.author?.name,
          created_at: item.commit?.author?.date,
          metadata: {
            sha: item.sha,
            commit_sha: item.sha
          }
        };
        
      default:
        return baseItem;
    }
  }

  // Sorting and deduplication logic (from universalSearchService)
  private sortAndLimitResults(
    results: GitHubDataItem[],
    sortBy?: string,
    limit?: number
  ): GitHubDataItem[] {
    // First deduplicate by repository
    const deduplicatedResults = this.deduplicateByRepository(results);
    
    let sorted = [...deduplicatedResults];

    switch (sortBy) {
      case 'created':
        sorted.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case 'updated':
        sorted.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
        break;
      case 'relevance':
      case 'best-match':
      default:
        sorted.sort((a, b) => b.score - a.score);
        break;
    }

    return limit ? sorted.slice(0, limit) : sorted;
  }

  private deduplicateByRepository(results: GitHubDataItem[]): GitHubDataItem[] {
    const repoMap = new Map<string, GitHubDataItem>();
    
    results.forEach(item => {
      const repoKey = `${item.organization}/${item.repository}`;
      
      if (!repoMap.has(repoKey)) {
        // First result for this repository
        repoMap.set(repoKey, { ...item });
      } else {
        const existing = repoMap.get(repoKey)!;
        
        // For the same repository, prioritize different types or keep highest score
        if (existing.type !== item.type) {
          // Different types - keep the higher scoring one, but prefer repo > code > pr > issue
          const typePriority: Record<string, number> = {
            'repo': 4,
            'code': 3, 
            'pr': 2,
            'issue': 1,
            'commit': 1
          };
          
          const existingPriority = typePriority[existing.type] || 0;
          const itemPriority = typePriority[item.type] || 0;
          
          if (itemPriority > existingPriority || (itemPriority === existingPriority && item.score > existing.score)) {
            repoMap.set(repoKey, { ...item });
          }
        } else if (item.score > existing.score) {
          // Same type, higher score
          repoMap.set(repoKey, { ...item });
        }
      }
    });

    // Update descriptions to show match counts for repositories with multiple results
    const repoCounts = new Map<string, { code: number, pr: number, issue: number, commit: number }>();
    
    results.forEach(item => {
      const repoKey = `${item.organization}/${item.repository}`;
      if (!repoCounts.has(repoKey)) {
        repoCounts.set(repoKey, { code: 0, pr: 0, issue: 0, commit: 0 });
      }
      const counts = repoCounts.get(repoKey)!;
      if (item.type === 'code') counts.code++;
      if (item.type === 'pr') counts.pr++;
      if (item.type === 'issue') counts.issue++;
      if (item.type === 'commit') counts.commit++;
    });

    // Update descriptions with match counts
    return Array.from(repoMap.values()).map(item => {
      const repoKey = `${item.organization}/${item.repository}`;
      const counts = repoCounts.get(repoKey);
      
      if (counts) {
        const parts = [];
        if (counts.code > 1) parts.push(`${counts.code} files`);
        if (counts.pr > 1) parts.push(`${counts.pr} PRs`);
        if (counts.issue > 1) parts.push(`${counts.issue} issues`);
        if (counts.commit > 1) parts.push(`${counts.commit} commits`);
        
        if (parts.length > 0) {
          return {
            ...item,
            description: `Found matches in ${parts.join(', ')}`
          };
        }
      }
      
      return item;
    });
  }

  /**
   * Get faceted search results (for enhanced command palette)
   */
  async getFacetedSearch(
    query: string,
    organizations: string[],
    accessToken: string
  ): Promise<FacetedSearchResult> {
    // Use Promise.allSettled to handle individual search failures gracefully
    const searchPromises = [
      this.searchByType('repo', { mode: 'search', query, organizations, accessToken }, 10),
      this.searchByType('code', { mode: 'search', query, organizations, accessToken }, 10),
      this.searchByType('pr', { mode: 'search', query, organizations, accessToken }, 10),
      this.searchByType('issue', { mode: 'search', query, organizations, accessToken }, 10),
      this.searchByType('commit', { mode: 'search', query, organizations, accessToken }, 10)
    ];

    const results = await Promise.allSettled(searchPromises);
    
    // Extract successful results, defaulting to empty arrays for failed searches
    const [repositories, code, pullRequests, issues, commits] = results.map(result => 
      result.status === 'fulfilled' ? result.value : []
    );

    return {
      repositories,
      code,
      pullRequests,
      issues,
      commits
    };
  }

  // Utility methods for backward compatibility
  filterByType(items: GitHubDataItem[], type: string): GitHubDataItem[] {
    const filterType = type === 'pull_request' ? 'pr' : type;
    return type === 'all' ? items : items.filter(item => item.type === filterType);
  }

  getImportantItems(items: GitHubDataItem[]): GitHubDataItem[] {
    return items.filter(item => item.important);
  }

  formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  // Cache management
  private generateCacheKey(options: GitHubDataOptions): string {
    const keyParts = [
      options.mode,
      options.organizations.join(','),
      options.query || '',
      options.daysBack || 1,
      options.filter || 'all',
      JSON.stringify(options.types || [])
    ];
    return keyParts.join('|');
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
const githubDataService = new GitHubDataService();
export default githubDataService;

// Export backward compatibility interfaces
export type { GitHubDataItem as ActivityItem };
export type { GitHubDataItem as UniversalSearchItem };
export type { GitHubDataOptions as UniversalSearchOptions };
export type { GitHubDataResponse as ActivityFeedResponse };
export type { GitHubDataResponse as UniversalSearchResult };
