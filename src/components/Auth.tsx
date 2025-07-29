import { useState } from 'react';

interface AuthProps {
  onAuthSuccess: (token: string, username: string) => void;
  onBack?: () => void;
}

export default function Auth({ onAuthSuccess, onBack }: AuthProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!token.trim()) {
      setError('Please provide a GitHub Personal Access Token');
      setIsLoading(false);
      return;
    }

    try {
      // Test the token and get the authenticated user info
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid GitHub token or insufficient permissions');
      }

      const userData = await response.json();
      
      // Pass the token and the username retrieved from the API
      onAuthSuccess(token, userData.login);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 animate-bounce flex-shrink-0">
            <span className="text-2xl">🔧</span>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GitSecureOps
          </h2>
          <p className="mt-4 text-lg text-gray-600 font-medium">
            ✨ Manage repository access with style ✨
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative">
        <div className="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-2xl border border-white/20 sm:rounded-2xl sm:px-10 transition-all duration-300 hover:shadow-3xl">
          {/* Back Button */}
          {onBack && (
            <div className="mb-6">
              <button
                type="button"
                onClick={onBack}
                className="group inline-flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
                <span>Back to Homepage</span>
              </button>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="token" className="block text-sm font-semibold text-gray-700 mb-2">
                🔑 Personal Access Token
              </label>
              <div className="relative">
                <input
                  id="token"
                  name="token"
                  type="password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">💡 Required permissions:</span> 'repo' and 'read:org'
                  <br />
                  <span className="text-xs opacity-75">We'll automatically detect your username</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="relative">
                <div className="absolute inset-0 bg-red-100 rounded-xl animate-pulse opacity-50"></div>
                <div className="relative bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">❌</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Authentication Failed</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 overflow-hidden ${
                  isLoading 
                    ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 animate-pulse border-2 border-blue-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.01] hover:shadow-lg moving-border-button'
                }`}
              >
                {/* Loading wave effect */}
                {isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                )}
                
                {/* Loading spinner */}
                {isLoading && (
                  <div className="absolute left-4 inset-y-0 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                )}
                
                {/* Main button content */}
                <span className={`flex items-center space-x-2 transition-all duration-300 ${isLoading ? 'transform scale-95' : ''}`}>
                  {isLoading ? (
                    <>
                      <span className="animate-bounce">🔄</span>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span className="group-hover:animate-bounce">🚀</span>
                      <span>Connect to GitHub</span>
                    </>
                  )}
                </span>
                
                {/* Success ripple effect (shows briefly when successful) */}
                {!isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/20 to-green-400/0 transform scale-x-0 group-active:scale-x-100 transition-transform duration-300 origin-center"></div>
                )}
              </button>
            </div>
          </form>

          {/* OAuth Section - Coming Soon */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">⚡ Quick Login</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-800">🚀 OAuth Authentication</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      One-click GitHub login coming soon! For now, use your Personal Access Token above.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gradient-to-r from-transparent via-gray-300 to-transparent" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">🔑 Need a token?</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:org"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full inline-flex justify-center py-3 px-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:shadow-md minimal-moving-border-button"
              >
                <span className="flex items-center space-x-2">
                  <span>🔗</span>
                  <span>Create GitHub Token</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </span>
              </a>
            </div>

            {/* Fun facts about the app */}
            <div className="mt-6 text-center">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">✨ Fun Fact:</span> This app can manage thousands of repositories in seconds!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
