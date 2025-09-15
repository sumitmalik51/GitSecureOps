import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function AnalyticsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
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
              <h1 className="text-3xl font-bold text-dark-text">Performance Analytics</h1>
              <p className="text-dark-text-muted">Detailed performance metrics and insights</p>
            </div>
          </div>
        </motion.div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center min-h-96"
        >
          <Card className="p-12 text-center max-w-md">
            <BarChart3 className="w-16 h-16 text-brand-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-dark-text mb-4">Coming Soon</h2>
            <p className="text-dark-text-muted mb-6">
              Comprehensive analytics dashboard with performance metrics, 
              contribution insights, and team productivity tracking.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
