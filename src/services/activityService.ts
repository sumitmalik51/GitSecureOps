import environmentService from './environmentService';

export interface ActivityItem {
  id: string;
  type: 'pull_request' | 'commit' | 'issue';
  title: string;
  repo: string;
  user: string;
  avatar: string | null;
  url: string;
  state?: string;
  merged?: boolean;
  sha?: string;
  number?: number;
  created_at: string;
  updated_at: string;
  timestamp: string;
  important: boolean;
}

export interface ActivityFeedResponse {
  success: boolean;
  activities: ActivityItem[];
  metadata: {
    total_count: number;
    organizations: string[];
    days_back: number;
    fetch_time: string;
  };
  error?: string;
}

export type ActivityFilter = 'all' | 'pull_request' | 'commit' | 'issue';

class ActivityService {
  private cache: Map<string, { data: ActivityFeedResponse; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch recent activity from GitHub API via Azure Function
   */
  async fetchRecentActivity(
    accessToken: string,
    organizations: string[],
    daysBack: number = 1 // Changed default to 1 day to reduce load
  ): Promise<ActivityFeedResponse> {
    const cacheKey = `${organizations.join(',')}-${daysBack}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const apiUrl = environmentService.getFunctionAppUrl();
      const url = `${apiUrl}/api/recent-activity?organizations=${organizations.join(',')}&days=${daysBack}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as ActivityFeedResponse;
      
      // Cache the response
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw new Error(`Failed to fetch activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Filter activities by type
   */
  filterActivities(activities: ActivityItem[], filter: ActivityFilter): ActivityItem[] {
    if (filter === 'all') {
      return activities;
    }
    return activities.filter(activity => activity.type === filter);
  }

  /**
   * Get activities marked as important
   */
  getImportantActivities(activities: ActivityItem[]): ActivityItem[] {
    return activities.filter(activity => activity.important);
  }

  /**
   * Format relative time for activity timestamps
   */
  formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  }

  /**
   * Get activity type display information
   */
  getActivityTypeInfo(type: ActivityItem['type']): { 
    label: string; 
    color: string; 
    bgColor: string;
    icon: string;
  } {
    switch (type) {
      case 'pull_request':
        return {
          label: 'Pull Request',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          icon: '↗'
        };
      case 'commit':
        return {
          label: 'Commit',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: '•'
        };
      case 'issue':
        return {
          label: 'Issue',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: '!'
        };
      default:
        return {
          label: 'Activity',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: '?'
        };
    }
  }

  /**
   * Get state display information for PRs and issues
   */
  getStateInfo(activity: ActivityItem): {
    label: string;
    color: string;
    bgColor: string;
  } | null {
    if (activity.type === 'pull_request') {
      if (activity.merged) {
        return {
          label: 'Merged',
          color: 'text-purple-700',
          bgColor: 'bg-purple-200'
        };
      } else if (activity.state === 'open') {
        return {
          label: 'Open',
          color: 'text-green-700',
          bgColor: 'bg-green-200'
        };
      } else {
        return {
          label: 'Closed',
          color: 'text-red-700',
          bgColor: 'bg-red-200'
        };
      }
    }

    if (activity.type === 'issue') {
      if (activity.state === 'open') {
        return {
          label: 'Open',
          color: 'text-green-700',
          bgColor: 'bg-green-200'
        };
      } else {
        return {
          label: 'Closed',
          color: 'text-red-700',
          bgColor: 'bg-red-200'
        };
      }
    }

    return null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

const activityService = new ActivityService();
export default activityService;
