import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, UserPlus, UserMinus, Shield, Users, Search, Filter, Link } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import githubService, { GitHubRepo, GitHubUser, GitHubOrg } from '../services/githubService'

export default function AccessPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [repositories, setRepositories] = useState<GitHubRepo[]>([])
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([])
  const [selectedOrgMembers, setSelectedOrgMembers] = useState<GitHubUser[]>([])
  const [selectedRepoCollabs, setSelectedRepoCollabs] = useState<GitHubUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'organizations' | 'repositories' | 'url-based'>('organizations')
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedRepo, setSelectedRepo] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [isAddingUser, setIsAddingUser] = useState(false)
  
  // URL-based access states
  const [repoUrl, setRepoUrl] = useState('')
  const [usersToAdd, setUsersToAdd] = useState('')
  const [permission, setPermission] = useState<'pull' | 'push' | 'admin'>('push')
  const [isProcessingUrl, setIsProcessingUrl] = useState(false)

  // Enhanced repository filtering states
  const [selectedOrgForRepos, setSelectedOrgForRepos] = useState('')
  const [repoSearchTerm, setRepoSearchTerm] = useState('')
  const [newOrgUsername, setNewOrgUsername] = useState('')
  const [orgUserRole, setOrgUserRole] = useState<'member' | 'admin'>('member')
  const [isAddingOrgUser, setIsAddingOrgUser] = useState(false)

  useEffect(() => {
    loadAccessData()
  }, [token])

  const loadAccessData = async () => {
    if (!token) return
    
    try {
      setIsLoading(true)
      githubService.setToken(token)
      
      // Load both repositories and organizations
      const [repos, orgs] = await Promise.all([
        githubService.getUserRepositories(),
        githubService.getUserOrganizations()
      ])
      
      setRepositories(repos)
      setOrganizations(orgs)
      
      // If user has organizations, select first one by default
      if (orgs.length > 0) {
        setSelectedOrg(orgs[0].login)
        await loadOrgMembers(orgs[0].login)
      }
      
    } catch (error) {
      console.error('Failed to load access data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrgMembers = async (orgName: string) => {
    try {
      const members = await githubService.getOrgMembers(orgName)
      setSelectedOrgMembers(members)
    } catch (error) {
      console.error(`Failed to load members for ${orgName}:`, error)
      setSelectedOrgMembers([])
    }
  }

  const loadRepoCollaborators = async (repoFullName: string) => {
    try {
      const [owner, repo] = repoFullName.split('/')
      const collabs = await githubService.getRepoCollaborators(owner, repo)
      setSelectedRepoCollabs(collabs)
    } catch (error) {
      console.error(`Failed to load collaborators for ${repoFullName}:`, error)
      setSelectedRepoCollabs([])
    }
  }

  const handleOrgChange = async (orgName: string) => {
    setSelectedOrg(orgName)
    setIsLoading(true)
    await loadOrgMembers(orgName)
    setIsLoading(false)
  }

  const handleRepoChange = async (repoFullName: string) => {
    setSelectedRepo(repoFullName)
    setIsLoading(true)
    await loadRepoCollaborators(repoFullName)
    setIsLoading(false)
  }

  const handleAddCollaborator = async () => {
    if (!newUsername.trim() || !selectedRepo) return

    try {
      setIsAddingUser(true)
      const [owner, repo] = selectedRepo.split('/')
      await githubService.addRepoCollaborator(owner, repo, newUsername.trim())
      setNewUsername('')
      // Reload collaborators
      await loadRepoCollaborators(selectedRepo)
      alert('Collaborator added successfully!')
    } catch (error) {
      console.error('Failed to add collaborator:', error)
      alert('Failed to add collaborator. Please check the username and permissions.')
    } finally {
      setIsAddingUser(false)
    }
  }

  const handleRemoveCollaborator = async (username: string) => {
    if (!selectedRepo) return

    if (!confirm(`Are you sure you want to remove ${username} from ${selectedRepo}?`)) {
      return
    }

    try {
      const [owner, repo] = selectedRepo.split('/')
      await githubService.removeRepoCollaborator(owner, repo, username)
      // Reload collaborators
      await loadRepoCollaborators(selectedRepo)
      alert('Collaborator removed successfully!')
    } catch (error) {
      console.error('Failed to remove collaborator:', error)
      alert('Failed to remove collaborator.')
    }
  }

  const handleRemoveOrgMember = async (username: string) => {
    if (!selectedOrg) return

    if (!confirm(`Are you sure you want to remove ${username} from the ${selectedOrg} organization? This will remove their access to all organization repositories.`)) {
      return
    }

    try {
      // First remove from all organization repositories
      await githubService.removeUserFromAllOrgRepos(selectedOrg, username)
      
      // Then remove from organization
      await githubService.removeOrgMember(selectedOrg, username)
      
      // Reload organization members
      await loadOrgMembers(selectedOrg)
      alert('User removed from organization successfully!')
    } catch (error) {
      console.error('Failed to remove organization member:', error)
      alert('Failed to remove user from organization. You may not have sufficient permissions.')
    }
  }

  const handleDeleteUserAccess = async (username: string) => {
    const deleteOptions = []
    
    if (viewMode === 'organizations' && selectedOrg) {
      deleteOptions.push({
        action: 'removeFromOrg',
        description: `Remove ${username} from ${selectedOrg} organization (removes all repository access)`
      })
    }
    
    if (viewMode === 'repositories' && selectedRepo) {
      deleteOptions.push({
        action: 'removeFromRepo',
        description: `Remove ${username} from ${selectedRepo} repository`
      })
    }

    // For now, let's handle the simple case directly
    if (viewMode === 'organizations') {
      await handleRemoveOrgMember(username)
    } else if (viewMode === 'repositories') {
      await handleRemoveCollaborator(username)
    }
  }

  // URL-based access functionality
  const handleUrlBasedAccess = async () => {
    if (!repoUrl.trim() || !usersToAdd.trim()) {
      alert('Please provide both repository URL and usernames')
      return
    }

    setIsProcessingUrl(true)
    
    try {
      // Parse GitHub repository URL
      const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/)
      if (!repoMatch) {
        throw new Error('Invalid GitHub repository URL')
      }

      const [, owner, repo] = repoMatch
      const usernames = usersToAdd.split(',').map(u => u.trim()).filter(u => u)

      let successCount = 0
      let errors: string[] = []

      // Add each user as collaborator
      for (const username of usernames) {
        try {
          await githubService.addRepoCollaborator(owner, repo, username, permission)
          successCount++
        } catch (error) {
          console.error(`Failed to add ${username}:`, error)
          errors.push(`${username}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Show results
      let message = `Successfully added ${successCount} out of ${usernames.length} users`
      if (errors.length > 0) {
        message += `\n\nErrors:\n${errors.join('\n')}`
      }
      
      alert(message)
      
      // Clear form on success
      if (successCount > 0) {
        setRepoUrl('')
        setUsersToAdd('')
      }

    } catch (error) {
      console.error('URL-based access failed:', error)
      alert('Failed to process repository access: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsProcessingUrl(false)
    }
  }

  const handleAddOrgMember = async () => {
    if (!selectedOrg || !newOrgUsername.trim()) return

    setIsAddingOrgUser(true)
    try {
      await githubService.addOrgMember(selectedOrg, newOrgUsername.trim(), orgUserRole)
      await loadOrgMembers(selectedOrg)
      setNewOrgUsername('')
      alert(`User added to organization as ${orgUserRole} successfully!`)
    } catch (error) {
      console.error('Failed to add organization member:', error)
      alert('Failed to add user to organization. They may need to accept the invitation.')
    } finally {
      setIsAddingOrgUser(false)
    }
  }

  const getFilteredRepositories = () => {
    let filteredRepos = repositories

    // Filter by organization if selected
    if (selectedOrgForRepos) {
      filteredRepos = repositories.filter(repo => 
        repo.full_name.startsWith(selectedOrgForRepos + '/')
      )
    }

    // Filter by search term
    if (repoSearchTerm) {
      filteredRepos = filteredRepos.filter(repo =>
        repo.full_name.toLowerCase().includes(repoSearchTerm.toLowerCase()) ||
        repo.name.toLowerCase().includes(repoSearchTerm.toLowerCase())
      )
    }

    return filteredRepos
  }

  const getCurrentMembers = () => {
    if (viewMode === 'organizations') {
      return selectedOrgMembers
    } else {
      return selectedRepoCollabs
    }
  }

  const filteredMembers = getCurrentMembers().filter(member =>
    member.login.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-dark-bg/95">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-dark-bg/95">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-dark-text">User Access Control</h1>
              <p className="text-dark-text/70">Manage team members and repository access</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/access-management')}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Advanced Tools
            </Button>
            
            <Button
              variant={viewMode === 'organizations' ? 'primary' : 'outline'}
              onClick={() => setViewMode('organizations')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Organizations
            </Button>
            <Button
              variant={viewMode === 'repositories' ? 'primary' : 'outline'}
              onClick={() => setViewMode('repositories')}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Repositories
            </Button>
            <Button
              variant={viewMode === 'url-based' ? 'primary' : 'outline'}
              onClick={() => setViewMode('url-based')}
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              URL-based
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-text/70">Total Members</p>
                <p className="text-2xl font-bold text-dark-text">{getCurrentMembers().length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-text/70">
                  {viewMode === 'organizations' ? 'Organizations' : 'Repositories'}
                </p>
                <p className="text-2xl font-bold text-dark-text">
                  {viewMode === 'organizations' ? organizations.length : repositories.length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-text/70">Active Access</p>
                <p className="text-2xl font-bold text-dark-text">
                  {getCurrentMembers().length}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-text/70">Filtered Results</p>
                <p className="text-2xl font-bold text-dark-text">{filteredMembers.length}</p>
              </div>
              <Filter className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* URL-based Access View */}
        {viewMode === 'url-based' && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">URL-based Repository Access</h3>
              <p className="text-dark-text/70 mb-6">
                Add users to a repository by providing the GitHub repository URL and usernames.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-card text-dark-text"
                  />
                  <p className="text-xs text-dark-text/60 mt-1">
                    Enter the full GitHub repository URL
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Usernames
                  </label>
                  <textarea
                    value={usersToAdd}
                    onChange={(e) => setUsersToAdd(e.target.value)}
                    placeholder="username1, username2, username3"
                    rows={3}
                    className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-card text-dark-text"
                  />
                  <p className="text-xs text-dark-text/60 mt-1">
                    Enter usernames separated by commas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Permission Level
                  </label>
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as 'pull' | 'push' | 'admin')}
                    className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-card text-dark-text"
                  >
                    <option value="pull">Read</option>
                    <option value="push">Write</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <Button
                  onClick={handleUrlBasedAccess}
                  disabled={isProcessingUrl || !repoUrl.trim() || !usersToAdd.trim()}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isProcessingUrl ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Add Users to Repository
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Content */}
        {viewMode !== 'url-based' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Selection and Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Selector */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">
                Select {viewMode === 'organizations' ? 'Organization' : 'Repository'}
              </h3>
              
              {viewMode === 'organizations' ? (
                <select
                  value={selectedOrg}
                  onChange={(e) => handleOrgChange(e.target.value)}
                  className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-card text-dark-text"
                >
                  <option value="">Select Organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.login}>
                      {org.login}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-3">
                  {/* Organization filter for repositories */}
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-1">
                      Filter by Organization (Optional)
                    </label>
                    <select
                      value={selectedOrgForRepos}
                      onChange={(e) => setSelectedOrgForRepos(e.target.value)}
                      className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-card text-dark-text"
                    >
                      <option value="">All Organizations</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.login}>
                          {org.login}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Repository search */}
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-1">
                      Search Repositories
                    </label>
                    <input
                      type="text"
                      value={repoSearchTerm}
                      onChange={(e) => setRepoSearchTerm(e.target.value)}
                      placeholder="Search repositories..."
                      className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-card text-dark-text"
                    />
                  </div>

                  {/* Repository selector */}
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-1">
                      Select Repository
                    </label>
                    <select
                      value={selectedRepo}
                      onChange={(e) => handleRepoChange(e.target.value)}
                      className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-card text-dark-text"
                    >
                      <option value="">Select Repository</option>
                      {getFilteredRepositories().map((repo) => (
                        <option key={repo.id} value={repo.full_name}>
                          {repo.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </Card>

            {/* Add Member to Organization */}
            {viewMode === 'organizations' && selectedOrg && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-dark-text mb-4">Add Organization Member</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newOrgUsername}
                    onChange={(e) => setNewOrgUsername(e.target.value)}
                    placeholder="GitHub username"
                    className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-card text-dark-text"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-1">
                      Role
                    </label>
                    <select
                      value={orgUserRole}
                      onChange={(e) => setOrgUserRole(e.target.value as 'member' | 'admin')}
                      className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-card text-dark-text"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <p className="text-xs text-dark-text/60 mt-1">
                      {orgUserRole === 'member' 
                        ? 'Member: Can view and clone private repos, manage issues/PRs' 
                        : 'Admin: Full organization access, can manage settings and members'
                      }
                    </p>
                  </div>

                  <Button
                    onClick={handleAddOrgMember}
                    disabled={!newOrgUsername.trim() || isAddingOrgUser}
                    className="w-full flex items-center gap-2"
                  >
                    {isAddingOrgUser ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Add as {orgUserRole === 'member' ? 'Member' : 'Admin'}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-dark-text/60">
                    User will receive an invitation to join the organization
                  </p>
                </div>
              </Card>
            )}

            {/* Add Collaborator (only for repositories) */}
            {viewMode === 'repositories' && selectedRepo && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-dark-text mb-4">Add Collaborator</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="GitHub username"
                    className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-card text-dark-text"
                  />
                  <Button
                    onClick={handleAddCollaborator}
                    disabled={!newUsername.trim() || isAddingUser}
                    className="w-full flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {isAddingUser ? 'Adding...' : 'Add Collaborator'}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Right Panel - Member List */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-dark-text">
                  {viewMode === 'organizations' ? 'Organization Members' : 'Repository Collaborators'}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text/40 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-dark-border rounded-lg bg-dark-card text-dark-text text-sm w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-12 text-dark-text/70">
                    {selectedOrg || selectedRepo ? (
                      searchTerm ? 'No members match your search.' : 'No members found.'
                    ) : (
                      `Select ${viewMode === 'organizations' ? 'an organization' : 'a repository'} to view members`
                    )}
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-dark-card rounded-lg border border-dark-border"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar_url}
                          alt={member.login}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-dark-text">{member.login}</p>
                          <p className="text-sm text-dark-text/70">
                            Member
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {viewMode === 'organizations' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUserAccess(member.login)}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600"
                          >
                            <UserMinus className="h-3 w-3" />
                            Remove
                          </Button>
                        )}
                        {viewMode === 'repositories' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveCollaborator(member.login)}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600"
                          >
                            <UserMinus className="h-3 w-3" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
