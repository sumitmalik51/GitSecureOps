import { type ReactNode, useState } from 'react';
import DarkModeToggle from './ui/DarkModeToggle';
import NotificationBell from './NotificationBell';
import NotificationCenter from './NotificationCenter';
import NotificationSettings from './NotificationSettings';
import ActivitySidebar from './ActivitySidebar';
import UserAvatarHeader from './UserAvatarHeader';

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
              
              {/* User Avatar Header with GitHub Profile */}
              <UserAvatarHeader
                accessToken={accessToken || ''}
                username={username}
                onLogout={onLogout}
                className="ml-2"
              />
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