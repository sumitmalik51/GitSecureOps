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
  UserCheck
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function HomePage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: Shield,
      title: 'Copilot Management',
      description: 'Control and monitor GitHub Copilot access across your organization with granular permissions.'
    },
    {
      icon: Lock,
      title: '2FA Enforcement',
      description: 'Ensure all team members have two-factor authentication enabled for maximum security.'
    },
    {
      icon: GitBranch,
      title: 'Repository Access Control',
      description: 'Manage private and public repository access with detailed user permissions.'
    },
    {
      icon: BarChart3,
      title: 'Compliance Monitoring',
      description: 'Track security compliance and generate detailed reports for auditing purposes.'
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Efficiently manage team members, export user data, and control access levels.'
    },
    {
      icon: Eye,
      title: 'Activity Monitoring',
      description: 'Monitor repository activity, PRs, commits, and issues in real-time.'
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Connect GitHub',
      description: 'Securely connect your GitHub organization with OAuth authentication.'
    },
    {
      number: '02',
      title: 'Manage Access',
      description: 'Set permissions, enforce 2FA, and control Copilot access for team members.'
    },
    {
      number: '03',
      title: 'Monitor Compliance',
      description: 'Track security metrics and generate compliance reports effortlessly.'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'DevOps Manager',
      company: 'TechCorp',
      content: 'GitSecureOps transformed how we manage our GitHub security. The Copilot management features alone saved us thousands.',
      avatar: '👩‍💻'
    },
    {
      name: 'Michael Chen',
      role: 'Security Lead',
      company: 'StartupXYZ',
      content: 'Finally, a comprehensive solution for GitHub compliance. The 2FA enforcement and reporting features are excellent.',
      avatar: '👨‍💼'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
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
      <section className="relative px-6 pt-20 pb-32 overflow-hidden">
        <div className="hero-glow absolute inset-0" />
        
        <motion.div 
          className="max-w-7xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-8 text-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Secure Your{' '}
            <span className="text-gradient-primary">Git Workflows</span>{' '}
            Efficiently
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-dark-text-muted mb-12 max-w-3xl mx-auto text-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Comprehensive GitHub repository management and security platform with Copilot management, 
            2FA enforcement, and real-time compliance monitoring.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/login')}
              className="min-w-[200px]"
            >
              <Github className="w-5 h-5 mr-2" />
              Connect GitHub
            </Button>
            <Button 
              variant="ghost" 
              size="lg"
              className="min-w-[200px]"
            >
              Schedule Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Trust signals */}
          <motion.div 
            className="mt-16 pt-8 border-t border-dark-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <p className="text-dark-text-muted text-sm mb-6">Trusted by development teams worldwide</p>
            <div className="flex justify-center items-center space-x-8 text-dark-text-muted">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-brand-secondary" />
                <span>10K+ Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-brand-primary" />
                <span>SOC2 Compliant</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-32 bg-dark-surface/50">
        <motion.div 
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center mb-20" variants={itemVariants}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient-primary">
              Powerful Features for Modern Teams
            </h2>
            <p className="text-xl text-dark-text-muted max-w-3xl mx-auto">
              Everything you need to manage, secure, and monitor your GitHub organization effectively.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-8 h-full hover:glow-primary group">
                  <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-dark-text group-hover:text-gradient-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-dark-text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-32">
        <motion.div 
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center mb-20" variants={itemVariants}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient-accent">
              How It Works
            </h2>
            <p className="text-xl text-dark-text-muted max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-8 text-center group hover:glow-secondary">
                  <div className="w-16 h-16 rounded-full gradient-accent mx-auto mb-6 flex items-center justify-center text-2xl font-bold text-white group-hover:scale-110 transition-transform duration-300">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-dark-text">
                    {step.title}
                  </h3>
                  <p className="text-dark-text-muted leading-relaxed">
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-32 bg-dark-surface/30">
        <motion.div 
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="text-center mb-20" variants={itemVariants}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient-primary">
              What Our Users Say
            </h2>
            <p className="text-xl text-dark-text-muted">
              Don't just take our word for it.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-8 hover:glow-primary">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary flex items-center justify-center text-2xl mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-dark-text">{testimonial.name}</h4>
                      <p className="text-dark-text-muted text-sm">{testimonial.role} at {testimonial.company}</p>
                    </div>
                  </div>
                  <p className="text-dark-text-muted leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-32">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="p-12 gradient-primary text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Start Securing Your GitHub Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of teams who trust GitSecureOps to keep their code secure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="ghost" 
                size="lg"
                onClick={() => navigate('/login')}
                className="min-w-[200px] bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Zap className="w-5 h-5 mr-2" />
                Connect Now
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="min-w-[200px] bg-white text-brand-primary border-white hover:bg-gray-100"
              >
                Schedule Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-dark-border">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient-primary">GitSecureOps</span>
          </div>
          <p className="text-dark-text-muted text-sm">
            © 2025 GitSecureOps. All rights reserved. Made with ❤️ for developers.
          </p>
        </div>
      </footer>
    </div>
  )
}
