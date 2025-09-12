import { type ErrorDetails } from '../../utils/errorHandling';

interface ErrorDisplayProps {
  error: ErrorDetails;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, onDismiss, className = '' }: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getErrorColors = () => {
    switch (error.type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getErrorColors()} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="text-xl flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                {error.title}
              </h3>
              <p className="text-sm mb-3">
                {error.message}
              </p>
              
              {error.actionable && (
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-md p-3 mb-3 border border-white/20 dark:border-gray-700/50">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">💡</span>
                    <span className="font-medium text-sm">What to do:</span>
                  </div>
                  <p className="text-sm pl-6">
                    {error.actionable}
                  </p>
                </div>
              )}
              
              {error.suggestion && (
                <div className="bg-white/30 dark:bg-gray-800/30 rounded-md p-3 border border-white/20 dark:border-gray-700/50">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">💭</span>
                    <span className="font-medium text-sm">Tip:</span>
                  </div>
                  <p className="text-sm pl-6">
                    {error.suggestion}
                  </p>
                </div>
              )}
            </div>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {onRetry && (
            <div className="flex space-x-2 mt-4">
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
      
      {error.code && (
        <div className="mt-3 pt-3 border-t border-white/20 dark:border-gray-700/50">
          <p className="text-xs opacity-70 font-mono">
            Error Code: {error.code}
          </p>
        </div>
      )}
    </div>
  );
}

export default ErrorDisplay;
