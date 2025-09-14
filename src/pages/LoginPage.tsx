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
        className="absolute top-16 left-16 w-16 h-16 rounded-full bg-brand-primary/15 blur-xl"
        animate={{
          y: [-15, 15, -15],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-16 right-16 w-24 h-24 rounded-full bg-brand-secondary/15 blur-xl"
        animate={{
          y: [15, -15, 15],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Back to home */}
        <motion.button
          className="flex items-center text-dark-text-muted hover:text-dark-text mb-6 transition-colors duration-300 text-sm"
          onClick={() => navigate('/')}
          whileHover={{ x: -3, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Card className="p-6 transition-all duration-500 ease-in-out">
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div 
                className="flex justify-center mb-3"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15,
                  delay: 0.2 
                }}
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              
              <h1 className="text-2xl font-bold text-gradient-primary mb-2">
                Welcome Back
              </h1>
              <p className="text-dark-text-muted text-sm">
                Connect your GitHub account to access GitSecureOps
              </p>
            </div>

            {/* GitHub OAuth Button */}
            <motion.div
              className="mb-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            >
              <Button
                variant="primary"
                size="md"
                className="w-full transition-all duration-300 ease-in-out"
                onClick={handleGitHubLogin}
                loading={isGitHubLoading}
              >
                <Github className="w-4 h-4 mr-2" />
                Continue with GitHub
              </Button>
            </motion.div>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-dark-card text-dark-text-muted text-xs">Or use Personal Access Token</span>
              </div>
            </div>

            {/* PAT Login Form */}
            <motion.form 
              onSubmit={handlePATLogin} 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
            >
              {/* PAT Field */}
              <div>
                <label className="block text-xs font-medium text-dark-text mb-2">
                  Personal Access Token
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-text-muted" />
                  <input
                    type={showPAT ? 'text' : 'password'}
                    required
                    value={patToken}
                    onChange={(e) => setPATToken(e.target.value)}
                    className="form-input pl-10 pr-10 text-sm h-11 transition-all duration-300 ease-in-out"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPAT(!showPAT)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-text-muted hover:text-dark-text transition-colors duration-300"
                  >
                    {showPAT ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-dark-text-muted leading-tight">
                  Need a token? Create one in your{' '}
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:underline transition-all duration-300"
                  >
                    GitHub Settings
                  </a>
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="outline"
                size="md"
                className="w-full transition-all duration-300 ease-in-out"
                loading={isPATLoading}
              >
                Sign In with Token
              </Button>
            </motion.form>

            {/* Info about tokens */}
            <motion.div 
              className="mt-4 p-3 bg-dark-surface/50 rounded-lg border border-dark-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
            >
              <p className="text-xs text-dark-text-muted leading-relaxed">
                <strong>Required scopes:</strong> repo, read:org, user:email
              </p>
            </motion.div>

            {/* Terms */}
            <motion.div 
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
            >
              <p className="text-xs text-dark-text-muted leading-tight">
                By signing in, you agree to our{' '}
                <button className="text-brand-primary hover:underline transition-colors duration-300">Terms of Service</button>
                {' '}and{' '}
                <button className="text-brand-primary hover:underline transition-colors duration-300">Privacy Policy</button>
              </p>
            </motion.div>
          </Card>
        </motion.div>

        {/* Branding */}
        <motion.div 
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-dark-text-muted text-xs">
            © 2025 GitSecureOps. Secure workflows for modern teams.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
