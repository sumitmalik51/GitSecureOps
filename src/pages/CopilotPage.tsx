import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Users, Activity, Zap, CheckCircle, UserPlus, AlertTriangle, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import githubService, { GitHubOrg, CopilotSeat } from '../services/githubService'

interface CopilotSeats {
  seats: CopilotSeat[]
  total_seats: number
}

export default function CopilotPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { success, error: showError } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [copilotSeats, setCopilotSeats] = useState<CopilotSeats | null>(null)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    loadCopilotData()
  }, [token])

  const loadCopilotData = async () => {
    if (!token) return

    try {
      setIsLoading(true)
      githubService.setToken(token)
      
      // Load user's organizations
      const orgs = await githubService.getUserOrganizations()
      setOrganizations(orgs)
      
      // If user has organizations, select the first one by default
      if (orgs.length > 0) {
        setSelectedOrg(orgs[0].login)
        await loadCopilotSeats(orgs[0].login)
      }
      
    } catch (error) {
      console.error('Failed to load Copilot data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCopilotSeats = async (org: string) => {
    try {
      const seats = await githubService.getCopilotSeats(org)
      setCopilotSeats(seats)
    } catch (error) {
      console.error(`Failed to load Copilot seats for ${org}:`, error)
      setCopilotSeats(null)
    }
  }

  const handleOrgChange = async (orgName: string) => {
    setSelectedOrg(orgName)
    setIsLoading(true)
    await loadCopilotSeats(orgName)
    setIsLoading(false)
  }

  const handleAssignCopilot = async () => {
    if (!selectedOrg || !newUserEmail.trim()) return

    const username = newUserEmail.trim() // Move declaration outside try block

    try {
      setIsAssigning(true)
      
      // Check membership status first
      const membershipStatus = await githubService.checkOrgMembership(selectedOrg, username)
      
      if (membershipStatus === 'not_member') {
        // Show info that we're inviting the user first
        success('Inviting User', `Inviting ${username} to the organization and then assigning Copilot seat...`)
      }

      await githubService.addCopilotUsers(selectedOrg, [username])
      setNewUserEmail('')
      
      // Reload seats after assignment
      await loadCopilotSeats(selectedOrg)
      
      if (membershipStatus === 'not_member') {
        success('Copilot Seat Assigned', `Successfully invited ${username} to the organization and assigned Copilot seat!`)
      } else {
        success('Copilot Seat Assigned', 'Successfully assigned Copilot seat to user!')
      }
    } catch (error: any) {
      console.error('Failed to assign Copilot seat:', error)
      
      let errorTitle = 'Assignment Failed'
      let errorMessage = error.message || 'Failed to assign Copilot seat.'
      
      // Handle the enhanced error messages with emojis
      if (errorMessage.includes('📧') && errorMessage.includes('Organization invitations sent')) {
        // Successful invitation - show as success
        success('Invitations Sent', errorMessage)
        return; // Don't show error in this case
      } else if (errorMessage.includes('❌') && errorMessage.includes('not found on GitHub')) {
        errorTitle = 'User Not Found'
        errorMessage = 'The username you entered does not exist on GitHub. Please check the spelling and try again.'
      } else if (errorMessage.includes('⚠️') && errorMessage.includes('Could not invite')) {
        errorTitle = 'Invitation Failed'
        errorMessage = 'Could not automatically invite the user to your organization. Please manually invite them first.'
      } else if (errorMessage.includes('do not exist on GitHub')) {
        errorTitle = 'User Not Found'
        errorMessage = 'The username you entered does not exist on GitHub. Please check the spelling and try again.'
      } else if (errorMessage.includes('need to accept organization invitations')) {
        errorTitle = 'Invitation Pending'
        errorMessage = 'An invitation has been sent to the user. They need to accept the organization invitation before a Copilot seat can be assigned.'
        success('Invitation Sent', `Organization invitation sent to ${username}. Once they accept, you can assign a Copilot seat.`)
        return; // Don't show error in this case
      } else if (errorMessage.includes('do not exist in this organization')) {
        errorTitle = 'Not an Organization Member'
        errorMessage = 'The user needs to be a member of your organization first. Please invite them to join your organization.'
      } else if (errorMessage.includes('already has access')) {
        errorTitle = 'Already Has Access'
        errorMessage = 'This user already has Copilot access in your organization.'
      } else if (errorMessage.includes('Forbidden')) {
        errorTitle = 'Permission Denied'
        errorMessage = 'You do not have permission to manage Copilot seats or invite users to this organization.'
      } else if (errorMessage.includes('Not Found')) {
        errorTitle = 'Organization or API Not Found'
        errorMessage = 'The organization was not found or the Copilot API is not available for this organization.'
      }
      
      showError(errorTitle, errorMessage)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveCopilot = async (username: string) => {
    if (!selectedOrg) return

    if (!confirm(`Are you sure you want to remove Copilot access for ${username}?`)) {
      return
    }

    try {
      await githubService.removeCopilotUsers(selectedOrg, [username])
      // Reload seats after removal
      await loadCopilotSeats(selectedOrg)
      success('Copilot Seat Removed', 'Successfully removed Copilot seat from user!')
    } catch (error) {
      console.error('Failed to remove Copilot seat:', error)
      showError('Removal Failed', 'Failed to remove Copilot seat.')
    }
  }

  const handleSelectUser = (username: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(username)) {
      newSelected.delete(username)
    } else {
      newSelected.add(username)
    }
    setSelectedUsers(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === currentSeats.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(currentSeats.map(seat => seat.assignee.login)))
    }
  }

  const handleBulkRemove = async () => {
    if (!selectedOrg || selectedUsers.size === 0) return

    const usersToRemove = Array.from(selectedUsers)
    const confirmMessage = `Are you sure you want to remove Copilot access for ${usersToRemove.length} user${usersToRemove.length > 1 ? 's' : ''}?\n\nUsers: ${usersToRemove.join(', ')}`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setIsRemoving(true)
      await githubService.removeCopilotUsers(selectedOrg, usersToRemove)
      setSelectedUsers(new Set())
      await loadCopilotSeats(selectedOrg)
      success('Copilot Seats Removed', `Successfully removed Copilot access for ${usersToRemove.length} user${usersToRemove.length > 1 ? 's' : ''}!`)
    } catch (error) {
      console.error('Failed to remove Copilot seats:', error)
      showError('Removal Failed', 'Failed to remove some Copilot seats.')
    } finally {
      setIsRemoving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-text-muted">Loading Copilot data...</p>
        </div>
      </div>
    )
  }

  const currentSeats = copilotSeats?.seats || []
  const totalSeats = copilotSeats?.total_seats || 0
  const usedSeats = currentSeats.length

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
              <h1 className="text-3xl font-bold text-dark-text">GitHub Copilot Management</h1>
              <p className="text-dark-text-muted">Monitor and control Copilot usage across your organizations</p>
            </div>
          </div>
        </motion.div>

        {/* Organization Selector */}
        {organizations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <label className="text-dark-text font-medium">Organization:</label>
                <select
                  value={selectedOrg}
                  onChange={(e) => handleOrgChange(e.target.value)}
                  className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.login}>
                      {org.login}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          </motion.div>
        )}

        {organizations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center min-h-96"
          >
            <Card className="p-12 text-center max-w-md">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-dark-text mb-4">No Organizations Found</h2>
              <p className="text-dark-text-muted mb-6">
                You need to be a member of an organization to manage GitHub Copilot seats.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </Card>
          </motion.div>
        ) : selectedOrg ? (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text-muted text-sm">Total Seats</p>
                    <p className="text-2xl font-bold text-dark-text">{totalSeats}</p>
                  </div>
                  <Shield className="w-8 h-8 text-brand-primary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text-muted text-sm">Used Seats</p>
                    <p className="text-2xl font-bold text-dark-text">{usedSeats}</p>
                  </div>
                  <Users className="w-8 h-8 text-brand-secondary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text-muted text-sm">Available Seats</p>
                    <p className="text-2xl font-bold text-dark-text">{Math.max(0, totalSeats - usedSeats)}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text-muted text-sm">Utilization</p>
                    <p className="text-2xl font-bold text-dark-text">
                      {totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0}%
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>
            </motion.div>

            {/* Assign New User */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-dark-text mb-4">Assign Copilot Seat</h2>
                <p className="text-dark-text-muted text-sm mb-4">
                  Enter a GitHub username to assign a Copilot seat. If the user isn't in your organization, they'll be automatically invited first.
                </p>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Enter GitHub username or email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                  <Button
                    onClick={handleAssignCopilot}
                    disabled={!newUserEmail.trim() || isAssigning}
                    className="flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isAssigning ? 'Assigning...' : 'Assign Seat'}</span>
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Current Seat Holders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-dark-text">Current Copilot Users</h2>
                  {currentSeats.length > 0 && (
                    <div className="flex items-center space-x-4">
                      {selectedUsers.size > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkRemove}
                          disabled={isRemoving}
                          className="flex items-center space-x-2 text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{isRemoving ? 'Removing...' : `Remove ${selectedUsers.size} Selected`}</span>
                        </Button>
                      )}
                      <label className="flex items-center space-x-2 text-sm text-dark-text">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === currentSeats.length && currentSeats.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-dark-border text-brand-primary focus:ring-brand-primary"
                        />
                        <span>Select All</span>
                      </label>
                    </div>
                  )}
                </div>
                {currentSeats.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-dark-text-muted mx-auto mb-4" />
                    <p className="text-dark-text-muted text-lg">No Copilot seats assigned</p>
                    <p className="text-dark-text-muted text-sm">Assign seats to team members to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentSeats.map((seat) => (
                      <div
                        key={seat.assignee.id}
                        className="flex items-center justify-between p-4 bg-dark-card rounded-lg border border-dark-border"
                      >
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(seat.assignee.login)}
                            onChange={() => handleSelectUser(seat.assignee.login)}
                            className="rounded border-dark-border text-brand-primary focus:ring-brand-primary"
                          />
                          <img
                            src={seat.assignee.avatar_url}
                            alt={seat.assignee.login}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <h3 className="text-dark-text font-medium">{seat.assignee.login}</h3>
                            <p className="text-dark-text-muted text-sm">
                              Last active: {seat.last_activity_at ? new Date(seat.last_activity_at).toLocaleDateString() : 'Never'}
                            </p>
                            {seat.last_activity_editor && (
                              <p className="text-dark-text-muted text-xs">
                                Editor: {seat.last_activity_editor}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {seat.pending_cancellation_date ? (
                            <div className="text-right">
                              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                                Pending Removal
                              </span>
                              <p className="text-dark-text-muted text-xs mt-1">
                                Will be removed on: {new Date(seat.pending_cancellation_date).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-green-500 text-sm">Active</span>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveCopilot(seat.assignee.login)}
                            className="text-red-500 hover:text-red-400"
                            disabled={isRemoving}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        ) : null}
      </div>
    </div>
  )
}
