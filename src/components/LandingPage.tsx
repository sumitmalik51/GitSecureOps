import { useState } from 'react';
import DarkModeToggle from './ui/DarkModeToggle';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes customBounce {
            0%, 6.25% { transform: translateY(0); }
            3.125% { transform: translateY(-25px); }
            12.5%, 100% { transform: translateY(0); }
          }
          .custom-bounce {
            animation: customBounce 32s infinite;
          }
          
          @keyframes fadeIn {
            from { 
              opacity: 0; 
              transform: translateY(30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          .animate-fade-in {
            animation: fadeIn 1s ease-out forwards;
            opacity: 0;
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `
      }} />
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo - Left Corner */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold">🔒</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 bg-clip-text text-transparent">
                  GitSecureOps
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Repository Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                Contact
              </button>
              <DarkModeToggle />
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
            <div className="md:hidden flex items-center space-x-2">
              <DarkModeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors text-left"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('about')}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors text-left"
                >
                  About
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors text-left"
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
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200/30 rounded-full animate-bounce" style={{animationDelay: '0s', animationDuration: '6s'}}></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200/40 rounded-full animate-bounce" style={{animationDelay: '2s', animationDuration: '8s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-indigo-200/50 rounded-full animate-bounce" style={{animationDelay: '4s', animationDuration: '7s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 custom-bounce bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Git<span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">SecureOps</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto animate-fade-in" style={{animationDelay: '0.5s'}}>
              Professional GitHub repository management with enterprise-grade security. 
              Streamline user access, automate permissions, and maintain compliance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={onGetStarted}
                className="group relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-500 transform hover:scale-[1.03] shadow-2xl hover:shadow-blue-500/25 animate-fade-in border border-white/10 overflow-hidden backdrop-blur-sm"
                style={{animationDelay: '0.8s'}}
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
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              💡 What GitSecureOps Does
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Comprehensive GitHub access automation for modern DevSecOps teams.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">🔐 Automated Access Control</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Automatically manage user permissions across all your repositories.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">⚡ Lightning Fast Operations</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Process thousands of repositories in parallel with optimized batching.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">🛡️ Enterprise-Grade Security</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Secure access via PAT (Personal Access Tokens) with zero data persistence.<br />
                <span className="text-blue-600 dark:text-blue-400 font-medium">OAuth integration — coming soon.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                👨‍💻 Built for Modern Teams
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                GitSecureOps was built to solve the pain of managing GitHub repos at scale. Whether you're a solo developer or DevSecOps at an enterprise, we offer tools that make repository security and automation faster, smarter, and safer.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✅</span>
                  <span className="text-gray-700 dark:text-gray-300">No data storage — token is used in-memory only</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✅</span>
                  <span className="text-gray-700 dark:text-gray-300">Batch operations — handle access at scale</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✅</span>
                  <span className="text-gray-700 dark:text-gray-300">Enterprise-ready — built with security-first principles</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-600">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">�️ Key Features</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-4 text-xl flex-shrink-0">🗑️</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Delete User Access</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Remove users from all repos in one click</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-4 text-xl flex-shrink-0">🔒</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">List Private Repos</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Get an instant view of sensitive codebases</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-4 text-xl flex-shrink-0">🌍</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">List Public Repos</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Audit all open-source repositories</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-4 text-xl flex-shrink-0">📊</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Export User Data</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Download user and access reports</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-4 text-xl flex-shrink-0">🏢</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Org Management</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Navigate and manage GitHub organizations easily</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Streamline Your GitHub Management?
          </h2>
          <p className="text-xl text-blue-100 dark:text-blue-200 mb-8 max-w-2xl mx-auto">
            Join development teams who trust GitSecureOps for their repository management needs.
          </p>
          <button
            onClick={onGetStarted}
            className="group relative bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 hover:from-purple-700 hover:via-blue-700 hover:to-green-700 text-white px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-500 transform hover:scale-[1.03] shadow-2xl hover:shadow-purple-500/25 border border-white/10 overflow-hidden backdrop-blur-sm"
          >
            <span className="relative z-10 flex items-center gap-3">
              <span className="transition-all duration-300 group-hover:rotate-12 group-hover:scale-110">✨</span>
              Get Started Now
              <svg className="w-5 h-5 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            
            {/* Advanced layered effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/15 to-white/5 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/10 via-blue-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"></div>
            <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-r from-white/5 to-transparent opacity-50"></div>
            
            {/* Rotating gradient border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 opacity-0 group-hover:opacity-30 animate-pulse"></div>
          </button>
        </div>
      </section>

      {/* Contact/Footer Section */}
      <footer id="contact" className="bg-gray-900 dark:bg-gray-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">🔒</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">GitSecureOps</h3>
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
};

export default LandingPage;