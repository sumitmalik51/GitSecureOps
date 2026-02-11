import { motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  GitBranch,
  Users,
  BarChart3,
  Lock,
  ArrowRight,
  Github,
  Zap,
  Eye,
  CheckCircle,
  Terminal,
  ChevronRight,
} from 'lucide-react'
import Button from '@/components/ui/Button'

export default function HomePage() {
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll()
  const navBg = useTransform(scrollYProgress, [0, 0.05], [0, 1])

  const features = [
    {
      icon: Shield,
      title: 'Copilot Management',
      description:
        'Control and monitor GitHub Copilot access across your organization with granular seat-level permissions.',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      icon: Lock,
      title: '2FA Enforcement',
      description:
        'Ensure every team member has two-factor authentication enabled. Get instant compliance visibility.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: GitBranch,
      title: 'Repository Access',
      description:
        'Manage private and public repository access with detailed user-level permission controls.',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      icon: BarChart3,
      title: 'Security Analytics',
      description:
        'Track organization health scores, security alerts, and compliance trends in real-time dashboards.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: Users,
      title: 'User Management',
      description:
        'Bulk manage team members, export access data, and revoke permissions across organizations.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
    {
      icon: Eye,
      title: 'Audit Logging',
      description:
        'Full audit trail of every access change, permission grant, and security event in your org.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Connect GitHub',
      description: 'Sign in with your GitHub account via OAuth. No tokens to copy-paste.',
      icon: Github,
    },
    {
      number: '02',
      title: 'Configure Policies',
      description: 'Set 2FA requirements, Copilot seat limits, and access rules.',
      icon: Shield,
    },
    {
      number: '03',
      title: 'Monitor & Act',
      description: 'Get real-time dashboards, alerts, and one-click remediation.',
      icon: BarChart3,
    },
  ]

  const stats = [
    { value: '10K+', label: 'Developers' },
    { value: '500+', label: 'Organizations' },
    { value: '2M+', label: 'Repos Secured' },
    { value: '99.9%', label: 'Uptime' },
  ]

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text overflow-x-hidden">
      {/* ── Subtle background glow ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-brand-primary/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full bg-brand-secondary/[0.05] blur-[100px]" />
      </div>

      {/* ── Navigation ── */}
      <motion.nav
        className="fixed top-0 inset-x-0 z-50 border-b transition-colors duration-300"
        style={{
          backgroundColor: useTransform(navBg, (v) =>
            `rgba(9,9,11,${v * 0.85})`
          ),
          borderColor: useTransform(navBg, (v) =>
            `rgba(46,46,51,${v * 0.6})`
          ),
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              GitSecureOps
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-dark-text-secondary hover:text-dark-text transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-dark-text-secondary hover:text-dark-text transition-colors"
            >
              How it Works
            </a>
            <a
              href="#stats"
              className="text-sm text-dark-text-secondary hover:text-dark-text transition-colors"
            >
              Stats
            </a>
          </div>

          <div className="flex items-center gap-3">
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
              Get Started
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-dark-border-light/40 bg-dark-surface/60 text-xs text-dark-text-secondary mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now with AI-powered recommendations
            <ChevronRight className="w-3 h-3" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
          >
            Secure your GitHub
            <br />
            <span className="text-gradient-primary">organization</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-dark-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Copilot seat management, 2FA enforcement, access control, and
            real-time compliance monitoring — all in one dashboard built for
            modern engineering teams.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              size="md"
              onClick={() => navigate('/login')}
              className="min-w-[180px] font-medium"
            >
              <Zap className="w-4 h-4 mr-2" />
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="md"
              className="min-w-[180px] font-medium"
            >
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
            </Button>
          </motion.div>

          {/* Terminal preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 max-w-2xl mx-auto"
          >
            <div className="rounded-xl border border-dark-border bg-dark-card/80 backdrop-blur-sm shadow-elevated overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border bg-dark-surface/60">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="text-[11px] text-dark-text-muted ml-2 flex items-center gap-1.5">
                  <Terminal className="w-3 h-3" />
                  GitSecureOps Dashboard
                </span>
              </div>
              <div className="p-5 font-mono text-[13px] leading-relaxed text-left space-y-1.5">
                <div className="text-dark-text-muted">
                  <span className="text-emerald-400">✓</span> Connected to{' '}
                  <span className="text-brand-400">acme-corp</span> organization
                </div>
                <div className="text-dark-text-muted">
                  <span className="text-emerald-400">✓</span> 2FA enforced for{' '}
                  <span className="text-white">142/142</span> members
                </div>
                <div className="text-dark-text-muted">
                  <span className="text-emerald-400">✓</span> Copilot seats:{' '}
                  <span className="text-white">89</span> active,{' '}
                  <span className="text-amber-400">3</span> pending
                </div>
                <div className="text-dark-text-muted">
                  <span className="text-emerald-400">✓</span> Security score:{' '}
                  <span className="text-emerald-400 font-semibold">94/100</span>
                </div>
                <div className="text-dark-text-muted mt-1">
                  <span className="text-brand-400">→</span> All checks passed.
                  Organization is fully compliant.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section id="stats" className="relative z-10 py-12 border-y border-dark-border/50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                className="text-center"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="text-3xl md:text-4xl font-bold tracking-tight text-dark-text">
                  {stat.value}
                </div>
                <div className="text-sm text-dark-text-muted mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to{' '}
              <span className="text-gradient-primary">stay secure</span>
            </h2>
            <p className="text-dark-text-muted text-lg max-w-xl mx-auto">
              Purpose-built tools for GitHub organization security and
              compliance.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group rounded-xl border border-dark-border/60 bg-dark-card/40 p-6 hover:border-dark-border-light hover:bg-dark-card/70 transition-all duration-300"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}
                >
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-dark-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="relative z-10 py-24 px-6 bg-dark-surface/30"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Up and running in{' '}
              <span className="text-gradient-accent">minutes</span>
            </h2>
            <p className="text-dark-text-muted text-lg max-w-md mx-auto">
              Three simple steps to full visibility.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {steps.map((step) => (
              <motion.div
                key={step.number}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="relative rounded-xl border border-dark-border/60 bg-dark-card/40 p-6 text-center"
              >
                <div className="text-[11px] font-semibold tracking-widest text-brand-400 mb-4 uppercase">
                  Step {step.number}
                </div>
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-dark-text-muted leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-24 px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="rounded-2xl border border-dark-border bg-dark-card/60 backdrop-blur-sm p-12 md:p-16 relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-brand-primary/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Start securing your org today
              </h2>
              <p className="text-dark-text-muted text-lg mb-8 max-w-lg mx-auto">
                Free to get started. No credit card required. Connect your
                GitHub account and get instant visibility.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="md"
                  onClick={() => navigate('/login')}
                  className="min-w-[180px] font-medium"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Connect GitHub
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="min-w-[180px] font-medium"
                >
                  Schedule a Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-dark-border/50 bg-dark-surface/20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold tracking-tight">
                  GitSecureOps
                </span>
              </div>
              <p className="text-sm text-dark-text-muted leading-relaxed">
                GitHub security management for modern engineering teams.
              </p>
            </div>

            {/* Links */}
            {[
              {
                title: 'Product',
                items: ['Features', 'Pricing', 'Security', 'Integrations'],
              },
              {
                title: 'Resources',
                items: ['Documentation', 'Blog', 'Guides', 'API Reference'],
              },
              {
                title: 'Company',
                items: [
                  'About',
                  'Contact',
                  'Privacy Policy',
                  'Terms of Service',
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold tracking-wider uppercase text-dark-text-secondary mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-dark-text-muted hover:text-dark-text transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-dark-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-dark-text-muted">
              © {new Date().getFullYear()} GitSecureOps. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-dark-text-muted hover:text-dark-text transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-1.5 text-xs text-dark-text-muted">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                All systems operational
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
