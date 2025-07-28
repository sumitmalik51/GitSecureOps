import { useState } from 'react';

interface AuthProps {
  onAuthSuccess: (token: string, username: string) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
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
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <span className="text-3xl">🔧</span>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GitHub Repo Access Manager
          </h2>
          <p className="mt-4 text-lg text-gray-600 font-medium">
            ✨ Manage repository access with style ✨
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative">
        <div className="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-2xl border border-white/20 sm:rounded-2xl sm:px-10 transition-all duration-300 hover:shadow-3xl">
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
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all duration-200 bg-gray-50 focus:bg-white"
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
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading 
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.01] hover:shadow-lg'
                }`}
              >
                {isLoading && (
                  <div className="absolute left-4 inset-y-0 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                )}
                <span className="flex items-center space-x-2">
                  {isLoading ? (
                    <>
                      <span>🔄</span>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Connect to GitHub</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

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
                className="group w-full inline-flex justify-center py-3 px-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
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
