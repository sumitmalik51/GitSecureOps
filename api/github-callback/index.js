const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

module.exports = async function (context, req) {
    context.log('GitHub OAuth callback function processed a request.');

    // Dynamically determine frontend URL
    const getFrontendUrl = () => {
        // First try the environment variable (explicitly configured)
        if (process.env.FRONTEND_URL) {
            return process.env.FRONTEND_URL;
        }
        
        // Extract from headers - common Azure Static Web Apps patterns
        const host = req.headers.host || req.headers['x-forwarded-host'] || req.headers['x-original-host'];
        const protocol = req.headers['x-forwarded-proto'] || req.headers['x-arr-ssl'] ? 'https' : 'http';
        const referer = req.headers.referer || req.headers.referrer;
        
        // Try to get frontend URL from referer header (most reliable for OAuth callbacks)
        if (referer) {
            try {
                const refererUrl = new URL(referer);
                const refererOrigin = `${refererUrl.protocol}//${refererUrl.hostname}${refererUrl.port ? ':' + refererUrl.port : ''}`;
                // Don't use localhost referers in production
                if (!refererOrigin.includes('localhost') || host?.includes('localhost')) {
                    context.log(`Using referer origin: ${refererOrigin}`);
                    return refererOrigin;
                }
            } catch (e) {
                context.log(`Failed to parse referer: ${referer}`);
            }
        }
        
        if (host) {
            // If host is the Azure Function host (contains .azurewebsites.net)
            // we need to derive the Static Web App URL
            if (host.includes('.azurewebsites.net')) {
                // Convert function app URL to static web app URL
                // Function: func-gh-xxx.azurewebsites.net -> Static: swa-gh-xxx.azurestaticapps.net
                const staticHost = host.replace('func-', 'swa-').replace('.azurewebsites.net', '.azurestaticapps.net');
                return `${protocol}://${staticHost}`;
            }
            
            // Handle Azure Static Web Apps direct access (*.azurestaticapps.net)
            if (host.includes('.azurestaticapps.net')) {
                return `${protocol}://${host}`;
            }
            
            // For custom domains or other deployments
            return `${protocol}://${host}`;
        }
        
        // Fallback for local development
        return 'http://localhost:4280';
    };

    const frontendUrl = getFrontendUrl();
    context.log(`Determined frontend URL: ${frontendUrl}`);

    // Enable CORS - Allow specific frontend origin for security
    const corsOrigin = frontendUrl.includes('localhost') ? '*' : frontendUrl;
    
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400', // 24 hours
        }
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    try {
        context.log('Starting OAuth callback processing...');
        const { code, state, error } = req.query;
        context.log(`Query parameters - code: ${code ? 'present' : 'missing'}, state: ${state}, error: ${error}`);

        // Handle OAuth errors
        if (error) {
            context.log(`OAuth error detected: ${error}`);
            const errorMessage = error === 'access_denied' 
                ? 'User cancelled authorization'
                : `OAuth error: ${error}`;
            
            // Redirect to frontend with error
            context.res = {
                status: 302,
                headers: {
                    'Location': `${frontendUrl}?error=${encodeURIComponent(errorMessage)}`
                }
            };
            return;
        }

        // Validate required parameters
        if (!code) {
            context.log('Missing authorization code');
            throw new Error('Missing authorization code');
        }

        context.log('Attempting to exchange authorization code for access token...');
        context.log(`GitHub Client ID: ${process.env.GH_WEB_APP ? 'present' : 'missing'}`);
        context.log(`GitHub Client Secret: ${process.env.GH_WEB_APP_SECRET ? 'present' : 'missing'}`);

        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GH_WEB_APP,
                client_secret: process.env.GH_WEB_APP_SECRET,
                code: code,
            }),
        });

        context.log(`Token exchange response status: ${tokenResponse.status}`);
        if (!tokenResponse.ok) {
            context.log(`Token exchange failed with status ${tokenResponse.status}`);
            throw new Error('Failed to exchange code for token');
        }

        const tokenData = await tokenResponse.json();
        context.log(`Token data received: ${tokenData.error ? 'error - ' + tokenData.error : 'success'}`);

        if (tokenData.error) {
            context.log(`Token exchange error: ${tokenData.error} - ${tokenData.error_description}`);
            throw new Error(tokenData.error_description || tokenData.error);
        }

        // Get user information
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${tokenData.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user information');
        }

        const userData = await userResponse.json();

        // Create a secure session token or JWT (simplified version)
        const sessionData = {
            token: tokenData.access_token,
            username: userData.login,
            name: userData.name,
            avatar: userData.avatar_url,
            timestamp: Date.now()
        };

        // For security, you might want to encrypt this or use proper JWT
        const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

        // Redirect to frontend with success
        context.res = {
            status: 302,
            headers: {
                'Location': `${frontendUrl}/oauth-success?session=${sessionToken}&state=${state || ''}`
            }
        };

    } catch (error) {
        context.log.error('OAuth callback error:', error);
        
        // Redirect to frontend with error
        context.res = {
            status: 302,
            headers: {
                'Location': `${frontendUrl}?error=${encodeURIComponent(error.message)}`
            }
        };
    }
};
