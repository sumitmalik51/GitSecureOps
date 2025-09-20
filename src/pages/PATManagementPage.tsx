import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Key, 
  Plus, 
  Shield, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Eye, 
  EyeOff,
  Clock,
  Users,
  GitBranch,
  Package,
  Zap,
  Activity
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import EnhancedCard, { CardHeader, CardContent } from '../components/ui/EnhancedCard'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import githubService, { PATScope, CreatePATRequest } from '../services/githubService'
import { animationVariants } from '../utils/animations'
import { announceToScreenReader } from '../utils/accessibility'

interface TokenValidationResult {
  valid: boolean;
  user?: any;
  scopes?: string[];
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
    resetDate?: string;
  };
}

export default function PATManagementPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { success, error: showError } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [showTokenForm, setShowTokenForm] = useState(false)
  const [availableScopes] = useState<PATScope[]>(githubService.getPATScopes())
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [tokenValidation, setTokenValidation] = useState<TokenValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showValidationToken, setShowValidationToken] = useState(false)

  // Token creation form state
  const [newToken, setNewToken] = useState<CreatePATRequest>({
    note: '',
    note_url: '',
    scopes: [],
    expires_at: ''
  })

  useEffect(() => {
    if (token) {
      githubService.setToken(token)
    }
  }, [token])

  const handleScopeToggle = (scopeName: string) => {
    setNewToken(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scopeName)
        ? prev.scopes.filter(s => s !== scopeName)
        : [...prev.scopes, scopeName]
    }))
  }

  const handleCreateToken = async () => {
    if (!newToken.note.trim()) {
      showError('Validation Error', 'Token description is required')
      return
    }

    if (newToken.scopes.length === 0) {
      showError('Validation Error', 'At least one scope must be selected')
      return
    }

    try {
      setIsLoading(true)
      const result = await githubService.createPersonalAccessToken(newToken)
      
      // Open GitHub's token creation page
      window.open(result.url, '_blank')
      
      success('Redirecting to GitHub', 'Opening GitHub\'s secure token creation page')
      announceToScreenReader('Redirecting to GitHub token creation page')
      
      // Reset form
      setNewToken({
        note: '',
        note_url: '',
        scopes: [],
        expires_at: ''
      })
      setShowTokenForm(false)
      
    } catch (error: any) {
      console.error('Failed to create token:', error)
      showError('Creation Failed', error.message || 'Failed to create token')
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidateToken = async () => {
    if (!tokenInput.trim()) {
      showError('Validation Error', 'Please enter a token to validate')
      return
    }

    try {
      setIsValidating(true)
      const result = await githubService.getTokenInfo(tokenInput)
      
      setTokenValidation({
        valid: true,
        user: result.user,
        scopes: result.scopes,
        rateLimit: {
          ...result.rateLimit,
          resetDate: result.rateLimit.resetDate
        }
      })
      
      success('Token Valid', `Token is valid for user ${result.user.login}`)
      announceToScreenReader(`Token validated successfully for user ${result.user.login}`)
      
    } catch (error: any) {
      console.error('Token validation failed:', error)
      setTokenValidation({ valid: false })
      showError('Invalid Token', 'The token is invalid or has insufficient permissions')
    } finally {
      setIsValidating(false)
    }
  }

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text)
      success('Copied', `${description} copied to clipboard`)
      announceToScreenReader(`${description} copied to clipboard`)
    } catch (error) {
      showError('Copy Failed', 'Failed to copy to clipboard')
    }
  }

  // TODO: Future enhancement - copy functionality for token details

  const getScopeIcon = (scopeName: string) => {
    if (scopeName.includes('repo')) return <GitBranch className="w-4 h-4" />
    if (scopeName.includes('org')) return <Users className="w-4 h-4" />
    if (scopeName.includes('user')) return <Users className="w-4 h-4" />
    if (scopeName.includes('copilot')) return <Zap className="w-4 h-4" />
    if (scopeName.includes('package')) return <Package className="w-4 h-4" />
    if (scopeName.includes('workflow')) return <Activity className="w-4 h-4" />
    return <Key className="w-4 h-4" />
  }

  const getScopeCategoryColor = (category: string) => {
    switch (category) {
      case 'Repository': return 'text-green-500 bg-green-500/10'
      case 'Organization': return 'text-blue-500 bg-blue-500/10'
      case 'User': return 'text-purple-500 bg-purple-500/10'
      case 'Copilot': return 'text-yellow-500 bg-yellow-500/10'
      case 'Actions': return 'text-orange-500 bg-orange-500/10'
      case 'Packages': return 'text-cyan-500 bg-cyan-500/10'
      default: return 'text-gray-500 bg-gray-500/10'
    }
  }

  // Group scopes by category
  const scopesByCategory = availableScopes.reduce((acc, scope) => {
    if (!acc[scope.category]) {
      acc[scope.category] = []
    }
    acc[scope.category].push(scope)
    return acc
  }, {} as Record<string, PATScope[]>)

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={animationVariants.pageTransition}
          initial="initial"
          animate="animate"
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
              <h1 className="text-3xl font-bold text-dark-text">Personal Access Tokens</h1>
              <p className="text-dark-text-muted">Create and manage GitHub personal access tokens securely</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowTokenInput(!showTokenInput)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Validate Token</span>
            </Button>
            <Button
              onClick={() => setShowTokenForm(!showTokenForm)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Token</span>
            </Button>
          </div>
        </motion.div>

        {/* Token Validation Section */}
        {showTokenInput && (
          <motion.div
            variants={animationVariants.slideInRight}
            initial="initial"
            animate="animate"
            className="mb-8"
          >
            <EnhancedCard variant="elevated">
              <CardHeader
                title="Token Validation"
                subtitle="Validate and inspect a GitHub personal access token"
                icon={<Shield className="w-5 h-5 text-blue-500" />}
              />
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <label htmlFor="tokenInput" className="block text-sm font-medium text-dark-text mb-2">
                      Personal Access Token
                    </label>
                    <div className="relative">
                      <input
                        id="tokenInput"
                        type={showValidationToken ? "text" : "password"}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent pr-20"
                      />
                      <div className="absolute right-2 top-2 flex space-x-1">
                        <button
                          type="button"
                          onClick={() => setShowValidationToken(!showValidationToken)}
                          className="p-1 hover:bg-dark-card rounded"
                          aria-label={showValidationToken ? "Hide token" : "Show token"}
                        >
                          {showValidationToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-dark-text-muted">
                      <Info className="w-4 h-4 inline mr-1" />
                      Token is validated securely and not stored
                    </div>
                    <Button
                      onClick={handleValidateToken}
                      disabled={!tokenInput.trim() || isValidating}
                      loading={isValidating}
                      className="flex items-center space-x-2"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Validate Token</span>
                    </Button>
                  </div>
                </div>

                {/* Validation Results */}
                {tokenValidation && (
                  <motion.div
                    variants={animationVariants.slideInRight}
                    initial="initial"
                    animate="animate"
                    className="mt-6 p-4 bg-dark-surface rounded-lg border border-dark-border"
                  >
                    {tokenValidation.valid ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-green-500">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">Token is valid</span>
                        </div>
                        
                        {tokenValidation.user && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-medium text-dark-text mb-2">User Information</h4>
                              <div className="flex items-center space-x-3">
                                <img
                                  src={tokenValidation.user.avatar_url}
                                  alt={tokenValidation.user.login}
                                  className="w-10 h-10 rounded-full"
                                />
                                <div>
                                  <p className="font-medium text-dark-text">{tokenValidation.user.name || tokenValidation.user.login}</p>
                                  <p className="text-sm text-dark-text-muted">@{tokenValidation.user.login}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-dark-text mb-2">Rate Limit</h4>
                              {tokenValidation.rateLimit && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-dark-text-muted">Remaining:</span>
                                    <span className="text-dark-text">{tokenValidation.rateLimit.remaining}/{tokenValidation.rateLimit.limit}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-dark-text-muted">Resets:</span>
                                    <span className="text-dark-text">
                                      {tokenValidation.rateLimit.resetDate 
                                        ? new Date(tokenValidation.rateLimit.resetDate).toLocaleTimeString()
                                        : 'Unknown'
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-dark-text mb-2">Scopes ({tokenValidation.scopes?.length || 0})</h4>
                              <div className="flex flex-wrap gap-1">
                                {tokenValidation.scopes?.slice(0, 3).map((scope) => (
                                  <span
                                    key={scope}
                                    className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded text-xs"
                                  >
                                    {scope}
                                  </span>
                                ))}
                                {tokenValidation.scopes && tokenValidation.scopes.length > 3 && (
                                  <span className="px-2 py-1 bg-dark-card text-dark-text-muted rounded text-xs">
                                    +{tokenValidation.scopes.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-500">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Token is invalid</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </EnhancedCard>
          </motion.div>
        )}

        {/* Token Creation Form */}
        {showTokenForm && (
          <motion.div
            variants={animationVariants.slideInRight}
            initial="initial"
            animate="animate"
            className="mb-8"
          >
            <EnhancedCard variant="feature">
              <CardHeader
                title="Create New Token"
                subtitle="Configure and create a new personal access token"
                icon={<Plus className="w-5 h-5 text-green-500" />}
              />
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="tokenNote" className="block text-sm font-medium text-dark-text mb-2">
                        Token Description *
                      </label>
                      <input
                        id="tokenNote"
                        type="text"
                        value={newToken.note}
                        onChange={(e) => setNewToken(prev => ({ ...prev, note: e.target.value }))}
                        placeholder="My GitSecureOps Token"
                        className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="tokenExpires" className="block text-sm font-medium text-dark-text mb-2">
                        Expiration Date (Optional)
                      </label>
                      <input
                        id="tokenExpires"
                        type="date"
                        value={newToken.expires_at}
                        onChange={(e) => setNewToken(prev => ({ ...prev, expires_at: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tokenUrl" className="block text-sm font-medium text-dark-text mb-2">
                      Home Page URL (Optional)
                    </label>
                    <input
                      id="tokenUrl"
                      type="url"
                      value={newToken.note_url}
                      onChange={(e) => setNewToken(prev => ({ ...prev, note_url: e.target.value }))}
                      placeholder="https://your-app.com"
                      className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-dark-text placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                  </div>

                  {/* Scope Selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-dark-text mb-4">Select Scopes</h3>
                    <p className="text-sm text-dark-text-muted mb-4">
                      Choose the permissions this token will have. Be cautious with broader scopes.
                    </p>
                    
                    <div className="space-y-4">
                      {Object.entries(scopesByCategory).map(([category, scopes]) => (
                        <div key={category}>
                          <h4 className="text-md font-medium text-dark-text mb-3 flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${getScopeCategoryColor(category)}`}>
                              {category}
                            </span>
                          </h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {scopes.map((scope) => (
                              <div
                                key={scope.name}
                                className="flex items-start space-x-3 p-3 bg-dark-surface rounded-lg border border-dark-border hover:border-brand-primary/50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  id={`scope-${scope.name}`}
                                  checked={newToken.scopes.includes(scope.name)}
                                  onChange={() => handleScopeToggle(scope.name)}
                                  className="mt-1 rounded border-dark-border text-brand-primary focus:ring-brand-primary"
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={`scope-${scope.name}`}
                                    className="flex items-center space-x-2 cursor-pointer"
                                  >
                                    {getScopeIcon(scope.name)}
                                    <span className="font-mono text-sm text-dark-text">{scope.name}</span>
                                  </label>
                                  <p className="text-xs text-dark-text-muted mt-1">{scope.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Scopes Summary */}
                  {newToken.scopes.length > 0 && (
                    <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-lg">
                      <h4 className="font-medium text-dark-text mb-2">Selected Scopes ({newToken.scopes.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {newToken.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded text-sm font-mono"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-dark-border">
                    <div className="flex items-center space-x-2 text-sm text-dark-text-muted">
                      <ExternalLink className="w-4 h-4" />
                      <span>You'll be redirected to GitHub for secure token creation</span>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowTokenForm(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateToken}
                        disabled={!newToken.note.trim() || newToken.scopes.length === 0 || isLoading}
                        loading={isLoading}
                        className="flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Create on GitHub</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </EnhancedCard>
          </motion.div>
        )}

        {/* Information Cards */}
        <motion.div
          variants={animationVariants.staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Security Best Practices */}
          <EnhancedCard variant="elevated">
            <CardHeader
              title="Security Best Practices"
              icon={<Shield className="w-5 h-5 text-green-500" />}
            />
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-dark-text">Use minimal scopes</p>
                    <p className="text-xs text-dark-text-muted">Only grant the permissions your application actually needs</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-dark-text">Set expiration dates</p>
                    <p className="text-xs text-dark-text-muted">Regularly rotate tokens to limit exposure</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Key className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-dark-text">Store securely</p>
                    <p className="text-xs text-dark-text-muted">Never commit tokens to version control</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Activity className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-dark-text">Monitor usage</p>
                    <p className="text-xs text-dark-text-muted">Regularly review token activity and permissions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>

          {/* Token Information */}
          <EnhancedCard variant="elevated">
            <CardHeader
              title="Token Management Tips"
              icon={<Info className="w-5 h-5 text-blue-500" />}
            />
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-dark-text">GitHub Security</p>
                      <p className="text-xs text-dark-text-muted">
                        For security, GitHub doesn't allow listing existing tokens via API. 
                        Use GitHub's settings page to manage existing tokens.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-dark-text">Fine-grained Tokens</p>
                      <p className="text-xs text-dark-text-muted">
                        Consider using GitHub's fine-grained personal access tokens 
                        for better security and repository-specific permissions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-dark-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://github.com/settings/tokens', '_blank')}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Manage Existing Tokens on GitHub</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </EnhancedCard>
        </motion.div>
      </div>
    </div>
  )
}
