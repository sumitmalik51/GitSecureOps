import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, FileText, GitBranch, ExternalLink, Clock, Code2, MessageSquare, GitCommit, User, Package } from 'lucide-react';
import environmentService from '../services/environmentService';
import githubDataService, { type GitHubDataItem } from '../services/githubDataService';

interface CommandPaletteItem extends GitHubDataItem {
  lastAccessed?: Date;
  icon?: React.ReactNode;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  organizations: string[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  accessToken,
  organizations
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommandPaletteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<CommandPaletteItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent items from localStorage
  useEffect(() => {
    const savedRecentItems = localStorage.getItem('commandPalette_recentItems');
    if (savedRecentItems) {
      try {
        const parsed = JSON.parse(savedRecentItems);
        setRecentItems(parsed.map((item: any) => ({
          ...item,
          lastAccessed: new Date(item.lastAccessed)
        })));
      } catch (error) {
        console.warn('Failed to parse recent items:', error);
      }
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleItemSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Fuzzy search function
  const fuzzyMatch = (text: string, query: string): { score: number; matches: number[] } => {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (textLower.includes(queryLower)) {
      const index = textLower.indexOf(queryLower);
      return { 
        score: 100 - index, 
        matches: Array.from({ length: queryLower.length }, (_, i) => index + i)
      };
    }

    let score = 0;
    let textIndex = 0;
    const matches: number[] = [];

    for (let i = 0; i < queryLower.length; i++) {
      const char = queryLower[i];
      const foundIndex = textLower.indexOf(char, textIndex);
      
      if (foundIndex === -1) {
        return { score: 0, matches: [] };
      }
      
      matches.push(foundIndex);
      score += foundIndex === textIndex ? 10 : 1;
      textIndex = foundIndex + 1;
    }

    return { score: score + queryLower.length, matches };
  };

  // Search across repos, files, and PRs
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || !accessToken) {
      setResults(query.trim() ? [] : recentItems);
      return;
    }

    setIsLoading(true);
    const searchResults: CommandPaletteItem[] = [];

    try {
      const functionAppUrl = environmentService.getFunctionAppUrl();

      // Search repositories across all organizations
      const promises = organizations.map(async (org) => {
        try {
          // Search repositories
          const repoResponse = await fetch(`${functionAppUrl}/api/search-repos`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: searchQuery,
              organization: org
            })
          });

          if (repoResponse.ok) {
            const repoData = await repoResponse.json();
            
            // Process repository results with fuzzy matching
            for (const repo of repoData.results || []) {
              const titleMatch = fuzzyMatch(repo.name, searchQuery);
              const descMatch = fuzzyMatch(repo.description || '', searchQuery);
              const score = Math.max(titleMatch.score, descMatch.score);

              if (score > 0) {
                searchResults.push({
                  id: `repo-${repo.id}`,
                  type: 'repo',
                  title: repo.name,
                  subtitle: `${org} • ${repo.description?.slice(0, 60)}${repo.description?.length > 60 ? '...' : ''}`,
                  url: repo.html_url,
                  organization: org,
                  language: repo.language,
                  description: repo.description,
                  icon: <GitBranch size={16} className="text-blue-500" />
                });
              }
            }
          }

          // Search code files
          const codeResponse = await fetch(`${functionAppUrl}/api/search-code`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: searchQuery,
              organizations: [org]
            })
          });

          if (codeResponse.ok) {
            const codeData = await codeResponse.json();
            
            // Process code results with fuzzy matching
            for (const codeResult of codeData.results || []) {
              const fileMatch = fuzzyMatch(codeResult.file.name, searchQuery);
              const pathMatch = fuzzyMatch(codeResult.file.path, searchQuery);
              const score = Math.max(fileMatch.score, pathMatch.score);

              if (score > 0) {
                searchResults.push({
                  id: `file-${codeResult.file.sha}`,
                  type: 'file',
                  title: codeResult.file.name,
                  subtitle: `${codeResult.repository.name} • ${codeResult.file.path}`,
                  url: codeResult.file.url,
                  organization: org,
                  language: codeResult.repository.language,
                  description: `${codeResult.matches.length} matches`,
                  icon: <FileText size={16} className="text-green-500" />
                });
              }
            }
          }
        } catch (error) {
          console.warn(`Search failed for org ${org}:`, error);
        }
      });

      await Promise.all(promises);

      // Sort results by relevance and type
      searchResults.sort((a, b) => {
        const aScore = fuzzyMatch(a.title, searchQuery).score;
        const bScore = fuzzyMatch(b.title, searchQuery).score;
        
        if (aScore !== bScore) return bScore - aScore;
        
        // Prioritize repos over files
        if (a.type !== b.type) {
          return a.type === 'repo' ? -1 : 1;
        }
        
        return a.title.localeCompare(b.title);
      });

      setResults(searchResults.slice(0, 50)); // Limit to top 50 results

    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, accessToken, organizations]);

  // Handle item selection
  const handleItemSelect = (item: CommandPaletteItem) => {
    // Add to recent items
    const updatedRecent = [
      { ...item, lastAccessed: new Date(), type: 'recent' as const },
      ...recentItems.filter(r => r.id !== item.id)
    ].slice(0, 10); // Keep only last 10 items

    setRecentItems(updatedRecent);
    localStorage.setItem('commandPalette_recentItems', JSON.stringify(updatedRecent));

    // Open the URL
    window.open(item.url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  // Clear recent items
  const clearRecentItems = () => {
    setRecentItems([]);
    localStorage.removeItem('commandPalette_recentItems');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-[10vh] z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 flex-1">
            <Command size={18} className="text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to repository, file, or code..."
              className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
            />
            {isLoading && (
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
            <span>navigate</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
            <span>select</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">esc</kbd>
            <span>close</span>
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {results.length === 0 && !isLoading && !query.trim() && recentItems.length > 0 && (
            <>
              <div className="flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-700">
                <span>Recent</span>
                <button
                  onClick={clearRecentItems}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear
                </button>
              </div>
              {recentItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => handleItemSelect(item)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <Clock size={16} className="text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                      <div className="text-sm text-gray-500">{item.subtitle}</div>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-gray-400" />
                </div>
              ))}
            </>
          )}

          {results.length === 0 && !isLoading && query.trim() && (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search size={24} className="mx-auto mb-2 text-gray-400" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try searching for repository names, file names, or code content</p>
            </div>
          )}

          {results.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
              onClick={() => handleItemSelect(item)}
            >
              <div className="flex items-center space-x-3 flex-1">
                {item.icon}
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                  <div className="text-sm text-gray-500">{item.subtitle}</div>
                </div>
                {item.language && (
                  <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded-full text-gray-700 dark:text-gray-300">
                    {item.language}
                  </span>
                )}
              </div>
              <ExternalLink size={14} className="text-gray-400" />
            </div>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 bg-gray-50 dark:bg-gray-700">
            {results.length} result{results.length !== 1 ? 's' : ''} • 
            <span className="ml-1">
              Press <kbd className="px-1 bg-gray-200 dark:bg-gray-600 rounded">Ctrl+K</kbd> to open command palette
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandPalette;
