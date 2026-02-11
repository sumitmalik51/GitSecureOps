import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, iconRight, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-dark-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'form-input',
              icon && 'pl-10',
              iconRight && 'pr-10',
              error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/30',
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-text-muted">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-danger-400">{error}</p>}
        {hint && !error && <p className="text-xs text-dark-text-muted">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
