import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OAuthCallback from './pages/OAuthCallback';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CommandPalette from './components/CommandPalette';
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

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <CommandPalette />
          <div className="min-h-screen bg-dark-bg">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/oauth-callback" element={<OAuthCallback />} />
                <Route path="/oauth-success" element={<OAuthCallback />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageSkeleton />}>
                        <DashboardPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/copilot"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageSkeleton />}>
                        <CopilotPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/access"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageSkeleton />}>
                        <AccessPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/access-management"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageSkeleton />}>
                        <AccessManagementPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/repositories"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageSkeleton />}>
                        <RepositoriesPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/security"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageSkeleton />}>
                        <SecurityPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audit"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageSkeleton />}>
                        <AuditLogsPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageSkeleton />}>
                        <SearchPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recommendations"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageSkeleton />}>
                        <RecommendationsPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageSkeleton />}>
                        <AnalyticsPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </motion.div>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
