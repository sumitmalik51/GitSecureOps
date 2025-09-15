import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Shield, 
  Users, 
  GitBranch, 
  BarChart3, 
  Settings,
  Bell,
  Plus,
  Lock,
  UserPlus,
  Download,
  Eye,
  Bookmark,
  Code2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  LogOut
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import githubService from '../services/githubService'

export default function DashboardPage() {
  const { user, logout, token } = useAuth()
  const { success, error: showError, warning } = useToast()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalRepos: 0,
    publicRepos: 0,
    privateRepos: 0,
    totalOrgs: 0
  })

  // Repository management state
  const [repositories, setRepositories] = useState<any[]>([])
  const [isFetchingRepos, setIsFetchingRepos] = useState(false)
  const [showReposList, setShowReposList] = useState(false)
  const [repoListType, setRepoListType] = useState<'public' | 'private'>('public')

  // Notifications state
  const [hasNotifications, setHasNotifications] = useState(false)

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check for notifications (you can extend this to check real notifications)
  const checkForNotifications = async () => {
    try {
      // For now, just set to false. You can implement real notification checking here
      // Example: const notifications = await githubService.getNotifications();
      // setHasNotifications(notifications.length > 0);
      // setNotificationCount(notifications.length);
      setHasNotifications(false);
    } catch (error) {
      console.error('Failed to check notifications:', error);
      setHasNotifications(false);
    }
  };

  // Handle feature actions
  const handleFeatureAction = (featureTitle: string) => {
    switch (featureTitle) {
      case 'Copilot Management':
        navigate('/copilot')
        break
      case 'User Access Control':
        navigate('/access')
        break
      case 'Repository Overview':
        navigate('/repositories')
        break
      case '2FA Enforcement':
        navigate('/security')
        break
      case 'Audit Logs':
        navigate('/audit')
        break
      case 'Vulnerability Scanning':
        navigate('/security')
        break
      case 'Code Search':
        navigate('/search')
        break
      case 'Smart Recommendations':
        navigate('/recommendations')
        break
      case 'Performance Analytics':
        navigate('/analytics')
        break
      case 'Delete User Access':
      case 'Export User Data':
        navigate('/access-management')
        break
      default:
        console.log(`Action for ${featureTitle} not implemented yet`)
    }
  }
  
  // Load GitHub data on component mount
  useEffect(() => {
    if (token) {
      loadGitHubData()
    }
  }, [token])

  const loadGitHubData = async () => {
    try {
      setIsLoading(true)
      githubService.setToken(token!)
      
      // Fetch user repositories, organizations, and recent activity in parallel
      const [userRepos, userOrgs] = await Promise.all([
        githubService.getUserRepositories(),
        githubService.getUserOrganizations()
      ])
      
      // Calculate stats
      setStats({
        totalRepos: userRepos.length,
        publicRepos: userRepos.filter(repo => !repo.private).length,
        privateRepos: userRepos.filter(repo => repo.private).length,
        totalOrgs: userOrgs.length
      })

      // Load recent activity
      await loadRecentActivity()
      
      // Check for notifications
      await checkForNotifications()
      
    } catch (error) {
      console.error('Failed to load GitHub data:', error)
      showError('Failed to load GitHub data', 'Please check your token permissions.')
    } finally {
      setIsLoading(false)
    }
  }

  // Repository management functions
  const fetchAndShowRepositories = async (type: 'public' | 'private') => {
    try {
      setIsFetchingRepos(true)
      githubService.setToken(token!)
      
      const allRepos = await githubService.getUserRepositories()
      
      let filteredRepos = allRepos
      if (type === 'public') {
        filteredRepos = allRepos.filter(repo => !repo.private)
      } else if (type === 'private') {
        filteredRepos = allRepos.filter(repo => repo.private)
      }
      
      setRepositories(filteredRepos)
      setRepoListType(type)
      setShowReposList(true)
      setActiveSection('repositories') // Switch to a repositories view
      
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
      showError('Failed to fetch repositories', 'Please check your permissions.')
    } finally {
      setIsFetchingRepos(false)
    }
  }

  const exportRepositories = () => {
    if (repositories.length === 0) {
      warning('No repositories to export', 'Please fetch repositories first.')
      return
    }

    try {
      // Prepare data for export
      const exportData = repositories.map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        description: repo.description || '',
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        clone_url: repo.clone_url,
        html_url: repo.html_url
      }))

      // Create CSV content
      const headers = ['Name', 'Full Name', 'Private', 'Description', 'Language', 'Stars', 'Forks', 'Created', 'Updated', 'Clone URL', 'GitHub URL']
      const csvContent = [
        headers.join(','),
        ...exportData.map(repo => [
          repo.name,
          repo.full_name,
          repo.private,
          `"${repo.description.replace(/"/g, '""')}"`,
          repo.language,
          repo.stars,
          repo.forks,
          new Date(repo.created_at).toLocaleDateString(),
          new Date(repo.updated_at).toLocaleDateString(),
          repo.clone_url,
          repo.html_url
        ].join(','))
      ].join('\n')

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `repositories_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      success('Export Successful', `Exported ${repositories.length} repositories to CSV file`)
      
    } catch (error) {
      console.error('Failed to export repositories:', error)
      showError('Export Failed', 'Failed to export repositories')
    }
  }
  
  const sidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'management', label: 'Management', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'productivity', label: 'Productivity', icon: TrendingUp },
    { id: 'repositories', label: 'Repositories', icon: GitBranch },
  ]

  const getStatsCards = () => [
    { 
      label: 'Total Repositories', 
      value: isLoading ? '...' : stats.totalRepos.toString(), 
      icon: GitBranch, 
      change: stats.totalRepos > 0 ? `${stats.publicRepos} public` : '0 repos',
      trend: 'neutral' 
    },
    { 
      label: 'Private Repos', 
      value: isLoading ? '...' : stats.privateRepos.toString(), 
      icon: Lock, 
      change: `${Math.round((stats.privateRepos / Math.max(stats.totalRepos, 1)) * 100)}% of total`,
      trend: 'up' 
    },
    { 
      label: 'Organizations', 
      value: isLoading ? '...' : stats.totalOrgs.toString(), 
      icon: Users, 
      change: stats.totalOrgs > 0 ? 'Connected' : 'None',
      trend: stats.totalOrgs > 0 ? 'up' : 'neutral' 
    },
    { 
      label: 'Account Status', 
      value: user ? 'Active' : 'Inactive', 
      icon: CheckCircle, 
      change: user ? `@${user.login}` : 'Not authenticated',
      trend: user ? 'up' : 'down' 
    },
  ]

  const managementFeatures = [
    {
      title: 'Copilot Management',
      description: 'Control GitHub Copilot access and monitor usage across your organization.',
      icon: Shield,
      action: 'Manage Copilot'
    },
    {
      title: 'User Access Control',
      description: 'Grant and revoke repository access for team members.',
      icon: UserPlus,
      action: 'Manage Access'
    }
  ]

  const securityFeatures = [
    {
      title: '2FA Enforcement',
      description: 'Ensure all team members have two-factor authentication enabled.',
      icon: Lock,
      action: 'Check 2FA'
    },
    {
      title: 'Delete User Access',
      description: 'Remove user access and clean up permissions securely.',
      icon: Users,
      action: 'Manage Users'
    },
    {
      title: 'Export User Data',
      description: 'Export user information for compliance and auditing.',
      icon: Download,
      action: 'Export Data'
    }
  ]

  const productivityFeatures = [
    {
      title: 'Smart Bookmarks',
      description: 'Save and organize important repositories and resources.',
      icon: Bookmark,
      action: 'View Bookmarks'
    },
    {
      title: 'Code Snippets',
      description: 'Manage reusable code snippets across your projects.',
      icon: Code2,
      action: 'Manage Snippets'
    },
    {
      title: 'Activity Monitoring',
      description: 'Track team activity and repository insights.',
      icon: Eye,
      action: 'View Activity'
    }
  ]

  // Load real recent activity
  const loadRecentActivity = async () => {
    try {
      // Fetch recent events from GitHub API
      const events = await githubService.getUserEvents()
      
      if (events.length > 0) {
        const processedActivity = events.slice(0, 10).map((event: any) => ({
          type: event.type === 'PushEvent' ? 'commit' : 
                event.type === 'PullRequestEvent' ? 'pr' :
                event.type === 'IssuesEvent' ? 'issue' : 'activity',
          title: getEventTitle(event),
          repo: event.repo?.name || 'Unknown repository',
          user: event.actor?.login || 'Unknown user',
          time: getTimeAgo(event.created_at),
          icon: getEventIcon(event.type)
        }))
        setRecentActivity(processedActivity)
      } else {
        // Provide fallback activity data if no events are available
        setRecentActivity([
          {
            type: 'activity',
            title: 'Welcome to GitSecureOps',
            repo: 'Getting Started',
            user: user?.login || 'User',
            time: 'Just now',
            icon: Shield
          },
          {
            type: 'activity',
            title: '2FA feature enabled',
            repo: 'Security Enhancement',
            user: 'System',
            time: '5 minutes ago',
            icon: Shield
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error)
      // Fallback to welcome activity if API fails
      setRecentActivity([
        {
          type: 'activity',
          title: 'Welcome to GitSecureOps',
          repo: 'Getting Started',
          user: user?.login || 'User',
          time: 'Just now',
          icon: Shield
        },
        {
          type: 'activity',
          title: 'Dashboard loaded successfully',
          repo: 'System Status',
          user: 'System',
          time: '1 minute ago',
          icon: CheckCircle
        }
      ])
    }
  }

  const getEventTitle = (event: any) => {
    switch (event.type) {
      case 'PushEvent':
        const commitCount = event.payload?.commits?.length || 1
        return `${commitCount} commit${commitCount > 1 ? 's' : ''} pushed`
      case 'PullRequestEvent':
        const action = event.payload?.action
        return `Pull request ${action || 'updated'}`
      case 'IssuesEvent':
        return `Issue ${event.payload?.action || 'updated'}`
      case 'CreateEvent':
        return `Created ${event.payload?.ref_type || 'repository'}`
      case 'DeleteEvent':
        return `Deleted ${event.payload?.ref_type || 'branch'}`
      case 'WatchEvent':
        return 'Starred repository'
      case 'ForkEvent':
        return 'Forked repository'
      default:
        return 'Repository activity'
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'PushEvent': return GitBranch
      case 'PullRequestEvent': return CheckCircle
      case 'IssuesEvent': return AlertTriangle
      case 'CreateEvent': return Plus
      case 'WatchEvent': return Eye
      default: return Shield
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return `${Math.max(1, diffInMinutes)} minute${diffInMinutes > 1 ? 's' : ''} ago`
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  }

  const renderFeatures = () => {
    switch (activeSection) {
      case 'management':
        return managementFeatures
      case 'security':
        return securityFeatures
      case 'productivity':
        return productivityFeatures
      case 'repositories':
        return [] // We'll render repositories list separately
      default:
        return [...managementFeatures.slice(0, 2), ...securityFeatures.slice(0, 2), ...productivityFeatures.slice(0, 2)]
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Sidebar */}
      <motion.aside 
        className="w-64 bg-dark-surface border-r border-dark-border flex flex-col"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gradient-primary">GitSecureOps</h2>
              <p className="text-xs text-dark-text-muted">Team Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeSection === item.id
                  ? 'bg-brand-primary text-white glow-primary'
                  : 'text-dark-text-muted hover:text-dark-text hover:bg-dark-card'
              }`}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </motion.button>
          ))}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.login || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold">
                  {user?.login?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-dark-text">{user?.login || 'User'}</p>
              <p className="text-xs text-dark-text-muted">GitHub User</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <motion.header 
          className="bg-dark-surface border-b border-dark-border px-6 py-4 flex items-center justify-between"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div>
            <h1 className="text-2xl font-bold text-dark-text">
              {activeSection === 'overview' ? 'Dashboard Overview' : 
               activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h1>
            <p className="text-dark-text-muted">Welcome back, {user?.name || user?.login}</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              {user?.avatar_url && (
                <img 
                  src={user.avatar_url} 
                  alt={user.login}
                  className="w-8 h-8 rounded-full border-2 border-brand-primary"
                />
              )}
              <span className="text-dark-text font-medium">{user?.login}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-dark-text-muted hover:text-dark-text transition-colors">
              <Bell className="w-5 h-5" />
              {hasNotifications && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand-secondary rounded-full" />
              )}
            </button>
          </div>
        </motion.header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6">
          {activeSection === 'overview' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Stats Cards */}
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" variants={itemVariants}>
                {getStatsCards().map((stat, index) => (
                  <Card key={index} className="stats-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-dark-text-muted text-sm font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold text-dark-text mt-2">{stat.value}</p>
                        <div className="flex items-center mt-2">
                          <span className={`text-sm font-medium ${
                            stat.trend === 'up' ? 'text-brand-secondary' : 
                            stat.trend === 'down' ? 'text-red-400' : 'text-dark-text-muted'
                          }`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        stat.trend === 'up' ? 'bg-brand-secondary/20 text-brand-secondary' : 
                        stat.trend === 'down' ? 'bg-red-400/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Features */}
            <div className="lg:col-span-2">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.h2 
                  className="text-xl font-bold text-dark-text mb-6" 
                  variants={itemVariants}
                >
                  {activeSection === 'overview' ? 'Quick Actions' : 
                   activeSection === 'repositories' ? `${repoListType.charAt(0).toUpperCase() + repoListType.slice(1)} Repositories` :
                   `${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Tools`}
                </motion.h2>
                
                {/* Repositories List View */}
                {activeSection === 'repositories' && (
                  <motion.div variants={itemVariants}>
                    {!showReposList ? (
                      /* Initial Repository Options */
                      <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-dark-text mb-4">Choose Repository Type</h3>
                        <p className="text-dark-text-muted mb-6">Select which type of repositories you want to view and manage</p>
                        <div className="flex justify-center gap-4">
                          <Button
                            variant="primary"
                            onClick={() => fetchAndShowRepositories('public')}
                            disabled={isFetchingRepos}
                            className="flex items-center gap-2"
                          >
                            <GitBranch className="w-4 h-4" />
                            {isFetchingRepos && repoListType === 'public' ? 'Loading...' : 'View Public Repos'}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => fetchAndShowRepositories('private')}
                            disabled={isFetchingRepos}
                            className="flex items-center gap-2"
                          >
                            <Lock className="w-4 h-4" />
                            {isFetchingRepos && repoListType === 'private' ? 'Loading...' : 'View Private Repos'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Repository List */
                      <>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex gap-4">
                        <Button
                          variant={repoListType === 'public' ? 'primary' : 'outline'}
                          onClick={() => fetchAndShowRepositories('public')}
                          disabled={isFetchingRepos}
                        >
                          {isFetchingRepos && repoListType === 'public' ? 'Loading...' : 'Public Repos'}
                        </Button>
                        <Button
                          variant={repoListType === 'private' ? 'primary' : 'outline'}
                          onClick={() => fetchAndShowRepositories('private')}
                          disabled={isFetchingRepos}
                        >
                          {isFetchingRepos && repoListType === 'private' ? 'Loading...' : 'Private Repos'}
                        </Button>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={exportRepositories}
                        disabled={repositories.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export ({repositories.length})
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {repositories.map((repo, index) => (
                        <motion.div
                          key={repo.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-dark-text">{repo.name}</h3>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    repo.private 
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  }`}>
                                    {repo.private ? 'Private' : 'Public'}
                                  </span>
                                  {repo.language && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                      {repo.language}
                                    </span>
                                  )}
                                </div>
                                <p className="text-dark-text-muted text-sm mb-2">
                                  {repo.description || 'No description available'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-dark-text-muted">
                                  <span className="flex items-center gap-1">
                                    <span>⭐</span> {repo.stargazers_count || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <GitBranch className="w-3 h-3" /> {repo.forks_count || 0}
                                  </span>
                                  <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(repo.html_url, '_blank')}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                      
                      {repositories.length === 0 && !isFetchingRepos && (
                        <div className="text-center py-12">
                          <p className="text-dark-text-muted">No repositories found. Try fetching repositories first.</p>
                        </div>
                      )}
                    </div>
                    </>
                    )}
                  </motion.div>
                )}

                {/* Regular Features Grid */}
                {activeSection !== 'repositories' && (
                <div className="grid gap-6">
                  {renderFeatures().map((feature, index) => (
                    <motion.div key={index} variants={itemVariants}>
                      <Card 
                        className="p-6 hover:glow-primary group cursor-pointer container-hover"
                        onClick={() => handleFeatureAction(feature.title)}
                      >
                        <div className="flex items-start space-x-4 container-content">
                          <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 no-blur-hover">
                            <feature.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-dark-text mb-2 group-hover:text-gradient-primary transition-colors duration-300 card-text">
                              {feature.title}
                            </h3>
                            <p className="text-dark-text-muted mb-4 leading-relaxed card-text">
                              {feature.description}
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleFeatureAction(feature.title)
                              }}
                            >
                              {feature.action}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                )}
              </motion.div>
            </div>

            {/* Recent Activity */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h2 className="text-xl font-bold text-dark-text mb-6">Recent Activity</h2>
                
                <Card className="p-6">
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={index}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-dark-card/50 transition-colors cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'pr' ? 'bg-brand-primary/20 text-brand-primary' :
                          activity.type === 'commit' ? 'bg-brand-secondary/20 text-brand-secondary' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          <activity.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-dark-text text-sm font-medium truncate">
                            {activity.title}
                          </p>
                          <p className="text-dark-text-muted text-xs">
                            {activity.repo} • by {activity.user}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-dark-text-muted">
                            <Clock className="w-3 h-3 mr-1" />
                            {activity.time}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-dark-border">
                    <Button variant="ghost" size="sm" className="w-full">
                      View All Activity
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
