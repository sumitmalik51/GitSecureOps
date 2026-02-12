import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  GitBranch,
  Users,
  Lock,
  ArrowRight,
  Github,
  Zap,
  Eye,
  Terminal,
  ChevronRight,
  Sparkles,
  Brain,
  Radar,
  Fingerprint,
  Activity,
  Cpu,
  Bot,
  Globe,
  Star,
} from 'lucide-react';
import Button from '@/components/ui/Button';

/* ──────────────────────── Animated grid background ──────────────────────── */
function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {[15, 35, 55, 75].map((left) => (
        <motion.div
          key={left}
          className="absolute top-0 w-px h-full"
          style={{
            left: `${left}%`,
            background:
              'linear-gradient(180deg, transparent, rgba(99,102,241,0.08) 30%, rgba(99,102,241,0.03) 70%, transparent)',
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: left * 0.05,
            ease: 'easeInOut',
          }}
        />
      ))}
      {[20, 50, 80].map((top) => (
        <motion.div
          key={top}
          className="absolute left-0 h-px w-full"
          style={{
            top: `${top}%`,
            background:
              'linear-gradient(90deg, transparent, rgba(99,102,241,0.06) 30%, rgba(99,102,241,0.02) 70%, transparent)',
          }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            delay: top * 0.04,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────── Floating orbs ──────────────────────── */
function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          left: '-10%',
          top: '10%',
        }}
        animate={{
          x: [0, 80, 30, 0],
          y: [0, -40, 60, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          right: '-5%',
          top: '30%',
        }}
        animate={{
          x: [0, -60, 20, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.9, 1.05, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(244,114,182,0.06) 0%, transparent 70%)',
          left: '40%',
          bottom: '5%',
        }}
        animate={{
          x: [0, -40, 60, 0],
          y: [0, -60, 20, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ──────────────────────── Beam ray effect ──────────────────────── */
function HeroBeams() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-[2px] h-[50vh]"
        style={{
          background:
            'linear-gradient(180deg, rgba(99,102,241,0.5) 0%, rgba(99,102,241,0.1) 40%, transparent 100%)',
        }}
        animate={{ opacity: [0, 1, 0], scaleY: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {[-30, -15, 15, 30].map((angle) => (
        <motion.div
          key={angle}
          className="absolute left-1/2 top-0 w-[1px] h-[40vh] origin-top"
          style={{
            background: 'linear-gradient(180deg, rgba(99,102,241,0.2) 0%, transparent 100%)',
            transform: `rotate(${angle}deg)`,
          }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: Math.abs(angle) * 0.05,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────── Typing text effect ──────────────────────── */
function TypingText({ words, className = '' }: { words: string[]; className?: string }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    const timer = setTimeout(
      () => {
        if (!isDeleting) {
          setDisplayed(word.slice(0, displayed.length + 1));
          if (displayed.length + 1 === word.length) {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          setDisplayed(word.slice(0, displayed.length - 1));
          if (displayed.length === 0) {
            setIsDeleting(false);
            setWordIdx((i) => (i + 1) % words.length);
          }
        }
      },
      isDeleting ? 40 : 80
    );
    return () => clearTimeout(timer);
  }, [displayed, isDeleting, wordIdx, words]);

  return (
    <span className={className}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="inline-block w-[3px] h-[1em] bg-brand-400 ml-0.5 align-middle rounded-full"
      />
    </span>
  );
}

/* ──────────────────────── Counter animation ──────────────────────── */
function AnimatedCounter({
  target,
  suffix = '',
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const dur = 2;
          const tick = () => {
            const elapsed = (Date.now() - start) / 1000;
            const progress = Math.min(elapsed / dur, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ──────────────────────── Spotlight card ──────────────────────── */
function SpotlightCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouse = useCallback(
    (e: React.MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      className={`relative group overflow-hidden rounded-2xl border border-dark-border/50 bg-dark-card/30 backdrop-blur-sm transition-all duration-300 hover:border-brand-500/30 ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(400px circle at ${x}px ${y}px, rgba(99,102,241,0.12), transparent 60%)`
          ),
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ──────────────────────── Marquee / ticker ──────────────────────── */
function Marquee() {
  const items = [
    'Enterprise-grade security',
    'Zero-trust access control',
    'AI-powered threat detection',
    'Real-time compliance',
    'Automated remediation',
    'SOC 2 ready',
    'GitHub Advanced Security',
    'SAML SSO integration',
  ];
  return (
    <div className="relative overflow-hidden py-4">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-dark-bg to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-dark-bg to-transparent z-10" />
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-sm text-dark-text-muted/60">
            <Sparkles className="w-3.5 h-3.5 text-brand-400/40" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ──────────────────────── Animated particles ──────────────────────── */
function Particles() {
  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-brand-400/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, -10, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                               */
/* ══════════════════════════════════════════════════════════════════════════ */

export default function HomePage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const navBg = useTransform(scrollYProgress, [0, 0.03], [0, 1]);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(heroProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);

  /* ── Data ── */
  const features = [
    {
      icon: Brain,
      title: 'AI Security Agent',
      description:
        'Continuous threat analysis powered by machine learning. Detects anomalous access patterns before they become breaches.',
      color: 'text-violet-400',
      bg: 'from-violet-500/20 to-violet-600/5',
      span: 'md:col-span-2',
    },
    {
      icon: Radar,
      title: 'Threat Radar',
      description:
        'Animated real-time threat visualization. See every vulnerability mapped across your entire attack surface.',
      color: 'text-emerald-400',
      bg: 'from-emerald-500/20 to-emerald-600/5',
      span: '',
    },
    {
      icon: Fingerprint,
      title: 'Zero Trust Access',
      description:
        'Continuous verification. Every identity, every device, every access request — validated in real-time.',
      color: 'text-cyan-400',
      bg: 'from-cyan-500/20 to-cyan-600/5',
      span: '',
    },
    {
      icon: Activity,
      title: 'Live Pulse Monitor',
      description:
        'Organization heartbeat in real-time. Every push, PR, review, and deployment — streaming live.',
      color: 'text-pink-400',
      bg: 'from-pink-500/20 to-pink-600/5',
      span: 'md:col-span-2',
    },
    {
      icon: Cpu,
      title: 'Smart Automation',
      description:
        'AI-driven policy enforcement. Auto-revoke stale access, enforce 2FA, and remediate drift — zero human intervention.',
      color: 'text-amber-400',
      bg: 'from-amber-500/20 to-amber-600/5',
      span: '',
    },
    {
      icon: Eye,
      title: 'Deep Audit Trail',
      description:
        'Every permission change, every login, every API call — cryptographically logged and instantly searchable.',
      color: 'text-blue-400',
      bg: 'from-blue-500/20 to-blue-600/5',
      span: '',
    },
    {
      icon: Bot,
      title: 'Copilot Governance',
      description:
        'Control AI coding assistants at scale. Seat management, usage analytics, ROI tracking, and policy enforcement.',
      color: 'text-purple-400',
      bg: 'from-purple-500/20 to-purple-600/5',
      span: 'md:col-span-2',
    },
  ];

  const stats = [
    { value: 10000, suffix: '+', label: 'Developers Protected', icon: Users },
    { value: 500, suffix: '+', label: 'Organizations', icon: Globe },
    { value: 2, suffix: 'M+', label: 'Repos Secured', icon: GitBranch },
    { value: 99, suffix: '.9%', label: 'Uptime SLA', icon: Activity },
  ];

  const steps = [
    {
      number: '01',
      title: 'Connect in Seconds',
      description:
        'One OAuth click. No tokens, no config files, no agents to install. Your GitHub org is connected instantly.',
      icon: Github,
      gradient: 'from-violet-500 to-indigo-600',
    },
    {
      number: '02',
      title: 'AI Analyzes Everything',
      description:
        'Our AI agent scans every repo, permission, workflow, and identity. It builds a complete security graph in under 60 seconds.',
      icon: Brain,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      number: '03',
      title: 'Protect & Automate',
      description:
        'Get instant security grades, real-time alerts, and one-click remediation. Threats are neutralized before they escalate.',
      icon: Shield,
      gradient: 'from-pink-500 to-rose-600',
    },
  ];

  const trustedBy = ['Vercel', 'Linear', 'Supabase', 'Railway', 'Resend', 'Neon', 'Turso', 'Clerk'];

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text overflow-x-hidden">
      <GridBackground />
      <FloatingOrbs />
      <Particles />

      {/* ── Navigation ── */}
      <motion.nav
        className="fixed top-0 inset-x-0 z-50 border-b transition-colors duration-300"
        style={{
          backgroundColor: useTransform(navBg, (v) => `rgba(9,9,11,${v * 0.9})`),
          borderColor: useTransform(navBg, (v) => `rgba(46,46,51,${v * 0.5})`),
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center"
              whileHover={{ rotate: 10, scale: 1.05 }}
            >
              <Shield className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-lg font-semibold tracking-tight">GitSecureOps</span>
            <span className="hidden sm:inline-flex ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/15 text-brand-400 border border-brand-500/20">
              AI-POWERED
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'Stats'].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-dark-text-secondary hover:text-dark-text transition-colors relative group"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/login')}
                className="shadow-glow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Get Started
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <motion.section
        ref={heroRef}
        className="relative z-10 pt-28 pb-8 px-6"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <HeroBeams />
        <div className="max-w-5xl mx-auto text-center relative">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/20 bg-brand-500/5 backdrop-blur-sm text-xs text-brand-300 mb-8"
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="font-medium">Powered by AI — Trusted by 500+ teams</span>
            <ChevronRight className="w-3 h-3" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
          >
            <span className="block">The AI-first platform for</span>
            <span className="block mt-2">
              <TypingText
                words={[
                  'GitHub Security',
                  'Access Control',
                  'Copilot Governance',
                  'Threat Detection',
                  'Compliance',
                ]}
                className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl text-dark-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Autonomous security agents that monitor, detect, and remediate threats across your
            GitHub organization — in real-time, with zero manual intervention.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                onClick={() => navigate('/login')}
                className="min-w-[200px] font-semibold shadow-glow relative overflow-hidden group"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <Zap className="w-4 h-4 mr-2" />
                Start Free — No Card
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="outline" size="lg" className="min-w-[200px] font-semibold">
                <Github className="w-4 h-4 mr-2" />
                View Source
              </Button>
            </motion.div>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6, type: 'spring' }}
            className="mt-16 max-w-3xl mx-auto relative"
          >
            {/* Glow behind */}
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 via-purple-500/10 to-pink-500/15 rounded-3xl blur-2xl opacity-60" />

            <div className="relative rounded-2xl border border-dark-border/60 bg-dark-card/80 backdrop-blur-xl shadow-elevated-lg overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border/60 bg-dark-surface/80">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70 hover:bg-red-500 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70 hover:bg-yellow-500 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70 hover:bg-green-500 transition-colors" />
                  </div>
                  <div className="ml-3 flex items-center gap-2 px-3 py-1 rounded-md bg-dark-bg/50 border border-dark-border/50">
                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-[11px] text-dark-text-muted font-mono">
                      app.gitsecureops.com/dashboard
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-dark-text-muted" />
                </div>
              </div>

              {/* Terminal content with streaming effect */}
              <div className="p-6 font-mono text-[13px] leading-loose space-y-1">
                {[
                  {
                    text: (
                      <>
                        <span className="text-brand-400">{'>'}</span>{' '}
                        <span className="text-emerald-400">Initializing AI security agent</span>
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ...
                        </motion.span>
                      </>
                    ),
                    delay: 0,
                  },
                  {
                    text: (
                      <>
                        <span className="text-emerald-400">✓</span>{' '}
                        <span className="text-dark-text-muted">Connected to </span>
                        <span className="text-brand-400 font-semibold">acme-corp</span>
                        <span className="text-dark-text-muted"> (142 members, 89 repos)</span>
                      </>
                    ),
                    delay: 0.3,
                  },
                  {
                    text: (
                      <>
                        <span className="text-emerald-400">✓</span>{' '}
                        <span className="text-dark-text-muted">Full graph scan complete in </span>
                        <span className="text-white font-semibold">1.2s</span>
                      </>
                    ),
                    delay: 0.6,
                  },
                  {
                    text: (
                      <>
                        <span className="text-emerald-400">✓</span>{' '}
                        <span className="text-dark-text-muted">2FA enforced: </span>
                        <span className="text-emerald-400 font-semibold">142/142</span>
                        <span className="text-dark-text-muted"> members compliant</span>
                      </>
                    ),
                    delay: 0.9,
                  },
                  {
                    text: (
                      <>
                        <span className="text-emerald-400">✓</span>{' '}
                        <span className="text-dark-text-muted">Copilot seats: </span>
                        <span className="text-white font-semibold">89</span>
                        <span className="text-dark-text-muted"> active, </span>
                        <span className="text-amber-400">3</span>
                        <span className="text-dark-text-muted"> idle → </span>
                        <span className="text-rose-400">auto-revoked</span>
                      </>
                    ),
                    delay: 1.2,
                  },
                  {
                    text: (
                      <>
                        <span className="text-emerald-400">✓</span>{' '}
                        <span className="text-dark-text-muted">Security score: </span>
                        <span className="text-emerald-400 font-bold text-base">A+ (97/100)</span>
                      </>
                    ),
                    delay: 1.5,
                  },
                  {
                    text: (
                      <>
                        <span className="text-brand-400">→</span>{' '}
                        <span className="text-brand-300 font-medium">
                          All threats neutralized. Organization fully secured.
                        </span>{' '}
                        <span className="text-emerald-400">🛡️</span>
                      </>
                    ),
                    delay: 1.8,
                  },
                ].map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: line.delay + 0.8 }}
                  >
                    {line.text}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Marquee ── */}
      <section className="relative z-10 pt-16 pb-4">
        <Marquee />
      </section>

      {/* ── Trusted by ── */}
      <section className="relative z-10 py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-dark-text-muted/50 mb-6 font-medium">
            Trusted by world-class engineering teams
          </p>
          <motion.div
            className="flex flex-wrap justify-center gap-x-10 gap-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {trustedBy.map((name) => (
              <motion.span
                key={name}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="text-lg font-semibold text-dark-text-muted/25 hover:text-dark-text-muted/50 transition-colors duration-300 tracking-tight"
              >
                {name}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="relative z-10 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                className="text-center p-6 rounded-2xl border border-dark-border/30 bg-dark-card/20 backdrop-blur-sm"
              >
                <stat.icon className="w-5 h-5 text-brand-400 mx-auto mb-3 opacity-50" />
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-dark-text tabular-nums">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-dark-text-muted mt-1.5 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Bento Features Grid ── */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 text-xs text-brand-300 font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Platform Capabilities
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Security that{' '}
              <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                thinks for itself
              </span>
            </h2>
            <p className="text-dark-text-muted text-lg max-w-xl mx-auto">
              AI agents that continuously protect your GitHub organization. Not dashboards — active
              defense.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-3"
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
                  hidden: { opacity: 0, y: 16, scale: 0.98 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.4 },
                  },
                }}
                className={feature.span}
              >
                <SpotlightCard className="h-full">
                  <div className="p-6 sm:p-7">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.bg} flex items-center justify-center mb-4`}
                    >
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-dark-text-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how-it-works" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-300 font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              Setup in 60 seconds
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Three steps to{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                total protection
              </span>
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            {/* Animated connector line */}
            <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-px">
              <motion.div
                className="h-full"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(99,102,241,0.3), rgba(16,185,129,0.3), rgba(244,63,94,0.3))',
                }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>

            {steps.map((step) => (
              <motion.div
                key={step.number}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <SpotlightCard className="text-center">
                  <div className="p-8">
                    <motion.div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} mx-auto mb-5 flex items-center justify-center shadow-lg`}
                      whileHover={{ rotate: 5, scale: 1.05 }}
                    >
                      <step.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="text-[11px] font-bold tracking-[0.3em] text-brand-400 mb-3 uppercase">
                      Step {step.number}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-dark-text-muted leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Social proof / testimonial ── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <SpotlightCard>
              <div className="p-10 md:p-14">
                <div className="flex justify-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <blockquote className="text-xl md:text-2xl font-medium leading-relaxed mb-8 text-dark-text/90">
                  &ldquo;GitSecureOps replaced three separate tools for us. The AI threat detection
                  caught a credential exposure we would have missed for days. It&apos;s like having
                  a security team that never sleeps.&rdquo;
                </blockquote>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    SK
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-dark-text">Sarah Kim</p>
                    <p className="text-xs text-dark-text-muted">Head of Engineering, TechCorp</p>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-24 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative rounded-3xl overflow-hidden">
            {/* Animated gradient border */}
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 opacity-30 animate-gradient blur-sm" />
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 opacity-20 animate-gradient" />

            <div className="relative rounded-3xl bg-dark-bg/90 backdrop-blur-xl p-12 md:p-20">
              <div className="absolute top-0 left-1/4 w-[300px] h-[200px] bg-brand-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-[250px] h-[150px] bg-purple-500/[0.08] blur-[60px] rounded-full pointer-events-none" />

              <div className="relative">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 mx-auto mb-6 flex items-center justify-center shadow-glow-lg"
                >
                  <Shield className="w-8 h-8 text-white" />
                </motion.div>

                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                  Ready to secure your org?
                </h2>
                <p className="text-dark-text-muted text-lg mb-10 max-w-lg mx-auto">
                  Join 500+ engineering teams who trust GitSecureOps to protect their GitHub
                  organizations. Free to start, no credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      size="lg"
                      onClick={() => navigate('/login')}
                      className="min-w-[220px] font-semibold shadow-glow relative overflow-hidden group"
                    >
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <Zap className="w-4 h-4 mr-2" />
                      Get Started with GitSecureOps
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="outline" size="lg" className="min-w-[220px] font-semibold">
                      Schedule a Demo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-dark-border/30 bg-dark-surface/10">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold tracking-tight">GitSecureOps</span>
              </div>
              <p className="text-sm text-dark-text-muted leading-relaxed max-w-xs mb-4">
                AI-first GitHub security platform for modern engineering teams. Built for the age of
                autonomous development.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="w-8 h-8 rounded-lg bg-dark-card/60 border border-dark-border/40 flex items-center justify-center text-dark-text-muted hover:text-dark-text hover:border-dark-border transition-all"
                >
                  <Github className="w-4 h-4" />
                </a>
                <div className="flex items-center gap-1.5 text-xs text-dark-text-muted">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  All systems operational
                </div>
              </div>
            </div>

            {[
              {
                title: 'Product',
                items: ['Features', 'Security', 'AI Agent', 'Pricing', 'Changelog'],
              },
              {
                title: 'Resources',
                items: ['Documentation', 'API Reference', 'Blog', 'Guides', 'Status'],
              },
              {
                title: 'Company',
                items: ['About', 'Careers', 'Contact', 'Privacy', 'Terms'],
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

          <div className="pt-8 border-t border-dark-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-dark-text-muted/60">
              © {new Date().getFullYear()} GitSecureOps. All rights reserved. Built with AI.
            </p>
            <div className="flex items-center gap-2 text-xs text-dark-text-muted/40">
              <Sparkles className="w-3 h-3" />
              Powered by autonomous security agents
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
