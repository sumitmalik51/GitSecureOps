import { DASHBOARD_OPTIONS } from '../config/constants';

interface DashboardProps {
  username: string;
  onLogout: () => void;
  onSelectOption: (option: string) => void;
}

// Enhanced card component with hover effects and section categorization
interface CardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  category: 'productivity' | 'management' | 'compliance';
}

function Card({ title, description, icon, onClick, category }: CardProps) {
  const getCategoryClasses = () => {
    switch (category) {
      case 'productivity':
        return 'productivity-card hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-600';
      case 'management':
        return 'management-card hover:bg-green-50/50 dark:hover:bg-green-900/10 hover:border-green-300 dark:hover:border-green-600';
      case 'compliance':
        return 'compliance-card hover:bg-pink-50/50 dark:hover:bg-pink-900/10 hover:border-pink-300 dark:hover:border-pink-600';
      default:
        return '';
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .feature-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
            overflow: hidden;
          }
          .feature-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          }
          .dark .feature-card:hover {
            box-shadow: 0 8px 20px rgba(0,0,0,0.4);
          }
          .section-header {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
            border-left: 4px solid rgb(99, 102, 241);
          }
          .dashboard-section {
            overflow: hidden;
          }
          .cards-grid {
            padding: 0 2px;
          }
        `
      }} />
      <div 
        onClick={onClick}
        className={`feature-card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md cursor-pointer border border-gray-200 dark:border-gray-700 ${getCategoryClasses()}`}
      >
        <div className="icon text-2xl mb-3">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
      </div>
    </>
  );
}

// Section header component
interface SectionHeaderProps {
  title: string;
  description: string;
  icon: string;
}

function SectionHeader({ title, description, icon }: SectionHeaderProps) {
  return (
    <div className="section-header rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm ml-11">{description}</p>
    </div>
  );
}

export default function Dashboard({ onSelectOption }: DashboardProps) {
  // Group options by category based on their function
  const productivityOptions = DASHBOARD_OPTIONS.filter(option => 
    ['bookmarks', 'snippets'].includes(option.id)
  );

  const managementOptions = DASHBOARD_OPTIONS.filter(option => 
    ['copilot-manager', 'grant-access', 'list-public-repos', 'list-private-repos', 'actions-manager'].includes(option.id)
  );

  const complianceOptions = DASHBOARD_OPTIONS.filter(option => 
    ['two-factor-checker', 'delete-user-access', 'export-usernames'].includes(option.id)
  );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What would you like to do?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
            Choose from organized sections below to manage your GitHub repositories and user access.
          </p>
        </div>

        <div className="space-y-12 dashboard-section">
          {/* Productivity Section */}
          <section className="overflow-hidden">
            <SectionHeader
              title="Productivity"
              description="Daily-use tools for efficient development workflow"
              icon="⚡"
            />
            <div className="cards-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {productivityOptions.map((option) => (
                <Card
                  key={option.id}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  onClick={() => onSelectOption(option.id)}
                  category="productivity"
                />
              ))}
            </div>
          </section>

          {/* Management Section */}
          <section className="overflow-hidden">
            <SectionHeader
              title="Management"
              description="Administrative tools for repository and access control"
              icon="🔧"
            />
            <div className="cards-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {managementOptions.map((option) => (
                <Card
                  key={option.id}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  onClick={() => onSelectOption(option.id)}
                  category="management"
                />
              ))}
            </div>
          </section>

          {/* Security & Compliance Section */}
          <section className="overflow-hidden">
            <SectionHeader
              title="Security & Compliance"
              description="Security auditing and compliance monitoring tools"
              icon="🛡️"
            />
            <div className="cards-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {complianceOptions.map((option) => (
                <Card
                  key={option.id}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  onClick={() => onSelectOption(option.id)}
                  category="compliance"
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
