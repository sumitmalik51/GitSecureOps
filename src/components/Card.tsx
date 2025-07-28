import { type ReactNode } from 'react';

interface CardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  children?: ReactNode;
  className?: string;
}

export default function Card({ title, description, icon, onClick, children, className = '' }: CardProps) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 ${className}`}
    >
      <div className="flex items-center mb-3">
        <span className="text-lg font-bold mr-3 bg-blue-100 dark:bg-blue-800 px-3 py-2 rounded-md text-blue-800 dark:text-blue-100 border border-blue-200 dark:border-blue-700">
          {icon}
        </span>
      </div>
      <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {description}
      </p>
      {children}
    </div>
  );
}
