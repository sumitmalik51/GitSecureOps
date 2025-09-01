import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Plus, 
  Search, 
  FolderPlus,
  Share,
  Copy,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Clock,
  FileText,
  Bookmark,
  MessageSquare
} from 'lucide-react';
import snippetService, { type CodeSnippet, type SnippetFolder } from '../services/snippetService';

interface SnippetManagerProps {
  userLogin: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface CreateSnippetForm {
  title: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
  category: 'bookmark' | 'shared' | 'template' | 'note';
  is_public: boolean;
}

const SnippetManager: React.FC<SnippetManagerProps> = ({ userLogin, isOpen, onClose }) => {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [folders, setFolders] = useState<SnippetFolder[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my-snippets' | 'shared' | 'public' | 'folders'>('my-snippets');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateSnippetForm>({
    title: '',
    description: '',
    code: '',
    language: 'javascript',
    tags: [],
    category: 'bookmark',
    is_public: false
  });
  const [filters, setFilters] = useState({
    language: '',
    category: '',
    tags: [] as string[]
  });

  // Load initial data
  useEffect(() => {
    if (!userLogin) return;
    loadSnippets();
    loadFolders();
  }, [userLogin, activeTab]);

  const loadSnippets = () => {
    if (!userLogin) return;
    
    switch (activeTab) {
      case 'my-snippets':
        setSnippets(snippetService.getSnippets(userLogin));
        break;
      case 'shared':
        setSnippets(snippetService.getSharedSnippets(userLogin));
        break;
      case 'public':
        // For now, show user's public snippets
        setSnippets(snippetService.getSnippets(userLogin).filter(s => s.is_public));
        break;
      default:
        setSnippets(snippetService.getSnippets(userLogin));
    }
  };

  const loadFolders = () => {
    if (!userLogin) return;
    setFolders(snippetService.getFolders(userLogin));
  };

  // Filter snippets based on search and filters
  const filteredSnippets = snippets.filter(snippet => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        snippet.title.toLowerCase().includes(query) ||
        snippet.description.toLowerCase().includes(query) ||
        snippet.code.toLowerCase().includes(query) ||
        snippet.tags.some(tag => tag.toLowerCase().includes(query));
      if (!matches) return false;
    }

    if (filters.language && snippet.language !== filters.language) return false;
    if (filters.category && snippet.category !== filters.category) return false;
    if (filters.tags.length > 0 && !filters.tags.some(tag => snippet.tags.includes(tag))) return false;

    return true;
  });

  const handleCreateSnippet = () => {
    if (!userLogin || !createForm.title.trim() || !createForm.code.trim()) return;

    const newSnippet = snippetService.createSnippet(userLogin, {
      ...createForm,
      tags: createForm.tags.filter(tag => tag.trim()),
      shared_with: []
    });

    setSnippets(prev => [newSnippet, ...prev]);
    setCreateForm({
      title: '',
      description: '',
      code: '',
      language: 'javascript',
      tags: [],
      category: 'bookmark',
      is_public: false
    });
    setShowCreateForm(false);
  };

  const handleDeleteSnippet = (snippetId: string) => {
    if (!userLogin) return;
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      snippetService.deleteSnippet(userLogin, snippetId);
      setSnippets(prev => prev.filter(s => s.id !== snippetId));
      if (selectedSnippet?.id === snippetId) {
        setSelectedSnippet(null);
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const handleShareSnippet = (snippet: CodeSnippet) => {
    if (!userLogin) return;
    const shareWith = prompt('Enter usernames to share with (comma-separated):');
    if (shareWith) {
      const users = shareWith.split(',').map(u => u.trim()).filter(u => u);
      const share = snippetService.shareSnippet(userLogin, snippet.id, users);
      if (share) {
        // Show share link or success message
        alert(`Snippet shared! Share link: ${share.share_link}`);
      }
    }
  };

  const languages = [
    'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c',
    'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'dart', 'html',
    'css', 'scss', 'sql', 'json', 'yaml', 'xml', 'markdown', 'bash'
  ];

  const categories = [
    { value: 'bookmark', label: 'Bookmark', icon: Bookmark },
    { value: 'shared', label: 'Shared', icon: Share },
    { value: 'template', label: 'Template', icon: FileText },
    { value: 'note', label: 'Note', icon: MessageSquare }
  ];

  // Don't render if not open or no user
  if (!isOpen || !userLogin) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Code2 className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Code Snippets
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Snippet
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="flex h-full max-h-[80vh]">
          {/* Sidebar */}
          <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {/* Tabs */}
            <div className="p-4 space-y-2">
              {[
                { key: 'my-snippets', label: 'My Snippets', icon: Code2 },
                { key: 'shared', label: 'Shared with Me', icon: Share },
                { key: 'public', label: 'Public', icon: Unlock },
                { key: 'folders', label: 'Folders', icon: FolderPlus }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search snippets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>

              {/* Language Filter */}
              <select
                value={filters.language}
                onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">All Languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Folders (when folders tab is active) */}
            {activeTab === 'folders' && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    if (!userLogin) return;
                    const name = prompt('Folder name:');
                    if (name) {
                      const folder = snippetService.createFolder(userLogin, name);
                      setFolders(prev => [...prev, folder]);
                    }
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                  New Folder
                </button>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`flex items-center gap-2 w-full px-3 py-2 mt-1 text-left rounded-lg transition-colors ${
                      selectedFolder === folder.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-lg">{folder.icon}</span>
                    <span className="text-sm">{folder.name}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {folder.snippets.length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex">
            {/* Snippet List */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-3">
                  {filteredSnippets.length} snippets
                </div>
                <div className="space-y-2">
                  {filteredSnippets.map(snippet => (
                    <div
                      key={snippet.id}
                      onClick={() => setSelectedSnippet(snippet)}
                      className={`p-3 rounded-lg cursor-pointer border transition-all ${
                        selectedSnippet?.id === snippet.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {snippet.title}
                        </h3>
                        <div className="flex items-center gap-1 ml-2">
                          {snippet.is_public ? (
                            <Unlock className="h-3 w-3 text-green-500" />
                          ) : (
                            <Lock className="h-3 w-3 text-gray-400" />
                          )}
                          {snippet.shared_with.length > 0 && (
                            <Share className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {snippet.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                            {snippet.language}
                          </span>
                          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                            {snippet.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {new Date(snippet.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {snippet.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {snippet.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-400">
                              #{tag}
                            </span>
                          ))}
                          {snippet.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{snippet.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Snippet Detail */}
            <div className="flex-1 overflow-y-auto">
              {selectedSnippet ? (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedSnippet.title}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {selectedSnippet.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(selectedSnippet.code)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Copy code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleShareSnippet(selectedSnippet)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Share snippet"
                      >
                        <Share className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Implement editing functionality
                          alert('Edit functionality coming soon!');
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Edit snippet"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSnippet(selectedSnippet.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg text-red-600"
                        title="Delete snippet"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Code Display */}
                  <div className="mb-4">
                    <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <code className={`language-${selectedSnippet.language}`}>
                        {selectedSnippet.code}
                      </code>
                    </pre>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Language:</strong> {selectedSnippet.language}
                    </div>
                    <div>
                      <strong>Category:</strong> {selectedSnippet.category}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(selectedSnippet.created_at).toLocaleString()}
                    </div>
                    <div>
                      <strong>Updated:</strong> {new Date(selectedSnippet.updated_at).toLocaleString()}
                    </div>
                    {selectedSnippet.repo_name && (
                      <div className="col-span-2">
                        <strong>Source:</strong> 
                        <a 
                          href={selectedSnippet.repo_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 ml-1"
                        >
                          {selectedSnippet.repo_name}
                        </a>
                        {selectedSnippet.file_path && (
                          <span className="text-gray-500"> - {selectedSnippet.file_path}</span>
                        )}
                      </div>
                    )}
                    {selectedSnippet.tags.length > 0 && (
                      <div className="col-span-2">
                        <strong>Tags:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedSnippet.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Code2 className="h-12 w-12 mx-auto mb-4" />
                    <p>Select a snippet to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Snippet Modal */}
        {showCreateForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Create New Snippet</h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Snippet title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
                
                <textarea
                  placeholder="Description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg h-20"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={createForm.language}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, language: e.target.value }))}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <textarea
                  placeholder="Code"
                  value={createForm.code}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg h-40 font-mono"
                />
                
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={createForm.tags.join(', ')}
                  onChange={(e) => setCreateForm(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                  }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={createForm.is_public}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, is_public: e.target.checked }))}
                  />
                  <label htmlFor="is_public" className="text-sm">Make this snippet public</label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSnippet}
                  disabled={!createForm.title.trim() || !createForm.code.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Snippet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnippetManager;
