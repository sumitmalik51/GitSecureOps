import { useEffect, useState } from 'react';
import { oauthService } from '../services/oauthService';

interface OAuthCallbackProps {
  onAuthSuccess: (token: string, username: string) => void;
  onAuthError: (error: string) => void;
}

export default function OAuthCallback({ onAuthSuccess, onAuthError }: OAuthCallbackProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = oauthService.parseCallbackUrl(window.location.href);

        if (urlParams.error) {
          throw new Error(urlParams.error === 'access_denied' 
            ? 'User cancelled the authorization'
            : `OAuth error: ${urlParams.error}`
          );
        }

        if (!urlParams.code || !urlParams.state) {
          throw new Error('Missing authorization code or state parameter');
        }

        setStatus('Exchanging authorization code...');
        
        const { token, user } = await oauthService.handleCallback(urlParams.code, urlParams.state);
        
        setStatus('Authentication successful! Redirecting...');
        
        // Small delay to show success message
        setTimeout(() => {
          onAuthSuccess(token, user.login);
        }, 1000);

      } catch (error) {
        console.error('OAuth callback error:', error);
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

    handleOAuthCallback();
  }, [onAuthSuccess, onAuthError]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900">
              {isProcessing ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              ) : (
                <span className="text-2xl">✅</span>
              )}
            </div>
            
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
              {isProcessing ? 'Authenticating' : 'Complete'}
            </h2>
            
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {status}
            </p>
            
            {isProcessing && (
              <div className="mt-4">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
