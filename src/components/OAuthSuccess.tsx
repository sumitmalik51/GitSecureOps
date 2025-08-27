import { useEffect, useState } from 'react';
import { oauthService } from '../services/oauthService';

interface OAuthSuccessProps {
  onAuthSuccess: (token: string, username: string) => void;
  onAuthError: (error: string) => void;
}

export default function OAuthSuccess({ onAuthSuccess, onAuthError }: OAuthSuccessProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionToken = urlParams.get('session');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(decodeURIComponent(error));
        }

        if (!sessionToken) {
          throw new Error('Missing session token');
        }

        setStatus('Validating authentication session...');
        
        const { token, user } = await oauthService.handleOAuthSuccess(sessionToken);
        
        setStatus('Authentication successful! Redirecting...');
        
        // Small delay to show success message
        setTimeout(() => {
          onAuthSuccess(token, user.login);
        }, 1000);

      } catch (error) {
        console.error('OAuth success processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'OAuth authentication failed';
        setStatus(`Error: ${errorMessage}`);
        
        // Show error for a moment then call error handler
        setTimeout(() => {
          onAuthError(errorMessage);
        }, 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleOAuthSuccess();
  }, [onAuthSuccess, onAuthError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-zinc-50 dark:from-gray-900 dark:via-slate-900 dark:to-zinc-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl py-8 px-4 shadow-xl border border-slate-200/50 dark:border-slate-700/50 sm:rounded-3xl sm:px-10">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              {isProcessing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
              ) : (
                <span className="text-2xl">✅</span>
              )}
            </div>
            
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-zinc-700 to-slate-800 dark:from-slate-200 dark:via-zinc-200 dark:to-slate-300 bg-clip-text text-transparent">
              {isProcessing ? 'Authenticating' : 'Authentication Complete'}
            </h2>
            
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
              {status}
            </p>
            
            {isProcessing && (
              <div className="mt-6">
                <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse transition-all duration-1000" 
                       style={{ width: '85%' }}>
                  </div>
                </div>
              </div>
            )}

            {!isProcessing && (
              <div className="mt-6">
                <div className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                  <span className="mr-2">🎉</span>
                  Welcome to GitSecureOps!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
