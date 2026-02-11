import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Lock, Unlock, Eye, Star, GitFork, Search, Filter, ExternalLink } from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import githubService, { GitHubRepo } from '../services/githubService'

export default function RepositoriesPage() {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [repositories, setRepositories] = useState<GitHubRepo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('all')

  useEffect(() => {
    loadRepositories()
  }, [token])

  const loadRepositories = async () => {
    if (!token) return
    
    try {
      setIsLoading(true)
      const repos = await githubService.getUserRepositories()
      setRepositories(repos)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load repositories:', error)
      setIsLoading(false)
    }
  }

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (visibilityFilter === 'all' || 
     (visibilityFilter === 'private' && repo.private) ||
     (visibilityFilter === 'public' && !repo.private))
  )

  const stats = {
    total: repositories.length,
    private: repositories.filter(r => r.private).length,
    public: repositories.filter(r => !r.private).length,
    totalStars: 0 // repositories.reduce((sum, repo) => sum + (repo.stars || 0), 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-text-muted">Loading repositories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-text-muted text-sm">Total Repositories</p>
                <p className="text-2xl font-bold text-dark-text">{stats.total}</p>
              </div>
              <GitBranch className="w-8 h-8 text-brand-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-text-muted text-sm">Private</p>
                <p className="text-2xl font-bold text-dark-text">{stats.private}</p>
              </div>
              <Lock className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-text-muted text-sm">Public</p>
                <p className="text-2xl font-bold text-dark-text">{stats.public}</p>
              </div>
              <Unlock className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-text-muted text-sm">Total Stars</p>
                <p className="text-2xl font-bold text-dark-text">{stats.totalStars}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-text-muted" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-dark-text-muted" />
                <select
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                  <option value="all">All Repositories</option>
                  <option value="public">Public Only</option>
                  <option value="private">Private Only</option>
                </select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Repository List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-text">
                Repositories ({filteredRepos.length})
              </h2>
            </div>
            
            <div className="space-y-4">
              {filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between p-4 bg-dark-card rounded-lg border border-dark-border hover:border-brand-primary/50 transition-colors"
                >
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-dark-text font-medium text-lg">{repo.name}</h3>
                        <div className="flex items-center space-x-2">
                          {repo.private ? (
                            <div className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 rounded text-red-400 text-xs">
                              <Lock className="w-3 h-3" />
                              <span>Private</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 rounded text-green-400 text-xs">
                              <Unlock className="w-3 h-3" />
                              <span>Public</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {repo.description && (
                        <p className="text-dark-text-muted text-sm mb-3">{repo.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-6 text-dark-text-muted text-sm">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <GitFork className="w-4 h-4" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>TypeScript</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(repo.html_url, '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View</span>
                    </Button>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredRepos.length === 0 && (
              <div className="text-center py-12">
                <GitBranch className="w-16 h-16 text-dark-text-muted mx-auto mb-4" />
                <p className="text-dark-text-muted text-lg">No repositories found</p>
                <p className="text-dark-text-muted text-sm">
                  {searchTerm ? 'Try adjusting your search terms' : 'No repositories match the selected filters'}
                </p>
              </div>
            )}
          </Card>
        </motion.div>
    </div>
  )
}
