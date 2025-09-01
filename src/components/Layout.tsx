import { type ReactNode, useState } from 'react';
import DarkModeToggle from './ui/DarkModeToggle';
import NotificationBell from './NotificationBell';
import NotificationCenter from './NotificationCenter';
import NotificationSettings from './NotificationSettings';
import ActivitySidebar from './ActivitySidebar';

interface LayoutProps {
  children: ReactNode;
  username: string;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  accessToken?: string;
  organizations?: string[];
}

export default function Layout({ children, username, onLogout, currentView, accessToken, organizations = [] }: LayoutProps) {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content Area - Full Width */}
      <div className="flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* GitSecureOps Logo - Always Visible */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔒</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">GitSecureOps</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Repository Management</p>
                </div>
              </div>
              
              {/* Current View Info */}
              <div className="hidden sm:block">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {currentView === 'dashboard' 
                    ? `Welcome ${username}` 
                    : currentView.replace(/-/g, ' ').replace('list ', '')
                  }
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
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

        {/* Page Content with Sidebar Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          
          {/* Activity Sidebar */}
          <ActivitySidebar 
            accessToken={accessToken || null}
            organizations={organizations}
          />
        </div>
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