import { useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: "🔐",
      title: "Automated Access Control",
      description: "Streamline user permissions across all your repositories with intelligent automation"
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Process thousands of repositories in minutes with our optimized batch operations"
    },
    {
      icon: "🛡️",
      title: "Enterprise Security",
      description: "Bank-grade security with OAuth integration and zero data persistence"
    },
    {
      icon: "📊",
      title: "Advanced Analytics",
      description: "Comprehensive reporting and audit trails for compliance and oversight"
    },
    {
      icon: "🚀",
      title: "Easy Integration",
      description: "Seamlessly integrates with your existing GitHub workflow and CI/CD pipelines"
    },
    {
      icon: "🎯",
      title: "Precision Control",
      description: "Granular permissions management with role-based access controls"
    }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold">🔒</span>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 bg-clip-text text-transparent">
                  GitSecureOps
                </h1>
                <p className="text-xs text-gray-600">Repository Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('security')}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Security
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Contact
              </button>
              <button
                onClick={onGetStarted}
                className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] overflow-hidden border border-blue-500/20"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-left"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('about')}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-left"
                >
                  About
                </button>
                <button 
                  onClick={() => scrollToSection('security')}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-left"
                >
                  Security
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-left"
                >
                  Contact
                </button>
                <button
                  onClick={onGetStarted}
                  className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg text-left overflow-hidden border border-blue-500/20"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              GitHub <span className="text-blue-600">AccessOps</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional GitHub repository management with enterprise-grade security. 
              Streamline user access, automate permissions, and maintain compliance across your entire organization.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={onGetStarted}
                className="group relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-500 transform hover:scale-[1.03] shadow-2xl hover:shadow-blue-500/25 border border-white/10 overflow-hidden backdrop-blur-sm"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <span className="transition-transform duration-300 group-hover:scale-110">🚀</span>
                  Start Managing Access
                  <svg className="w-5 h-5 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                
                {/* Sophisticated layered effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/15 to-white/5 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/10 via-indigo-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"></div>
                <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-r from-white/5 to-transparent opacity-50"></div>
                
                {/* Pulse ring on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 animate-ping"></div>
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="group relative text-blue-600 hover:text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 border-2 border-blue-600 hover:border-blue-700 hover:bg-blue-50 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Learn More
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What GitHub AccessOps Does
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive repository management tools designed for modern development teams
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Built for Modern Development Teams
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                GitSecureOps was built to solve the pain of managing GitHub repos at scale. Whether you're a solo developer or DevSecOps at an enterprise, we offer tools that make repository security and automation faster, smarter, and safer.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Zero data storage - your token stays secure</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Lightning-fast batch operations</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Enterprise-ready security features</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Comprehensive audit trails</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-blue-600 mr-3">🗑️</span>
                  <span>Delete User Access</span>
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-3">🔒</span>
                  <span>List Private Repositories</span>
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-3">🌍</span>
                  <span>List Public Repositories</span>
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-3">📊</span>
                  <span>Export Username Data</span>
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-3">🏢</span>
                  <span>Organization Management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Enterprise-Grade Security
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Your security is our top priority. GitHub AccessOps follows industry best practices 
            to ensure your data and tokens remain secure.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Zero Data Storage</h3>
              <p className="text-gray-600">Your GitHub tokens are never stored on our servers. All operations are performed in memory only.</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">OAuth Integration</h3>
              <p className="text-gray-600">Secure authentication through GitHub's official OAuth system with minimal required permissions.</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Audit Trails</h3>
              <p className="text-gray-600">Complete logging and audit trails for all operations to maintain compliance and transparency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 relative overflow-hidden cta-section"
        style={{
          background: '#ff6b6b',
          backgroundImage: 'linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #ffeaa7 100%)',
          minHeight: '400px'
        }}
      >
        {/* Enhanced Animated Background Effects */}
        <div className="absolute inset-0">
          {/* Bright static overlay to ensure colors are visible */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, #ff9a56, #ffad56, #c44569, #f8b500, #6c5ce7, #a29bfe)',
            }}
          ></div>
          
          {/* Additional bright overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: 'radial-gradient(circle, #fd79a8, #fdcb6e, #6c5ce7, #74b9ff, #00b894)',
            }}
          ></div>
          {/* CSS for background animation */}
          <style dangerouslySetInnerHTML={{
            __html: `
              /* Simplified animations */
              .cta-section {
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7) !important;
              }
            `
          }} />
          
          {/* Multiple layered gradient animations with stronger colors */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/50 via-yellow-400/50 to-green-400/50"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-blue-400/40 via-purple-400/40 to-pink-400/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 via-cyan-500/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-lime-400/25 via-indigo-500/25 to-rose-500/25"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/35 via-violet-400/20 to-transparent"></div>
          
          {/* Enhanced Floating Particles with more visibility and variety */}
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-purple-400 rounded-full opacity-90 animate-bounce shadow-2xl shadow-purple-400/80" style={{animationDelay: '0s', animationDuration: '3s', filter: 'blur(0.5px)'}}></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-blue-400 rounded-full opacity-95 animate-bounce shadow-2xl shadow-blue-400/80" style={{animationDelay: '1s', animationDuration: '4s', filter: 'blur(0.5px)'}}></div>
          <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-green-400 rounded-full opacity-85 animate-bounce shadow-2xl shadow-green-400/80" style={{animationDelay: '2s', animationDuration: '5s', filter: 'blur(0.5px)'}}></div>
          <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-yellow-400 rounded-full opacity-90 animate-bounce shadow-2xl shadow-yellow-400/80" style={{animationDelay: '0.5s', animationDuration: '3.5s', filter: 'blur(0.5px)'}}></div>
          <div className="absolute bottom-1/4 right-1/5 w-3 h-3 bg-pink-400 rounded-full opacity-95 animate-bounce shadow-2xl shadow-pink-400/80" style={{animationDelay: '1.5s', animationDuration: '4.5s', filter: 'blur(0.5px)'}}></div>
          <div className="absolute top-3/4 left-1/5 w-3 h-3 bg-cyan-400 rounded-full opacity-85 animate-bounce shadow-2xl shadow-cyan-400/80" style={{animationDelay: '2.5s', animationDuration: '6s', filter: 'blur(0.5px)'}}></div>
          <div className="absolute top-1/6 right-1/2 w-4 h-4 bg-rose-400 rounded-full opacity-90 animate-bounce shadow-2xl shadow-rose-400/80" style={{animationDelay: '3s', animationDuration: '4s', filter: 'blur(0.5px)'}}></div>
          <div className="absolute bottom-1/6 left-1/2 w-3 h-3 bg-indigo-400 rounded-full opacity-85 animate-bounce shadow-2xl shadow-indigo-400/80" style={{animationDelay: '1.2s', animationDuration: '5.5s', filter: 'blur(0.5px)'}}></div>
          <div className="absolute top-2/3 right-1/6 w-2 h-2 bg-emerald-400 rounded-full opacity-90 animate-bounce shadow-2xl shadow-emerald-400/80" style={{animationDelay: '2.8s', animationDuration: '3.8s', filter: 'blur(0.5px)'}}></div>
          <div className="absolute bottom-2/3 left-1/6 w-4 h-4 bg-violet-400 rounded-full opacity-80 animate-bounce shadow-2xl shadow-violet-400/80" style={{animationDelay: '0.8s', animationDuration: '4.2s', filter: 'blur(0.5px)'}}></div>
          
          {/* Enhanced Moving Gradient Orbs with stronger colors */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-purple-500/40 rounded-full blur-3xl animate-pulse shadow-2xl" style={{animationDuration: '4s'}}></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/35 rounded-full blur-3xl animate-pulse shadow-2xl" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-green-500/30 rounded-full blur-3xl animate-pulse shadow-2xl transform -translate-x-1/2 -translate-y-1/2" style={{animationDelay: '4s', animationDuration: '6s'}}></div>
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-yellow-500/25 rounded-full blur-3xl animate-pulse shadow-2xl" style={{animationDelay: '1s', animationDuration: '4.5s'}}></div>
          <div className="absolute bottom-1/4 left-1/4 w-56 h-56 bg-pink-500/30 rounded-full blur-3xl animate-pulse shadow-2xl" style={{animationDelay: '3s', animationDuration: '5.5s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 relative">
            <span className="bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent animate-pulse">
              Ready to Streamline Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 bg-clip-text text-transparent relative">
              GitHub Management?
              {/* Sparkle effects around the text */}
              <span className="absolute -top-2 -right-2 text-yellow-400 animate-bounce text-2xl">✨</span>
              <span className="absolute -bottom-2 -left-2 text-purple-400 animate-bounce text-xl" style={{animationDelay: '0.5s'}}>⭐</span>
              <span className="absolute top-1/2 -right-8 text-blue-400 animate-bounce text-lg" style={{animationDelay: '1s'}}>💫</span>
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join development teams who trust GitSecureOps for their repository management needs.
          </p>
          <button
            onClick={onGetStarted}
            className="group relative text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-700 transform hover:scale-[1.05] shadow-2xl hover:shadow-purple-500/40 border-2 border-white/20 hover:border-white/40 overflow-hidden backdrop-blur-sm"
            style={{
              background: 'linear-gradient(45deg, #8b5cf6, #3b82f6, #10b981, #8b5cf6)',
              backgroundSize: '400% 400%',
              animation: 'gradientShift 3s ease infinite'
            }}
          >
            {/* CSS Keyframes in a style tag */}
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes gradientShift {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                @keyframes sparkleRotate {
                  0% { transform: rotate(0deg) scale(1); }
                  25% { transform: rotate(90deg) scale(1.1); }
                  50% { transform: rotate(180deg) scale(1); }
                  75% { transform: rotate(270deg) scale(1.1); }
                  100% { transform: rotate(360deg) scale(1); }
                }
                @keyframes shimmerSweep {
                  0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
                  50% { opacity: 1; }
                  100% { transform: translateX(200%) skewX(-15deg); opacity: 0; }
                }
                @keyframes pulseGlow {
                  0%, 100% { opacity: 0.3; transform: scale(1); }
                  50% { opacity: 0.8; transform: scale(1.02); }
                }
                @keyframes floatingParticle {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-10px) rotate(180deg); }
                }
              `
            }} />
            
            <span className="relative z-10 flex items-center gap-4">
              <span 
                className="transition-all duration-500 group-hover:scale-125"
                style={{
                  animation: 'sparkleRotate 2s ease-in-out infinite',
                  display: 'inline-block'
                }}
              >
                ✨
              </span>
              Get Started Now
              <svg className="w-6 h-6 transition-all duration-500 group-hover:translate-x-2 group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            
            {/* Multi-layered sophisticated effects */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/30 to-white/10 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
              style={{
                animation: 'shimmerSweep 2s ease-in-out infinite'
              }}
            ></div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl pointer-events-none"></div>
            <div className="absolute inset-[2px] rounded-2xl bg-gradient-to-r from-white/10 to-white/5 opacity-60 pointer-events-none"></div>
            
            {/* Enhanced pulse ring effects */}
            <div 
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/40 via-blue-500/40 to-green-500/40 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
              style={{
                animation: 'pulseGlow 1.5s ease-in-out infinite'
              }}
            ></div>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 animate-ping pointer-events-none"></div>
            
            {/* Outer glow effect */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-700 pointer-events-none"></div>
          </button>
        </div>
      </section>

      {/* Contact/Footer Section */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">🔒</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">GitHub AccessOps</h3>
                  <p className="text-sm text-gray-400">Repository Management</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Enterprise-grade GitHub access controls with built-in automation.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('features')} className="text-gray-400 hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-white transition-colors">About</button></li>
                <li><button onClick={() => scrollToSection('security')} className="text-gray-400 hover:text-white transition-colors">Security</button></li>
                <li><button onClick={onGetStarted} className="text-gray-400 hover:text-white transition-colors">Get Started</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Developer</h4>
              <p className="text-gray-400 mb-2">Created by Sumit Malik</p>
              <div className="flex space-x-4">
                <a 
                  href="https://github.com/sumitmalik51" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  GitHub
                </a>
                <a 
                  href="https://linkedin.com/in/sumitmalik51" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
                <a 
                  href="https://sumitmalik51.github.io/sumitmalik51/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Portfolio
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 GitSecureOps. Built with ❤️ using React & TypeScript.
            </p>
            <p className="text-gray-400 mt-2">
              🔒 Secure • ⚡ Fast • 🛡️ Reliable | Version 1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}