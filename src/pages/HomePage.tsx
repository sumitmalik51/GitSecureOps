import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Shield, 
  GitBranch, 
  Users, 
  BarChart3, 
  Lock, 
  Star,
  ArrowRight,
  Github,
  Zap,
  Eye,
  UserCheck,
  Twitter,
  Linkedin,
  FileText,
  Mail,
  CreditCard,
  BookOpen,
  ChevronRight
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function HomePage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: Shield,
      title: 'Copilot Management',
      description: 'Control and monitor GitHub Copilot access across your organization with granular permissions.',
      theme: 'purple'
    },
    {
      icon: Lock,
      title: '2FA Enforcement',
      description: 'Ensure all team members have two-factor authentication enabled for maximum security.',
      theme: 'green'
    },
    {
      icon: GitBranch,
      title: 'Repository Access Control',
      description: 'Manage private and public repository access with detailed user permissions.',
      theme: 'blue'
    },
    {
      icon: BarChart3,
      title: 'Compliance Monitoring',
      description: 'Track security compliance and generate detailed reports for auditing purposes.',
      theme: 'purple'
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Efficiently manage team members, export user data, and control access levels.',
      theme: 'green'
    },
    {
      icon: Eye,
      title: 'Activity Monitoring',
      description: 'Monitor repository activity, PRs, commits, and issues in real-time.',
      theme: 'blue'
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Connect GitHub',
      description: 'Securely connect your GitHub organization with OAuth authentication.',
      icon: Github
    },
    {
      number: '02',
      title: 'Manage Access',
      description: 'Set permissions, enforce 2FA, and control Copilot access for team members.',
      icon: Shield
    },
    {
      number: '03',
      title: 'Monitor Compliance',
      description: 'Track security metrics and generate compliance reports effortlessly.',
      icon: BarChart3
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 20,
        duration: 0.6
      }
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-dark-bg to-brand-secondary/10" />
        <motion.div
          className="absolute top-1/4 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-gradient-to-r from-brand-secondary/15 to-brand-primary/15 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-brand-accent/10 to-brand-primary/10 blur-2xl"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        {/* Network nodes effect */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-brand-secondary rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      </div>
      {/* Navigation */}
      <motion.nav 
        className="relative z-50 px-6 py-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient-primary">GitSecureOps</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="nav-item">Features</a>
            <a href="#how-it-works" className="nav-item">How it Works</a>
            <a href="#testimonials" className="nav-item">Testimonials</a>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => navigate('/login')}
            >
              Connect GitHub
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 min-h-screen flex items-center hero-glow">
        <motion.div 
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="max-w-4xl mx-auto text-center" variants={itemVariants}>
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight relative"
              variants={itemVariants}
            >
              <span className="text-gradient-primary relative inline-block">
                Secure Your GitHub
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{
                    x: ['-100%', '100%', '200%'],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 8,
                    ease: 'easeInOut',
                  }}
                />
              </span>
              <br />
              <span className="text-gradient-accent">Organization</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl mb-10 text-dark-text-muted max-w-2xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Comprehensive GitHub security management with Copilot access control, 
              2FA enforcement, and real-time compliance monitoring for modern development teams.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
              variants={itemVariants}
            >
              <Button 
                size="md" 
                onClick={() => navigate('/login')}
                className="min-w-[180px] font-semibold group"
              >
                <Zap className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button 
                variant="outline" 
                size="md"
                className="min-w-[180px] font-semibold"
              >
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </Button>
            </motion.div>

            {/* Trust Signals */}
            <motion.div 
              className="flex flex-wrap justify-center items-center gap-6 text-dark-text-muted text-sm"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-brand-secondary" />
                <span>10K+ Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-brand-primary" />
                <span>SOC2 Compliant</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20 bg-dark-surface/50">
        <motion.div 
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient-primary">
              Powerful Features for Modern Teams
            </h2>
            <p className="text-lg text-dark-text-muted max-w-2xl mx-auto">
              Everything you need to manage, secure, and monitor your GitHub organization effectively.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-6 h-full group relative overflow-hidden transition-all duration-500 ease-in-out no-blur-hover">
                  {/* Colored background based on theme */}
                  <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 transition-all duration-500 ${
                    feature.theme === 'purple' ? 'bg-purple-500' : 
                    feature.theme === 'green' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 ease-out no-blur-hover ${
                    feature.theme === 'purple' ? 'bg-purple-500/20 text-purple-400' : 
                    feature.theme === 'green' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-dark-text transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-dark-text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-6 py-20">
        <motion.div 
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient-accent">
              How It Works
            </h2>
            <p className="text-lg text-dark-text-muted max-w-xl mx-auto">
              Get started in minutes with our simple three-step process.
            </p>
          </motion.div>

          {/* Connected Stepper Design */}
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent transform -translate-y-1/2 hidden md:block opacity-30" />
            
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div key={index} variants={itemVariants} className="relative">
                  <Card className="p-6 text-center group relative z-10 transition-all duration-500 ease-in-out no-blur-hover">
                    {/* Step connector */}
                    {index < steps.length - 1 && (
                      <ChevronRight className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-primary hidden md:block z-20 transition-all duration-300" />
                    )}
                    
                    <div className="w-12 h-12 rounded-full gradient-accent mx-auto mb-4 flex items-center justify-center font-bold text-white group-hover:scale-110 transition-all duration-500 ease-out relative z-10 no-blur-hover">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-semibold text-brand-secondary mb-2 tracking-wider">
                      STEP {step.number}
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-dark-text">
                      {step.title}
                    </h3>
                    <p className="text-sm text-dark-text-muted leading-relaxed">
                      {step.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Card className="p-10 gradient-primary text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-secondary opacity-90" />
            <motion.div
              className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-white/10 blur-xl"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Start Securing Your GitHub Today
              </h2>
              <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
                Join thousands of teams who trust GitSecureOps to keep their code secure.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="ghost" 
                  size="md"
                  onClick={() => navigate('/login')}
                  className="min-w-[160px] bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-300"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Connect Now
                </Button>
                <Button 
                  variant="outline" 
                  size="md"
                  className="min-w-[160px] bg-white text-brand-primary border-white hover:bg-gray-100 transition-all duration-300"
                >
                  Schedule Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-dark-border bg-dark-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6 mb-10">
            {/* Brand Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gradient-primary">GitSecureOps</span>
              </div>
              <p className="text-dark-text-muted text-sm leading-relaxed pr-4">
                The comprehensive GitHub security management platform trusted by development teams worldwide.
              </p>
              
              {/* Social Media */}
              <div className="flex space-x-3">
                <motion.a 
                  href="#" 
                  className="w-8 h-8 rounded-lg bg-dark-border/50 hover:bg-brand-primary/20 flex items-center justify-center transition-all duration-300 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Github className="w-4 h-4 text-dark-text-muted group-hover:text-brand-primary transition-colors duration-300" />
                </motion.a>
                <motion.a 
                  href="#" 
                  className="w-8 h-8 rounded-lg bg-dark-border/50 hover:bg-brand-primary/20 flex items-center justify-center transition-all duration-300 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Twitter className="w-4 h-4 text-dark-text-muted group-hover:text-brand-primary transition-colors duration-300" />
                </motion.a>
                <motion.a 
                  href="#" 
                  className="w-8 h-8 rounded-lg bg-dark-border/50 hover:bg-brand-primary/20 flex items-center justify-center transition-all duration-300 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Linkedin className="w-4 h-4 text-dark-text-muted group-hover:text-brand-primary transition-colors duration-300" />
                </motion.a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-dark-text mb-3 text-sm">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm">Features</a></li>
                <li><a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm flex items-center">Pricing <CreditCard className="w-3 h-3 ml-1" /></a></li>
                <li><a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm">Security</a></li>
                <li><a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm">Integrations</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-dark-text mb-3 text-sm">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm flex items-center">Documentation <FileText className="w-3 h-3 ml-1" /></a></li>
                <li><a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm flex items-center">Blog <BookOpen className="w-3 h-3 ml-1" /></a></li>
                <li><a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm">Guides</a></li>
                <li><a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm">API Reference</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-dark-text mb-3 text-sm">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm">About Us</a></li>
                <li><a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm flex items-center">Contact <Mail className="w-3 h-3 ml-1" /></a></li>
                <li><a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300 text-sm">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-dark-border">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
              <p className="text-dark-text-muted text-xs">
                © 2025 GitSecureOps. All rights reserved. Made with ❤️ for developers.
              </p>
              <div className="flex items-center space-x-4 text-xs">
                <a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300">Status</a>
                <a href="#" className="text-dark-text-muted hover:text-brand-primary transition-colors duration-300">Changelog</a>
                <div className="flex items-center space-x-2">
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-green-400"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-dark-text-muted">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
