import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage_new';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrganizationSelector from './components/OrganizationSelector';
import DeleteUserAccess from './components/DeleteUserAccess';
import RepositoryListView from './components/RepositoryListView';
import ExportUsernames from './components/ExportUsernames';
import SmartRecommendations from './components/SmartRecommendations';
import githubService from './services/githubService';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'app'>('landing');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedScope, setSelectedScope] = useState<'user' | 'org' | 'all' | 'multi-org'>('user');
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);

  // Check for persisted authentication state on component mount
  useEffect(() => {
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
    if (option === 'smart-recommendations') {
      setCurrentView('smart-recommendations');
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

  if (currentPage === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (currentPage === 'auth') {
    return <Auth onAuthSuccess={handleAuthSuccess} onBack={handleBackToLanding} />;
  }

  switch (currentView) {
    case 'org-selector-delete-user-access':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
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
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
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
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
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
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
          <OrganizationSelector
            onBack={handleBack}
            onSelectScope={handleScopeSelection}
            title="Export User Details"
            description="Choose which repositories to scan for usernames"
          />
        </Layout>
      );
    case 'smart-recommendations':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
          <SmartRecommendations onBack={handleBack} />
        </Layout>
      );
    case 'delete-user-access':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
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
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
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
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
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
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
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
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
          <Dashboard
            username={username}
            onLogout={handleLogout}
            onSelectOption={handleSelectOption}
          />
        </Layout>
      );
  }
}

export default App;
