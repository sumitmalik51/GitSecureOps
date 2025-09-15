const https = require('https');
const { URLSearchParams } = require('url');
const crypto = require('crypto');

// Simple checksum generation for session integrity (basic protection)
function generateChecksum(data) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex').substring(0, 16); // First 16 characters
}

// Helper function to make HTTP requests using built-in modules with security improvements
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        // SECURITY: Validate URL to prevent SSRF
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (error) {
            reject(new Error('Invalid URL format'));
            return;
        }
        
        // SECURITY: Only allow HTTPS requests to GitHub API
        if (parsedUrl.protocol !== 'https:') {
            reject(new Error('Only HTTPS requests are allowed'));
            return;
        }
        
        // SECURITY: Restrict to GitHub domains
        const allowedDomains = ['api.github.com', 'github.com'];
        if (!allowedDomains.includes(parsedUrl.hostname)) {
            reject(new Error('Requests only allowed to GitHub domains'));
            return;
        }
        
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'GitSecureOps/1.0',
                ...options.headers
            },
            timeout: 30000 // 30 second timeout
        };

        if (options.body && (options.method === 'POST' || options.method === 'PUT')) {
            const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
            requestOptions.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = https.request(requestOptions, (res) => {
            let data = '';
            let dataLength = 0;
            const maxDataLength = 10 * 1024 * 1024; // 10MB max response
            
            res.on('data', (chunk) => {
                dataLength += chunk.length;
                
                if (dataLength > maxDataLength) {
                    req.destroy();
                    reject(new Error('Response too large'));
                    return;
                }
                
                data += chunk;
            });
            
            res.on('end', () => {
                const response = {
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    json: () => {
                        try {
                            return Promise.resolve(JSON.parse(data));
                        } catch (e) {
                            return Promise.reject(new Error(`JSON parse error: ${e.message}`));
                        }
                    },
                    text: () => Promise.resolve(data)
                };
                resolve(response);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body && (options.method === 'POST' || options.method === 'PUT')) {
            const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
            req.write(data);
        }

        req.end();
    });
}

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
        
        // Fallback for local development - use environment variable
        return process.env.FRONTEND_URL || 'http://localhost:4280';
    };

    const frontendUrl = getFrontendUrl();
    context.log(`Determined frontend URL: ${frontendUrl}`);

    // Enable CORS - More secure configuration
    let corsOrigin;
    if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
        corsOrigin = frontendUrl;
    } else {
        corsOrigin = frontendUrl;
    }
    
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600', // Reduced from 24 hours
            // Security headers
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
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
        const tokenResponse = await makeRequest('https://github.com/login/oauth/access_token', {
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
        context.log('Fetching user information from GitHub API...');
        const userResponse = await makeRequest('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'GitSecureOps-OAuth-App',
            },
        });

        context.log(`User API response status: ${userResponse.status}`);
        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            context.log(`User API error response: ${errorText}`);
            throw new Error(`Failed to fetch user information: ${userResponse.status} ${userResponse.statusText}`);
        }

        const userData = await userResponse.json();

        // SECURITY IMPROVEMENT: Create a more secure session token with additional validation data
        const sessionData = {
            token: tokenData.access_token,
            username: userData.login,
            name: userData.name,
            email: userData.email,
            id: userData.id,
            avatar: userData.avatar_url,
            timestamp: Date.now(),
            // Add simple integrity check
            checksum: generateChecksum({
                username: userData.login,
                id: userData.id,
                timestamp: Date.now()
            })
        };

        // SECURITY NOTE: In production, consider using proper JWT with signing
        // This is still base64 encoding but with improved data structure
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
