import React from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'glass' | 'elevated' | 'interactive';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: React.ReactNode;
  noPadding?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-dark-card border border-dark-border',
  glass: 'bg-dark-card/60 backdrop-blur-xl border border-white/[0.06] shadow-elevated',
  elevated: 'bg-dark-card border border-dark-border shadow-elevated',
  interactive:
    'bg-dark-card border border-dark-border hover:border-dark-border-light hover:bg-dark-hover cursor-pointer transition-all duration-200',
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl overflow-hidden',
          variantClasses[variant],
          !noPadding && 'p-5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/* Sub-components for structured cards */
function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-dark-text', className)} {...props}>
      {children}
    </h3>
  );
}

function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardContent };
export default Card;
