import { useState } from 'react';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrganizationSelector from './components/OrganizationSelector';
import DeleteUserAccess from './components/DeleteUserAccess';
import RepositoryListView from './components/RepositoryListView';
import ExportUsernames from './components/ExportUsernames';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'auth' | 'app'>('landing');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedScope, setSelectedScope] = useState<'user' | 'org' | 'all'>('user');
  const [selectedOrg, setSelectedOrg] = useState<string>('');

  const handleGetStarted = () => {
    setCurrentPage('auth');
  };

  const handleAuthSuccess = (authToken: string, authUsername: string) => {
    setToken(authToken);
    setUsername(authUsername);
    setCurrentPage('app');
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    setCurrentPage('landing');
    setCurrentView('dashboard');
    setSelectedScope('user');
    setSelectedOrg('');
  };

  const handleSelectOption = (option: string) => {
    setCurrentView(`org-selector-${option}`);
  };

  const handleNavigate = (view: string) => {
    if (view === 'dashboard') {
      setCurrentView('dashboard');
    } else {
      setCurrentView(`org-selector-${view}`);
    }
  };

  const handleScopeSelection = (scope: 'user' | 'org' | 'all', orgLogin?: string) => {
    if (scope === 'org' && orgLogin) {
      setSelectedScope('org');
      setSelectedOrg(orgLogin);
    } else if (scope === 'all') {
      setSelectedScope('all');
      setSelectedOrg('');
    } else {
      setSelectedScope('user');
      setSelectedOrg('');
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
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  switch (currentView) {
    case 'org-selector-delete-user-access':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
          <OrganizationSelector
            onBack={handleBack}
            onSelectScope={handleScopeSelection}
            title="Select Scope for Delete User Access"
            description="Choose where to search for user access to remove"
          />
        </Layout>
      );
    case 'org-selector-list-private-repos':
      return (
        <Layout username={username} onLogout={handleLogout} currentView={currentView} onNavigate={handleNavigate}>
          <OrganizationSelector
            onBack={handleBack}
            onSelectScope={handleScopeSelection}
            title="Select Scope for Private Repositories"
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
            title="Select Scope for Public Repositories"
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
            title="Select Scope for Username Export"
            description="Choose which repositories to scan for usernames"
          />
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
