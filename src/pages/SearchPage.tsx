import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function SearchPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 max-w-7xl">

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center min-h-96"
        >
          <Card className="p-12 text-center max-w-md">
            <Search className="w-16 h-16 text-brand-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-dark-text mb-4">Coming Soon</h2>
            <p className="text-dark-text-muted mb-6">
              Advanced code search functionality will allow you to search across 
              all repositories with powerful filters and syntax highlighting.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </Card>
        </motion.div>
    </div>
  )
}
