import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OAuthCallback from './pages/OAuthCallback';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CommandPalette from './components/CommandPalette';
import AppShell from './components/layout/AppShell';
import { PageSkeleton } from './components/ui/Skeleton';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Lazy-loaded pages for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CopilotPage = lazy(() => import('./pages/CopilotPage'));
const AccessPage = lazy(() => import('./pages/AccessPage'));
const RepositoriesPage = lazy(() => import('./pages/RepositoriesPage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const AccessManagementPage = lazy(() => import('./pages/AccessManagementPage'));
const CopilotROIPage = lazy(() => import('./pages/CopilotROIPage'));
const AccessReviewPage = lazy(() => import('./pages/AccessReviewPage'));
const VisibilityDriftPage = lazy(() => import('./pages/VisibilityDriftPage'));
const PRReviewPage = lazy(() => import('./pages/PRReviewPage'));
const ActionsCostPage = lazy(() => import('./pages/ActionsCostPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const TeamMembersPage = lazy(() => import('./pages/TeamMembersPage'));
const SSOManagementPage = lazy(() => import('./pages/SSOManagementPage'));
const CostManagerPage = lazy(() => import('./pages/CostManagerPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <CommandPalette />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route path="/oauth-success" element={<OAuthCallback />} />

            {/* Protected routes — wrapped in AppShell layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route
                path="/dashboard"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="/copilot"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <CopilotPage />
                  </Suspense>
                }
              />
              <Route
                path="/access"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <AccessPage />
                  </Suspense>
                }
              />
              <Route
                path="/access-management"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <AccessManagementPage />
                  </Suspense>
                }
              />
              <Route
                path="/repositories"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <RepositoriesPage />
                  </Suspense>
                }
              />
              <Route
                path="/security"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <SecurityPage />
                  </Suspense>
                }
              />
              <Route
                path="/audit"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <AuditLogsPage />
                  </Suspense>
                }
              />
              <Route
                path="/search"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <SearchPage />
                  </Suspense>
                }
              />
              <Route
                path="/recommendations"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <RecommendationsPage />
                  </Suspense>
                }
              />
              <Route
                path="/analytics"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <AnalyticsPage />
                  </Suspense>
                }
              />
              <Route
                path="/copilot-roi"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <CopilotROIPage />
                  </Suspense>
                }
              />
              <Route
                path="/access-review"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <AccessReviewPage />
                  </Suspense>
                }
              />
              <Route
                path="/visibility-drift"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <VisibilityDriftPage />
                  </Suspense>
                }
              />
              <Route
                path="/pr-review"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <PRReviewPage />
                  </Suspense>
                }
              />
              <Route
                path="/actions-cost"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <ActionsCostPage />
                  </Suspense>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <OnboardingPage />
                  </Suspense>
                }
              />
              <Route
                path="/team-members"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <TeamMembersPage />
                  </Suspense>
                }
              />
              <Route
                path="/sso"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <SSOManagementPage />
                  </Suspense>
                }
              />
              <Route
                path="/cost-manager"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <CostManagerPage />
                  </Suspense>
                }
              />
              <Route
                path="/settings"
                element={
                  <Suspense fallback={<PageSkeleton />}>
                    <SettingsPage />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
