import { useState, type ReactNode } from 'react';
import { ToastContainer } from './AlertBanner';
import { ToastContext, type ToastData } from '../../contexts/ToastContext';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showToast = (toast: Omit<ToastData, 'id' | 'onRemove'>) => {
    const id = Date.now().toString();
    const newToast: ToastData = {
      ...toast,
      id,
      onRemove: removeToast
    };
    setToasts(prev => [...prev, newToast]);
  };

  const showSuccess = (message: string, title?: string) => {
    showToast({
      type: 'success',
      message,
      title,
      autoClose: true
    });
  };

  const showError = (message: string, title?: string) => {
    showToast({
      type: 'error',
      message,
      title,
      autoClose: true,
      autoCloseDelay: 7000 // Longer for errors
    });
  };

  const showWarning = (message: string, title?: string) => {
    showToast({
      type: 'warning',
      message,
      title,
      autoClose: true
    });
  };

  const showInfo = (message: string, title?: string) => {
    showToast({
      type: 'info',
      message,
      title,
      autoClose: true
    });
  };

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}
