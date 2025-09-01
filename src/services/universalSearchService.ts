// Cross-organization universal search service
// Provides comprehensive search across repos, files, PRs, issues, and more

export interface UniversalSearchItem {
  id: string;
  type: 'repo' | 'file' | 'pr' | 'issue' | 'code' | 'commit' | 'user' | 'discussion' | 'release' | 'action';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  organization: string;
  repository?: string;
  language?: string;
  author?: string;
  state?: 'open' | 'closed' | 'merged' | 'draft';
  created_at?: string;
  updated_at?: string;
  score: number;
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
  };
  preview?: string;
}

export interface UniversalSearchOptions {
  query: string;
  organizations?: string[];
  types?: ('repo' | 'file' | 'pr' | 'issue' | 'code' | 'commit' | 'user' | 'discussion' | 'release' | 'action')[];
  language?: string;
  author?: string;
  state?: string;
  created?: string; // date range
  updated?: string; // date range
  limit?: number;
  sort?: 'relevance' | 'created' | 'updated' | 'best-match';
}

export interface UniversalSearchResult {
  query: string;
  total_count: number;
  items: UniversalSearchItem[];
  facets: {
    organizations: Array<{ name: string; count: number }>;
    types: Array<{ type: string; count: number }>;
    languages: Array<{ language: string; count: number }>;
    repositories: Array<{ repo: string; count: number }>;
  };
  search_time: string;
  rate_limit?: {
    remaining: number;
    reset_at: string;
  };
}

class UniversalSearchService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.github.com';
  }

  // Universal search across all content types
  async searchUniversal(
    options: UniversalSearchOptions,
    accessToken: string,
    onProgress?: (results: Partial<UniversalSearchResult>) => void
  ): Promise<UniversalSearchResult> {
    const startTime = Date.now();
    const allResults: UniversalSearchItem[] = [];
    const facets = {
      organizations: new Map<string, number>(),
      types: new Map<string, number>(),
      languages: new Map<string, number>(),
      repositories: new Map<string, number>()
    };

    const searchTypes = options.types || ['repo', 'code', 'pr', 'issue'];
    const limit = Math.floor((options.limit || 100) / searchTypes.length);

    // Execute searches in parallel for different content types
    const searchPromises = searchTypes.map(type => 
      this.searchByType(type, options, accessToken, limit)
    );

    // Handle streaming results if onProgress callback is provided
    if (onProgress) {
      let completedSearches = 0;
      
      // Use Promise.allSettled with individual promise handling for real-time updates
      searchPromises.forEach((promise, index) => {
        promise.then(typeResults => {
          completedSearches++;
          
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
          const currentResult: Partial<UniversalSearchResult> = {
            query: options.query,
            total_count: allResults.length,
            items: this.sortAndLimitResults([...allResults], options.sort, options.limit),
            facets: {
              organizations: Array.from(facets.organizations.entries()).map(([name, count]) => ({ name, count })),
              types: Array.from(facets.types.entries()).map(([type, count]) => ({ type, count })),
              languages: Array.from(facets.languages.entries()).map(([language, count]) => ({ language, count })),
              repositories: Array.from(facets.repositories.entries()).map(([repo, count]) => ({ repo, count }))
            }
          };

          // Call progress callback immediately for streaming
          onProgress(currentResult);
          
        }).catch(error => {
          console.error(`Search failed for type ${searchTypes[index]}:`, error);
          completedSearches++;
          
          // Still send progress update even on partial failures
          if (allResults.length > 0) {
            const currentResult: Partial<UniversalSearchResult> = {
              query: options.query,
              total_count: allResults.length,
              items: this.sortAndLimitResults([...allResults], options.sort, options.limit),
            };
            onProgress(currentResult);
          }
        });
      });
    }

    // Wait for all searches to complete
    const typeResults = await Promise.allSettled(searchPromises);
    
    // Collect successful results
    typeResults.forEach(result => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
        
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

    // Sort and limit final results
    const finalResults = this.sortAndLimitResults(allResults, options.sort, options.limit);

    return {
      query: options.query,
      total_count: allResults.length,
      items: finalResults,
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
      },
      search_time: `${Date.now() - startTime}ms`
    };
  }

  // Search by specific content type
  private async searchByType(
    type: string,
    options: UniversalSearchOptions,
    accessToken: string,
    limit: number
  ): Promise<UniversalSearchItem[]> {
    let searchUrl = '';
    let queryParams = new URLSearchParams();

    // Build search query based on type
    switch (type) {
      case 'repo':
        searchUrl = `${this.baseUrl}/search/repositories`;
        queryParams.set('q', this.buildRepositoryQuery(options));
        break;
      case 'code':
        searchUrl = `${this.baseUrl}/search/code`;
        queryParams.set('q', this.buildCodeQuery(options));
        break;
      case 'pr':
        searchUrl = `${this.baseUrl}/search/issues`;
        queryParams.set('q', this.buildPRQuery(options));
        break;
      case 'issue':
        searchUrl = `${this.baseUrl}/search/issues`;
        queryParams.set('q', this.buildIssueQuery(options));
        break;
      case 'commit':
        searchUrl = `${this.baseUrl}/search/commits`;
        queryParams.set('q', this.buildCommitQuery(options));
        break;
      case 'user':
        searchUrl = `${this.baseUrl}/search/users`;
        queryParams.set('q', this.buildUserQuery(options));
        break;
      default:
        return [];
    }

    queryParams.set('per_page', limit.toString());
    queryParams.set('sort', this.getGitHubSortParam(options.sort || 'relevance'));

    try {
      const response = await fetch(`${searchUrl}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitSecureOps-Universal-Search'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformSearchResults(data.items || [], type);

    } catch (error) {
      console.error(`Search failed for ${type}:`, error);
      return [];
    }
  }

  // Build query strings for different search types
  private buildRepositoryQuery(options: UniversalSearchOptions): string {
    // Wrap multi-word queries in quotes for exact phrase search
    let query = options.query.includes(' ') ? `"${options.query}"` : options.query;
    
    if (options.organizations?.length) {
      const orgQuery = options.organizations.map(org => `org:${org}`).join(' OR ');
      query += ` (${orgQuery})`;
    }
    
    if (options.language) {
      query += ` language:${options.language}`;
    }
    
    if (options.created) {
      query += ` created:${options.created}`;
    }
    
    if (options.updated) {
      query += ` pushed:${options.updated}`;
    }

    return query;
  }

  private buildCodeQuery(options: UniversalSearchOptions): string {
    // Wrap multi-word queries in quotes for exact phrase search
    let query = options.query.includes(' ') ? `"${options.query}"` : options.query;
    
    if (options.organizations?.length) {
      const orgQuery = options.organizations.map(org => `org:${org}`).join(' OR ');
      query += ` (${orgQuery})`;
    }
    
    if (options.language) {
      query += ` language:${options.language}`;
    }

    return query;
  }

  private buildPRQuery(options: UniversalSearchOptions): string {
    // Wrap multi-word queries in quotes for exact phrase search
    const baseQuery = options.query.includes(' ') ? `"${options.query}"` : options.query;
    let query = `${baseQuery} type:pr`;
    
    if (options.organizations?.length) {
      const orgQuery = options.organizations.map(org => `org:${org}`).join(' OR ');
      query += ` (${orgQuery})`;
    }
    
    if (options.state) {
      query += ` state:${options.state}`;
    }
    
    if (options.author) {
      query += ` author:${options.author}`;
    }
    
    if (options.created) {
      query += ` created:${options.created}`;
    }
    
    if (options.updated) {
      query += ` updated:${options.updated}`;
    }

    return query;
  }

  private buildIssueQuery(options: UniversalSearchOptions): string {
    // Wrap multi-word queries in quotes for exact phrase search
    const baseQuery = options.query.includes(' ') ? `"${options.query}"` : options.query;
    let query = `${baseQuery} type:issue`;
    
    if (options.organizations?.length) {
      const orgQuery = options.organizations.map(org => `org:${org}`).join(' OR ');
      query += ` (${orgQuery})`;
    }
    
    if (options.state) {
      query += ` state:${options.state}`;
    }
    
    if (options.author) {
      query += ` author:${options.author}`;
    }
    
    if (options.created) {
      query += ` created:${options.created}`;
    }
    
    if (options.updated) {
      query += ` updated:${options.updated}`;
    }

    return query;
  }

  private buildCommitQuery(options: UniversalSearchOptions): string {
    // Wrap multi-word queries in quotes for exact phrase search
    let query = options.query.includes(' ') ? `"${options.query}"` : options.query;
    
    if (options.organizations?.length) {
      const orgQuery = options.organizations.map(org => `org:${org}`).join(' OR ');
      query += ` (${orgQuery})`;
    }
    
    if (options.author) {
      query += ` author:${options.author}`;
    }

    return query;
  }

  private buildUserQuery(options: UniversalSearchOptions): string {
    let query = options.query;
    
    if (options.organizations?.length) {
      const orgQuery = options.organizations.map(org => `org:${org}`).join(' OR ');
      query += ` (${orgQuery})`;
    }

    return query;
  }

  // Transform GitHub API results to universal search items
  private transformSearchResults(items: any[], type: string): UniversalSearchItem[] {
    return items.map((item, index) => {
      const baseItem: UniversalSearchItem = {
        id: `${type}_${item.id || index}`,
        type: type as any,
        title: '',
        url: '',
        organization: '',
        score: item.score || 1
      };

      switch (type) {
        case 'repo':
          return {
            ...baseItem,
            title: item.name,
            subtitle: item.full_name,
            description: item.description,
            url: item.html_url,
            organization: item.owner.login,
            language: item.language,
            created_at: item.created_at,
            updated_at: item.updated_at,
            metadata: {
              size: item.size,
              downloads: item.stargazers_count
            }
          };
          
        case 'code':
          return {
            ...baseItem,
            title: item.name,
            subtitle: item.path,
            url: item.html_url,
            organization: item.repository.owner.login,
            repository: item.repository.name,
            language: item.language,
            preview: item.text_matches?.[0]?.fragment,
            metadata: {
              file_path: item.path,
              commit_sha: item.sha
            }
          };
          
        case 'pr':
        case 'issue':
          return {
            ...baseItem,
            title: item.title,
            subtitle: `#${item.number}`,
            description: item.body?.substring(0, 200) + (item.body?.length > 200 ? '...' : ''),
            url: item.html_url,
            organization: item.repository_url.split('/')[4],
            repository: item.repository_url.split('/')[5],
            author: item.user.login,
            state: item.state,
            created_at: item.created_at,
            updated_at: item.updated_at,
            metadata: {
              labels: item.labels?.map((l: any) => l.name),
              assignees: item.assignees?.map((a: any) => a.login)
            }
          };
          
        case 'commit':
          return {
            ...baseItem,
            title: item.commit.message.split('\n')[0],
            subtitle: item.sha.substring(0, 7),
            description: item.commit.message,
            url: item.html_url,
            organization: item.repository?.owner.login || 'unknown',
            repository: item.repository?.name,
            author: item.commit.author.name,
            created_at: item.commit.author.date,
            metadata: {
              commit_sha: item.sha
            }
          };
          
        case 'user':
          return {
            ...baseItem,
            title: item.name || item.login,
            subtitle: item.login,
            description: item.bio,
            url: item.html_url,
            organization: item.login,
            created_at: item.created_at,
            updated_at: item.updated_at
          };
          
        default:
          return baseItem;
      }
    });
  }

  private getGitHubSortParam(sort: string): string {
    switch (sort) {
      case 'created': return 'created';
      case 'updated': return 'updated';
      case 'best-match': return 'best-match';
      default: return 'best-match';
    }
  }

  private sortAndLimitResults(
    results: UniversalSearchItem[],
    sortBy?: string,
    limit?: number
  ): UniversalSearchItem[] {
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

  private deduplicateByRepository(results: UniversalSearchItem[]): UniversalSearchItem[] {
    const repoMap = new Map<string, UniversalSearchItem>();
    
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

  // Quick search suggestions (for autocomplete)
  async getSearchSuggestions(
    query: string,
    organizations: string[],
    accessToken: string
  ): Promise<string[]> {
    if (query.length < 2) return [];

    try {
      // Get repository suggestions
      const repoSuggestions = await this.searchByType('repo', {
        query,
        organizations,
        limit: 5
      }, accessToken, 5);

      return repoSuggestions.map(item => item.title);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  // Search in specific repository
  async searchInRepository(
    repository: string,
    query: string,
    accessToken: string,
    type: 'code' | 'pr' | 'issue' = 'code'
  ): Promise<UniversalSearchItem[]> {
    return this.searchByType(type, {
      query: `${query} repo:${repository}`
    }, accessToken, 20);
  }

  // Get trending repositories across organizations
  async getTrendingRepositories(
    organizations: string[],
    accessToken: string,
    language?: string,
    since: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<UniversalSearchItem[]> {
    const dateThreshold = new Date();
    if (since === 'daily') {
      dateThreshold.setDate(dateThreshold.getDate() - 1);
    } else if (since === 'weekly') {
      dateThreshold.setDate(dateThreshold.getDate() - 7);
    } else {
      dateThreshold.setMonth(dateThreshold.getMonth() - 1);
    }

    const dateStr = dateThreshold.toISOString().split('T')[0];

    return this.searchByType('repo', {
      query: `created:>=${dateStr}`,
      organizations,
      language,
      sort: 'created',
      limit: 20
    }, accessToken, 20);
  }

  // Search across all content types with faceted results
  async facetedSearch(
    query: string,
    organizations: string[],
    accessToken: string
  ): Promise<{
    repositories: UniversalSearchItem[];
    code: UniversalSearchItem[];
    pullRequests: UniversalSearchItem[];
    issues: UniversalSearchItem[];
    commits: UniversalSearchItem[];
  }> {
    const [repositories, code, pullRequests, issues, commits] = await Promise.all([
      this.searchByType('repo', { query, organizations, limit: 10 }, accessToken, 10),
      this.searchByType('code', { query, organizations, limit: 10 }, accessToken, 10),
      this.searchByType('pr', { query, organizations, limit: 10 }, accessToken, 10),
      this.searchByType('issue', { query, organizations, limit: 10 }, accessToken, 10),
      this.searchByType('commit', { query, organizations, limit: 10 }, accessToken, 10)
    ]);

    return {
      repositories,
      code,
      pullRequests,
      issues,
      commits
    };
  }
}

// Export singleton instance
export const universalSearchService = new UniversalSearchService();
export default universalSearchService;
