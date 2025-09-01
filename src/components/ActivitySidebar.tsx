import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  GitPullRequest, 
  GitCommit, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Star,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import activityService, { type ActivityItem, type ActivityFilter } from '../services/activityService';

interface ActivitySidebarProps {
  accessToken: string | null;
  organizations: string[];
}

const ActivitySidebar: React.FC<ActivitySidebarProps> = ({ 
  accessToken, 
  organizations 
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [displayedActivities, setDisplayedActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [daysBack, setDaysBack] = useState(1); // Default to 1 day
  const [isExpanded, setIsExpanded] = useState(true);
  const [itemsToShow, setItemsToShow] = useState(10); // Show 10 items initially
  const [hasMore, setHasMore] = useState(false);

  const fetchActivity = async () => {
    if (!accessToken || organizations.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await activityService.fetchRecentActivity(
        accessToken, 
        organizations, 
        daysBack
      );

      if (result.success) {
        setActivities(result.activities);
      } else {
        setError(result.error || 'Failed to fetch activity');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and pagination when activities, filter, or itemsToShow changes
  useEffect(() => {
    const filtered = activityService.filterActivities(activities, filter);
    setFilteredActivities(filtered);
    
    // Set displayed activities with pagination
    const displayed = filtered.slice(0, itemsToShow);
    setDisplayedActivities(displayed);
    setHasMore(filtered.length > itemsToShow);
  }, [activities, filter, itemsToShow]);

  // Reset pagination when filter changes
  useEffect(() => {
    setItemsToShow(10);
  }, [filter]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    fetchActivity();
  }, [accessToken, organizations.join(','), daysBack]);

  const handleLoadMore = () => {
    setItemsToShow(prev => prev + 10);
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'pull_request':
        return <GitPullRequest size={12} />;
      case 'commit':
        return <GitCommit size={12} />;
      case 'issue':
        return <AlertCircle size={12} />;
      default:
        return <Activity size={12} />;
    }
  };

  const renderCompactActivityItem = (activity: ActivityItem) => {
    const typeInfo = activityService.getActivityTypeInfo(activity.type);
    const timeAgo = activityService.formatTimeAgo(activity.timestamp);
    const truncatedTitle = activity.title.length > 70 
      ? `${activity.title.substring(0, 70)}...` 
      : activity.title;
    const repoName = activity.repo.split('/')[1] || activity.repo;

    return (
      <div 
        key={activity.id} 
        className={`p-3 rounded-md bg-white dark:bg-gray-800 shadow-sm border-l-3 hover:shadow-md transition-shadow ${
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
                alt={activity.user}
                className="w-7 h-7 rounded-full"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <User size={12} className="text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-1 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}>
                {getActivityIcon(activity.type)}
                <span className="ml-1">{typeInfo.label}</span>
              </span>
              
              {activity.important && (
                <Star size={12} className="text-yellow-600" />
              )}
            </div>

            {/* Title */}
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 leading-relaxed">
              {truncatedTitle}
            </h4>

            {/* Meta information */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <div className="flex items-center space-x-1">
                <span className="truncate font-medium">{repoName}</span>
                {activity.sha && (
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">
                    {activity.sha}
                  </span>
                )}
              </div>
              <span className="text-xs whitespace-nowrap">{timeAgo}</span>
            </div>

            {/* Action link */}
            <a
              href={activity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline"
            >
              <ExternalLink size={10} />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  if (!accessToken || organizations.length === 0) {
    return (
      <div className="w-[440px] bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4">{/* Increased from w-96 to w-[440px] */}
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Activity size={32} className="mx-auto mb-2" />
          <p className="text-sm">Sign in to view recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[440px] bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">{/* Increased from w-96 to w-[440px] */}
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Recent Activity
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {organizations.length > 0 && `${organizations.length} org${organizations.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={fetchActivity}
              disabled={isLoading}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Refresh activity"
            >
              <RefreshCw 
                size={14} 
                className={`text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} 
              />
            </button>
          </div>
        </div>

        {/* Compact Controls */}
        {isExpanded && (
          <div className="mt-3 space-y-2">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1">
              {(['all', 'pull_request', 'commit', 'issue'] as ActivityFilter[]).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {filterType === 'all' ? 'All' : 
                   filterType === 'pull_request' ? 'PRs' : 
                   filterType === 'commit' ? 'Commits' : 'Issues'}
                </button>
              ))}
            </div>

            {/* Days selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Days:</span>
              <select
                value={daysBack}
                onChange={(e) => setDaysBack(parseInt(e.target.value))}
                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>1 week</option>
                <option value={14}>2 weeks</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {error && (
            <div className="p-3 m-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <div className="flex items-center space-x-2">
                <AlertCircle className="text-red-600 dark:text-red-400" size={14} />
                <span className="text-xs text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <RefreshCw className="animate-spin text-blue-600" size={16} />
                <span className="text-xs text-gray-600 dark:text-gray-400">Loading...</span>
              </div>
            </div>
          )}

          {!isLoading && !error && displayedActivities.length === 0 && filteredActivities.length === 0 && (
            <div className="text-center py-8">
              <Activity className="mx-auto text-gray-400" size={24} />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                No recent activity
              </p>
            </div>
          )}

          {/* Activity feed */}
          {!isLoading && !error && displayedActivities.length > 0 && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {displayedActivities.map(renderCompactActivityItem)}
              
              {/* Load More Button */}
              {hasMore && (
                <div className="text-center py-3">
                  <button
                    onClick={handleLoadMore}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    Load More ({filteredActivities.length - displayedActivities.length} remaining)
                  </button>
                </div>
              )}
              
              {/* Show total indicator */}
              <div className="text-center py-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {displayedActivities.length} of {filteredActivities.length} activities
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {isExpanded && !isLoading && !error && activities.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs">
            <div className="text-gray-600 dark:text-gray-400">
              {displayedActivities.length} of {filteredActivities.length} shown
            </div>
            <div className="text-blue-600 dark:text-blue-400">
              Important: {activityService.getImportantActivities(displayedActivities).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitySidebar;
