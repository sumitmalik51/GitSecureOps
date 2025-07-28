import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface LayoutProps {
  children: ReactNode;
  username: string;
  onLogout: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Layout({ children, username, onLogout, currentView, onNavigate }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar currentView={currentView} onNavigate={onNavigate} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <Topbar username={username} onLogout={onLogout} currentView={currentView} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="text-xs text-gray-600 dark:text-gray-400 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <ul className="space-y-1">
            <li>🔒 Token is stored in memory only</li>
            <li>⚡ Lightning-fast with rate limit optimization</li>
            <li>🛡️ Direct GitHub API integration</li>
          </ul>
        </footer>
      </div>
    </div>
  );
}
