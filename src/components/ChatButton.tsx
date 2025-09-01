import React from 'react';
import { MessageSquare } from 'lucide-react';

interface ChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick, unreadCount = 0 }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 group"
      aria-label="Open repository search chat"
      title="Search repositories with AI assistance"
    >
      <div className="relative">
        <MessageSquare size={24} className="group-hover:animate-pulse" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <div className="absolute inset-0 bg-blue-400 rounded-full opacity-0 group-hover:opacity-20 transform scale-150 transition-all duration-300"></div>
      </div>
    </button>
  );
};

export default ChatButton;
