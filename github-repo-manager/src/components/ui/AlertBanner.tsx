import { type ReactNode, useEffect, useState } from 'react';

interface AlertBannerProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  icon?: ReactNode;
}

export default function AlertBanner({
  type,
  title,
  message,
  onClose,
  autoClose = false,
  autoCloseDelay = 5000,
  icon
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const typeStyles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: '✅',
      progressBar: 'bg-green-500'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: '❌',
      progressBar: 'bg-red-500'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️',
      progressBar: 'bg-yellow-500'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ️',
      progressBar: 'bg-blue-500'
    }
  };

  const styles = typeStyles[type];

  if (!isVisible) return null;

  return (
    <div className={`relative rounded-lg border p-4 ${styles.bg} transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg">
            {icon || styles.icon}
          </span>
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.text}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${styles.text} ${title ? 'mt-1' : ''}`}>
            {message}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(), 300);
              }}
              className={`inline-flex rounded-md p-1.5 ${styles.text} hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white`}
            >
              <span className="sr-only">Dismiss</span>
              <span className="text-lg">×</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Auto-close progress bar */}
      {autoClose && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div 
            className={`h-full ${styles.progressBar} transition-all duration-300 ease-linear`}
            style={{
              animation: `shrink ${autoCloseDelay}ms linear`,
            }}
          />
        </div>
      )}
      
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// Toast notification system
interface ToastProps extends Omit<AlertBannerProps, 'onClose'> {
  id: string;
  onRemove: (id: string) => void;
}

export function Toast({ id, onRemove, ...props }: ToastProps) {
  return (
    <AlertBanner
      {...props}
      onClose={() => onRemove(id)}
      autoClose={true}
    />
  );
}

// Toast container component
interface ToastContainerProps {
  toasts: Array<ToastProps>;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ToastContainer({ toasts, position = 'top-right' }: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-2 max-w-sm w-full`}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
