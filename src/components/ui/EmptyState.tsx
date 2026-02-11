import { motion } from 'framer-motion';
import { LucideIcon, Inbox } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-dark-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-dark-text mb-1">{title}</h3>
      {description && <p className="text-sm text-dark-text-muted max-w-sm mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
