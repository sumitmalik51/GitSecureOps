interface DashboardProps {
  username: string;
  onLogout: () => void;
  onSelectOption: (option: string) => void;
}

export default function Dashboard({ username, onLogout, onSelectOption }: DashboardProps) {
  const dashboardOptions = [
    {
      id: 'delete-user-access',
      title: 'Delete User Access',
      description: 'Remove specific users access from repositories by username',
      icon: '🗑️',
      gradient: 'from-red-400 to-pink-500',
      hoverGradient: 'hover:from-red-500 hover:to-pink-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 'list-private-repos',
      title: 'Get All Private Repositories',
      description: 'View all your private repositories',
      icon: '🔒',
      gradient: 'from-yellow-400 to-orange-500',
      hoverGradient: 'hover:from-yellow-500 hover:to-orange-600',
      bgColor: 'bg-yellow-50'
    },
    {
      id: 'list-public-repos',
      title: 'Get All Public Repositories',
      description: 'View all your public repositories',
      icon: '🌍',
      gradient: 'from-green-400 to-emerald-500',
      hoverGradient: 'hover:from-green-500 hover:to-emerald-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'export-usernames',
      title: 'Get All Usernames',
      description: 'Export all users with repository access to Excel',
      icon: '📊',
      gradient: 'from-blue-400 to-purple-500',
      hoverGradient: 'hover:from-blue-500 hover:to-purple-600',
      bgColor: 'bg-blue-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-200 rounded-full opacity-10 animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  GitHub Repo Access Manager
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  Welcome back, <span className="font-semibold text-blue-600">{username}</span>! 👋
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="group inline-flex items-center px-6 py-3 border-2 border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white/80 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
            >
              <span className="mr-2">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6 animate-bounce">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            What would you like to do?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Choose from the powerful options below to manage your GitHub repositories and user access with style! 🎯
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4">
          {dashboardOptions.map((option, index) => (
            <div
              key={option.id}
              onClick={() => onSelectOption(option.id)}
              className={`group relative ${option.bgColor} border-2 border-white/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] hover:-translate-y-1 backdrop-blur-sm overflow-hidden`}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Gradient Border Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${option.gradient} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className={`flex items-center justify-center w-14 h-14 bg-gradient-to-r ${option.gradient} rounded-xl mr-4 group-hover:scale-105 transition-transform duration-300`}>
                    <span className="text-2xl">{option.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-200 truncate">
                      {option.title}
                    </h3>
                    <div className={`h-1 bg-gradient-to-r ${option.gradient} rounded-full mt-2 w-0 group-hover:w-full transition-all duration-500`}></div>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-200 text-sm line-clamp-3">
                  {option.description}
                </p>
                
                {/* Arrow indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
                  <div className={`w-6 h-6 bg-gradient-to-r ${option.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                    <span className="text-white text-xs">→</span>
                  </div>
                </div>
              </div>
              
              {/* Subtle glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                <div className={`w-full h-full bg-gradient-to-r ${option.gradient} rounded-2xl blur-sm`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200/50 rounded-2xl p-8 max-w-3xl mx-auto backdrop-blur-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
              Security & Privacy First
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              🛡️ Your GitHub token is stored only in memory and never persisted<br />
              🔐 All operations are performed directly through GitHub's API with your permissions<br />
              ⚡ Lightning-fast processing with smart batching to respect rate limits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
