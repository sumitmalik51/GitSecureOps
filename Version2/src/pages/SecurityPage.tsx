import { motion } from 'framer-motion'
import { ArrowLeft, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TwoFactorChecker from '../components/TwoFactorChecker'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function SecurityPage() {
  const navigate = useNavigate()
  const { token } = useAuth()

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-dark-text">Security Management</h1>
              <p className="text-dark-text-muted">Two-Factor Authentication enforcement and compliance monitoring</p>
            </div>
          </div>
        </motion.div>

        {/* 2FA Checker Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {token ? (
            <TwoFactorChecker 
              token={token}
              onBack={() => navigate('/dashboard')}
            />
          ) : (
            <Card className="p-12 text-center max-w-md mx-auto">
              <Shield className="w-16 h-16 text-brand-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-dark-text mb-4">Authentication Required</h2>
              <p className="text-dark-text-muted mb-6">
                You need to be authenticated with GitHub to use the 2FA checker.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
