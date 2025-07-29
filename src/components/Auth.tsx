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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-zinc-50 dark:from-gray-900 dark:via-slate-900 dark:to-zinc-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Modern Minimal Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle floating orbs */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-slate-300/30 dark:bg-slate-600/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-zinc-400/40 dark:bg-zinc-500/40 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-1/3 w-3 h-3 bg-stone-300/20 dark:bg-stone-600/20 rounded-full animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-20 right-1/4 w-1.5 h-1.5 bg-slate-400/30 dark:bg-slate-500/30 rounded-full animate-bounce" style={{animationDelay: '6s'}}></div>
        
        {/* Large background gradient orbs - very subtle */}
        <div className="absolute -top-96 -right-96 w-96 h-96 bg-gradient-to-br from-slate-200/10 to-zinc-200/5 dark:from-slate-700/10 dark:to-zinc-700/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-96 -left-96 w-96 h-96 bg-gradient-to-tr from-stone-200/10 to-slate-200/5 dark:from-stone-700/10 dark:to-slate-700/5 rounded-full blur-3xl"></div>
      </div>

      {/* Custom animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gentleFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(180deg); }
          }
          
          @keyframes subtleGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.05); }
            50% { box-shadow: 0 0 20px 5px rgba(0, 0, 0, 0.1); }
          }
          
          @keyframes minimalPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          
          .gentle-float {
            animation: gentleFloat 8s ease-in-out infinite;
          }
          
          .subtle-glow {
            animation: subtleGlow 4s ease-in-out infinite;
          }
          
          .minimal-pulse {
            animation: minimalPulse 3s ease-in-out infinite;
          }
        `
      }} />

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-600 via-zinc-600 to-slate-700 dark:from-slate-400 dark:via-zinc-400 dark:to-slate-500 rounded-2xl flex items-center justify-center mb-6 gentle-float shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50">
            <span className="text-2xl filter drop-shadow-sm">🔒</span>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-700 via-zinc-700 to-slate-800 dark:from-slate-200 dark:via-zinc-200 dark:to-slate-300 bg-clip-text text-transparent">
            GitSecureOps
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 font-medium">
            Minimal • Secure • Efficient
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl py-8 px-4 shadow-xl border border-slate-200/50 dark:border-slate-700/50 sm:rounded-3xl sm:px-10 transition-all duration-300 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-slate-900/80 subtle-glow">
          {/* Back Button */}
          {onBack && (
            <div className="mb-6">
              <button
                type="button"
                onClick={onBack}
                className="group inline-flex items-center space-x-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all duration-200 hover:translate-x-1"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-200 text-slate-500 dark:text-slate-400">←</span>
                <span>Back to Homepage</span>
              </button>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="token" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Personal Access Token
              </label>
              <div className="relative group">
                <input
                  id="token"
                  name="token"
                  type="password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="appearance-none block w-full px-4 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent sm:text-sm transition-all duration-300 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 group-hover:border-slate-300 dark:group-hover:border-slate-600"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full minimal-pulse"></div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Required permissions:</span> 'repo' and 'read:org'
                  <br />
                  <span className="text-xs opacity-75">Authentication is processed securely in-memory</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="relative group">
                <div className="absolute inset-0 bg-red-50 dark:bg-red-900/20 rounded-2xl animate-pulse opacity-50"></div>
                <div className="relative bg-red-50/80 dark:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start space-x-3 backdrop-blur-sm">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                      <span className="text-xs text-red-600 dark:text-red-400">✕</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Authentication Failed</h3>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-4 px-6 rounded-2xl text-sm font-semibold transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-slate-400 overflow-hidden ${
                  isLoading 
                    ? 'bg-gradient-to-r from-slate-400 via-zinc-400 to-slate-400 text-white cursor-not-allowed animate-pulse border border-slate-300 dark:border-slate-600' 
                    : 'bg-gradient-to-r from-slate-700 via-zinc-700 to-slate-800 dark:from-slate-600 dark:via-zinc-600 dark:to-slate-700 hover:from-slate-800 hover:via-zinc-800 hover:to-slate-900 dark:hover:from-slate-500 dark:hover:via-zinc-500 dark:hover:to-slate-600 text-white transform hover:scale-[1.02] hover:shadow-xl shadow-lg'
                }`}
              >
                {/* Minimal loading effect */}
                {isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                )}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="absolute left-6 inset-y-0 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border border-white/30 border-t-white"></div>
                  </div>
                )}
                
                {/* Main button content */}
                <span className={`flex items-center space-x-3 transition-all duration-300 ${isLoading ? 'transform scale-95 opacity-80' : ''}`}>
                  {isLoading ? (
                    <>
                      <span className="text-base opacity-80">●</span>
                      <span>Authenticating</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base group-hover:scale-110 transition-transform duration-300">→</span>
                      <span>Connect to GitHub</span>
                    </>
                  )}
                </span>
                
                {/* Subtle success effect */}
                {!isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 transform scale-x-0 group-active:scale-x-100 transition-transform duration-300 origin-center"></div>
                )}
              </button>
            </div>
          </form>

          {/* OAuth Section - Coming Soon */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">Alternative Methods</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="p-4 bg-gradient-to-r from-slate-50 to-zinc-50 dark:from-slate-800/50 dark:to-zinc-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">OAuth Authentication</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      One-click GitHub login coming soon. For now, use your Personal Access Token above.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">Need a token?</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:org"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full inline-flex justify-center py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-md"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-slate-500 dark:text-slate-400">⧉</span>
                  <span>Create GitHub Token</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200 text-slate-400 dark:text-slate-500">→</span>
                </span>
              </a>
            </div>

            {/* Minimal info section */}
            <div className="mt-6 text-center">
              <div className="bg-gradient-to-r from-slate-50 to-zinc-50 dark:from-slate-800/30 dark:to-zinc-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Secure:</span> Your token is processed locally and never stored
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
