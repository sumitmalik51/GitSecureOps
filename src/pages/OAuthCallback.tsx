import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { oauthService } from '../services/oauthService';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const sessionToken = searchParams.get('session');
        const error = searchParams.get('error');

        // Handle error from GitHub or backend
        if (error) {
          setStatus('error');
          setMessage(decodeURIComponent(error));
          return;
        }

        // Handle missing session token
        if (!sessionToken) {
          setStatus('error');
          setMessage('Authentication failed: No session data received.');
          return;
        }

        // Process the OAuth success
        setMessage('Validating authentication...');
        const { token, user } = await oauthService.handleOAuthSuccess(sessionToken);
        
        // Login the user
        login(token, user);
        
        setStatus('success');
        setMessage(`Welcome, ${user.name || user.login}! Redirecting to dashboard...`);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  const handleRetry = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-20 bg-repeat" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 max-w-md w-full text-center relative"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-xl"></div>
        
        <div className="relative">
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto w-16 h-16 flex items-center justify-center"
              >
                <Loader className="w-8 h-8 text-indigo-400" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Authenticating</h2>
                <p className="text-slate-300">{message}</p>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
                <p className="text-slate-300">{message}</p>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
                <p className="text-slate-300 mb-6">{message}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleRetry} variant="primary" className="flex-1">
                    Try Again
                  </Button>
                  <Button onClick={handleGoHome} variant="ghost" className="flex-1">
                    Go Home
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OAuthCallback;
