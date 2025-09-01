import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  GitPullRequest, 
  GitCommit, 
  AlertCircle, 
  Filter, 
  RefreshCw, 
  ExternalLink,
  Star,
  Calendar,
  User
} from 'lucide-react';
import githubDataService, { type GitHubDataItem } from '../services/githubDataService';

type ActivityFilter = 'all' | 'pr' | 'commit' | 'issue';

interface RecentActivityFeedProps {
  accessToken: string | null;
  organizations: string[];
}

const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ 
  accessToken, 
  organizations 
}) => {
  const [activities, setActivities] = useState<GitHubDataItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<GitHubDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [daysBack, setDaysBack] = useState(7);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchActivity = async () => {
    if (!accessToken || organizations.length === 0) {
      setError('No access token or organizations available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await githubDataService.getData({
        mode: 'recent',
        organizations,
        accessToken,
        daysBack,
        filter: filter === 'all' ? 'all' : filter === 'pr' ? 'pull_request' : filter
      });

      if (result.success) {
        setActivities(result.items);
        setLastFetch(new Date());
      } else {
        setError(result.error || 'Failed to fetch activity');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters when activities or filter changes
  useEffect(() => {
    const filtered = githubDataService.filterByType(activities, filter);
    setFilteredActivities(filtered);
  }, [activities, filter]);

  // Initial fetch
  useEffect(() => {
    fetchActivity();
  }, [accessToken, organizations.join(','), daysBack]);

  const handleFilterChange = (newFilter: ActivityFilter) => {
    setFilter(newFilter);
  };

  const getActivityIcon = (type: GitHubDataItem['type']) => {
    switch (type) {
      case 'pr':
        return <GitPullRequest size={16} />;
      case 'commit':
        return <GitCommit size={16} />;
      case 'issue':
        return <AlertCircle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const getActivityTypeInfo = (type: GitHubDataItem['type']) => {
    switch (type) {
      case 'pr':
        return {
          label: 'Pull Request',
          color: 'text-green-700',
          bgColor: 'bg-green-100 dark:bg-green-900/20'
        };
      case 'commit':
        return {
          label: 'Commit',
          color: 'text-blue-700',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20'
        };
      case 'issue':
        return {
          label: 'Issue',
          color: 'text-red-700',
          bgColor: 'bg-red-100 dark:bg-red-900/20'
        };
      default:
        return {
          label: 'Activity',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20'
        };
    }
  };

  const getStateInfo = (activity: GitHubDataItem) => {
    if (!activity.state) return null;
    
    switch (activity.state) {
      case 'open':
        return {
          label: 'Open',
          color: 'text-green-700',
          bgColor: 'bg-green-100'
        };
      case 'closed':
        return {
          label: 'Closed',
          color: 'text-red-700',
          bgColor: 'bg-red-100'
        };
      case 'merged':
        return {
          label: 'Merged',
          color: 'text-purple-700',
          bgColor: 'bg-purple-100'
        };
      default:
        return null;
    }
  };

  const renderActivityItem = (activity: GitHubDataItem) => {
    const typeInfo = getActivityTypeInfo(activity.type);
    const stateInfo = getStateInfo(activity);
    const timeAgo = githubDataService.formatTimeAgo(activity.timestamp || activity.updated_at || activity.created_at || '');

    return (
      <div 
        key={activity.id} 
        className={`p-4 border-l-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow ${
          activity.important 
            ? 'border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/10' 
            : 'border-l-gray-300 dark:border-l-gray-600'
        }`}
      >
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {activity.avatar ? (
              <img
                src={activity.avatar}
                alt={activity.author}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <User size={14} className="text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                {getActivityIcon(activity.type)}
                <span className="ml-1">{typeInfo.label}</span>
              </span>
              
              {stateInfo && (
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${stateInfo.bgColor} ${stateInfo.color}`}>
                  {stateInfo.label}
                </span>
              )}
              
              {activity.important && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                  <Star size={12} className="mr-1" />
                  Important
                </span>
              )}
            </div>

            {/* Title */}
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
              {activity.title}
            </h4>

            {/* Meta information */}
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <GitCommit size={12} />
                <span className="truncate">{activity.repository}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User size={12} />
                <span>{activity.author}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>{timeAgo}</span>
              </div>
              {activity.metadata?.sha && (
                <div className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                  {activity.metadata.sha.substring(0, 7)}
                </div>
              )}
              {activity.metadata?.number && (
                <div className="font-medium">
                  #{activity.metadata.number}
                </div>
              )}
            </div>

            {/* Action link */}
            <div className="mt-2">
              <a
                href={activity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ExternalLink size={12} />
                <span>View on GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {organizations.length > 0 
              ? `Activity from ${organizations.join(', ')} organizations`
              : 'No organizations selected'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Refresh button */}
          <button
            onClick={fetchActivity}
            disabled={isLoading}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Refresh activity"
          >
            <RefreshCw 
              size={16} 
              className={`text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} 
            />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-4">
          {/* Filter buttons */}
          <div className="flex items-center space-x-1">
            <Filter size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            {(['all', 'pr', 'commit', 'issue'] as ActivityFilter[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => handleFilterChange(filterType)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {filterType === 'all' ? 'All' : 
                 filterType === 'pr' ? 'PRs' : 
                 filterType === 'commit' ? 'Commits' : 'Issues'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Days back selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Days:</span>
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(parseInt(e.target.value))}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>1 week</option>
              <option value={14}>2 weeks</option>
              <option value={30}>1 month</option>
            </select>
          </div>

          {lastFetch && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Updated {githubDataService.formatTimeAgo(lastFetch.toISOString())}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-600 dark:text-red-400" size={16} />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <RefreshCw className="animate-spin text-blue-600" size={20} />
            <span className="text-gray-600 dark:text-gray-400">Loading recent activity...</span>
          </div>
        </div>
      )}

      {!isLoading && !error && filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <Activity className="mx-auto text-gray-400" size={48} />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {filter === 'all' 
              ? 'No recent activity found' 
              : `No ${filter === 'pr' ? 'pull requests' : filter}s found`}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Try adjusting the time range or filters
          </p>
        </div>
      )}

      {/* Activity feed */}
      {!isLoading && !error && filteredActivities.length > 0 && (
        <div className="space-y-4">
          {filteredActivities.map(renderActivityItem)}
        </div>
      )}

      {/* Summary */}
      {!isLoading && !error && activities.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="text-blue-700 dark:text-blue-300">
              Showing {filteredActivities.length} of {activities.length} activities
            </div>
            <div className="text-blue-600 dark:text-blue-400">
              Important: {githubDataService.getImportantItems(activities).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivityFeed;
