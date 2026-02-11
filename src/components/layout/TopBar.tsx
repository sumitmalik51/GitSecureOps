import { useNavigate } from 'react-router-dom';
import { LogOut, Command } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';
import Button from '@/components/ui/Button';

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-dark-border bg-dark-surface/80 backdrop-blur-md sticky top-0 z-30">
      {/* Left — Page title */}
      <div>
        {title && <h1 className="text-sm font-semibold text-dark-text">{title}</h1>}
        {subtitle && <p className="text-xs text-dark-text-muted">{subtitle}</p>}
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-3">
        {/* Keyboard shortcut hint */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
            document.dispatchEvent(event);
          }}
          className="hidden md:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-dark-card border border-dark-border text-dark-text-muted text-xs hover:border-dark-border-light transition-colors"
        >
          <Command className="w-3 h-3" />
          <span>K</span>
        </button>

        <NotificationBell />

        {/* User avatar + logout */}
        <div className="flex items-center gap-2 ml-1">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.login || 'User'}
              className="w-7 h-7 rounded-full ring-1 ring-dark-border"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold">
              {user?.login?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          <span className="hidden md:block text-sm font-medium text-dark-text max-w-[120px] truncate">
            {user?.login || 'User'}
          </span>

          <Button
            variant="ghost"
            size="xs"
            onClick={handleLogout}
            className="text-dark-text-muted hover:text-danger-400"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
