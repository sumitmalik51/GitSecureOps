import DarkModeToggle from './ui/DarkModeToggle';

interface TopbarProps {
  username: string;
  onLogout: () => void;
  currentView: string;
}

export default function Topbar({ username, onLogout, currentView }: TopbarProps) {
  const getViewTitle = (view: string): string => {
    switch (view) {
      case 'dashboard':
        return 'Dashboard';
      case 'delete-user-access':
        return 'Delete User Access';
      case 'list-private-repos':
        return 'Private Repositories';
      case 'list-public-repos':
        return 'Public Repositories';
      case 'export-usernames':
        return 'Export Users';
      default:
        if (view.includes('org-selector')) {
          return 'Select Organization';
        }
        return 'Repository Management';
    }
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {getViewTitle(currentView)}
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <DarkModeToggle />
        <span className="text-sm text-gray-600 dark:text-gray-400">👤 {username}</span>
        <button 
          onClick={onLogout}
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
