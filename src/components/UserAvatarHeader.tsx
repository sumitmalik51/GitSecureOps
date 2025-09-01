import React, { useState, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import userService, { type GitHubUserProfile } from '../services/userService';

interface UserAvatarHeaderProps {
  accessToken: string;
  username: string;
  onLogout: () => void;
  className?: string;
}

const UserAvatarHeader: React.FC<UserAvatarHeaderProps> = ({ 
  accessToken, 
  username, 
  onLogout,
  className = ''
}) => {
  const [userProfile, setUserProfile] = useState<GitHubUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (accessToken) {
      loadUserProfile();
    }
  }, [accessToken]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // Check if we already have cached profile
      let profile = userService.getCurrentProfile();
      
      if (!profile) {
        // Fetch from GitHub API
        profile = await userService.fetchUserProfile(accessToken);
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Fallback to username-only display
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    userService.clearCache();
    onLogout();
  };

  const getDisplayName = () => {
    if (userProfile?.name) {
      return userProfile.name;
    }
    return userProfile?.login || username;
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={`${getDisplayName()}'s avatar`}
              className="w-8 h-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-600"
              onError={(e) => {
                // Fallback to initials if avatar fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          {/* Fallback avatar with initials */}
          <div 
            className={`w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
              userProfile?.avatar_url ? 'hidden' : ''
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              getInitials(getDisplayName())
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {isLoading ? (
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-24" />
            ) : (
              <>Welcome back, {getDisplayName().split(' ')[0] || getDisplayName()} 👋</>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            @{userProfile?.login || username}
          </div>
        </div>

        {/* Dropdown indicator */}
        <div className="hidden sm:block text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 z-20">
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={`${getDisplayName()}'s avatar`}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {getInitials(getDisplayName())}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {getDisplayName()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    @{userProfile?.login || username}
                  </div>
                  {userProfile?.email && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {userProfile.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Stats (if available) */}
            {userProfile && (
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{userProfile.public_repos} repos</span>
                  <span>{userProfile.followers} followers</span>
                  <span>{userProfile.following} following</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="py-1">
              <a
                href={`https://github.com/${userProfile?.login || username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User size={16} className="mr-3" />
                View GitHub Profile
              </a>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={16} className="mr-3" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserAvatarHeader;
