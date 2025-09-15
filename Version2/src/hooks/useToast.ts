import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastFunction {
  (options: Omit<ToastMessage, 'id'>): string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, newToast.duration);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((options: Omit<ToastMessage, 'id'>) => {
    return showToast(options);
  }, [showToast]) as ToastFunction;

  // Convenience methods
  toast.success = (title: string, description?: string) => 
    showToast({ type: 'success', title, description });
  
  toast.error = (title: string, description?: string) => 
    showToast({ type: 'error', title, description });
  
  toast.warning = (title: string, description?: string) => 
    showToast({ type: 'warning', title, description });
  
  toast.info = (title: string, description?: string) => 
    showToast({ type: 'info', title, description });

  return {
    toast,
    toasts,
    removeToast,
  };
};
