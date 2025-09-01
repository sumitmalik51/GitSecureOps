import React, { useState, useEffect, useRef } from 'react';
import { 
  Command, 
  FileText, 
  GitBranch, 
  Code2, 
  MessageSquare, 
  GitCommit, 
  User, 
  Package,
  Hash,
  Filter,
  X
} from 'lucide-react';
import githubDataService, { type GitHubDataItem } from '../services/githubDataService';

interface EnhancedCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  organizations: string[];
}

interface RecentItem extends GitHubDataItem {
  lastAccessed: Date;
}

interface SearchFilters {
  types: string[];
  organizations: string[];
  language?: string;
  author?: string;
  state?: string;
}

const EnhancedCommandPalette: React.FC<EnhancedCommandPaletteProps> = ({
  isOpen,
  onClose,
  accessToken,
  organizations
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GitHubDataItem[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    types: ['repo', 'code', 'pr', 'issue'],
    organizations: []
  });
  const [searchMode, setSearchMode] = useState<'unified' | 'faceted'>('unified');
  const [facetedResults, setFacetedResults] = useState<{
    repositories: GitHubDataItem[];
    code: GitHubDataItem[];
    pullRequests: GitHubDataItem[];
    issues: GitHubDataItem[];
    commits: GitHubDataItem[];
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentSearchRef = useRef<{ cancel: () => void } | null>(null);

  // Load recent items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('universalSearch_recentItems');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validItems = parsed.map((item: any) => ({
          ...item,
          lastAccessed: new Date(item.lastAccessed)
        })).filter((item: any) => item.id && item.title); // Filter out invalid items
        
        setRecentItems(validItems);
      } catch (error) {
        console.warn('Failed to parse recent items:', error);
        // Clear corrupted localStorage data
        localStorage.removeItem('universalSearch_recentItems');
      }
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      // Cancel any ongoing search
      if (currentSearchRef.current) {
        currentSearchRef.current.cancel();
        currentSearchRef.current = null;
      }
      
      // Clear any pending timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      
      // Reset all state
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setIsLoading(false);
      setShowFilters(false);
      setFacetedResults(null);
    } else {
      // When opened, show recent items only if query is empty
      if (!query.trim()) {
        setResults(recentItems.slice(0, 8));
      }
    }
  }, [isOpen]);

  // Debounced search - only run when modal is open
  useEffect(() => {
    // Don't run if modal is closed
    if (!isOpen) return;
    
    // Cancel any previous search
    if (currentSearchRef.current) {
      currentSearchRef.current.cancel();
      currentSearchRef.current = null;
    }
    
    // Clear any pending timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // Don't run if no access token
    if (!accessToken) {
      setResults([]);
      return;
    }

    // If query is empty, show recent items
    if (!query.trim()) {
      setResults(recentItems.slice(0, 8));
      return;
    }

    // Debounced search for non-empty queries
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [query, filters, accessToken, isOpen]); // Removed recentItems from dependencies

  const performSearch = async (searchQuery: string) => {
    // Guard against invalid search conditions
    if (!accessToken || !searchQuery.trim() || !isOpen) {
      return;
    }

    setIsLoading(true);
    setSelectedIndex(0);

    // Create a cancellation mechanism
    let isCancelled = false;
    const searchCancellation = {
      cancel: () => {
        isCancelled = true;
        setIsLoading(false);
      }
    };
    
    // Store the current search for potential cancellation
    currentSearchRef.current = searchCancellation;

    try {
      const searchOptions = {
        mode: 'search' as const,
        query: searchQuery,
        organizations: filters.organizations.length > 0 ? filters.organizations : organizations,
        types: filters.types as any[],
        language: filters.language,
        author: filters.author,
        state: filters.state,
        limit: 50,
        sort: 'best-match' as const,
        accessToken: accessToken!
      };

      if (searchMode === 'faceted') {
        // Get faceted results for detailed view
        const faceted = await githubDataService.getFacetedSearch(
          searchQuery,
          searchOptions.organizations,
          accessToken!
        );
        
        // Check if search was cancelled
        if (isCancelled) return;
        
        setFacetedResults(faceted);
        
        // Also set unified results for keyboard navigation
        const allResults = [
          ...faceted.repositories.slice(0, 3),
          ...faceted.code.slice(0, 3),
          ...faceted.pullRequests.slice(0, 3),
          ...faceted.issues.slice(0, 3),
          ...faceted.commits.slice(0, 2)
        ];
        
        // Check if search was cancelled before updating results
        if (!isCancelled) {
          setResults(allResults);
        }
      } else {
        // Unified search with streaming
        setResults([]); // Clear previous results
        setFacetedResults(null);
        
        const result = await githubDataService.getData(
          searchOptions,
          (progressResult) => {
            // Check if search was cancelled before updating progress
            if (isCancelled) return;
            
            // Update results progressively in real-time
            // The progress callback receives the complete set of results so far, not incremental
            if (progressResult.items && progressResult.items.length > 0) {
              setResults(progressResult.items); // Replace results, don't merge
            }
          }
        );
        
        // Check if search was cancelled before final update
        if (!isCancelled && result.items) {
          setResults(result.items);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      if (!isCancelled) {
        setResults([]);
      }
    } finally {
      // Only set loading false if not cancelled (cancellation already sets it to false)
      if (!isCancelled) {
        setIsLoading(false);
      }
      
      // Clear the current search reference
      if (currentSearchRef.current === searchCancellation) {
        currentSearchRef.current = null;
      }
    }
  };

  const handleItemSelect = (item: GitHubDataItem) => {
    // Add to recent items
    const recentItem: RecentItem = {
      ...item,
      lastAccessed: new Date()
    };

    const updatedRecent = [
      recentItem,
      ...recentItems.filter(r => r.id !== item.id)
    ].slice(0, 20);

    setRecentItems(updatedRecent);
    localStorage.setItem('universalSearch_recentItems', JSON.stringify(updatedRecent));

    // Open the item
    window.open(item.url, '_blank');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleItemSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setSearchMode(prev => prev === 'unified' ? 'faceted' : 'unified');
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'repo': return <Package size={16} className="text-blue-500" />;
      case 'code': return <Code2 size={16} className="text-green-500" />;
      case 'file': return <FileText size={16} className="text-gray-500" />;
      case 'pr': return <GitBranch size={16} className="text-purple-500" />;
      case 'issue': return <MessageSquare size={16} className="text-red-500" />;
      case 'commit': return <GitCommit size={16} className="text-yellow-500" />;
      case 'user': return <User size={16} className="text-indigo-500" />;
      default: return <Hash size={16} className="text-gray-400" />;
    }
  };

  const getStateColor = (state?: string) => {
    switch (state) {
      case 'open': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-red-600 bg-red-100';
      case 'merged': return 'text-purple-600 bg-purple-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderUnifiedResults = () => (
    <div className="max-h-96 overflow-y-auto">
      {results.length === 0 && !isLoading && query && (
        <div className="p-4 text-center text-gray-500">
          No results found for "{query}"
        </div>
      )}
      
      {results.length === 0 && !query && (
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Recent</h3>
          <div className="text-sm text-gray-500">Start typing to search across all your organizations...</div>
        </div>
      )}

      {results.map((item, index) => (
        <div
          key={item.id}
          onClick={() => handleItemSelect(item)}
          className={`p-3 cursor-pointer border-l-4 ${
            index === selectedIndex
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent'
          }`}
        >
          <div className="flex items-start gap-3">
            {getItemIcon(item.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white truncate">
                  {item.title}
                </span>
                {item.state && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${getStateColor(item.state)}`}>
                    {item.state}
                  </span>
                )}
              </div>
              
              {item.subtitle && (
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {item.subtitle}
                </div>
              )}
              
              {item.description && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-1">
                  {item.description}
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <span>{item.organization}</span>
                {item.repository && <span>• {item.repository}</span>}
                {item.language && <span>• {item.language}</span>}
                {item.author && <span>• by {item.author}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderFacetedResults = () => {
    if (!facetedResults) return renderUnifiedResults();

    const sections = [
      { key: 'repositories', title: 'Repositories', items: facetedResults.repositories },
      { key: 'code', title: 'Code', items: facetedResults.code },
      { key: 'pullRequests', title: 'Pull Requests', items: facetedResults.pullRequests },
      { key: 'issues', title: 'Issues', items: facetedResults.issues },
      { key: 'commits', title: 'Commits', items: facetedResults.commits }
    ];

    return (
      <div className="max-h-96 overflow-y-auto">
        {sections.map(section => (
          section.items.length > 0 && (
            <div key={section.key} className="mb-4">
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700">
                {section.title} ({section.items.length})
              </h3>
              {section.items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-start gap-3">
                    {getItemIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        {item.state && (
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${getStateColor(item.state)}`}>
                            {item.state}
                          </span>
                        )}
                      </div>
                      
                      {item.subtitle && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {item.subtitle}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{item.organization}</span>
                        {item.repository && <span>• {item.repository}</span>}
                        {item.language && <span>• {item.language}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {section.items.length > 4 && (
                <div className="px-3 py-2 text-xs text-gray-500 text-center">
                  +{section.items.length - 4} more {section.title.toLowerCase()}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[70vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Command size={20} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search repos, code, PRs, issues, commits..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-lg outline-none text-gray-900 dark:text-white placeholder-gray-500"
          />
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchMode(prev => prev === 'unified' ? 'faceted' : 'unified')}
              className={`px-2 py-1 text-xs rounded border ${
                searchMode === 'faceted'
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
              title="Toggle view mode (Tab)"
            >
              {searchMode === 'faceted' ? 'Grouped' : 'Unified'}
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Toggle filters"
            >
              <Filter size={16} className="text-gray-400" />
            </button>
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Content Types:</label>
                <div className="flex flex-wrap gap-2">
                  {['repo', 'code', 'pr', 'issue', 'commit'].map(type => (
                    <label key={type} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, types: [...prev.types, type] }));
                          } else {
                            setFilters(prev => ({ ...prev, types: prev.types.filter(t => t !== type) }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Organizations:</label>
                <select
                  multiple
                  value={filters.organizations}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFilters(prev => ({ ...prev, organizations: selected }));
                  }}
                  className="w-full p-1 border rounded text-sm max-h-20"
                >
                  {organizations.map(org => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="p-4 text-center text-gray-500">
            <div className="inline-block animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-2">Searching...</span>
          </div>
        )}

        {/* Results */}
        <div ref={resultsRef} className="overflow-hidden">
          {searchMode === 'faceted' ? renderFacetedResults() : renderUnifiedResults()}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500">
          <div className="flex justify-between">
            <div>
              {results.length > 0 && `${results.length} results`}
              {query && ` for "${query}"`}
            </div>
            <div className="flex gap-4">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd> navigate
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">↵</kbd> open
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Tab</kbd> toggle view
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> close
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCommandPalette;
