import { type ReactNode } from 'react';

export interface User {
  login: string;
  avatar_url: string;
  html_url?: string;
  name?: string;
  id: number;
}

interface UserRowProps {
  user: User;
  selected?: boolean;
  onToggle?: (user: User) => void;
  repositories?: string[];
  className?: string;
  children?: ReactNode;
  showCheckbox?: boolean;
}

export default function UserRow({
  user,
  selected = false,
  onToggle,
  repositories = [],
  className = '',
  children,
  showCheckbox = true
}: UserRowProps) {
  const handleToggle = () => {
    onToggle?.(user);
  };

  return (
    <div className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200 ${className}`}>
      <div className="flex items-center space-x-3">
        {showCheckbox && onToggle && (
          <input
            type="checkbox"
            checked={selected}
            onChange={handleToggle}
            className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
          />
        )}
        
        <img
          src={user.avatar_url}
          alt={user.login}
          className="h-10 w-10 rounded-full ring-2 ring-white shadow-sm"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || user.login}
            </p>
            {user.name && user.name !== user.login && (
              <span className="text-xs text-gray-500">(@{user.login})</span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {repositories.length > 0 
              ? `Access to ${repositories.length} repo${repositories.length !== 1 ? 's' : ''}`
              : 'GitHub User'
            }
          </p>
        </div>

        {user.html_url && (
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
            title="View GitHub Profile"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
      
      {repositories.length > 0 && (
        <div className="mt-3 pl-8">
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-600 mb-2">Repository Access:</p>
            {repositories.slice(0, 3).map(repo => (
              <div key={repo} className="flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                <span>{repo}</span>
              </div>
            ))}
            {repositories.length > 3 && (
              <div className="flex items-center text-blue-600">
                <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
                <span>... and {repositories.length - 3} more</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}
