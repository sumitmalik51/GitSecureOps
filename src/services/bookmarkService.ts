// Repository bookmark service
// Handles storing and retrieving user's bookmarked repositories

export interface BookmarkedRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  owner: {
    login: string;
    avatar_url: string;
    type: string;
  };
  topics: string[];
  private: boolean;
  bookmarked_at: string;
  tags?: string[];
}

export interface BookmarkFolder {
  id: string;
  name: string;
  color: string;
  repos: number[];
  created_at: string;
}

class BookmarkService {
  private readonly BOOKMARKS_KEY = 'gitsecureops_bookmarks';
  private readonly FOLDERS_KEY = 'gitsecureops_bookmark_folders';

  // Get all bookmarked repositories for current user
  getBookmarks(userLogin: string): BookmarkedRepo[] {
    try {
      const bookmarksData = localStorage.getItem(`${this.BOOKMARKS_KEY}_${userLogin}`);
      if (!bookmarksData) return [];
      
      const bookmarks: BookmarkedRepo[] = JSON.parse(bookmarksData);
      // Sort by most recently bookmarked
      return bookmarks.sort((a, b) => new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime());
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  }

  // Add a repository to bookmarks
  addBookmark(userLogin: string, repo: any, tags: string[] = []): boolean {
    try {
      const bookmarks = this.getBookmarks(userLogin);
      
      // Check if already bookmarked
      if (bookmarks.some(b => b.id === repo.id)) {
        return false; // Already bookmarked
      }

      const bookmarkedRepo: BookmarkedRepo = {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || 'No description available',
        html_url: repo.html_url,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        owner: repo.owner,
        topics: repo.topics || [],
        private: repo.private,
        bookmarked_at: new Date().toISOString(),
        tags
      };

      bookmarks.unshift(bookmarkedRepo); // Add to beginning
      localStorage.setItem(`${this.BOOKMARKS_KEY}_${userLogin}`, JSON.stringify(bookmarks));
      
      return true;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return false;
    }
  }

  // Remove a repository from bookmarks
  removeBookmark(userLogin: string, repoId: number): boolean {
    try {
      const bookmarks = this.getBookmarks(userLogin);
      const filteredBookmarks = bookmarks.filter(b => b.id !== repoId);
      
      if (filteredBookmarks.length === bookmarks.length) {
        return false; // Wasn't bookmarked
      }

      localStorage.setItem(`${this.BOOKMARKS_KEY}_${userLogin}`, JSON.stringify(filteredBookmarks));
      return true;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }
  }

  // Check if a repository is bookmarked
  isBookmarked(userLogin: string, repoId: number): boolean {
    const bookmarks = this.getBookmarks(userLogin);
    return bookmarks.some(b => b.id === repoId);
  }

  // Get bookmark folders
  getFolders(userLogin: string): BookmarkFolder[] {
    try {
      const foldersData = localStorage.getItem(`${this.FOLDERS_KEY}_${userLogin}`);
      if (!foldersData) return [];
      
      return JSON.parse(foldersData);
    } catch (error) {
      console.error('Error loading bookmark folders:', error);
      return [];
    }
  }

  // Create a new bookmark folder
  createFolder(userLogin: string, name: string, color: string = '#3B82F6'): BookmarkFolder {
    const folders = this.getFolders(userLogin);
    const newFolder: BookmarkFolder = {
      id: Date.now().toString(),
      name,
      color,
      repos: [],
      created_at: new Date().toISOString()
    };

    folders.push(newFolder);
    localStorage.setItem(`${this.FOLDERS_KEY}_${userLogin}`, JSON.stringify(folders));
    
    return newFolder;
  }

  // Add repository to folder
  addToFolder(userLogin: string, folderId: string, repoId: number): boolean {
    try {
      const folders = this.getFolders(userLogin);
      const folder = folders.find(f => f.id === folderId);
      
      if (!folder || folder.repos.includes(repoId)) {
        return false;
      }

      folder.repos.push(repoId);
      localStorage.setItem(`${this.FOLDERS_KEY}_${userLogin}`, JSON.stringify(folders));
      
      return true;
    } catch (error) {
      console.error('Error adding repo to folder:', error);
      return false;
    }
  }

  // Remove repository from folder
  removeFromFolder(userLogin: string, folderId: string, repoId: number): boolean {
    try {
      const folders = this.getFolders(userLogin);
      const folder = folders.find(f => f.id === folderId);
      
      if (!folder) return false;

      folder.repos = folder.repos.filter(id => id !== repoId);
      localStorage.setItem(`${this.FOLDERS_KEY}_${userLogin}`, JSON.stringify(folders));
      
      return true;
    } catch (error) {
      console.error('Error removing repo from folder:', error);
      return false;
    }
  }

  // Get bookmarks by folder
  getBookmarksByFolder(userLogin: string, folderId: string): BookmarkedRepo[] {
    const folders = this.getFolders(userLogin);
    const folder = folders.find(f => f.id === folderId);
    
    if (!folder) return [];

    const allBookmarks = this.getBookmarks(userLogin);
    return allBookmarks.filter(bookmark => folder.repos.includes(bookmark.id));
  }

  // Export bookmarks (for backup)
  exportBookmarks(userLogin: string): { bookmarks: BookmarkedRepo[], folders: BookmarkFolder[] } {
    return {
      bookmarks: this.getBookmarks(userLogin),
      folders: this.getFolders(userLogin)
    };
  }

  // Import bookmarks (from backup)
  importBookmarks(userLogin: string, data: { bookmarks: BookmarkedRepo[], folders: BookmarkFolder[] }): boolean {
    try {
      localStorage.setItem(`${this.BOOKMARKS_KEY}_${userLogin}`, JSON.stringify(data.bookmarks));
      localStorage.setItem(`${this.FOLDERS_KEY}_${userLogin}`, JSON.stringify(data.folders));
      return true;
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      return false;
    }
  }

  // Clear all bookmarks for user
  clearBookmarks(userLogin: string): void {
    localStorage.removeItem(`${this.BOOKMARKS_KEY}_${userLogin}`);
    localStorage.removeItem(`${this.FOLDERS_KEY}_${userLogin}`);
  }
}

// Export singleton instance
export const bookmarkService = new BookmarkService();
export default bookmarkService;
