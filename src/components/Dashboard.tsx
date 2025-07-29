import { DASHBOARD_OPTIONS } from '../config/constants';

interface DashboardProps {
  username: string;
  onLogout: () => void;
  onSelectOption: (option: string) => void;
}

// Simple inline card component
interface CardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

function Card({ title, description, icon, onClick }: CardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
    >
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  );
}

export default function Dashboard({ onSelectOption }: DashboardProps) {

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What would you like to do?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
            Choose from the options below to manage your GitHub repositories and user access.
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DASHBOARD_OPTIONS.map((option) => (
            <Card
              key={option.id}
              title={option.title}
              description={option.description}
              icon={option.icon}
              onClick={() => onSelectOption(option.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
