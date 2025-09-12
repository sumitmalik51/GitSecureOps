import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Shield, 
  Github, 
  Key,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { oauthService } from '../services/oauthService'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  const [isPATLoading, setIsPATLoading] = useState(false)
  const [showPAT, setShowPAT] = useState(false)
  const [patToken, setPATToken] = useState('')

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleGitHubLogin = () => {
    if (!oauthService.isConfigured()) {
      alert('GitHub OAuth is not configured. Please check your environment variables.')
      return
    }
    
    setIsGitHubLoading(true)
    try {
      oauthService.initiateOAuthFlow()
    } catch (error) {
      console.error('Failed to initiate OAuth flow:', error)
      alert('Failed to start GitHub authentication. Please try again.')
      setIsGitHubLoading(false)
    }
  }

  const handlePATLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patToken.trim()) {
      alert('Please enter a valid Personal Access Token.')
      return
    }

    setIsPATLoading(true)
    
    try {
      // Validate the PAT by making a request to GitHub API
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${patToken.trim()}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        throw new Error('Invalid Personal Access Token')
      }

      const userData = await response.json()
      
      // Create user object and login
      const user = {
        id: userData.id,
        login: userData.login,
        name: userData.name || userData.login,
        email: userData.email || '',
        avatar_url: userData.avatar_url || ''
      }

      login(patToken.trim(), user)
      navigate('/dashboard')
      
    } catch (error) {
      console.error('PAT login error:', error)
      alert('Failed to authenticate with Personal Access Token. Please check your token and try again.')
    } finally {
      setIsPATLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 hero-glow opacity-30" />
      
      {/* Floating elements */}
      <motion.div
        className="absolute top-20 left-20 w-20 h-20 rounded-full bg-brand-primary/20 blur-xl"
        animate={{
          y: [-20, 20, -20],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-brand-secondary/20 blur-xl"
        animate={{
          y: [20, -20, 20],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Back to home */}
        <motion.button
          className="flex items-center text-dark-text-muted hover:text-dark-text mb-8 transition-colors duration-200"
          onClick={() => navigate('/')}
          whileHover={{ x: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="p-8 hover:glow-primary">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div 
                className="flex justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  delay: 0.2 
                }}
              >
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-gradient-primary mb-2">
                Welcome Back
              </h1>
              <p className="text-dark-text-muted">
                Connect your GitHub account to access GitSecureOps
              </p>
            </div>

            {/* GitHub OAuth Button */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleGitHubLogin}
                loading={isGitHubLoading}
              >
                <Github className="w-5 h-5 mr-3" />
                Continue with GitHub
              </Button>
            </motion.div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-dark-card text-dark-text-muted">Or use Personal Access Token</span>
              </div>
            </div>

            {/* PAT Login Form */}
            <motion.form 
              onSubmit={handlePATLogin} 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* PAT Field */}
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Personal Access Token
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-text-muted" />
                  <input
                    type={showPAT ? 'text' : 'password'}
                    required
                    value={patToken}
                    onChange={(e) => setPATToken(e.target.value)}
                    className="form-input pl-11 pr-11"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPAT(!showPAT)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-text-muted hover:text-dark-text transition-colors"
                  >
                    {showPAT ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-dark-text-muted">
                  Need a token? Create one in your{' '}
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:underline"
                  >
                    GitHub Settings
                  </a>
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="outline"
                size="lg"
                className="w-full"
                loading={isPATLoading}
              >
                Sign In with Token
              </Button>
            </motion.form>

            {/* Info about tokens */}
            <motion.div 
              className="mt-6 p-4 bg-dark-surface/50 rounded-lg border border-dark-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-xs text-dark-text-muted">
                <strong>Required scopes:</strong> repo, read:org, user:email
              </p>
            </motion.div>

            {/* Terms */}
            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-xs text-dark-text-muted">
                By signing in, you agree to our{' '}
                <button className="text-brand-primary hover:underline">Terms of Service</button>
                {' '}and{' '}
                <button className="text-brand-primary hover:underline">Privacy Policy</button>
              </p>
            </motion.div>
          </Card>
        </motion.div>

        {/* Branding */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-dark-text-muted text-sm">
            © 2025 GitSecureOps. Secure workflows for modern teams.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
