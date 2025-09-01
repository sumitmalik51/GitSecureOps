import { useState, useEffect } from 'react';
import { Command } from 'lucide-react';
import LandingPage from './components/LandingPage_new';
import Auth from './components/Auth';
import OAuthSuccess from './components/OAuthSuccess';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrganizationSelector from './components/OrganizationSelector';
import GrantAccess from './components/GrantAccess';
import CopilotManager from './components/CopilotManager';
import GitHubActionsManager from './components/GitHubActionsManager';
import TwoFactorChecker from './components/TwoFactorChecker';
import DeleteUserAccess from './components/DeleteUserAccess';
import RepositoryListView from './components/RepositoryListView';
import ExportUsernames from './components/ExportUsernames';
import SearchChatbot from './components/SearchChatbot';
import ChatButton from './components/ChatButton';
import BookmarkManager from './components/BookmarkManager';
import ActivitySidebar from './components/ActivitySidebar';
import EnhancedCommandPalette from './components/EnhancedCommandPalette';
import SnippetManager from './components/SnippetManager';
import UserAvatarHeader from './components/UserAvatarHeader';
import githubService, { type GitHubOrg } from './services/githubService';
import useGlobalShortcut from './hooks/useGlobalShortcut';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'oauth-success' | 'app'>('landing');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedScope, setSelectedScope] = useState<'user' | 'org' | 'all' | 'multi-org'>('user');
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  
  // Chatbot state management
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [userOrganizations, setUserOrganizations] = useState<GitHubOrg[]>([]);
  const [orgNames, setOrgNames] = useState<string[]>([]);
  
  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Bookmark manager state
  const [isBookmarkManagerOpen, setIsBookmarkManagerOpen] = useState(false);
  
  // Snippet manager state
  const [isSnippetManagerOpen, setIsSnippetManagerOpen] = useState(false);

  console.log('User organizations loaded:', userOrganizations.length);

  // Check for OAuth callback or persisted authentication state on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('session');
    const error = urlParams.get('error');

    // Handle OAuth callback
    if (sessionToken || error) {
      setCurrentPage('oauth-success');
      return;
    }

    // Clear any persisted authentication state to ensure fresh start
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_username');
    sessionStorage.removeItem('github_token');
    sessionStorage.removeItem('github_username');
    
    // Clear any cookies that might be storing auth state
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    
    // Ensure we always start with landing page
    setCurrentPage('landing');
    setToken('');
    setUsername('');
    githubService.setToken('');
    
    console.log('🔄 Authentication state cleared - starting fresh');
  }, []);

  const handleGetStarted = () => {
    setCurrentPage('auth');
  };

  const handleBackToLanding = () => {
    setCurrentPage('landing');
  };

  const handleAuthSuccess = (authToken: string, authUsername: string) => {
    setToken(authToken);
    setUsername(authUsername);
    
    // Set the token in the github service so it can make API calls
    githubService.setToken(authToken);
    
    setCurrentPage('app');
    setCurrentView('dashboard');

    // Clear URL parameters after successful authentication
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Load user organizations when authenticated
  useEffect(() => {
    if (token && username) {
      const loadUserOrganizations = async () => {
        try {
          const orgs = await githubService.getUserOrganizations();
          setUserOrganizations(orgs);
          setOrgNames(orgs.map(org => org.login));
        } catch (error) {
          console.error('Failed to load user organizations:', error);
        }
      };
      
      loadUserOrganizations();

      // Force hide any persistent popups/notifications when authenticated
      const hideAllPopups = () => {
        // Hide any fixed positioned elements that might be notifications
        const fixedElements = document.querySelectorAll('[style*="fixed"]');
        fixedElements.forEach(el => {
          const element = el as HTMLElement;
          if (element.textContent?.toLowerCase().includes('streamline') || 
              element.textContent?.toLowerCase().includes('repos')) {
            element.style.display = 'none';
          }
        });
        
        // Also hide elements with specific classes that might be notifications
        const popupElements = document.querySelectorAll('.fixed, [class*="fixed"], [class*="popup"], [class*="notification"]');
        popupElements.forEach(el => {
          const element = el as HTMLElement;
          if (element.textContent?.toLowerCase().includes('streamline') || 
              element.textContent?.toLowerCase().includes('repos')) {
            element.style.display = 'none';
          }
        });
      };
      
      // Run immediately and after a short delay
      hideAllPopups();
      setTimeout(hideAllPopups, 1000);
    }
  }, [token, username]);

  // Global keyboard shortcut for command palette (Ctrl+K)
  useGlobalShortcut({
    key: 'k',
    ctrlKey: true,
    callback: () => setIsCommandPaletteOpen(true),
    enabled: currentPage === 'app' && !!token
  });

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error);
    // Redirect back to auth page with error
    setCurrentPage('auth');
    // You could also show a toast notification here
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    
    // Clear the token from the github service
    githubService.setToken('');
    
    // Clear any persisted authentication state
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_username');
    sessionStorage.removeItem('github_token');
    sessionStorage.removeItem('github_username');
    
    // Clear any cookies that might be storing auth state
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    
    setCurrentPage('landing');
    setCurrentView('dashboard');
    setSelectedScope('user');
    setSelectedOrg('');
    
    console.log('🚪 User logged out - authentication state cleared');
  };

  const handleSelectOption = (option: string) => {
    if (option === 'bookmarks') {
      setIsBookmarkManagerOpen(true);
    } else if (option === 'snippets') {
      setIsSnippetManagerOpen(true);
    } else if (option === 'copilot-manager') {
      setCurrentView('copilot-manager');
    } else if (option === 'grant-access') {
      setCurrentView('grant-access');
    } else if (option === 'actions-manager') {
      setCurrentView('actions-manager');
    } else if (option === 'two-factor-checker') {
      setCurrentView('two-factor-checker');
    } else {
      setCurrentView(`org-selector-${option}`);
    }
  };

  const handleNavigate = (view: string) => {
    if (view === 'dashboard') {
      setCurrentView('dashboard');
    } else {
      setCurrentView(`org-selector-${view}`);
    }
  };

  const handleScopeSelection = (scope: 'user' | 'org' | 'all' | 'multi-org', orgLogin?: string, selectedOrgsList?: string[]) => {
    if (scope === 'org' && orgLogin) {
      setSelectedScope('org');
      setSelectedOrg(orgLogin);
      setSelectedOrgs([]);
    } else if (scope === 'multi-org' && selectedOrgsList && selectedOrgsList.length > 0) {
      setSelectedScope('multi-org');
      setSelectedOrgs(selectedOrgsList);
      setSelectedOrg('');
    } else if (scope === 'all') {
      setSelectedScope('all');
      setSelectedOrg('');
      setSelectedOrgs([]);
    } else {
      setSelectedScope('user');
      setSelectedOrg('');
      setSelectedOrgs([]);
    }
    
    // Extract the original option from the current view
    const originalOption = currentView.replace('org-selector-', '');
    setCurrentView(originalOption);
  };

  const handleBack = () => {
    if (currentView.startsWith('org-selector-')) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleOpenChatbot = () => {
    setIsChatbotOpen(true);
  };

  const handleCloseChatbot = () => {
    setIsChatbotOpen(false);
  };

  const handleCloseBookmarks = () => {
    setIsBookmarkManagerOpen(false);
  };

  const handleCloseSnippets = () => {
    setIsSnippetManagerOpen(false);
  };

  if (currentPage === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (currentPage === 'auth') {
    return <Auth onAuthSuccess={handleAuthSuccess} onBack={handleBackToLanding} />;
  }

  if (currentPage === 'oauth-success') {
    return <OAuthSuccess onAuthSuccess={handleAuthSuccess} onAuthError={handleAuthError} />;
  }

  switch (currentView) {
    case 'org-selector-delete-user-access':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <OrganizationSelector
            onBack={handleBack}
            onSelectScope={handleScopeSelection}
            title="Delete User Access"
            description="Select the GitHub organization(s) where you want to scan and remove user access.

GitSecureOps will search across all repositories within the selected org(s) and identify where the specified user has access. Once identified, you'll have the option to review and remove access in bulk."
          />
        </Layout>
      );
    case 'org-selector-list-private-repos':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <OrganizationSelector
            onBack={handleBack}
            onSelectScope={handleScopeSelection}
            title="List Private Repos"
            description="Choose which private repositories to list"
          />
        </Layout>
      );
    case 'org-selector-list-public-repos':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <OrganizationSelector
            onBack={handleBack}
            onSelectScope={handleScopeSelection}
            title="List Public Repos"
            description="Choose which public repositories to list"
          />
        </Layout>
      );
    case 'org-selector-export-usernames':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <OrganizationSelector
            onBack={handleBack}
            onSelectScope={handleScopeSelection}
            title="Export User Details"
            description="Choose which repositories to scan for usernames"
          />
        </Layout>
      );
    case 'copilot-manager':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <CopilotManager
            onBack={handleBack}
          />
        </Layout>
      );
    case 'grant-access':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <GrantAccess
            token={token}
            onBack={handleBack}
          />
        </Layout>
      );
    case 'actions-manager':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <GitHubActionsManager
            token={token}
            onBack={handleBack}
          />
        </Layout>
      );
    case 'two-factor-checker':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <TwoFactorChecker
            token={token}
            onBack={handleBack}
          />
        </Layout>
      );
    case 'delete-user-access':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <DeleteUserAccess
            token={token}
            username={username}
            onBack={handleBack}
            selectedScope={selectedScope}
            selectedOrg={selectedOrg}
            selectedOrgs={selectedOrgs}
          />
        </Layout>
      );
    case 'list-private-repos':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <RepositoryListView
            token={token}
            username={username}
            onBack={handleBack}
            repoType="private"
            selectedScope={selectedScope}
            selectedOrg={selectedOrg}
            selectedOrgs={selectedOrgs}
          />
        </Layout>
      );
    case 'list-public-repos':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <RepositoryListView
            token={token}
            username={username}
            onBack={handleBack}
            repoType="public"
            selectedScope={selectedScope}
            selectedOrg={selectedOrg}
            selectedOrgs={selectedOrgs}
          />
        </Layout>
      );
    case 'export-usernames':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate} accessToken={token} organizations={orgNames}>
          <ExportUsernames
            token={token}
            username={username}
            onBack={handleBack}
            selectedScope={selectedScope}
            selectedOrg={selectedOrg}
            selectedOrgs={selectedOrgs}
          />
        </Layout>
      );
    default:
      return (
        <>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col min-h-screen">
              {/* Top Bar */}
              <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🔒</span>
                      </div>
                      <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">GitSecureOps</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Repository Management</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Command Palette Hint */}
                    <button
                      onClick={() => setIsCommandPaletteOpen(true)}
                      className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      title="Open Command Palette (Ctrl+K)"
                    >
                      <Command size={16} />
                      <span>Press Ctrl+K</span>
                    </button>
                    
                    {/* User Avatar Header with GitHub Profile */}
                    <UserAvatarHeader
                      accessToken={token}
                      username={username}
                      onLogout={handleLogout}
                      className="ml-4"
                    />
                  </div>
                </div>
              </header>

              {/* Dashboard with Sidebar Layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Main Dashboard Content */}
                <main className="flex-1 overflow-auto">
                  <Dashboard
                    username={username}
                    onLogout={handleLogout}
                    onSelectOption={handleSelectOption}
                  />
                </main>
                
                {/* Activity Sidebar */}
                <ActivitySidebar 
                  accessToken={token}
                  organizations={orgNames}
                />
              </div>
            </div>
          </div>
          
          {/* Floating Chat Button - Only show when authenticated */}
          {token && (
            <ChatButton onClick={handleOpenChatbot} />
          )}
          
          {/* Search Chatbot Modal */}
          <SearchChatbot
            isOpen={isChatbotOpen}
            onClose={handleCloseChatbot}
            accessToken={token}
            userLogin={username}
            organizations={orgNames}
          />
          
          {/* Bookmark Manager Modal */}
          <BookmarkManager
            isOpen={isBookmarkManagerOpen}
            onClose={handleCloseBookmarks}
            userLogin={username}
          />

          {/* Snippet Manager Modal */}
          <SnippetManager
            isOpen={isSnippetManagerOpen}
            userLogin={username}
            onClose={handleCloseSnippets}
          />

          {/* Enhanced Command Palette - Cross-Org Universal Search */}
          <EnhancedCommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            accessToken={token}
            organizations={orgNames}
          />
        </>
      );
  }
}

export default App;
