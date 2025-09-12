import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Search, GitBranch, Star, Eye, Bookmark, BookmarkCheck, Maximize2, Minimize2, Code2 } from 'lucide-react';
import environmentService from '../services/environmentService';
import bookmarkService from '../services/bookmarkService';
import snippetService from '../services/snippetService';
import { InlineLoading } from './ui/Loading';

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

interface CodeMatch {
  line_number: number;
  snippet: string;
  match_line_index: number;
  context_start: number;
  context_end: number;
}

interface CodeResult {
  repository: Repository;
  file: {
    name: string;
    path: string;
    url: string;
    git_url: string;
    sha: string;
  };
  matches: CodeMatch[];
  score: number;
}

interface CodeSearchResult {
  success: boolean;
  query: string;
  organization: string | null;
  language: string | null;
  file_type: string | null;
  total_results: number;
  repositories_searched: number;
  results: CodeResult[];
  metadata: {
    search_time: string;
    search_type: string;
    results_count: number;
  };
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
  type: 'user' | 'bot' | 'results' | 'code-results';
  content: string;
  timestamp: Date;
  results?: Repository[];
  codeResults?: CodeResult[];
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
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]); // Support multiple organization selection
  const [isMaximized, setIsMaximized] = useState(false);
  const [searchType, setSearchType] = useState<'repos' | 'code'>('repos');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target as Node)) {
        setIsMaximized(false);
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
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

  // Clear messages when search type changes
  useEffect(() => {
    if (messages.length > 1) { // Keep welcome message if it exists
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: `Switched to ${searchType === 'code' ? 'code' : 'repository'} search. What would you like to find?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [searchType]);

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

    const functionAppUrl = environmentService.getFunctionAppUrl();
    const response = await fetch(`${functionAppUrl}/api/search-repos?${searchParams.toString()}`, {
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

  const searchCode = async (query: string, organizations?: string[], language?: string, fileType?: string, onProgress?: (data: any) => void) => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const functionAppUrl = environmentService.getFunctionAppUrl();
    
    // If progress callback is provided, use streaming mode
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const requestBody = {
          query,
          organizations: organizations || [],
          language: language || '',
          fileType: fileType || '',
          streaming: true
        };

        console.log('Starting streaming search with body:', requestBody);
        console.log('Function app URL:', functionAppUrl);
        
        fetch(`${functionAppUrl}/api/search-code`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify(requestBody)
        }).then(response => {
          console.log('Streaming response received:', response.status, response.statusText);
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));
          console.log('Response body reader available:', !!response.body);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            console.error('ReadableStream not supported');
            throw new Error('ReadableStream not supported');
          }

          console.log('Starting to read stream...');
          const decoder = new TextDecoder();
          let buffer = '';

          const readStream = () => {
            reader.read().then(({ value, done }) => {
              console.log('Stream read:', { done, valueLength: value?.length });
              
              if (done) {
                console.log('Stream ended, final buffer:', buffer);
                resolve(null);
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              // console.log('Received streaming chunk:', buffer.slice(-200)); // Commented out for less noise
              
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.trim()) console.log('Processing line:', line); // Only log non-empty lines
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  console.log('Extracted data:', data.substring(0, 100) + '...'); // Truncated for readability
                  
                  if (data === '[DONE]') {
                    console.log('Streaming complete');
                    resolve(null);
                    return;
                  }

                  try {
                    const eventData = JSON.parse(data);
                    console.log('Received SSE event:', eventData); // Debug log
                    onProgress(eventData);

                    if (eventData.type === 'complete') {
                      resolve(eventData.data);
                      return;
                    } else if (eventData.type === 'error') {
                      reject(new Error(eventData.data.message));
                      return;
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse SSE data:', data);
                  }
                }
              }

              readStream();
            }).catch(reject);
          };

          readStream();
        }).catch(error => {
          console.error('Streaming fetch error:', error);
          reject(error);
        });
      });
    }

    // Non-streaming mode (original functionality)
    const requestBody = {
      query,
      organizations: organizations || [],
      language: language || '',
      fileType: fileType || ''
    };

    const response = await fetch(`${functionAppUrl}/api/search-code`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json() as CodeSearchResult;
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
      if (searchType === 'code') {
        // Create organization display text
        const orgText = selectedOrgs.length > 0 
          ? selectedOrgs.length === 1 
            ? ` in ${selectedOrgs[0]}` 
            : ` in ${selectedOrgs.length} organizations (${selectedOrgs.join(', ')})`
          : '';

        // Add initial bot message
        const botMessageId = (Date.now() + 1).toString();
        const botMessage: ChatMessage = {
          id: botMessageId,
          type: 'bot',
          content: `Searching for "${query}"${orgText}${selectedLanguage ? ` (${selectedLanguage})` : ''}${selectedFileType ? ` (*.${selectedFileType})` : ''}...`,
          timestamp: new Date()
        };

        const streamingMessageId = (Date.now() + 2).toString();
        const streamingMessage: ChatMessage = {
          id: streamingMessageId,
          type: 'code-results',
          content: '',
          timestamp: new Date(),
          codeResults: [],
          metadata: { streaming: true, repositories_searched: 0, total_results: 0 }
        };

        setMessages(prev => [...prev, botMessage, streamingMessage]);

        // Start streaming code search
        const onProgress = (eventData: any) => {
          console.log('SearchChatbot onProgress received:', eventData); // Debug log
          
          if (eventData.type === 'progress') {
            const { totalResults, progress, allResults } = eventData.data;
            console.log('Progress data:', { totalResults, progress, allResults }); // Debug log
            
            // Update the streaming message with new results
            setMessages(prev => prev.map(msg => {
              if (msg.id === streamingMessageId) {
                return {
                  ...msg,
                  codeResults: allResults || [],
                  metadata: {
                    ...msg.metadata,
                    repositories_searched: progress.current,
                    total_repositories: progress.total,
                    total_results: totalResults,
                    progress_percentage: progress.percentage,
                    current_repository: eventData.data.repository
                  }
                };
              }
              return msg;
            }));

            // Update bot message with progress
            setMessages(prev => prev.map(msg => {
              if (msg.id === botMessageId) {
                return {
                  ...msg,
                  content: `Found ${totalResults} code matches for "${query}"${orgText}${selectedLanguage ? ` (${selectedLanguage})` : ''}${selectedFileType ? ` (*.${selectedFileType})` : ''}. Searching... ${progress.current}/${progress.total} repositories (${progress.percentage}%)`
                };
              }
              return msg;
            }));
          } else if (eventData.type === 'complete') {
            // Update with final results
            const finalData = eventData.data;
            setMessages(prev => prev.map(msg => {
              if (msg.id === streamingMessageId) {
                return {
                  ...msg,
                  codeResults: finalData.results || [],
                  metadata: {
                    ...finalData.metadata,
                    repositories_searched: finalData.repositories_searched,
                    total_results: finalData.total_results
                  }
                };
              }
              return msg;
            }));

            // Update final bot message
            setMessages(prev => prev.map(msg => {
              if (msg.id === botMessageId) {
                return {
                  ...msg,
                  content: `Found ${finalData.total_results} code matches for "${query}"${orgText}${selectedLanguage ? ` (${selectedLanguage})` : ''}${selectedFileType ? ` (*.${selectedFileType})` : ''}. Searched ${finalData.repositories_searched} repositories:`
                };
              }
              return msg;
            }));
          }
        };

        await searchCode(query, selectedOrgs, selectedLanguage, selectedFileType, onProgress);
        
        // If streaming didn't work, try non-streaming as fallback
        setTimeout(async () => {
          try {
            console.log('Checking if streaming worked, trying fallback...');
            const fallbackResults = await searchCode(query, selectedOrgs, selectedLanguage, selectedFileType) as any;
            
            if (fallbackResults && fallbackResults.results && fallbackResults.results.length > 0) {
              console.log('Fallback results received:', fallbackResults);
              
              // Remove streaming message and replace with final results
              setMessages(prev => prev.map(msg => {
                if (msg.id === streamingMessageId) {
                  return {
                    ...msg,
                    codeResults: fallbackResults.results,
                    metadata: {
                      repositories_searched: fallbackResults.repositories_searched || 0,
                      total_results: fallbackResults.total_matches || fallbackResults.results.length,
                      streaming: false
                    }
                  };
                } else if (msg.id === botMessageId) {
                  return {
                    ...msg,
                    content: `Found ${fallbackResults.total_matches || fallbackResults.results.length} code matches for "${query}"${orgText}${selectedLanguage ? ` (${selectedLanguage})` : ''}${selectedFileType ? ` (*.${selectedFileType})` : ''}.`
                  };
                }
                return msg;
              }));
            }
          } catch (fallbackError) {
            console.error('Fallback search also failed:', fallbackError);
          }
        }, 5000); // Wait 5 seconds before trying fallback
        
      } else {
        // Repository search (existing functionality) - for now, use first selected org or empty
        const searchOrg = selectedOrgs.length > 0 ? selectedOrgs[0] : '';
        const results = await searchRepositories(query, searchOrg);
        
        // Add bot response with results
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: `Found ${results.total_count} repositories matching "${query}"${searchOrg ? ` in ${searchOrg}` : ''}. Here are the top ${results.results.length} results:`,
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
        setMessages(prev => [...prev, botMessage, resultsMessage]);
      }

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

  const handleSaveCodeSnippet = (
    code: string,
    repository: Repository,
    file: { name: string; path: string; url: string },
    lineStart: number,
    lineEnd: number
  ) => {
    if (!userLogin) return;

    try {
      const snippet = snippetService.createSnippetFromCode(userLogin, code, {
        filename: file.name,
        language: repository.language?.toLowerCase() || 'text',
        repo_name: repository.full_name,
        repo_url: repository.html_url,
        file_path: file.path,
        line_start: lineStart,
        line_end: lineEnd,
        commit_sha: undefined, // We could add this if available
        branch: 'main' // Default branch assumption
      });

      // Show success feedback (you could replace this with a toast notification)
      alert(`Code snippet saved as "${snippet.title}"`);
      
      // Optional: Add a message to the chat
      const snippetMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: `📝 Saved code snippet "${snippet.title}" from ${repository.full_name}/${file.path}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, snippetMessage]);

    } catch (error) {
      console.error('Error saving snippet:', error);
      alert('Failed to save code snippet. Please try again.');
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
        <div key={`results-${message.id}`} className="space-y-3">
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
                  {/* Bookmark Button */}
                  <button
                    onClick={() => {
                      if (!userLogin) return;
                      
                      const isCurrentlyBookmarked = bookmarkService.isBookmarked(userLogin, repo.id);
                      if (isCurrentlyBookmarked) {
                        bookmarkService.removeBookmark(userLogin, repo.id);
                      } else {
                        bookmarkService.addBookmark(userLogin, repo);
                      }
                    }}
                    className={`p-1 rounded transition-colors ${
                      userLogin && bookmarkService.isBookmarked(userLogin, repo.id)
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-400 hover:text-yellow-500'
                    }`}
                    title={userLogin && bookmarkService.isBookmarked(userLogin, repo.id) ? 'Remove bookmark' : 'Bookmark repository'}
                  >
                    {userLogin && bookmarkService.isBookmarked(userLogin, repo.id) ? (
                      <BookmarkCheck size={16} />
                    ) : (
                      <Bookmark size={16} />
                    )}
                  </button>
                  
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

    if (message.type === 'code-results' && message.codeResults) {
      return (
        <div key={`code-results-${message.id}`} className="space-y-4">
          {message.codeResults.map((codeResult, index) => (
            <div
              key={`${codeResult.repository.id}-${index}`}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
            >
              {/* Repository Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-sm">
                    <a href={codeResult.repository.html_url} target="_blank" rel="noopener noreferrer">
                      {codeResult.repository.full_name}
                    </a>
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Code2 size={12} />
                    <a
                      href={codeResult.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {codeResult.file.path}
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  {codeResult.repository.language && (
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {codeResult.repository.language}
                    </span>
                  )}
                  {codeResult.repository.private && (
                    <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                      <Eye size={12} className="inline mr-1" />
                      Private
                    </span>
                  )}
                </div>
              </div>

              {/* Code Matches */}
              <div className="space-y-3">
                {codeResult.matches.slice(0, 3).map((match, matchIndex) => (
                  <div key={matchIndex} className="bg-white dark:bg-gray-900 rounded border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Lines {match.context_start}-{match.context_end}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveCodeSnippet(
                            match.snippet,
                            codeResult.repository,
                            codeResult.file,
                            match.context_start,
                            match.context_end
                          )}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center gap-1 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900"
                          title="Save as snippet"
                        >
                          <Code2 size={12} />
                          Save
                        </button>
                        <span className="text-xs font-mono text-gray-400">
                          Line {match.line_number}
                        </span>
                      </div>
                    </div>
                    <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto bg-gray-50 dark:bg-gray-800 p-2 rounded text-gray-800 dark:text-gray-200">
                      {match.snippet}
                    </pre>
                  </div>
                ))}
                {codeResult.matches.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{codeResult.matches.length - 3} more matches in this file
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        key={`message-${message.id}`}
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
    <div className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex ${isMaximized ? 'items-center justify-center' : 'items-end justify-start'} p-4`}>
      <div 
        ref={chatbotRef}
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${
          isMaximized 
            ? 'w-[95vw] h-[95vh] max-w-none' 
            : 'w-full max-w-md h-[600px]'
        } transition-all duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Search className="text-blue-600 dark:text-blue-400" size={20} />
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              {searchType === 'code' ? 'Code Search' : 'Repository Search'}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={() => {
                setMessages([]);
                setIsMaximized(false);
                onClose();
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search Type Selector */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex space-x-2">
            <button
              onClick={() => setSearchType('repos')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                searchType === 'repos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
              }`}
            >
              <Search size={14} className="inline mr-1" />
              Repositories
            </button>
            <button
              onClick={() => setSearchType('code')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                searchType === 'code'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
              }`}
            >
              <Code2 size={14} className="inline mr-1" />
              Code
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {/* Organization Filter */}
          {organizations.length > 0 && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organizations ({selectedOrgs.length > 0 ? selectedOrgs.length : 'All'})
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                {organizations.map((org) => (
                  <label key={org} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrgs([...selectedOrgs, org]);
                        } else {
                          setSelectedOrgs(selectedOrgs.filter(o => o !== org));
                        }
                      }}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200">{org}</span>
                  </label>
                ))}
              </div>
              {selectedOrgs.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setSelectedOrgs([])}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Code Search Filters */}
          {searchType === 'code' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any language</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="C#">C#</option>
                  <option value="Go">Go</option>
                  <option value="Rust">Rust</option>
                  <option value="PHP">PHP</option>
                  <option value="Ruby">Ruby</option>
                  <option value="Swift">Swift</option>
                  <option value="Kotlin">Kotlin</option>
                  <option value="C++">C++</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any file type</option>
                  <option value="js">*.js</option>
                  <option value="ts">*.ts</option>
                  <option value="tsx">*.tsx</option>
                  <option value="jsx">*.jsx</option>
                  <option value="py">*.py</option>
                  <option value="java">*.java</option>
                  <option value="cs">*.cs</option>
                  <option value="go">*.go</option>
                  <option value="rs">*.rs</option>
                  <option value="php">*.php</option>
                  <option value="rb">*.rb</option>
                  <option value="swift">*.swift</option>
                  <option value="kt">*.kt</option>
                  <option value="cpp">*.cpp</option>
                  <option value="c">*.c</option>
                  <option value="md">*.md</option>
                  <option value="json">*.json</option>
                  <option value="yaml">*.yaml</option>
                  <option value="yml">*.yml</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(renderMessage)}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                <InlineLoading message="Searching..." />
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
              placeholder={
                accessToken 
                  ? (searchType === 'code' ? "Search code..." : "Search repositories...") 
                  : "Please sign in to search"
              }
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
