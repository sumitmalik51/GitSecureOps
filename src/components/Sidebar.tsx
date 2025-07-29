interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'delete-user-access', label: 'Delete User Access', icon: '🗑️' },
    { id: 'list-private-repos', label: 'Private Repos', icon: '🔒' },
    { id: 'list-public-repos', label: 'Public Repos', icon: '🌍' },
    { id: 'export-usernames', label: 'Export Users', icon: '📊' }
  ];

  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-900 p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 bg-clip-text text-transparent mb-1">
          GitSecureOps
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Repository Management</p>
      </div>
      
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left block px-4 py-2 rounded transition-colors duration-200 ${
              currentView === item.id || currentView.includes(item.id)
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
