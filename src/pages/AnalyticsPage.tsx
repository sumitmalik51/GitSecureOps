import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Users, 
  Activity,
  Download,
  Filter,
  Calendar,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowLeft
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import EnhancedCard, { StatCard, CardHeader, CardContent } from '../components/ui/EnhancedCard'
import Button from '../components/ui/Button'
import { 
  SecurityMetricsChart, 
  CopilotUsageTrendChart, 
  RepositoryActivityChart, 
  TeamPerformanceChart 
} from '../components/charts/InteractiveCharts'
import { animationVariants } from '../utils/animations'
import { announceToScreenReader } from '../utils/accessibility'

// Mock data for demonstration
const mockSecurityData = {
  vulnerabilities: { critical: 3, high: 8, medium: 15, low: 22 },
  repositories: 45,
  lastScan: '2025-09-20T10:30:00Z'
}

const mockCopilotData = [
  { date: '2025-09-14', activeUsers: 24, suggestions: 1250, acceptedSuggestions: 875 },
  { date: '2025-09-15', activeUsers: 28, suggestions: 1420, acceptedSuggestions: 995 },
  { date: '2025-09-16', activeUsers: 22, suggestions: 1180, acceptedSuggestions: 820 },
  { date: '2025-09-17', activeUsers: 31, suggestions: 1680, acceptedSuggestions: 1260 },
  { date: '2025-09-18', activeUsers: 29, suggestions: 1540, acceptedSuggestions: 1155 },
  { date: '2025-09-19', activeUsers: 33, suggestions: 1790, acceptedSuggestions: 1340 },
  { date: '2025-09-20', activeUsers: 35, suggestions: 1920, acceptedSuggestions: 1440 }
]

const mockRepositoryData = [
  { name: 'web-app', commits: 245, issues: 12, pullRequests: 34 },
  { name: 'api-service', commits: 189, issues: 8, pullRequests: 28 },
  { name: 'mobile-app', commits: 156, issues: 15, pullRequests: 22 },
  { name: 'docs', commits: 89, issues: 3, pullRequests: 12 },
  { name: 'infra', commits: 67, issues: 7, pullRequests: 15 }
]

const mockTeamPerformance = {
  codeQuality: 85,
  security: 78,
  productivity: 92,
  collaboration: 88,
  innovation: 76
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [selectedMetrics] = useState<string[]>(['security', 'copilot', 'activity'])
  const [isLoading, setIsLoading] = useState(false)

  // Simulate data loading
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
      announceToScreenReader('Analytics data updated')
    }, 1000)
    return () => clearTimeout(timer)
  }, [timeRange])

  const handleTimeRangeChange = (range: '7d' | '30d' | '90d') => {
    setTimeRange(range)
    announceToScreenReader(`Time range changed to ${range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}`)
  }

  const handleExportData = () => {
    announceToScreenReader('Exporting analytics data')
    // Simulate export
    setTimeout(() => {
      announceToScreenReader('Analytics data exported successfully')
    }, 1000)
  }

  // Calculate statistics
  const totalVulnerabilities = Object.values(mockSecurityData.vulnerabilities).reduce((a, b) => a + b, 0)
  const copilotAcceptanceRate = Math.round((mockCopilotData[mockCopilotData.length - 1].acceptedSuggestions / mockCopilotData[mockCopilotData.length - 1].suggestions) * 100)
  const activeUsers = mockCopilotData[mockCopilotData.length - 1].activeUsers

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          variants={animationVariants.pageTransition}
          initial="initial"
          animate="animate"
          className="flex flex-col md:flex-row md:items-center justify-between mb-8"
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
              <h1 className="text-3xl font-bold text-dark-text mb-2">Analytics Dashboard</h1>
              <p className="text-dark-text-muted">Comprehensive insights into your organization's security and productivity</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            {/* Time Range Selector */}
            <div className="flex bg-dark-card rounded-lg p-1 border border-dark-border">
              {[
                { key: '7d', label: '7D' },
                { key: '30d', label: '30D' },
                { key: '90d', label: '90D' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleTimeRangeChange(key as '7d' | '30d' | '90d')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                    timeRange === key
                      ? 'bg-brand-primary text-white'
                      : 'text-dark-text-muted hover:text-dark-text hover:bg-dark-surface'
                  }`}
                  aria-pressed={timeRange === key}
                  aria-label={`Select ${key === '7d' ? '7 days' : key === '30d' ? '30 days' : '90 days'} time range`}
                >
                  {label}
                </button>
              ))}
            </div>
            
            <Button onClick={handleExportData} variant="outline" size="sm" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          variants={animationVariants.staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Security Issues"
            value={totalVulnerabilities}
            change={{ value: -12, trend: 'down' }}
            description="Total vulnerabilities found"
            icon={<Shield className="w-8 h-8 text-red-500" />}
          />
          
          <StatCard
            title="Active Copilot Users"
            value={activeUsers}
            change={{ value: 8, trend: 'up' }}
            description="Users active in last 24h"
            icon={<Users className="w-8 h-8 text-blue-500" />}
          />
          
          <StatCard
            title="Acceptance Rate"
            value={`${copilotAcceptanceRate}%`}
            change={{ value: 3, trend: 'up' }}
            description="Copilot suggestions accepted"
            icon={<CheckCircle2 className="w-8 h-8 text-green-500" />}
          />
          
          <StatCard
            title="Team Performance"
            value="85%"
            change={{ value: 5, trend: 'up' }}
            description="Overall team score"
            icon={<TrendingUp className="w-8 h-8 text-purple-500" />}
          />
        </motion.div>

        {/* Charts Grid */}
        <motion.div
          variants={animationVariants.staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Security Metrics */}
          {selectedMetrics.includes('security') && (
            <EnhancedCard 
              variant="elevated" 
              className="chart-container"
              loading={isLoading}
              role="img"
              aria-label="Security vulnerabilities breakdown chart"
            >
              <CardHeader
                title="Security Overview"
                subtitle="Vulnerability distribution across severity levels"
                icon={<Shield className="w-5 h-5 text-red-500" />}
                actions={
                  <Button variant="ghost" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                }
              />
              <CardContent>
                <SecurityMetricsChart data={mockSecurityData} isDark />
              </CardContent>
            </EnhancedCard>
          )}

          {/* Copilot Usage */}
          {selectedMetrics.includes('copilot') && (
            <EnhancedCard 
              variant="elevated" 
              className="chart-container"
              loading={isLoading}
              role="img"
              aria-label="GitHub Copilot usage trend chart"
            >
              <CardHeader
                title="Copilot Usage Trends"
                subtitle="Daily activity and acceptance rates"
                icon={<Zap className="w-5 h-5 text-blue-500" />}
                actions={
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                }
              />
              <CardContent>
                <CopilotUsageTrendChart data={mockCopilotData} isDark />
              </CardContent>
            </EnhancedCard>
          )}

          {/* Repository Activity */}
          {selectedMetrics.includes('activity') && (
            <EnhancedCard 
              variant="elevated" 
              className="chart-container"
              loading={isLoading}
              role="img"
              aria-label="Repository activity comparison chart"
            >
              <CardHeader
                title="Repository Activity"
                subtitle="Commits, issues, and PRs by repository"
                icon={<BarChart3 className="w-5 h-5 text-green-500" />}
                actions={
                  <Button variant="ghost" size="sm">
                    <Calendar className="w-4 h-4" />
                  </Button>
                }
              />
              <CardContent>
                <RepositoryActivityChart data={mockRepositoryData} isDark />
              </CardContent>
            </EnhancedCard>
          )}

          {/* Team Performance Radar */}
          <EnhancedCard 
            variant="gradient" 
            className="chart-container"
            loading={isLoading}
            role="img"
            aria-label="Team performance radar chart"
          >
            <CardHeader
              title="Team Performance"
              subtitle="Multi-dimensional performance analysis"
              icon={<Activity className="w-5 h-5 text-purple-500" />}
            />
            <CardContent>
              <TeamPerformanceChart 
                data={mockTeamPerformance} 
                teamName="Development Team" 
                isDark 
              />
            </CardContent>
          </EnhancedCard>
        </motion.div>

        {/* Insights and Recommendations */}
        <motion.div
          variants={animationVariants.staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Security Insights */}
          <EnhancedCard variant="feature" interactive>
            <CardHeader
              title="Security Insights"
              icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
            />
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-dark-text">Critical vulnerabilities detected</p>
                    <p className="text-xs text-dark-text-muted">3 critical issues found in web-app repository requiring immediate attention</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-dark-text">Security score improved</p>
                    <p className="text-xs text-dark-text-muted">Overall security posture up 12% from last month</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-dark-text">Automated fixes available</p>
                    <p className="text-xs text-dark-text-muted">15 vulnerabilities can be automatically resolved</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>

          {/* Performance Recommendations */}
          <EnhancedCard variant="feature" interactive>
            <CardHeader
              title="Performance Recommendations"
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
            />
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-dark-text">Increase Copilot adoption</p>
                    <p className="text-xs text-dark-text-muted">5 team members haven't used Copilot this week</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-dark-text">Code review efficiency</p>
                    <p className="text-xs text-dark-text-muted">PR review time decreased by 23% this month</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-dark-text">Focus areas identified</p>
                    <p className="text-xs text-dark-text-muted">Documentation and testing need attention</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
        </motion.div>
      </div>
    </div>
  )
}
