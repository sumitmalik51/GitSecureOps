import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number;
  message?: string;
  subMessage?: string;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'cyan' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message,
  subMessage,
  color = 'blue',
  size = 'md',
  animated = true,
  showPercentage = false
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);

  // Animate progress value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Show sparkles when complete
  useEffect(() => {
    if (progress >= 100) {
      setShowSparkles(true);
      const timer = setTimeout(() => setShowSparkles(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  const colorClasses = {
    blue: {
      bg: 'from-blue-400 via-blue-500 to-blue-600',
      glow: 'shadow-blue-500/50',
      dots: 'bg-blue-600'
    },
    green: {
      bg: 'from-green-400 via-green-500 to-green-600',
      glow: 'shadow-green-500/50',
      dots: 'bg-green-600'
    },
    purple: {
      bg: 'from-purple-400 via-purple-500 to-purple-600',
      glow: 'shadow-purple-500/50',
      dots: 'bg-purple-600'
    },
    red: {
      bg: 'from-red-400 via-red-500 to-red-600',
      glow: 'shadow-red-500/50',
      dots: 'bg-red-600'
    },
    yellow: {
      bg: 'from-yellow-400 via-yellow-500 to-yellow-600',
      glow: 'shadow-yellow-500/50',
      dots: 'bg-yellow-600'
    },
    cyan: {
      bg: 'from-cyan-400 via-cyan-500 to-cyan-600',
      glow: 'shadow-cyan-500/50',
      dots: 'bg-cyan-600'
    },
    emerald: {
      bg: 'from-emerald-400 via-emerald-500 to-emerald-600',
      glow: 'shadow-emerald-500/50',
      dots: 'bg-emerald-600'
    }
  };

  const sizeClasses = {
    sm: { height: 'h-2', text: 'text-xs', padding: 'p-2' },
    md: { height: 'h-3', text: 'text-sm', padding: 'p-3' },
    lg: { height: 'h-4', text: 'text-base', padding: 'p-4' },
    xl: { height: 'h-6', text: 'text-lg', padding: 'p-5' }
  };

  const currentColor = colorClasses[color];
  const currentSize = sizeClasses[size];

  return (
    <div className="w-full space-y-3">
      {/* Progress Messages */}
      {(message || subMessage) && (
        <div className="space-y-2">
          {message && (
            <div className={`font-medium text-gray-800 ${currentSize.text} flex items-center`}>
              {animated && (
                <div className="mr-2">
                  <div className={`w-3 h-3 ${currentColor.dots} rounded-full animate-pulse`}></div>
                </div>
              )}
              {message}
              {showSparkles && (
                <span className="ml-2 animate-bounce">✨</span>
              )}
            </div>
          )}
          {subMessage && (
            <div className={`text-gray-600 ${currentSize.text === 'text-xs' ? 'text-xs' : 'text-sm'}`}>
              {subMessage}
            </div>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div className="relative">
        {/* Background Track */}
        <div className={`w-full ${currentSize.height} bg-gray-200 rounded-full overflow-hidden shadow-inner`}>
          {/* Filled Progress with Gradient */}
          <div
            className={`${currentSize.height} bg-gradient-to-r ${currentColor.bg} rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
            style={{ width: `${Math.min(displayProgress, 100)}%` }}
          >
            {/* Shimmer Effect */}
            {animated && displayProgress > 0 && displayProgress < 100 && (
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            )}
            
            {/* Completion Glow */}
            {progress >= 100 && (
              <div className={`absolute inset-0 ${currentColor.bg} animate-pulse shadow-lg ${currentColor.glow}`}></div>
            )}
          </div>
        </div>

        {/* Percentage Display */}
        {showPercentage && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full ml-3">
            <span className={`font-bold text-gray-700 ${currentSize.text}`}>
              {Math.round(displayProgress)}%
            </span>
          </div>
        )}

        {/* Progress Indicator Dots */}
        {animated && displayProgress > 0 && displayProgress < 100 && (
          <div className="flex justify-center mt-2 space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 ${currentColor.dots} rounded-full animate-pulse`}
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        )}

        {/* Completion Sparkles */}
        {showSparkles && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex space-x-2 animate-bounce">
              <span className="text-yellow-400 text-lg">✨</span>
              <span className="text-yellow-300 text-xl">🌟</span>
              <span className="text-yellow-400 text-lg">✨</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
