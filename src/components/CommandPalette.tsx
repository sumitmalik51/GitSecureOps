import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Shield,
  Users,
  Bot,
  BarChart3,
  FileText,
  Lightbulb,
  LogOut,
  Code,
  Folder,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Register keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const go = useCallback(
    (path: string) => {
      navigate(path);
      setIsOpen(false);
    },
    [navigate]
  );

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Dashboard',
        description: 'Go to main dashboard',
        icon: <LayoutDashboard size={18} />,
        action: () => go('/dashboard'),
        keywords: ['dashboard', 'home', 'overview'],
      },
      {
        id: 'copilot',
        label: 'Copilot Management',
        description: 'Manage GitHub Copilot seats',
        icon: <Bot size={18} />,
        action: () => go('/copilot'),
        keywords: ['copilot', 'ai', 'seats', 'billing'],
      },
      {
        id: 'access',
        label: 'Access Control',
        description: 'Manage user access and permissions',
        icon: <Users size={18} />,
        action: () => go('/access'),
        keywords: ['access', 'users', 'permissions', 'collaborators'],
      },
      {
        id: 'access-mgmt',
        label: 'Access Management',
        description: 'Delete access, export user data',
        icon: <Users size={18} />,
        action: () => go('/access-management'),
        keywords: ['delete', 'remove', 'export', 'bulk'],
      },
      {
        id: 'security',
        label: 'Security / 2FA',
        description: 'Check 2FA compliance',
        icon: <Shield size={18} />,
        action: () => go('/security'),
        keywords: ['security', '2fa', 'two-factor', 'compliance'],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        description: 'View security analytics and charts',
        icon: <BarChart3 size={18} />,
        action: () => go('/analytics'),
        keywords: ['analytics', 'charts', 'health', 'score'],
      },
      {
        id: 'audit',
        label: 'Audit Logs',
        description: 'View action history',
        icon: <FileText size={18} />,
        action: () => go('/audit'),
        keywords: ['audit', 'logs', 'history', 'activity'],
      },
      {
        id: 'recommendations',
        label: 'Recommendations',
        description: 'Smart security recommendations',
        icon: <Lightbulb size={18} />,
        action: () => go('/recommendations'),
        keywords: ['recommendations', 'suggestions', 'fixes', 'improve'],
      },
      {
        id: 'search',
        label: 'Code Search',
        description: 'Search code across repositories',
        icon: <Code size={18} />,
        action: () => go('/search'),
        keywords: ['search', 'code', 'find'],
      },
      {
        id: 'repositories',
        label: 'Repositories',
        description: 'Browse your repositories',
        icon: <Folder size={18} />,
        action: () => go('/repositories'),
        keywords: ['repositories', 'repos', 'browse'],
      },
      {
        id: 'logout',
        label: 'Sign Out',
        description: 'Log out of your account',
        icon: <LogOut size={18} />,
        action: () => {
          logout();
          go('/login');
        },
        keywords: ['logout', 'sign out', 'exit'],
      },
    ],
    [go, logout]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.keywords.some((k) => k.includes(q))
    );
  }, [commands, query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-dark-surface border border-dark-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-border">
              <Search size={18} className="text-dark-text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-dark-text placeholder-dark-text-muted outline-none text-sm"
              />
              <kbd className="text-[10px] text-dark-text-muted bg-dark-card px-1.5 py-0.5 rounded border border-dark-border">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-dark-text-muted text-sm text-center py-8">
                  No commands found for "{query}"
                </p>
              ) : (
                filtered.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === selectedIndex
                        ? 'bg-brand-primary/10 text-dark-text'
                        : 'text-dark-text-muted hover:bg-white/5'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 ${
                        i === selectedIndex ? 'text-brand-primary' : 'text-dark-text-muted'
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cmd.label}</p>
                      {cmd.description && (
                        <p className="text-xs text-dark-text-muted truncate">{cmd.description}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-dark-border text-[10px] text-dark-text-muted">
              <span>
                <kbd className="bg-dark-card px-1 py-0.5 rounded border border-dark-border mr-1">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span>
                <kbd className="bg-dark-card px-1 py-0.5 rounded border border-dark-border mr-1">
                  ↵
                </kbd>
                Select
              </span>
              <span>
                <kbd className="bg-dark-card px-1 py-0.5 rounded border border-dark-border mr-1">
                  Ctrl+K
                </kbd>
                Toggle
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
