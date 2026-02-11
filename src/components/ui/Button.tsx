import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500/40 shadow-sm hover:shadow-glow-sm',
  secondary:
    'bg-success-500 text-white hover:bg-success-600 focus-visible:ring-success-500/40 shadow-sm hover:shadow-glow-success',
  ghost:
    'bg-transparent text-dark-text-secondary hover:text-dark-text hover:bg-dark-hover focus-visible:ring-dark-border-light',
  outline:
    'bg-transparent text-dark-text border border-dark-border hover:bg-dark-hover hover:border-dark-border-light focus-visible:ring-brand-500/40',
  danger:
    'bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 border border-danger-500/20 focus-visible:ring-danger-500/40',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-6 text-base gap-2.5 rounded-lg',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-dark-bg',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.97]',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
