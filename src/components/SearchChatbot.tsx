import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Search, MessageSquare, GitBranch, Star, Eye } from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
    type: string;
  };
  topics: string[];
  private: boolean;
  visibility: string;
}

interface SearchResult {
  success: boolean;
  query: string;
  organization: string | null;
  total_count: number;
  results: Repository[];
  metadata: {
    search_time: string;
    api_rate_limit: string;
    results_count: number;
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'results';
  content: string;
  timestamp: Date;
  results?: Repository[];
  metadata?: any;
}

interface SearchChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  userLogin: string | null;
  organizations: string[];
}

const SearchChatbot: React.FC<SearchChatbotProps> = ({
  isOpen,
  onClose,
  accessToken,
  userLogin,
  organizations
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: `Hi ${userLogin}! I can help you search through your GitHub repositories. Just type what you're looking for, and I'll find relevant repositories for you.`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, userLogin, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const searchRepositories = async (query: string, organization?: string) => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    if (organization) {
      searchParams.append('org', organization);
    }

    const response = await fetch(`/api/search-repos?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json() as SearchResult;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading || !accessToken) {
      return;
    }

    const query = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const results = await searchRepositories(query, selectedOrg);
      
      // Add bot response with results
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `Found ${results.total_count} repositories matching "${query}"${selectedOrg ? ` in ${selectedOrg}` : ''}. Here are the top ${results.results.length} results:`,
        timestamp: new Date()
      };

      const resultsMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'results',
        content: '',
        timestamp: new Date(),
        results: results.results,
        metadata: results.metadata
      };

      setMessages(prev => [...prev, botMessage, resultsMessage]);

    } catch (error) {
      console.error('Search error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `Sorry, I encountered an error while searching: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'results' && message.results) {
      return (
        <div key={message.id} className="space-y-3">
          {message.results.map((repo) => (
            <div
              key={repo.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                      {repo.full_name}
                    </a>
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {repo.description || 'No description available'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 ml-4">
                  {repo.private && (
                    <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                      <Eye size={12} className="inline mr-1" />
                      Private
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  {repo.language && (
                    <span className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Star size={14} className="mr-1" />
                    {repo.stargazers_count.toLocaleString()}
                  </span>
                  <span className="flex items-center">
                    <GitBranch size={14} className="mr-1" />
                    {repo.forks_count.toLocaleString()}
                  </span>
                </div>
                <span>Updated {formatTimeAgo(repo.updated_at)}</span>
              </div>
              
              {repo.topics && repo.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {repo.topics.slice(0, 5).map((topic) => (
                    <span
                      key={topic}
                      className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                  {repo.topics.length > 5 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                      +{repo.topics.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[80%] px-4 py-2 rounded-lg ${
            message.type === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          <p className={`text-xs mt-1 ${
            message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageSquare className="text-blue-600 dark:text-blue-400" size={20} />
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Repository Search
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Organization Filter */}
        {organizations.length > 0 && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All repositories</option>
              {organizations.map((org) => (
                <option key={org} value={org}>
                  {org} organization
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(renderMessage)}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Search className="animate-spin" size={16} />
                  <span className="text-gray-600 dark:text-gray-400">Searching...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={accessToken ? "Search repositories..." : "Please sign in to search"}
              disabled={isLoading || !accessToken}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isLoading || !accessToken || !inputValue.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center space-x-1"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchChatbot;
