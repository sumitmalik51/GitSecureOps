import DarkModeToggle from './ui/DarkModeToggle';

interface TopbarProps {
  username: string;
  onLogout: () => void;
}

export default function Topbar({ username, onLogout }: TopbarProps) {
  return (
    <>
      {/* Custom CSS for minimalist header animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes topbarMinimalGradient {
            0% { 
              background-position: 0% 50%;
              transform: translateX(0%);
            }
            50% { 
              background-position: 100% 50%;
              transform: translateX(1%);
            }
            100% { 
              background-position: 0% 50%;
              transform: translateX(0%);
            }
          }
          
          .topbar-minimal-gradient-text {
            background: linear-gradient(110deg, #374151, #4b5563, #6b7280, #9ca3af, #6b7280, #4b5563, #374151);
            background-size: 250% 250%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: topbarMinimalGradient 6s ease-in-out infinite;
            font-weight: 600;
            filter: contrast(1.05) brightness(1.02);
          }

          .topbar-logo-glow {
            background: linear-gradient(135deg, #4b5563, #6b7280, #9ca3af);
            animation: topbarMinimalGradient 8s ease-in-out infinite;
            box-shadow: 0 2px 8px rgba(107, 114, 128, 0.15);
          }
        `
      }} />
      
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Left Side - GitSecureOps Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 topbar-logo-glow rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🛡️</span>
          </div>
          <div>
            <h1 className="text-lg topbar-minimal-gradient-text">
              GitSecureOps
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Repository Management</p>
          </div>
        </div>
      
      {/* Right Side - Menu and Controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Mobile menu button - only show on small screens */}
        <button
          onClick={() => {/* TODO: Add mobile menu toggle */}}
          className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <DarkModeToggle />
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-sm">
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
    </>
  );
}
