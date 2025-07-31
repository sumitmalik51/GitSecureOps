import { createContext, type ReactNode } from 'react';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onRemove: (id: string) => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  icon?: ReactNode;
}

export interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id' | 'onRemove'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);