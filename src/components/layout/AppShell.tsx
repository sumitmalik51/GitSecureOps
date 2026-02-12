import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from './Sidebar';
import TopBar from './TopBar';

// Map routes to page titles
const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your GitHub security posture' },
  '/analytics': { title: 'Analytics', subtitle: 'Performance metrics and trends' },
  '/repositories': { title: 'Repositories', subtitle: 'Manage repository access and settings' },
  '/access': { title: 'Access Control', subtitle: 'Grant and manage user permissions' },
  '/access-management': {
    title: 'Access Management',
    subtitle: 'Delete access and export user data',
  },
  '/copilot': { title: 'Copilot', subtitle: 'Manage GitHub Copilot settings' },
  '/security': { title: 'Security', subtitle: '2FA enforcement and vulnerability scanning' },
  '/audit': { title: 'Audit Logs', subtitle: 'Track all security-related events' },
  '/recommendations': { title: 'Recommendations', subtitle: 'AI-powered security suggestions' },
  '/search': { title: 'Code Search', subtitle: 'Search across repositories' },
  '/copilot-roi': {
    title: 'Copilot ROI',
    subtitle: 'Seat utilization, cost savings & reclamation',
  },
  '/access-review': {
    title: 'Access Review',
    subtitle: 'Periodic access certification for compliance',
  },
  '/visibility-drift': {
    title: 'Visibility Drift',
    subtitle: 'Detect and fix unintended public repositories',
  },
  '/pr-review': { title: 'PR Review', subtitle: 'Identify stuck PRs and overloaded reviewers' },
  '/actions-cost': {
    title: 'Actions Cost',
    subtitle: 'Track GitHub Actions usage and estimated costs',
  },
  '/onboarding': { title: 'Onboarding', subtitle: 'One-click provisioning for new team members' },
  '/team-members': {
    title: 'Team Members',
    subtitle: 'Manage org members, collaborators & invitations',
  },
  '/sso': { title: 'SSO & SAML', subtitle: 'SAML SSO identities, SCIM provisioning & compliance' },
  '/cost-manager': {
    title: 'Cost Manager',
    subtitle: 'Enterprise billing, Copilot PAYG & Actions cost analysis',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Account, organization access & authentication management',
  },
  '/org-pulse': {
    title: 'Organization Pulse',
    subtitle: 'Live mission control — real-time activity feed & heartbeat',
  },
  '/security-radar': {
    title: 'Security Threat Radar',
    subtitle: 'Animated radar sweep — detect and classify security threats',
  },
  '/repo-health': {
    title: 'Repository Health',
    subtitle: 'A-F grading for every repo — README, CI/CD, protection & more',
  },
  '/dev-velocity': {
    title: 'Developer Velocity',
    subtitle: 'PR cycle time, review speed & engineering throughput metrics',
  },
};

export default function AppShell() {
  const location = useLocation();
  const pageInfo = pageTitles[location.pathname] || { title: '', subtitle: '' };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
