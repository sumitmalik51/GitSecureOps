import { type ReactNode } from 'react';

interface DashboardCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  bgColor: string;
  onClick: (id: string) => void;
  index?: number;
  className?: string;
  children?: ReactNode;
}

export default function DashboardCard({
  id,
  title,
  description,
  icon,
  gradient,
  bgColor,
  onClick,
  index = 0,
  className = '',
  children
}: DashboardCardProps) {
  return (
    <div
      onClick={() => onClick(id)}
      className={`group relative ${bgColor} border-2 border-white/50 dark:border-gray-700/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] hover:-translate-y-1 backdrop-blur-sm overflow-hidden ${className}`}
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      {/* Gradient Border Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center mb-4">
          <div className={`flex items-center justify-center w-14 h-14 bg-gradient-to-r ${gradient} rounded-xl mr-4 group-hover:scale-105 transition-transform duration-300`}>
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-200 truncate">
              {title}
            </h3>
            <div className={`h-1 bg-gradient-to-r ${gradient} rounded-full mt-2 w-0 group-hover:w-full transition-all duration-500`}></div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200 text-sm line-clamp-3">
          {description}
        </p>
        
        {children}
        
        {/* Arrow indicator */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
          <div className={`w-6 h-6 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center shadow-lg`}>
            <span className="text-white text-xs">→</span>
          </div>
        </div>
      </div>
      
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
        <div className={`w-full h-full bg-gradient-to-r ${gradient} rounded-2xl blur-sm`}></div>
      </div>
    </div>
  );
}
