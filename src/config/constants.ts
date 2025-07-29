// UI Constants and Configuration
export const UI_CONSTANTS = {
  colors: {
    primary: {
      gradient: 'from-blue-600 to-purple-600',
      hover: 'hover:from-blue-700 hover:to-purple-700',
      bg: 'bg-blue-50',
      text: 'text-blue-700'
    },
    secondary: {
      gradient: 'from-gray-400 to-gray-600',
      hover: 'hover:from-gray-500 hover:to-gray-700',
      bg: 'bg-gray-50',
      text: 'text-gray-700'
    },
    success: {
      gradient: 'from-green-600 to-emerald-600',
      hover: 'hover:from-green-700 hover:to-emerald-700',
      bg: 'bg-green-50',
      text: 'text-green-700'
    },
    danger: {
      gradient: 'from-red-600 to-pink-600',
      hover: 'hover:from-red-700 hover:to-pink-700',
      bg: 'bg-red-50',
      text: 'text-red-700'
    },
    warning: {
      gradient: 'from-yellow-500 to-orange-500',
      hover: 'hover:from-yellow-600 hover:to-orange-600',
      bg: 'bg-yellow-50',
      text: 'text-yellow-700'
    }
  },
  
  messages: {
    loading: {
      default: 'Loading...',
      repositories: 'Loading repositories...',
      users: 'Loading users...',
      connecting: 'Connecting to GitHub...',
      processing: 'Processing request...'
    },
    success: {
      saved: 'Changes saved successfully!',
      deleted: 'Deleted successfully!',
      exported: 'Data exported successfully!',
      updated: 'Updated successfully!'
    },
    error: {
      network: 'Network error. Please check your connection.',
      authentication: 'Authentication failed. Please log in again.',
      notFound: 'Requested resource not found.',
      generic: 'Something went wrong. Please try again.'
    }
  },

  animations: {
    duration: {
      fast: 'duration-200',
      normal: 'duration-300',
      slow: 'duration-500'
    },
    transitions: {
      all: 'transition-all',
      colors: 'transition-colors',
      transform: 'transition-transform',
      opacity: 'transition-opacity'
    }
  },

  spacing: {
    padding: {
      sm: 'p-4 sm:p-6',
      md: 'p-6 sm:p-8',
      lg: 'p-8 sm:p-12'
    },
    margin: {
      sm: 'm-4 sm:m-6',
      md: 'm-6 sm:m-8',
      lg: 'm-8 sm:m-12'
    }
  }
};

export const DASHBOARD_OPTIONS = [
  {
    id: 'smart-recommendations',
    title: '🤖 Smart Recommendations (Preview)',
    description: 'Preview of AI-powered insights for access optimization (Full AI coming soon!)',
    icon: '🧠 AI'
  },
  {
    id: 'delete-user-access',
    title: 'Delete User Access',
    description: 'Remove specific users access from repositories by username',
    icon: '🗑️ DELETE'
  },
  {
    id: 'list-private-repos',
    title: 'Get All Private Repositories',
    description: 'View all your private repositories',
    icon: '🔒 PRIVATE'
  },
  {
    id: 'list-public-repos',
    title: 'Get All Public Repositories',
    description: 'View all your public repositories',
    icon: '🌍 PUBLIC'
  },
  {
    id: 'export-usernames',
    title: 'Get All Users',
    description: 'Export all users with repository access to Excel',
    icon: '📊 EXPORT'
  }
];

export const APP_CONFIG = {
  name: 'GitSecureOps',
  version: '1.0.0',
  description: 'Repository Management',
  theme: {
    defaultMode: 'light' as 'light' | 'dark' | 'system'
  }
};
