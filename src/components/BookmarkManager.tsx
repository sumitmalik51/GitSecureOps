import React, { useState, useEffect, useRef } from 'react';
import { 
  BookmarkCheck, 
  Folder, 
  FolderOpen, 
  Plus, 
  Star, 
  GitBranch, 
  ExternalLink,
  Tag,
  Calendar
} from 'lucide-react';
import bookmarkService, { type BookmarkedRepo, type BookmarkFolder } from '../services/bookmarkService';

interface BookmarkManagerProps {
  userLogin: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const BookmarkManager: React.FC<BookmarkManagerProps> = ({ userLogin, isOpen, onClose }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkedRepo[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [view, setView] = useState<'all' | 'folders'>('all');
  const modalRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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

  useEffect(() => {
    if (userLogin) {
      loadBookmarks();
    }
  }, [userLogin, isOpen]);

  const loadBookmarks = () => {
    if (!userLogin) return;
    
    const userBookmarks = bookmarkService.getBookmarks(userLogin);
    const userFolders = bookmarkService.getFolders(userLogin);
    
    setBookmarks(userBookmarks);
    setFolders(userFolders);
  };

  const createFolder = () => {
    if (!userLogin || !newFolderName.trim()) return;

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    bookmarkService.createFolder(userLogin, newFolderName.trim(), randomColor);
    setNewFolderName('');
    setIsCreatingFolder(false);
    loadBookmarks();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const displayedBookmarks = selectedFolder 
    ? bookmarkService.getBookmarksByFolder(userLogin!, selectedFolder)
    : bookmarks;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl h-[80vh] flex flex-col"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <BookmarkCheck className="text-blue-600 dark:text-blue-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Repository Bookmarks
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {bookmarks.length} bookmarked repositories
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setView('all')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  view === 'all' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                All Bookmarks
              </button>
              <button
                onClick={() => setView('folders')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  view === 'folders' 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Folders ({folders.length})
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar - Folders */}
          {view === 'folders' && (
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Folders</h3>
                <button
                  onClick={() => setIsCreatingFolder(true)}
                  className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  <Plus size={16} />
                </button>
              </div>

              {isCreatingFolder && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                    onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={createFolder}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {setIsCreatingFolder(false); setNewFolderName('');}}
                      className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`flex items-center space-x-2 w-full p-2 rounded-lg text-left transition-colors ${
                    selectedFolder === null 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FolderOpen size={16} />
                  <span className="text-sm">All Bookmarks</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({bookmarks.length})</span>
                </button>

                {folders.map((folder) => {
                  const folderBookmarks = bookmarkService.getBookmarksByFolder(userLogin!, folder.id);
                  return (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`flex items-center space-x-2 w-full p-2 rounded-lg text-left transition-colors ${
                        selectedFolder === folder.id 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }}></div>
                      <Folder size={16} />
                      <span className="text-sm flex-1">{folder.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({folderBookmarks.length})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {displayedBookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <BookmarkCheck size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No bookmarked repositories</p>
                <p className="text-sm">Start bookmarking repositories to see them here</p>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayedBookmarks.map((repo) => (
                  <div
                    key={repo.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                          <a 
                            href={repo.html_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1"
                          >
                            <span>{repo.full_name}</span>
                            <ExternalLink size={14} />
                          </a>
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {repo.description}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          bookmarkService.removeBookmark(userLogin!, repo.id);
                          loadBookmarks();
                        }}
                        className="text-yellow-500 hover:text-gray-400 dark:hover:text-gray-500 p-1"
                        title="Remove bookmark"
                      >
                        <BookmarkCheck size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
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
                      
                      <div className="flex items-center space-x-1 text-xs">
                        <Calendar size={12} />
                        <span>Bookmarked {formatTimeAgo(repo.bookmarked_at)}</span>
                      </div>
                    </div>
                    
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {repo.topics.slice(0, 4).map((topic) => (
                          <span
                            key={topic}
                            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full flex items-center"
                          >
                            <Tag size={10} className="mr-1" />
                            {topic}
                          </span>
                        ))}
                        {repo.topics.length > 4 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                            +{repo.topics.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarkManager;
