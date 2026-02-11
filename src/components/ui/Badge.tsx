import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-dark-hover text-dark-text-secondary border-dark-border',
  brand:    'bg-brand-500/10 text-brand-400 border-brand-500/20',
  success:  'bg-success-500/10 text-success-400 border-success-500/20',
  warning:  'bg-warning-500/10 text-warning-400 border-warning-500/20',
  danger:   'bg-danger-500/10 text-danger-400 border-danger-500/20',
  outline:  'bg-transparent text-dark-text-secondary border-dark-border',
};

export default function Badge({ variant = 'default', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md border',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', {
            'bg-dark-text-muted': variant === 'default' || variant === 'outline',
            'bg-brand-400': variant === 'brand',
            'bg-success-400': variant === 'success',
            'bg-warning-400': variant === 'warning',
            'bg-danger-400': variant === 'danger',
          })}
        />
      )}
      {children}
    </span>
  );
}
