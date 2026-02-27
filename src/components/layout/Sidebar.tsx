import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Shield,
  Users,
  GitBranch,
  Search,
  BarChart3,
  FileText,
  Lightbulb,
  Bot,
  UserCog,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ShieldCheck,
  Eye,
  GitPullRequest,
  Zap,
  Package,
  UsersRound,
  KeyRound,
  Settings,
  Activity,
  Radar,
  Heart,
  Rocket,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: string;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', to: '/analytics', icon: BarChart3 },
      { label: 'Org Pulse', to: '/org-pulse', icon: Activity, badge: 'Live' },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Repositories', to: '/repositories', icon: GitBranch },
      { label: 'Repo Health', to: '/repo-health', icon: Heart },
      { label: 'Access Control', to: '/access', icon: Users },
      { label: 'Access Mgmt', to: '/access-management', icon: UserCog },
      { label: 'Team Members', to: '/team-members', icon: UsersRound },
      { label: 'Org Owners', to: '/org-owner', icon: Crown, badge: 'New' },
      { label: 'Copilot', to: '/copilot', icon: Bot },
      { label: 'Copilot ROI', to: '/copilot-roi', icon: DollarSign },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Security', to: '/security', icon: Shield },
      { label: 'Security Radar', to: '/security-radar', icon: Radar, badge: 'New' },
      { label: 'Audit Logs', to: '/audit', icon: FileText },
      { label: 'Recommendations', to: '/recommendations', icon: Lightbulb },
      { label: 'Access Review', to: '/access-review', icon: ShieldCheck },
      { label: 'Visibility Drift', to: '/visibility-drift', icon: Eye },
      { label: 'SSO & SAML', to: '/sso', icon: KeyRound },
    ],
  },
  {
    title: 'Productivity',
    items: [
      { label: 'PR Review', to: '/pr-review', icon: GitPullRequest },
      { label: 'Dev Velocity', to: '/dev-velocity', icon: Rocket, badge: 'New' },
      { label: 'Actions Cost', to: '/actions-cost', icon: Zap },
      { label: 'Onboarding', to: '/onboarding', icon: Package },
      { label: 'Cost Manager', to: '/cost-manager', icon: DollarSign },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Code Search', to: '/search', icon: Search },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col bg-dark-surface border-r border-dark-border',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-dark-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="ml-3 font-semibold text-sm text-dark-text whitespace-nowrap overflow-hidden"
            >
              GitSecureOps
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-hide">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-dark-text-muted">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg transition-colors duration-150',
                      collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                      isActive
                        ? 'bg-brand-500/10 text-brand-400'
                        : 'text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text'
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="ml-auto text-2xs font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-dark-card border border-dark-border rounded-md text-xs font-medium text-dark-text whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-elevated">
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-dark-border shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-lg py-2 text-dark-text-muted hover:text-dark-text hover:bg-dark-hover transition-colors',
            collapsed ? 'px-2' : 'px-3'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
