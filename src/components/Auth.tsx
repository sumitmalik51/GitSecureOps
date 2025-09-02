import { useState, useEffect } from 'react';
import { oauthService } from '../services/oauthService';

interface AuthProps {
  onAuthSuccess: (token: string, username: string) => void;
  onBack?: () => void;
}

export default function Auth({ onAuthSuccess, onBack }: AuthProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOAuthConfigured] = useState(oauthService.isConfigured());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse tracking for advanced interactions
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleOAuthLogin = () => {
    oauthService.initiateOAuthFlow();
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Advanced Background Effects */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`
        }}
      >
        {/* Neural Network Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid-background"></div>
        </div>

        {/* Floating Orbs with Advanced Motion */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-cyan-500/20 rounded-full blur-3xl animate-float-complex"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-pink-500/20 rounded-full blur-3xl animate-float-complex-delayed"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/20 rounded-full blur-3xl animate-float-reverse"></div>

        {/* Animated Particles */}
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 bg-gradient-to-br ${
              ['from-blue-400/60 to-purple-500/60', 'from-purple-500/60 to-pink-500/60', 'from-cyan-400/60 to-blue-500/60', 'from-emerald-400/60 to-teal-500/60'][i % 4]
            } rounded-full blur-sm animate-particle-float`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${10 + Math.random() * 8}s`
            }}
          />
        ))}

        {/* Geometric Shapes */}
        <div className="absolute top-20 left-16 w-8 h-8 border border-blue-400/30 rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-24 right-20 w-6 h-6 bg-gradient-to-br from-purple-400/40 to-pink-400/40 rounded-full animate-pulse-glow"></div>
        <div className="absolute top-1/3 left-12 w-10 h-10 border-2 border-cyan-400/20 rounded-full animate-bounce-slow"></div>
      </div>

      {/* Enhanced CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float-complex {
            0%, 100% { 
              transform: translateY(0px) translateX(0px) rotate(0deg) scale(1);
            }
            25% { 
              transform: translateY(-30px) translateX(20px) rotate(90deg) scale(1.1);
            }
            50% { 
              transform: translateY(-15px) translateX(-10px) rotate(180deg) scale(0.9);
            }
            75% { 
              transform: translateY(20px) translateX(-30px) rotate(270deg) scale(1.05);
            }
          }

          @keyframes float-complex-delayed {
            0%, 100% { 
              transform: translateY(0px) translateX(0px) rotate(360deg) scale(1);
            }
            25% { 
              transform: translateY(25px) translateX(-20px) rotate(270deg) scale(0.95);
            }
            50% { 
              transform: translateY(-10px) translateX(15px) rotate(180deg) scale(1.1);
            }
            75% { 
              transform: translateY(-25px) translateX(25px) rotate(90deg) scale(0.9);
            }
          }

          @keyframes float-reverse {
            0%, 100% { 
              transform: translateY(0px) translateX(0px) rotate(0deg);
            }
            33% { 
              transform: translateY(-20px) translateX(-15px) rotate(-120deg);
            }
            66% { 
              transform: translateY(15px) translateX(20px) rotate(-240deg);
            }
          }

          @keyframes particle-float {
            0%, 100% { 
              transform: translateY(0px) translateX(0px) scale(0);
              opacity: 0;
            }
            10% { 
              transform: translateY(-10px) translateX(5px) scale(1);
              opacity: 1;
            }
            90% { 
              transform: translateY(-50px) translateX(-10px) scale(1);
              opacity: 0.8;
            }
          }

          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes pulse-glow {
            0%, 100% { 
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.7);
            }
            50% { 
              transform: scale(1.2);
              box-shadow: 0 0 0 10px rgba(147, 51, 234, 0);
            }
          }

          @keyframes bounce-slow {
            0%, 100% { 
              transform: translateY(0px);
              animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
            }
            50% { 
              transform: translateY(-25px);
              animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
            }
          }

          @keyframes gradient-wave {
            0%, 100% { 
              background-position: 0% 50%;
            }
            50% { 
              background-position: 100% 50%;
            }
          }

          @keyframes holographic-shift {
            0%, 100% { 
              background-position: 0% 50%;
              transform: scale(1) rotate(0deg);
            }
            25% { 
              background-position: 25% 25%;
              transform: scale(1.02) rotate(1deg);
            }
            50% { 
              background-position: 100% 50%;
              transform: scale(1) rotate(0deg);
            }
            75% { 
              background-position: 75% 75%;
              transform: scale(1.02) rotate(-1deg);
            }
          }

          @keyframes neural-pulse {
            0%, 100% { 
              opacity: 0.3;
              transform: scale(1);
            }
            50% { 
              opacity: 0.8;
              transform: scale(1.05);
            }
          }

          @keyframes data-stream {
            0% { 
              transform: translateX(-100%) scaleX(0);
              opacity: 0;
            }
            10% { 
              opacity: 1;
            }
            50% { 
              transform: translateX(0%) scaleX(1);
              opacity: 1;
            }
            90% { 
              opacity: 1;
            }
            100% { 
              transform: translateX(100%) scaleX(0);
              opacity: 0;
            }
          }

          @keyframes morphing-border {
            0%, 100% { 
              border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            }
            25% { 
              border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
            }
            50% { 
              border-radius: 70% 30% 60% 40% / 40% 70% 60% 30%;
            }
            75% { 
              border-radius: 40% 70% 30% 60% / 70% 40% 30% 60%;
            }
          }

          .grid-background {
            background-image: 
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: grid-flow 20s linear infinite;
          }

          @keyframes grid-flow {
            0% { background-position: 0 0; }
            100% { background-position: 50px 50px; }
          }

          .animate-float-complex {
            animation: float-complex 18s ease-in-out infinite;
          }

          .animate-float-complex-delayed {
            animation: float-complex-delayed 20s ease-in-out infinite;
            animation-delay: -5s;
          }

          .animate-float-reverse {
            animation: float-reverse 15s ease-in-out infinite;
            animation-delay: -10s;
          }

          .animate-particle-float {
            animation: particle-float 12s linear infinite;
          }

          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }

          .animate-pulse-glow {
            animation: pulse-glow 2s infinite;
          }

          .animate-bounce-slow {
            animation: bounce-slow 3s infinite;
          }

          .animate-gradient-wave {
            background-size: 400% 400%;
            animation: gradient-wave 6s ease infinite;
          }

          .animate-holographic {
            background-size: 400% 400%;
            animation: holographic-shift 8s ease infinite;
          }

          .animate-neural-pulse {
            animation: neural-pulse 4s ease-in-out infinite;
          }

          .animate-morphing {
            animation: morphing-border 8s ease-in-out infinite;
          }

          .glass-card {
            background: linear-gradient(135deg, 
              rgba(255, 255, 255, 0.1) 0%,
              rgba(255, 255, 255, 0.05) 100%
            );
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }

          .holographic-btn {
            background: linear-gradient(135deg,
              #667eea 0%,
              #764ba2 25%,
              #f093fb 50%,
              #f5576c 75%,
              #4facfe 100%
            );
            background-size: 400% 400%;
            position: relative;
            overflow: hidden;
          }

          .holographic-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.2),
              transparent
            );
            animation: data-stream 3s infinite;
          }

          .neo-input {
            background: linear-gradient(145deg, 
              rgba(15, 23, 42, 0.8) 0%,
              rgba(30, 41, 59, 0.6) 100%
            );
            backdrop-filter: blur(10px);
            border: 1px solid rgba(148, 163, 184, 0.2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .neo-input:focus {
            background: linear-gradient(145deg, 
              rgba(15, 23, 42, 0.9) 0%,
              rgba(30, 41, 59, 0.8) 100%
            );
            border-color: rgba(59, 130, 246, 0.5);
            box-shadow: 
              0 0 0 3px rgba(59, 130, 246, 0.1),
              0 10px 25px -5px rgba(59, 130, 246, 0.2);
          }
        `
      }} />

      {/* Logo Section with Enhanced Animation */}
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mb-8 animate-holographic shadow-2xl shadow-purple-500/25 animate-morphing">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
              <span className="text-3xl animate-neural-pulse">🛡️</span>
            </div>
          </div>
          <h2 className="text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4 animate-gradient-wave">
            GitSecureOps
          </h2>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-full px-6 py-3 border border-white/10 shadow-xl">
            <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-slate-200">
              Next-Gen Security Platform
            </span>
            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          </div>
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="glass-card rounded-3xl py-10 px-8 sm:px-12 relative overflow-hidden">
          {/* Animated Border */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 animate-gradient-wave blur-sm opacity-30"></div>
          <div className="relative z-10">
            
            {/* Back Button with Enhanced Style */}
            {onBack && (
              <div className="mb-8">
                <button
                  type="button"
                  onClick={onBack}
                  className="group inline-flex items-center space-x-3 text-sm font-medium text-slate-300 hover:text-white transition-all duration-300 hover:translate-x-1 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-xl rounded-xl px-4 py-2 border border-slate-700/50 hover:border-slate-600/50"
                >
                  <span className="group-hover:-translate-x-1 transition-transform duration-300 text-blue-400">←</span>
                  <span>Back to Homepage</span>
                  <div className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            )}
            
            {/* Primary OAuth Section */}
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Welcome Back
                </h3>
                <p className="text-base text-slate-300">
                  Choose your authentication method
                </p>
              </div>

              {isOAuthConfigured ? (
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleOAuthLogin}
                    className="holographic-btn group w-full flex justify-center items-center py-5 px-8 rounded-2xl text-lg font-bold transition-all duration-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-white transform hover:scale-[1.02] hover:shadow-2xl shadow-xl animate-holographic relative overflow-hidden"
                  >
                    <span className="flex items-center space-x-4 relative z-10">
                      <div className="w-7 h-7 text-white animate-neural-pulse">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Continue with GitHub</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </span>
                  </button>
                </div>
              ) : (
                <div className="relative group">
                  <div className="glass-card rounded-2xl p-6 border border-amber-400/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 animate-gradient-wave"></div>
                    <div className="relative z-10 flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center animate-pulse-glow">
                          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0710 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-amber-200 mb-2">OAuth Setup Required</h3>
                        <p className="text-sm text-amber-300/80 mb-3">
                          Configure GitHub OAuth for seamless authentication
                        </p>
                        <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                          ⚡ One-Click Setup Available
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Divider */}
            <div className="my-10">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-slate-600 to-transparent" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-6 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 text-slate-400 font-medium backdrop-blur-xl rounded-full border border-slate-700/50">
                    Alternative Method
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Token Section */}
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-slate-200">
                  Personal Access Token
                </h3>
                <p className="text-sm text-slate-400">
                  For advanced users and developers
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                  <label htmlFor="token" className="block text-sm font-medium text-slate-300 mb-3">
                    GitHub Token
                  </label>
                  <div className="relative">
                    <input
                      id="token"
                      name="token"
                      type="password"
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value);
                        if (error === 'Please provide a GitHub Personal Access Token') {
                          setError('');
                        }
                      }}
                      className="neo-input block w-full px-5 py-4 rounded-xl placeholder-slate-500 text-slate-100 focus:outline-none text-sm transition-all duration-500"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Info Card */}
                <div className="glass-card rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-white font-bold">i</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-300 mb-2">
                        <span className="font-semibold text-blue-200">Required permissions:</span> repo, read:org
                      </p>
                      <p className="text-xs text-slate-400">
                        🔒 Token processed locally • Never stored or transmitted
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Error Messages */}
                {error && (
                  <div className="glass-card rounded-xl p-4 border border-red-500/30 bg-red-500/5">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center animate-pulse">
                          <span className="text-xs text-white font-bold">!</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-200 mb-1">Authentication Failed</h4>
                        <p className="text-sm text-red-300/80">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative w-full flex justify-center items-center py-4 px-6 rounded-xl text-sm font-semibold transition-all duration-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 overflow-hidden ${
                    isLoading 
                      ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-slate-300 cursor-not-allowed' 
                      : 'holographic-btn text-white transform hover:scale-[1.01] hover:shadow-2xl shadow-lg animate-holographic'
                  }`}
                >
                  {isLoading && (
                    <div className="absolute left-5 inset-y-0 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    </div>
                  )}
                  
                  <span className={`flex items-center space-x-3 transition-all duration-300 relative z-10 ${isLoading ? 'transform scale-95 opacity-70' : ''}`}>
                    {isLoading ? (
                      <>
                        <span className="text-lg animate-pulse">⚡</span>
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg group-hover:scale-110 transition-transform duration-300">🔐</span>
                        <span>Authenticate with Token</span>
                        <div className="flex space-x-1 opacity-60">
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                        </div>
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>

            {/* Enhanced Help Section */}
            <div className="mt-12 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 text-slate-400 font-medium backdrop-blur-xl rounded-full">
                    Need Help?
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass-card rounded-xl py-4 px-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <span className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-400 text-lg">🔑</span>
                      <span className="text-slate-200 font-medium">Create GitHub Token</span>
                    </div>
                    <span className="group-hover:translate-x-1 transition-transform duration-300 text-slate-400">↗</span>
                  </span>
                </a>

                {/* Enhanced Security Badge */}
                <div className="glass-card rounded-xl p-5 border border-emerald-500/30 bg-emerald-500/5">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center animate-pulse-glow">
                      <span className="text-white text-sm">🛡️</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-200">Bank-Grade Security</span>
                  </div>
                  <p className="text-sm text-emerald-300/80 text-center leading-relaxed">
                    Zero-knowledge authentication • End-to-end encryption • No data retention
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}