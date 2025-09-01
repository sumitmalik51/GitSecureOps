// Code snippet service for saving and sharing code snippets
// Handles storing, retrieving, and sharing code snippets with metadata

export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  filename?: string;
  repo_name?: string;
  repo_url?: string;
  file_path?: string;
  line_start?: number;
  line_end?: number;
  author: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  is_public: boolean;
  shared_with: string[]; // List of usernames
  category: 'bookmark' | 'shared' | 'template' | 'note';
  metadata?: {
    commit_sha?: string;
    branch?: string;
    pr_number?: number;
    context?: string;
  };
}

export interface SnippetFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
  snippets: string[];
  created_at: string;
  description?: string;
}

export interface SnippetShare {
  id: string;
  snippet_id: string;
  shared_by: string;
  shared_with: string[];
  shared_at: string;
  expires_at?: string;
  access_level: 'view' | 'edit' | 'comment';
  share_link?: string;
}

class SnippetService {
  private readonly SNIPPETS_KEY = 'gitsecureops_snippets';
  private readonly FOLDERS_KEY = 'gitsecureops_snippet_folders';
  private readonly SHARES_KEY = 'gitsecureops_snippet_shares';
  private readonly PUBLIC_SNIPPETS_KEY = 'gitsecureops_public_snippets';

  // Generate unique ID for snippets
  private generateId(): string {
    return `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get all snippets for current user
  getSnippets(userLogin: string): CodeSnippet[] {
    try {
      const snippetsData = localStorage.getItem(`${this.SNIPPETS_KEY}_${userLogin}`);
      if (!snippetsData) return [];
      
      const snippets: CodeSnippet[] = JSON.parse(snippetsData);
      return snippets.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } catch (error) {
      console.error('Error loading snippets:', error);
      return [];
    }
  }

  // Create a new code snippet
  createSnippet(
    userLogin: string,
    snippet: Omit<CodeSnippet, 'id' | 'author' | 'created_at' | 'updated_at'>
  ): CodeSnippet {
    const newSnippet: CodeSnippet = {
      ...snippet,
      id: this.generateId(),
      author: userLogin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const snippets = this.getSnippets(userLogin);
    snippets.unshift(newSnippet);
    localStorage.setItem(`${this.SNIPPETS_KEY}_${userLogin}`, JSON.stringify(snippets));

    // If public, add to public snippets
    if (newSnippet.is_public) {
      this.addToPublicSnippets(newSnippet);
    }

    return newSnippet;
  }

  // Update an existing snippet
  updateSnippet(userLogin: string, snippetId: string, updates: Partial<CodeSnippet>): boolean {
    try {
      const snippets = this.getSnippets(userLogin);
      const snippetIndex = snippets.findIndex(s => s.id === snippetId);
      
      if (snippetIndex === -1) return false;

      const oldSnippet = snippets[snippetIndex];
      const updatedSnippet = {
        ...oldSnippet,
        ...updates,
        updated_at: new Date().toISOString()
      };

      snippets[snippetIndex] = updatedSnippet;
      localStorage.setItem(`${this.SNIPPETS_KEY}_${userLogin}`, JSON.stringify(snippets));

      // Update public snippets if visibility changed
      if (oldSnippet.is_public !== updatedSnippet.is_public) {
        if (updatedSnippet.is_public) {
          this.addToPublicSnippets(updatedSnippet);
        } else {
          this.removeFromPublicSnippets(snippetId);
        }
      } else if (updatedSnippet.is_public) {
        this.updatePublicSnippet(updatedSnippet);
      }

      return true;
    } catch (error) {
      console.error('Error updating snippet:', error);
      return false;
    }
  }

  // Delete a snippet
  deleteSnippet(userLogin: string, snippetId: string): boolean {
    try {
      const snippets = this.getSnippets(userLogin);
      const filteredSnippets = snippets.filter(s => s.id !== snippetId);
      
      if (filteredSnippets.length === snippets.length) {
        return false; // Snippet not found
      }

      localStorage.setItem(`${this.SNIPPETS_KEY}_${userLogin}`, JSON.stringify(filteredSnippets));
      
      // Remove from public snippets if it was public
      this.removeFromPublicSnippets(snippetId);
      
      return true;
    } catch (error) {
      console.error('Error deleting snippet:', error);
      return false;
    }
  }

  // Get snippet by ID
  getSnippet(userLogin: string, snippetId: string): CodeSnippet | null {
    const snippets = this.getSnippets(userLogin);
    return snippets.find(s => s.id === snippetId) || null;
  }

  // Search snippets
  searchSnippets(userLogin: string, query: string, filters?: {
    language?: string;
    category?: string;
    tags?: string[];
  }): CodeSnippet[] {
    let snippets = this.getSnippets(userLogin);

    // Apply text search
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      snippets = snippets.filter(snippet =>
        snippet.title.toLowerCase().includes(lowerQuery) ||
        snippet.description.toLowerCase().includes(lowerQuery) ||
        snippet.code.toLowerCase().includes(lowerQuery) ||
        snippet.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    if (filters) {
      if (filters.language) {
        snippets = snippets.filter(s => s.language === filters.language);
      }
      if (filters.category) {
        snippets = snippets.filter(s => s.category === filters.category);
      }
      if (filters.tags && filters.tags.length > 0) {
        snippets = snippets.filter(s => 
          filters.tags!.some(tag => s.tags.includes(tag))
        );
      }
    }

    return snippets;
  }

  // Create snippet from code selection
  createSnippetFromCode(
    userLogin: string,
    code: string,
    context: {
      filename?: string;
      language: string;
      repo_name?: string;
      repo_url?: string;
      file_path?: string;
      line_start?: number;
      line_end?: number;
      commit_sha?: string;
      branch?: string;
    }
  ): CodeSnippet {
    const title = context.filename 
      ? `Code from ${context.filename}`
      : `Code snippet from ${context.repo_name || 'repository'}`;

    const description = context.repo_name 
      ? `Saved from ${context.repo_name}${context.file_path ? ` - ${context.file_path}` : ''}`
      : 'Code snippet saved from search results';

    return this.createSnippet(userLogin, {
      title,
      description,
      code: code.trim(),
      language: context.language,
      filename: context.filename,
      repo_name: context.repo_name,
      repo_url: context.repo_url,
      file_path: context.file_path,
      line_start: context.line_start,
      line_end: context.line_end,
      tags: [context.language, 'saved-from-search'].filter(Boolean),
      is_public: false,
      shared_with: [],
      category: 'bookmark',
      metadata: {
        commit_sha: context.commit_sha,
        branch: context.branch,
        context: 'saved-from-search'
      }
    });
  }

  // Share snippet with users
  shareSnippet(
    userLogin: string,
    snippetId: string,
    shareWith: string[],
    accessLevel: 'view' | 'edit' | 'comment' = 'view',
    expiresIn?: number // days
  ): SnippetShare | null {
    try {
      const snippet = this.getSnippet(userLogin, snippetId);
      if (!snippet) return null;

      const share: SnippetShare = {
        id: this.generateId(),
        snippet_id: snippetId,
        shared_by: userLogin,
        shared_with: shareWith,
        shared_at: new Date().toISOString(),
        expires_at: expiresIn 
          ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        access_level: accessLevel,
        share_link: `${window.location.origin}/snippet/${snippetId}?share=${this.generateId()}`
      };

      const shares = this.getShares();
      shares.push(share);
      localStorage.setItem(this.SHARES_KEY, JSON.stringify(shares));

      // Update snippet's shared_with list
      snippet.shared_with = [...new Set([...snippet.shared_with, ...shareWith])];
      this.updateSnippet(userLogin, snippetId, { shared_with: snippet.shared_with });

      return share;
    } catch (error) {
      console.error('Error sharing snippet:', error);
      return null;
    }
  }

  // Get shared snippets (snippets shared with current user)
  getSharedSnippets(userLogin: string): CodeSnippet[] {
    try {
      const allSnippets = this.getAllPublicSnippets();
      return allSnippets.filter(snippet => 
        snippet.shared_with.includes(userLogin) && snippet.author !== userLogin
      );
    } catch (error) {
      console.error('Error getting shared snippets:', error);
      return [];
    }
  }

  // Snippet Folders Management
  getFolders(userLogin: string): SnippetFolder[] {
    try {
      const foldersData = localStorage.getItem(`${this.FOLDERS_KEY}_${userLogin}`);
      if (!foldersData) return [];
      
      return JSON.parse(foldersData);
    } catch (error) {
      console.error('Error loading snippet folders:', error);
      return [];
    }
  }

  createFolder(userLogin: string, name: string, color: string = '#3B82F6', icon: string = '📁'): SnippetFolder {
    const folders = this.getFolders(userLogin);
    const newFolder: SnippetFolder = {
      id: this.generateId(),
      name,
      color,
      icon,
      snippets: [],
      created_at: new Date().toISOString()
    };

    folders.push(newFolder);
    localStorage.setItem(`${this.FOLDERS_KEY}_${userLogin}`, JSON.stringify(folders));
    
    return newFolder;
  }

  // Add snippet to folder
  addToFolder(userLogin: string, folderId: string, snippetId: string): boolean {
    try {
      const folders = this.getFolders(userLogin);
      const folder = folders.find(f => f.id === folderId);
      
      if (!folder || folder.snippets.includes(snippetId)) {
        return false;
      }

      folder.snippets.push(snippetId);
      localStorage.setItem(`${this.FOLDERS_KEY}_${userLogin}`, JSON.stringify(folders));
      
      return true;
    } catch (error) {
      console.error('Error adding snippet to folder:', error);
      return false;
    }
  }

  // Get snippets by folder
  getSnippetsByFolder(userLogin: string, folderId: string): CodeSnippet[] {
    const folders = this.getFolders(userLogin);
    const folder = folders.find(f => f.id === folderId);
    
    if (!folder) return [];

    const allSnippets = this.getSnippets(userLogin);
    return allSnippets.filter(snippet => folder.snippets.includes(snippet.id));
  }

  // Private methods for managing public snippets
  private addToPublicSnippets(snippet: CodeSnippet): void {
    try {
      const publicSnippets = this.getAllPublicSnippets();
      publicSnippets.unshift(snippet);
      localStorage.setItem(this.PUBLIC_SNIPPETS_KEY, JSON.stringify(publicSnippets));
    } catch (error) {
      console.error('Error adding to public snippets:', error);
    }
  }

  private removeFromPublicSnippets(snippetId: string): void {
    try {
      const publicSnippets = this.getAllPublicSnippets();
      const filtered = publicSnippets.filter(s => s.id !== snippetId);
      localStorage.setItem(this.PUBLIC_SNIPPETS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from public snippets:', error);
    }
  }

  private updatePublicSnippet(snippet: CodeSnippet): void {
    try {
      const publicSnippets = this.getAllPublicSnippets();
      const index = publicSnippets.findIndex(s => s.id === snippet.id);
      if (index !== -1) {
        publicSnippets[index] = snippet;
        localStorage.setItem(this.PUBLIC_SNIPPETS_KEY, JSON.stringify(publicSnippets));
      }
    } catch (error) {
      console.error('Error updating public snippet:', error);
    }
  }

  private getAllPublicSnippets(): CodeSnippet[] {
    try {
      const publicData = localStorage.getItem(this.PUBLIC_SNIPPETS_KEY);
      return publicData ? JSON.parse(publicData) : [];
    } catch (error) {
      console.error('Error loading public snippets:', error);
      return [];
    }
  }

  private getShares(): SnippetShare[] {
    try {
      const sharesData = localStorage.getItem(this.SHARES_KEY);
      return sharesData ? JSON.parse(sharesData) : [];
    } catch (error) {
      console.error('Error loading shares:', error);
      return [];
    }
  }

  // Export snippets (for backup)
  exportSnippets(userLogin: string): {
    snippets: CodeSnippet[];
    folders: SnippetFolder[];
    shares: SnippetShare[];
  } {
    return {
      snippets: this.getSnippets(userLogin),
      folders: this.getFolders(userLogin),
      shares: this.getShares().filter(share => share.shared_by === userLogin)
    };
  }

  // Import snippets (from backup)
  importSnippets(userLogin: string, data: {
    snippets: CodeSnippet[];
    folders: SnippetFolder[];
    shares: SnippetShare[];
  }): boolean {
    try {
      localStorage.setItem(`${this.SNIPPETS_KEY}_${userLogin}`, JSON.stringify(data.snippets));
      localStorage.setItem(`${this.FOLDERS_KEY}_${userLogin}`, JSON.stringify(data.folders));
      
      // Merge shares (don't overwrite all shares, just add new ones)
      const existingShares = this.getShares();
      const mergedShares = [...existingShares, ...data.shares];
      localStorage.setItem(this.SHARES_KEY, JSON.stringify(mergedShares));
      
      return true;
    } catch (error) {
      console.error('Error importing snippets:', error);
      return false;
    }
  }

  // Clear all snippets for user
  clearSnippets(userLogin: string): void {
    localStorage.removeItem(`${this.SNIPPETS_KEY}_${userLogin}`);
    localStorage.removeItem(`${this.FOLDERS_KEY}_${userLogin}`);
  }

  // Get snippet statistics
  getStats(userLogin: string): {
    total: number;
    by_language: Record<string, number>;
    by_category: Record<string, number>;
    public_count: number;
    shared_count: number;
  } {
    const snippets = this.getSnippets(userLogin);
    
    const stats = {
      total: snippets.length,
      by_language: {} as Record<string, number>,
      by_category: {} as Record<string, number>,
      public_count: 0,
      shared_count: 0
    };

    snippets.forEach(snippet => {
      // Language stats
      stats.by_language[snippet.language] = (stats.by_language[snippet.language] || 0) + 1;
      
      // Category stats
      stats.by_category[snippet.category] = (stats.by_category[snippet.category] || 0) + 1;
      
      // Public/shared counts
      if (snippet.is_public) stats.public_count++;
      if (snippet.shared_with.length > 0) stats.shared_count++;
    });

    return stats;
  }
}

// Export singleton instance
export const snippetService = new SnippetService();
export default snippetService;
