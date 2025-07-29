import { type ReactNode, useState } from 'react';
import DarkModeToggle from './ui/DarkModeToggle';
import NotificationBell from './NotificationBell';
import NotificationCenter from './NotificationCenter';
import NotificationSettings from './NotificationSettings';

interface LayoutProps {
  children: ReactNode;
  username: string;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  description: string;
  action?: () => void;
}

export default function Layout({ children, username, onLogout, currentView, onNavigate }: LayoutProps) {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: `Welcome ${username}`,
      icon: '👋',
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
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      description: 'Configure alerts',
      action: () => setShowNotificationSettings(true)
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🔒</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">GitSecureOps</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Repository Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.action ? item.action() : onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                currentView === item.id || currentView.includes(item.id)
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${
                  currentView === item.id || currentView.includes(item.id) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                }`}>
                  {item.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</div>
              </div>
              {(currentView === item.id || currentView.includes(item.id)) && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
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
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button - only show on small screens */}
              <button
                onClick={() => {/* TODO: Add mobile menu toggle */}}
                className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* GitSecureOps Logo - Left Corner */}
              <div className="flex items-center space-x-3 lg:hidden">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔒</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">GitSecureOps</h1>
                </div>
              </div>
              
              {/* Current View Info */}
              <div className="lg:block">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {currentView === 'dashboard' 
                    ? `Welcome ${username}` 
                    : currentView.replace(/-/g, ' ').replace('list ', '')
                  }
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                  {getCurrentViewDescription(currentView)}
                </p>
              </div>
            </div>

            {/* User Info & Controls */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notification Bell */}
              <NotificationBell 
                onClick={() => setShowNotificationCenter(true)}
              />
              
              {/* Dark Mode Toggle */}
              <DarkModeToggle />
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{username}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">GitHub User</div>
                </div>
              </div>
              
              <button
                onClick={onLogout}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-red-200 dark:border-red-500/50 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-300 dark:hover:border-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span className="mr-2">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      {/* Notification Settings */}
      {showNotificationSettings && (
        <NotificationSettings 
          onClose={() => setShowNotificationSettings(false)}
        />
      )}
    </div>
  );
}

function getCurrentViewDescription(view: string): string {
  switch (view) {
    case 'dashboard':
      return 'Choose from the options below to manage your repositories';
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