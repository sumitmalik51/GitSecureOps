import { type ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  username: string;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Layout({ children, username, onLogout, currentView, onNavigate }: LayoutProps) {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      description: 'Main overview'
    },
    {
      id: 'delete-user-access',
      label: 'Delete Access',
      icon: '🗑️',
      description: 'Remove user access'
    },
    {
      id: 'list-private-repos',
      label: 'Private Repos',
      icon: '🔒',
      description: 'View private repositories'
    },
    {
      id: 'list-public-repos',
      label: 'Public Repos',
      icon: '🌍',
      description: 'View public repositories'
    },
    {
      id: 'export-usernames',
      label: 'Export Users',
      icon: '📊',
      description: 'Export to Excel'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🔒</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">GitHub AccessOps</h1>
              <p className="text-xs text-gray-500">Repository Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                currentView === item.id || currentView.includes(item.id)
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${
                  currentView === item.id || currentView.includes(item.id) ? 'text-blue-700' : 'text-gray-900'
                }`}>
                  {item.label}
                </div>
                <div className="text-xs text-gray-500 truncate">{item.description}</div>
              </div>
              {(currentView === item.id || currentView.includes(item.id)) && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-400 text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <span>🛡️</span>
              <span>Secure & Private</span>
            </div>
            <p>v1.0.0 • Enterprise Ready</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {currentView.replace(/-/g, ' ').replace('list ', '')}
                </h2>
                <p className="text-sm text-gray-500">
                  {getCurrentViewDescription(currentView)}
                </p>
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{username}</div>
                  <div className="text-xs text-gray-500">GitHub User</div>
                </div>
              </div>
              
              <button
                onClick={onLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
              >
                <span className="mr-2">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function getCurrentViewDescription(view: string): string {
  switch (view) {
    case 'dashboard':
      return 'Overview of all available operations';
    case 'delete-user-access':
      return 'Remove user access from repositories';
    case 'list-private-repos':
      return 'View and manage private repositories';
    case 'list-public-repos':
      return 'View and manage public repositories';
    case 'export-usernames':
      return 'Export repository collaborators to Excel';
    default:
      if (view.includes('org-selector')) {
        return 'Select organization scope for operation';
      }
      return 'Repository access management';
  }
}
