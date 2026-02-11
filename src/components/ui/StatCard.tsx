import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type TrendDirection = 'up' | 'down' | 'neutral';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  trend?: TrendDirection;
  className?: string;
}

const trendColors: Record<TrendDirection, string> = {
  up:      'text-success-400',
  down:    'text-danger-400',
  neutral: 'text-dark-text-muted',
};

const iconBgColors: Record<TrendDirection, string> = {
  up:      'bg-success-500/10 text-success-400',
  down:    'text-danger-400 bg-danger-500/10',
  neutral: 'bg-dark-hover text-dark-text-muted',
};

export default function StatCard({ label, value, icon: Icon, change, trend = 'neutral', className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-dark-card border border-dark-border p-5',
        'hover:border-dark-border-light transition-colors duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-dark-text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-dark-text tabular-nums">{value}</p>
          {change && (
            <p className={cn('text-xs font-medium', trendColors[trend])}>{change}</p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBgColors[trend])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
