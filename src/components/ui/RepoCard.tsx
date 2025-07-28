import { type ReactNode } from 'react';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description?: string;
  html_url: string;
  language?: string;
  stargazers_count?: number;
  forks_count?: number;
  updated_at?: string;
}

interface RepoCardProps {
  repo: Repository;
  index?: number;
  className?: string;
  children?: ReactNode;
  onClick?: (repo: Repository) => void;
  showStats?: boolean;
}

export default function RepoCard({
  repo,
  index = 0,
  className = '',
  children,
  onClick,
  showStats = false
}: RepoCardProps) {
  const handleClick = () => {
    onClick?.(repo);
  };

  return (
    <div 
      className={`group relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-gray-50/60 rounded-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
      <div className="relative bg-white/80 backdrop-blur-sm border border-white/30 rounded-xl p-6 hover:border-blue-200 transition-all duration-300 transform group-hover:scale-[1.01]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold">
              {index + 1}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">{repo.name}</h3>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            repo.private 
              ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700' 
              : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
          }`}>
            {repo.private ? '🔒 Private' : '🌍 Public'}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 font-medium">{repo.full_name}</p>
        
        {repo.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{repo.description}</p>
        )}

        {showStats && (
          <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
            {repo.language && (
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                {repo.language}
              </span>
            )}
            {repo.stargazers_count !== undefined && (
              <span className="flex items-center">
                ⭐ {repo.stargazers_count}
              </span>
            )}
            {repo.forks_count !== undefined && (
              <span className="flex items-center">
                🍴 {repo.forks_count}
              </span>
            )}
          </div>
        )}
        
        {children}
        
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-600 hover:text-white bg-blue-50 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-[1.01]"
          onClick={(e) => e.stopPropagation()} // Prevent parent onClick when clicking link
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View on GitHub
        </a>
      </div>
    </div>
  );
}
