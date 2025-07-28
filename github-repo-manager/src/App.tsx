import { useState } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import OrganizationSelector from './components/OrganizationSelector';
import DeleteUserAccess from './components/DeleteUserAccess';
import RepositoryListView from './components/RepositoryListView';
import ExportUsernames from './components/ExportUsernames';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedScope, setSelectedScope] = useState<'user' | 'org' | 'all'>('user');
  const [selectedOrg, setSelectedOrg] = useState<string>('');

  const handleAuthSuccess = (authToken: string, authUsername: string) => {
    setToken(authToken);
    setUsername(authUsername);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    setSelectedScope('user');
    setSelectedOrg('');
  };

  const handleSelectOption = (option: string) => {
    setCurrentView(`org-selector-${option}`);
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

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  switch (currentView) {
    case 'org-selector-delete-user-access':
      return (
        <OrganizationSelector
          onBack={handleBack}
          onSelectScope={handleScopeSelection}
          title="Select Scope for Delete User Access"
          description="Choose where to search for user access to remove"
        />
      );
    case 'org-selector-list-private-repos':
      return (
        <OrganizationSelector
          onBack={handleBack}
          onSelectScope={handleScopeSelection}
          title="Select Scope for Private Repositories"
          description="Choose which private repositories to list"
        />
      );
    case 'org-selector-list-public-repos':
      return (
        <OrganizationSelector
          onBack={handleBack}
          onSelectScope={handleScopeSelection}
          title="Select Scope for Public Repositories"
          description="Choose which public repositories to list"
        />
      );
    case 'org-selector-export-usernames':
      return (
        <OrganizationSelector
          onBack={handleBack}
          onSelectScope={handleScopeSelection}
          title="Select Scope for Username Export"
          description="Choose which repositories to scan for usernames"
        />
      );
    case 'delete-user-access':
      return (
        <DeleteUserAccess
          token={token}
          username={username}
          onBack={handleBack}
          selectedScope={selectedScope}
          selectedOrg={selectedOrg}
        />
      );
    case 'list-private-repos':
      return (
        <RepositoryListView
          token={token}
          username={username}
          onBack={handleBack}
          repoType="private"
          selectedScope={selectedScope}
          selectedOrg={selectedOrg}
        />
      );
    case 'list-public-repos':
      return (
        <RepositoryListView
          token={token}
          username={username}
          onBack={handleBack}
          repoType="public"
          selectedScope={selectedScope}
          selectedOrg={selectedOrg}
        />
      );
    case 'export-usernames':
      return (
        <ExportUsernames
          token={token}
          username={username}
          onBack={handleBack}
          selectedScope={selectedScope}
          selectedOrg={selectedOrg}
        />
      );
    default:
      return (
        <Dashboard
          username={username}
          onLogout={handleLogout}
          onSelectOption={handleSelectOption}
        />
      );
  }
}

export default App;
