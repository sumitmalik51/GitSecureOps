import { useState } from 'react';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showPrivateOnly: boolean;
  onPrivateOnlyChange: (show: boolean) => void;
  showPublicOnly: boolean;
  onPublicOnlyChange: (show: boolean) => void;
  sortBy: 'name' | 'updated' | 'stars' | 'forks';
  onSortChange: (sort: 'name' | 'updated' | 'stars' | 'forks') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  languages?: string[];
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  totalCount: number;
  filteredCount: number;
}

export function SearchFilters({
  searchTerm,
  onSearchChange,
  showPrivateOnly,
  onPrivateOnlyChange,
  showPublicOnly,
  onPublicOnlyChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  languages = [],
  selectedLanguage,
  onLanguageChange,
  totalCount,
  filteredCount
}: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const clearSearch = () => {
    onSearchChange('');
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onPrivateOnlyChange(false);
    onPublicOnlyChange(false);
    onLanguageChange('');
  };

  const hasActiveFilters = searchTerm || showPrivateOnly || showPublicOnly || selectedLanguage;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      {/* Search Input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search repositories by name..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Filter Toggle and Results Count */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              showFilters 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 bg-blue-500 text-white rounded-full w-2 h-2"></span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredCount === totalCount ? (
            <span>{totalCount} repositories</span>
          ) : (
            <span>{filteredCount} of {totalCount} repositories</span>
          )}
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
          {/* Repository Type Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repository Type
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showPrivateOnly}
                  onChange={(e) => onPrivateOnlyChange(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Private only</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showPublicOnly}
                  onChange={(e) => onPublicOnlyChange(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Public only</span>
              </label>
            </div>
          </div>

          {/* Language Filter */}
          {languages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All languages</option>
                {languages.map(language => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort by
            </label>
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as 'name' | 'updated' | 'stars' | 'forks')}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Name</option>
                <option value="updated">Last updated</option>
                <option value="stars">Stars</option>
                <option value="forks">Forks</option>
              </select>
              
              <button
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchFilters;
