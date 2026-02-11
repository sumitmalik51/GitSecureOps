import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  copilot: 'Copilot Management',
  access: 'Access Control',
  'access-management': 'Access Management',
  repositories: 'Repositories',
  security: 'Security',
  search: 'Search',
  analytics: 'Analytics',
  audit: 'Audit Logs',
  recommendations: 'Recommendations',
  settings: 'Settings',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0 || location.pathname === '/') return null;

  return (
    <nav className="flex items-center gap-1 text-sm mb-4" aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="text-dark-text-muted hover:text-dark-text transition-colors flex items-center gap-1"
      >
        <Home size={14} />
        <span>Home</span>
      </Link>
      {pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        const isLast = index === pathSegments.length - 1;
        const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-dark-text-muted" />
            {isLast ? (
              <span className="text-dark-text font-medium">{label}</span>
            ) : (
              <Link
                to={path}
                className="text-dark-text-muted hover:text-dark-text transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
