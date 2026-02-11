import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Github, Key, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { oauthService } from '../services/oauthService'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  const [isPATLoading, setIsPATLoading] = useState(false)
  const [showPAT, setShowPAT] = useState(false)
  const [patToken, setPATToken] = useState('')
  const [patError, setPATError] = useState('')
  const [oauthError, setOAuthError] = useState('')

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleGitHubLogin = () => {
    setOAuthError('')
    if (!oauthService.isConfigured()) {
      setOAuthError('GitHub OAuth is not configured. Please contact your administrator.')
      return
    }
    setIsGitHubLoading(true)
    try {
      oauthService.initiateOAuthFlow()
    } catch {
      setOAuthError('Unable to start GitHub authentication. Please try again.')
      setIsGitHubLoading(false)
    }
  }

  const handlePATLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setPATError('')
    if (!patToken.trim()) {
      setPATError('Please enter a valid Personal Access Token.')
      return
    }
    setIsPATLoading(true)
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${patToken.trim()}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })
      if (!response.ok) {
        if (response.status === 401) throw new Error('Invalid or expired token.')
        if (response.status === 403) throw new Error('Access forbidden — check permissions or rate limits.')
        throw new Error(`Authentication failed (${response.status}).`)
      }
      const userData = await response.json()
      login(patToken.trim(), {
        id: userData.id,
        login: userData.login,
        name: userData.name || userData.login,
        email: userData.email || '',
        avatar_url: userData.avatar_url || '',
      })
      navigate('/dashboard')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      setPATError(msg.includes('fetch') ? 'Unable to connect to GitHub.' : msg)
    } finally {
      setIsPATLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Back */}
        <button
          className="flex items-center gap-1.5 text-sm text-dark-text-muted hover:text-dark-text transition-colors mb-8"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-dark-text mb-1">Sign in to GitSecureOps</h1>
            <p className="text-sm text-dark-text-muted">Connect your GitHub account to get started</p>
          </div>

          {/* Card */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 space-y-5">
            {/* GitHub OAuth */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleGitHubLogin}
              loading={isGitHubLoading}
              icon={<Github className="w-4 h-4" />}
            >
              Continue with GitHub
            </Button>

            {oauthError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-danger-400 bg-danger-500/10 border border-danger-500/20 rounded-lg p-2.5"
              >
                {oauthError}
              </motion.p>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-dark-surface text-xs text-dark-text-muted">
                  or use a Personal Access Token
                </span>
              </div>
            </div>

            {/* PAT Form */}
            <form onSubmit={handlePATLogin} className="space-y-4">
              <Input
                label="Personal Access Token"
                type={showPAT ? 'text' : 'password'}
                value={patToken}
                onChange={(e) => { setPATToken(e.target.value); if (patError) setPATError('') }}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                icon={<Key className="w-4 h-4" />}
                iconRight={
                  <button type="button" onClick={() => setShowPAT(!showPAT)} className="hover:text-dark-text transition-colors">
                    {showPAT ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={patError}
                hint={
                  <>
                    Create a token at{' '}
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                      GitHub Settings
                    </a>
                  </>
                }
              />

              <Button
                type="submit"
                variant="outline"
                size="md"
                className="w-full"
                loading={isPATLoading}
              >
                Sign in with Token
              </Button>
            </form>

            {/* Scopes info */}
            <div className="bg-dark-card/50 rounded-lg p-3 border border-dark-border">
              <p className="text-xs text-dark-text-muted">
                <span className="font-medium text-dark-text-secondary">Required scopes:</span>{' '}
                repo, read:org, user:email
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-dark-text-muted mt-6">
            By signing in, you agree to our{' '}
            <button className="text-brand-400 hover:underline">Terms</button> and{' '}
            <button className="text-brand-400 hover:underline">Privacy Policy</button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
