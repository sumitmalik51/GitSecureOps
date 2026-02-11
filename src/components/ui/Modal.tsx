import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, description, className, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className={cn(
              'relative z-10 w-full max-w-lg mx-4',
              'bg-dark-surface border border-dark-border rounded-xl shadow-elevated-lg',
              'max-h-[85vh] overflow-y-auto',
              className
            )}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-dark-border">
                <div>
                  {title && <h2 className="text-base font-semibold text-dark-text">{title}</h2>}
                  {description && (
                    <p className="mt-1 text-sm text-dark-text-muted">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="ml-4 p-1 rounded-md text-dark-text-muted hover:text-dark-text hover:bg-dark-hover transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
