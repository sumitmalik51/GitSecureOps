import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CopilotPage from './pages/CopilotPage'
import AccessPage from './pages/AccessPage'
import RepositoriesPage from './pages/RepositoriesPage'
import SecurityPage from './pages/SecurityPage'
import SearchPage from './pages/SearchPage'
import AnalyticsPage from './pages/AnalyticsPage'
import PATManagementPage from './pages/PATManagementPage'
import OAuthCallback from './pages/OAuthCallback'
import AccessManagementPage from './pages/AccessManagementPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
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
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/copilot" 
                element={
                  <ProtectedRoute>
                    <CopilotPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/access" 
                element={
                  <ProtectedRoute>
                    <AccessPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/access-management" 
                element={
                  <ProtectedRoute>
                    <AccessManagementPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/repositories" 
                element={
                  <ProtectedRoute>
                    <RepositoriesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/security" 
                element={
                  <ProtectedRoute>
                    <SecurityPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/audit" 
                element={
                  <ProtectedRoute>
                    <SecurityPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/search" 
                element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recommendations" 
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tokens" 
                element={
                  <ProtectedRoute>
                    <PATManagementPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </motion.div>
        </div>
      </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
