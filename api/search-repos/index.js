const https = require('https');
const { URLSearchParams } = require('url');

// Input validation and sanitization functions
function sanitizeString(input, maxLength = 500) {
    if (typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    const sanitized = input
        .replace(/[<>'"&]/g, '') // Remove HTML/XSS characters
        .replace(/[{}()]/g, '') // Remove potential injection brackets
        .trim();
    
    return sanitized.substring(0, maxLength);
}

function validateSearchQuery(query) {
    if (!query || typeof query !== 'string') {
        throw new Error('Search query must be a non-empty string');
    }
    
    const sanitized = sanitizeString(query, 200);
    if (sanitized.length === 0) {
        throw new Error('Search query cannot be empty after sanitization');
    }
    
    // Check for minimum length
    if (sanitized.length < 2) {
        throw new Error('Search query must be at least 2 characters long');
    }
    
    return sanitized;
}

function validateOrganization(org) {
    if (!org) return '';
    
    if (typeof org !== 'string') {
        throw new Error('Organization name must be a string');
    }
    
    const sanitized = sanitizeString(org, 100);
    
    // Organization names should only contain alphanumeric, hyphens, and underscores
    if (sanitized && !/^[a-zA-Z0-9\-_]+$/.test(sanitized)) {
        throw new Error('Organization name contains invalid characters');
    }
    
    return sanitized;
}

function validateLanguage(lang) {
    if (!lang) return '';
    
    if (typeof lang !== 'string') {
        throw new Error('Language must be a string');
    }
    
    const sanitized = sanitizeString(lang, 50);
    
    // Language names should only contain alphanumeric characters, +, #, and -
    if (sanitized && !/^[a-zA-Z0-9+#\-]+$/.test(sanitized)) {
        throw new Error('Language name contains invalid characters');
    }
    
    return sanitized;
}

function validateFileExtension(ext) {
    if (!ext) return '';
    
    if (typeof ext !== 'string') {
        throw new Error('File extension must be a string');
    }
    
    const sanitized = sanitizeString(ext, 20);
    
    // File extensions should only contain alphanumeric characters and dots
    if (sanitized && !/^[a-zA-Z0-9.]+$/.test(sanitized)) {
        throw new Error('File extension contains invalid characters');
    }
    
    return sanitized;
}

function isValidAuthToken(token) {
    if (!token || typeof token !== 'string') {
        return false;
    }
    
    // GitHub tokens should be reasonable length
    if (token.length < 20 || token.length > 200) {
        return false;
    }
    
    // Should only contain valid token characters
    if (!/^[a-zA-Z0-9_\-]+$/.test(token)) {
        return false;
    }
    
    return true;
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
            // SECURITY: Add request timeout
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
                
                // SECURITY: Prevent memory exhaustion
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
                    headers: res.headers,
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
    context.log('GitHub Search function processed a request.');

    // Dynamically determine frontend URL for CORS
    const getFrontendUrl = () => {
        if (process.env.FRONTEND_URL) {
            return process.env.FRONTEND_URL;
        }
        
        const host = req.headers.host || req.headers['x-forwarded-host'] || req.headers['x-original-host'];
        const protocol = req.headers['x-forwarded-proto'] || req.headers['x-arr-ssl'] ? 'https' : 'http';
        const referer = req.headers.referer || req.headers.referrer;
        
        if (referer) {
            try {
                const refererUrl = new URL(referer);
                const refererOrigin = `${refererUrl.protocol}//${refererUrl.hostname}${refererUrl.port ? ':' + refererUrl.port : ''}`;
                if (!refererOrigin.includes('localhost') || host?.includes('localhost')) {
                    context.log(`Using referer origin: ${refererOrigin}`);
                    return refererOrigin;
                }
            } catch (e) {
                context.log(`Failed to parse referer: ${referer}`);
            }
        }
        
        if (host) {
            if (host.includes('.azurewebsites.net')) {
                const staticHost = host.replace('func-', 'swa-').replace('.azurewebsites.net', '.azurestaticapps.net');
                return `${protocol}://${staticHost}`;
            }
            
            if (host.includes('.azurestaticapps.net')) {
                return `${protocol}://${host}`;
            }
            
            return `${protocol}://${host}`;
        }
        
        // Fallback for local development - use environment variable
        return process.env.FRONTEND_URL || 'http://localhost:5173';
    };

    const frontendUrl = getFrontendUrl();
    
    // SECURITY: More restrictive CORS configuration
    let corsOrigin;
    if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
        // For local development, allow localhost but be more specific
        corsOrigin = frontendUrl;
    } else {
        // For production, use exact origin match
        corsOrigin = frontendUrl;
    }
    
    // Set CORS headers with security improvements
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600', // Reduced from 24 hours to 1 hour
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
        // Extract and validate query parameters or POST body
        const rawQuery = req.query.q || req.query.query || (req.body && req.body.query) || '';
        const rawOrganization = req.query.org || (req.body && req.body.organization) || '';
        const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

        // SECURITY: Validate and sanitize inputs
        let query, organization;
        
        try {
            query = validateSearchQuery(rawQuery);
            organization = validateOrganization(rawOrganization);
        } catch (validationError) {
            context.res = {
                ...context.res,
                status: 400,
                body: {
                    error: 'Input validation failed',
                    message: validationError.message
                }
            };
            return;
        }

        context.log(`Search query: ${query}, Organization: ${organization}`);

        if (!accessToken) {
            context.res = {
                ...context.res,
                status: 401,
                body: {
                    error: 'Missing authorization token',
                    message: 'Authorization header with Bearer token is required'
                }
            };
            return;
        }

        // SECURITY: Validate token format
        if (!isValidAuthToken(accessToken)) {
            context.res = {
                ...context.res,
                status: 401,
                body: {
                    error: 'Invalid authorization token',
                    message: 'Authorization token format is invalid'
                }
            };
            return;
        }

        // Build GitHub search parameters
        const searchParams = new URLSearchParams();
        
        // Build search query with filters
        let searchQuery = query;
        if (organization) {
            searchQuery = `${query} org:${organization}`;
        }
        
        searchParams.append('q', searchQuery);
        searchParams.append('sort', 'updated');
        searchParams.append('order', 'desc');
        searchParams.append('per_page', '20');

        context.log(`GitHub search query: ${searchQuery}`);

        // Search repositories using GitHub API
        const searchUrl = `https://api.github.com/search/repositories?${searchParams.toString()}`;
        
        const searchResponse = await makeRequest(searchUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'GitSecureOps-Search-Bot',
            }
        });

        if (!searchResponse.ok) {
            context.log(`GitHub API error: ${searchResponse.status}`);
            const errorText = await searchResponse.text();
            context.log(`Error details: ${errorText}`);
            
            context.res = {
                ...context.res,
                status: searchResponse.status,
                body: {
                    error: 'GitHub API error',
                    message: 'Failed to search repositories',
                    details: errorText
                }
            };
            return;
        }

        const searchData = await searchResponse.json();
        context.log(`Found ${searchData.total_count} repositories`);

        // Process and format results
        const results = searchData.items.map(repo => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || 'No description available',
            html_url: repo.html_url,
            clone_url: repo.clone_url,
            language: repo.language,
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            updated_at: repo.updated_at,
            owner: {
                login: repo.owner.login,
                avatar_url: repo.owner.avatar_url,
                type: repo.owner.type
            },
            topics: repo.topics || [],
            private: repo.private,
            visibility: repo.visibility,
            default_branch: repo.default_branch
        }));

        // Return formatted response
        context.res = {
            ...context.res,
            status: 200,
            body: {
                success: true,
                query: query,
                organization: organization || null,
                total_count: searchData.total_count,
                results: results,
                metadata: {
                    search_time: new Date().toISOString(),
                    api_rate_limit: searchResponse.headers?.['x-ratelimit-remaining'] || 'unknown',
                    results_count: results.length
                }
            }
        };

    } catch (error) {
        context.log.error('Search function error:', error);
        
        // SECURITY: Don't expose sensitive error details in production
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        context.res = {
            ...context.res,
            status: 500,
            body: {
                error: 'Internal server error',
                message: 'An error occurred while processing your search request',
                // Only include details in development
                details: isDevelopment ? error.message : undefined,
                timestamp: new Date().toISOString()
            }
        };
    }
};
