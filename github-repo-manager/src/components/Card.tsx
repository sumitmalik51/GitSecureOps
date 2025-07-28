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
      className={`p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer ${className}`}
    >
      <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
        {icon} {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {description}
      </p>
      {children}
    </div>
  );
}
