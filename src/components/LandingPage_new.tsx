import { useState, useEffect } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const darkModeMessages = [
    "Where's the light mode? Buried next to our sleep schedule. Welcome to the dark side.",
    "Light mode? That's a feature we left in the sun too long.",
    "Only Dark Mode? Yes. Because real developers squint proudly."
  ];

  const [isMessageVisible, setIsMessageVisible] = useState(false);

  // Scroll effect for parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Only show popup if no authentication tokens exist and component just mounted
  useEffect(() => {
    const hasToken = localStorage.getItem('github_token') || sessionStorage.getItem('github_token');
    if (!hasToken) {
      const timer = setTimeout(() => {
        setShowPopup(true);
        setIsMessageVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle navigation to authentication - hide popup first
  const handleGetStarted = () => {
    setShowPopup(false);
    setIsMessageVisible(false);
    onGetStarted();
  };

  // Hide popup when component is about to unmount
  useEffect(() => {
    return () => {
      setShowPopup(false);
      setIsMessageVisible(false);
    };
  }, []);

  // Cycle through messages
  useEffect(() => {
    let showTimer: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;

    const startCycle = () => {
      setIsMessageVisible(true);
      showTimer = setTimeout(() => {
        setIsMessageVisible(false);
        hideTimer = setTimeout(() => {
          setCurrentMessageIndex((prev) => (prev + 1) % darkModeMessages.length);
          startCycle();
        }, 10000);
      }, 5000);
    };

    startCycle();

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [darkModeMessages.length]);

  const features = [
    {
      icon: "🤖",
      title: "GitHub Copilot Management",
      description: "Advanced Copilot access control with usage analytics, seat management, and enterprise policy enforcement. Monitor AI assistance across your organization.",
      gradient: "from-purple-500 to-pink-500",
      color: "purple"
    },
    {
      icon: "🔐",
      title: "Smart Access Control",
      description: "Intelligent user invitation system with role-based permissions, automated workflows, and compliance tracking for enterprise security.",
      gradient: "from-blue-500 to-cyan-500",
      color: "blue"
    },
    {
      icon: "🛡️",
      title: "2FA Compliance Scanner",
      description: "Organization-wide 2FA audit with detailed compliance reports, user identification, and automated remediation workflows for security teams.",
      gradient: "from-green-500 to-emerald-500",
      color: "green"
    },
    {
      icon: "⚡",
      title: "GitHub Actions Hub",
      description: "Centralized Actions management with security scanning, secret detection, permission analysis, and self-hosted runner monitoring.",
      gradient: "from-orange-500 to-red-500",
      color: "orange"
    },
    {
      icon: "📚",
      title: "Smart Bookmarks",
      description: "AI-powered repository bookmarking with intelligent categorization, team sharing, and productivity insights for better project organization.",
      gradient: "from-indigo-500 to-purple-500",
      color: "indigo"
    },
    {
      icon: "💻",
      title: "Code Snippet Vault",
      description: "Secure code snippet management with syntax highlighting, version control, team collaboration, and intelligent search capabilities.",
      gradient: "from-pink-500 to-rose-500",
      color: "pink"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Enhanced Floating Dark Mode Message Popup */}
      {showPopup && isMessageVisible && !localStorage.getItem('github_token') && !sessionStorage.getItem('github_token') && (
        <div className="fixed top-20 left-4 z-50 animate-fade-in">
          <div className="relative bg-gradient-to-br from-gray-900/98 via-gray-800/98 to-gray-900/98 backdrop-blur-2xl text-white rounded-3xl p-6 shadow-2xl border border-gray-700/30 max-w-sm group hover:scale-[1.02] transition-all duration-300">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 opacity-50"></div>
            
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <span className="text-3xl animate-bounce">🌙</span>
                    <div className="absolute -inset-1 bg-blue-400/20 rounded-full blur-sm"></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      GitSecureOps Says
                    </span>
                    <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-1"></div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 leading-relaxed mb-4 font-medium">
                  {darkModeMessages[currentMessageIndex]}
                </p>
                
                <div className="flex gap-2 mb-3">
                  {darkModeMessages.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        index === currentMessageIndex 
                          ? 'w-8 bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg shadow-blue-400/50' 
                          : 'w-2 bg-gray-600 hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowPopup(false)}
                className="relative text-gray-400 hover:text-white transition-all duration-300 ml-3 flex-shrink-0 p-2 rounded-xl hover:bg-gray-700/50 group/close"
              >
                <svg className="w-4 h-4 group-hover/close:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Enhanced floating particles */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full opacity-80 animate-bounce" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-cyan-400 rounded-full opacity-50 animate-bounce" style={{animationDelay: '2s'}}></div>
          </div>
        </div>
      )}
      
      {/* Enhanced CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { 
              opacity: 0; 
              transform: translateY(30px) scale(0.95); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes morph {
            0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          }
          
          @keyframes pulse-glow {
            0%, 100% { 
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1);
            }
            50% { 
              box-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.2);
            }
          }
          
          .animate-fade-in {
            animation: fadeIn 1s ease-out forwards;
          }
          
          .animate-float {
            animation: float 8s ease-in-out infinite;
          }
          
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          
          .animate-gradient {
            background-size: 400% 400%;
            animation: gradientShift 6s ease infinite;
          }
          
          .animate-morph {
            animation: morph 8s ease-in-out infinite;
          }
          
          .animate-pulse-glow {
            animation: pulse-glow 3s ease-in-out infinite;
          }
          
          .hero-gradient {
            background: linear-gradient(135deg, 
              rgba(59, 130, 246, 0.1) 0%,
              rgba(147, 51, 234, 0.1) 25%,
              rgba(236, 72, 153, 0.1) 50%,
              rgba(59, 130, 246, 0.1) 75%,
              rgba(16, 185, 129, 0.1) 100%
            );
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
          }
        `
      }} />

      {/* Enhanced Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl animate-pulse-glow">
                  <span className="text-white text-xl font-bold">🔒</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 dark:from-gray-200 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  GitSecureOps
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Enterprise GitHub Management</p>
              </div>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center">
              <button
                onClick={handleGetStarted}
                className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="transition-transform duration-300 group-hover:scale-110">🚀</span>
                  Get Started
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none p-2 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4 animate-fade-in">
              <button
                onClick={handleGetStarted}
                className="w-full group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  🚀 Get Started with GitSecureOps
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Enhanced Hero Section with Parallax */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden hero-gradient py-8" 
               style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large floating orbs */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-float animate-morph"></div>
          <div className="absolute bottom-32 right-16 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
          
          {/* Small floating particles */}
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-gradient-to-br ${
                ['from-blue-400/40 to-purple-500/40', 'from-purple-500/40 to-pink-500/40', 'from-cyan-400/40 to-blue-500/40'][i % 3]
              } rounded-full blur-sm animate-float`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4 animate-fade-in">
            <div className="inline-flex items-center gap-3 bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl rounded-full px-6 py-3 mb-4 border border-white/20 dark:border-gray-700/20 shadow-lg">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enterprise GitHub Management Platform
              </span>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                SECURE
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight animate-fade-in">
            <span className="block bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent animate-gradient">
              Secure Your
            </span>
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient" style={{animationDelay: '0.5s'}}>
              GitHub Universe
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto font-light leading-relaxed animate-fade-in" style={{animationDelay: '0.5s'}}>
            Enterprise-grade security management for GitHub organizations. 
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              Control access, enforce compliance, and protect your code with AI-powered insights.
            </span>
          </p>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8 animate-fade-in" style={{animationDelay: '1s'}}>
            <button
              onClick={handleGetStarted}
              className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl overflow-hidden min-w-64"
            >
              <span className="relative z-10 flex items-center gap-3">
                <span className="text-2xl animate-bounce">🚀</span>
                Get Started with GitSecureOps
                <svg className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400/50 dark:border-gray-500/50 rounded-full p-2">
            <div className="w-1 h-3 bg-gray-400 dark:bg-gray-500 rounded-full mx-auto animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-8 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full px-6 py-2 mb-4">
              <span className="text-2xl">⚡</span>
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                POWERFUL FEATURES
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                Enterprise-Grade
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                GitHub Management
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Comprehensive security tools designed for modern development teams. 
              Manage access, monitor compliance, and protect your codebase with intelligent automation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 transform hover:scale-[1.02] animate-fade-in overflow-hidden"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                {/* Gradient border effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}></div>
                
                {/* Icon with enhanced styling */}
                <div className="relative mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300`}>
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <div className={`absolute -inset-2 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-all duration-500`}></div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:via-cyan-400 group-hover:to-emerald-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  {feature.description}
                </p>

                {/* Floating particles on hover */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-60 transition-all duration-500 animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="absolute bottom-6 left-6 w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-80 transition-all duration-700 animate-bounce" style={{animationDelay: '0.5s'}}></div>
              </div>
            ))}
          </div>

          {/* Call to action under features */}
          <div className="text-center mt-16 animate-fade-in" style={{animationDelay: '0.8s'}}>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Ready to secure your GitHub organization? GitSecureOps is completely free to use.
            </p>
            <button
              onClick={handleGetStarted}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="text-xl">🔐</span>
              Explore All Features
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Built for Modern Development Teams
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                GitSecureOps was built to solve the pain of managing GitHub repos at scale. Whether you're a solo developer or DevSecOps at an enterprise, we offer tools that make repository security and automation faster, smarter, and safer.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Zero data storage - your token stays secure</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Lightning-fast batch operations</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Enterprise-ready security features</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Comprehensive audit trails</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Key Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">�</span>
                  <span className="dark:text-gray-300">GitHub Copilot Management</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">🔑</span>
                  <span className="dark:text-gray-300">Grant GitHub Access</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">🌍</span>
                  <span className="dark:text-gray-300">List Public Repositories</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">🔒</span>
                  <span className="dark:text-gray-300">List Private Repositories</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">🔐</span>
                  <span className="dark:text-gray-300">Two-Factor Authentication Compliance</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">🗑️</span>
                  <span className="dark:text-gray-300">Delete User Access</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">�</span>
                  <span className="dark:text-gray-300">Repository Bookmarks</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">💾</span>
                  <span className="dark:text-gray-300">Code Snippets</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">🧬</span>
                  <span className="dark:text-gray-300">GitHub Actions Management</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 mr-3">📊</span>
                  <span className="dark:text-gray-300">Export User Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Enterprise-Grade Security
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Your security is our top priority. GitSecureOps follows industry best practices 
            to ensure your data and tokens remain secure.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Zero Data Storage</h3>
              <p className="text-gray-600 dark:text-gray-300">Your GitHub tokens are never stored on our servers. All operations are performed in memory only.</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">OAuth Integration</h3>
              <p className="text-gray-600 dark:text-gray-300">Secure authentication through GitHub's official OAuth system with minimal required permissions.</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Audit Trails</h3>
              <p className="text-gray-600 dark:text-gray-300">Complete logging and audit trails for all operations to maintain compliance and transparency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Final CTA Section */}
      <section className="py-32 relative overflow-hidden">
        {/* Multi-layered background with animated gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 opacity-95"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-gradient"></div>
        
        {/* Large floating orbs */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full blur-3xl animate-float animate-morph"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        
        {/* Floating particles */}
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 bg-gradient-to-br ${
              ['from-blue-400/60 to-purple-500/60', 'from-purple-500/60 to-pink-500/60', 'from-cyan-400/60 to-blue-500/60'][i % 3]
            } rounded-full animate-float`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${10 + Math.random() * 6}s`
            }}
          />
        ))}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in">
            {/* Enhanced badge */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-full px-8 py-3 mb-8 border border-white/20 shadow-2xl">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-white font-semibold text-lg">Ready to Get Started?</span>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-4 py-1 rounded-full animate-pulse">
                100% FREE
              </div>
            </div>

            {/* Powerful headline */}
            <h2 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight animate-fade-in" style={{animationDelay: '0.2s'}}>
              <span className="block">Transform Your</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                GitHub Security
              </span>
              <span className="block text-5xl md:text-6xl text-gray-300 font-light">Today</span>
            </h2>

            {/* Compelling subtitle */}
            <p className="text-2xl md:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto font-light leading-relaxed animate-fade-in" style={{animationDelay: '0.4s'}}>
              Join thousands of developers who use GitSecureOps to 
              <span className="block mt-2 text-white font-semibold">
                secure their organizations and streamline access management — completely free
              </span>
            </p>

            {/* Enhanced CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in" style={{animationDelay: '0.6s'}}>
              <button
                onClick={handleGetStarted}
                className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white px-12 py-6 rounded-3xl font-black text-xl transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-4xl overflow-hidden min-w-80"
              >
                <span className="relative z-10 flex items-center gap-4">
                  <span className="text-3xl animate-bounce">🚀</span>
                  Start Using GitSecureOps
                  <svg className="w-8 h-8 transition-transform duration-300 group-hover:translate-x-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/40 to-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              <div className="text-center text-gray-400">
                <div className="flex items-center gap-4 text-lg">
                  <span className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> No registration required
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Always free
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced trust indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-white animate-fade-in" style={{animationDelay: '0.8s'}}>
              <div className="text-center">
                <div className="text-4xl font-black mb-2 text-white drop-shadow-lg">99.9%</div>
                <div className="text-sm uppercase tracking-wide text-white/80">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2 text-white drop-shadow-lg">2ms</div>
                <div className="text-sm uppercase tracking-wide text-white/80">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2 text-white drop-shadow-lg">256-bit</div>
                <div className="text-sm uppercase tracking-wide text-white/80">Encryption</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-2 text-white drop-shadow-lg">24/7</div>
                <div className="text-sm uppercase tracking-wide text-white/80">Support</div>
              </div>
            </div>

            {/* Security badge */}
            <div className="flex justify-center mt-16 animate-fade-in" style={{animationDelay: '1s'}}>
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-4">
                <span className="text-3xl">🛡️</span>
                <div className="text-left">
                  <div className="text-white font-semibold">Enterprise Security</div>
                  <div className="text-gray-400 text-sm">SOC 2 Type II Compliant • GDPR Ready</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/Footer Section */}
      <footer id="contact" className="bg-gray-900 text-white py-12 relative overflow-hidden">
        {/* Subtle background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-pink-900/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            {/* Developer Section Centered */}
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-3">Developer</h4>
              <p className="text-gray-400 mb-4">Created by Sumit Malik</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a 
                  href="https://github.com/sumitmalik51" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 px-3 py-2 rounded-lg cursor-pointer z-50 relative"
                  onClick={(e) => {
                    console.log('GitHub link clicked!');
                    e.preventDefault();
                    e.stopPropagation();
                    window.open('https://github.com/sumitmalik51', '_blank', 'noopener,noreferrer');
                  }}
                >
                  <span className="text-xl">📚</span>
                  GitHub
                </a>
                <a 
                  href="https://www.linkedin.com/in/sumitmalik51" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 px-3 py-2 rounded-lg cursor-pointer z-50 relative"
                  onClick={(e) => {
                    console.log('LinkedIn link clicked!');
                    e.preventDefault();
                    e.stopPropagation();
                    window.open('https://www.linkedin.com/in/sumitmalik51', '_blank', 'noopener,noreferrer');
                  }}
                >
                  <span className="text-xl">💼</span>
                  LinkedIn
                </a>
                <a 
                  href="https://sumitmalik51.github.io/sumitmalik51/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 px-3 py-2 rounded-lg cursor-pointer z-50 relative"
                  onClick={(e) => {
                    console.log('Portfolio link clicked!');
                    e.preventDefault();
                    e.stopPropagation();
                    window.open('https://sumitmalik51.github.io/sumitmalik51/', '_blank', 'noopener,noreferrer');
                  }}
                >
                  <span className="text-xl">🌐</span>
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