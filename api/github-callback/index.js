import { URLSearchParams } from 'url';

export default async function (context, req) {
    context.log('GitHub OAuth callback function processed a request.');

    // Enable CORS
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    try {
        const { code, state, error } = req.query;

        // Handle OAuth errors
        if (error) {
            const errorMessage = error === 'access_denied' 
                ? 'User cancelled authorization'
                : `OAuth error: ${error}`;
            
            // Redirect to frontend with error
            context.res = {
                status: 302,
                headers: {
                    'Location': `${process.env.FRONTEND_URL || 'http://localhost:4280'}?error=${encodeURIComponent(errorMessage)}`
                }
            };
            return;
        }

        // Validate required parameters
        if (!code) {
            throw new Error('Missing authorization code');
        }

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

        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for token');
        }

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
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
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4280';
        context.res = {
            status: 302,
            headers: {
                'Location': `${frontendUrl}/oauth-success?session=${sessionToken}&state=${state || ''}`
            }
        };

    } catch (error) {
        context.log.error('OAuth callback error:', error);
        
        // Redirect to frontend with error
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4280';
        context.res = {
            status: 302,
            headers: {
                'Location': `${frontendUrl}?error=${encodeURIComponent(error.message)}`
            }
        };
    }
};
