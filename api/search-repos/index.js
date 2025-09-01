const https = require('https');
const { URLSearchParams } = require('url');

// Helper function to make HTTP requests using built-in modules
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        if (options.body && (options.method === 'POST' || options.method === 'PUT')) {
            const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
            requestOptions.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
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
                            return Promise.reject(new Error(`JSON parse error: ${e.message}. Response: ${data.substring(0, 200)}`));
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
    const corsOrigin = frontendUrl.includes('localhost') ? '*' : frontendUrl;
    
    // Set CORS headers
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        }
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    try {
        // Extract query parameters or POST body
        const query = req.query.q || req.query.query || (req.body && req.body.query) || '';
        const organization = req.query.org || (req.body && req.body.organization) || '';
        const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';

        context.log(`Search query: ${query}, Organization: ${organization}`);

        if (!query || query.trim().length === 0) {
            context.res = {
                ...context.res,
                status: 400,
                body: {
                    error: 'Missing search query',
                    message: 'Please provide a search query using "q" or "query" parameter'
                }
            };
            return;
        }

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
        
        context.res = {
            ...context.res,
            status: 500,
            body: {
                error: 'Internal server error',
                message: 'An error occurred while processing your search request',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        };
    }
};
