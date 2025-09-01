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
                    headers: res.headers,
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

// Helper function to get repository content with pagination
async function getRepositoryFiles(accessToken, repoFullName, path = '', ref = 'main') {
    const searchUrl = `https://api.github.com/repos/${repoFullName}/contents/${path}?ref=${ref}`;
    
    const response = await makeRequest(searchUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitSecureOps-CodeSearch-Bot',
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch repository contents: ${response.status}`);
    }

    return await response.json();
}

// Helper function to get file content
async function getFileContent(accessToken, repoFullName, filePath, ref = 'main') {
    const searchUrl = `https://api.github.com/repos/${repoFullName}/contents/${filePath}?ref=${ref}`;
    
    const response = await makeRequest(searchUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'GitSecureOps-CodeSearch-Bot',
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.status}`);
    }

    return await response.text();
}

// Helper function to fetch repositories for a specific scope (user or organization)
async function fetchRepositoriesForScope(accessToken, searchQuery, maxRepoFetch) {
    const searchParams = new URLSearchParams();
    searchParams.append('q', searchQuery);
    searchParams.append('sort', 'updated');
    searchParams.append('order', 'desc');
    searchParams.append('per_page', Math.min(maxRepoFetch, 100).toString()); // GitHub API max is 100 per page
    
    const repoSearchUrl = `https://api.github.com/search/repositories?${searchParams.toString()}`;
    
    const repoResponse = await makeRequest(repoSearchUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitSecureOps-CodeSearch-Bot',
        }
    });

    if (!repoResponse.ok) {
        throw new Error(`GitHub API error for repo search: ${repoResponse.status}`);
    }

    const repoData = await repoResponse.json();
    let repositories = repoData.items.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        language: repo.language,
        updated_at: repo.updated_at,
        private: repo.private
    }));

    // If we're searching an organization and got the maximum results per page,
    // fetch additional pages to get all repositories
    const isOrgSearch = searchQuery.startsWith('org:');
    if (isOrgSearch && repoData.items.length === 100 && maxRepoFetch > 100) {
        let page = 2;
        const maxPages = Math.ceil(maxRepoFetch / 100);
        
        while (page <= maxPages && repositories.length < maxRepoFetch) {
            try {
                searchParams.set('page', page.toString());
                const additionalRepoUrl = `https://api.github.com/search/repositories?${searchParams.toString()}`;
                
                const additionalResponse = await makeRequest(additionalRepoUrl, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'GitSecureOps-CodeSearch-Bot',
                    }
                });
                
                if (additionalResponse.ok) {
                    const additionalData = await additionalResponse.json();
                    
                    if (additionalData.items && additionalData.items.length > 0) {
                        const additionalRepos = additionalData.items.map(repo => ({
                            id: repo.id,
                            name: repo.name,
                            full_name: repo.full_name,
                            description: repo.description,
                            html_url: repo.html_url,
                            language: repo.language,
                            updated_at: repo.updated_at,
                            private: repo.private
                        }));
                        repositories = repositories.concat(additionalRepos);
                        
                        if (additionalData.items.length < 100) {
                            // No more results available
                            break;
                        }
                    } else {
                        break;
                    }
                } else {
                    console.warn(`Failed to fetch page ${page} of repositories: ${additionalResponse.status}`);
                    break;
                }
                
                // Rate limiting between pages
                await new Promise(resolve => setTimeout(resolve, 200));
                page++;
            } catch (error) {
                console.warn(`Error fetching page ${page} of repositories:`, error.message);
                break;
            }
        }
    }

    // Apply final limit only for user repos (not organization repos)
    if (!isOrgSearch && repositories.length > maxRepoFetch) {
        repositories = repositories.slice(0, maxRepoFetch);
    }

    return repositories;
}

// Helper function to extract code snippets around matches
function extractSnippet(content, query, contextLines = 3) {
    const lines = content.split('\n');
    const matches = [];
    const lowerQuery = query.toLowerCase();
    
    lines.forEach((line, index) => {
        if (line.toLowerCase().includes(lowerQuery)) {
            const start = Math.max(0, index - contextLines);
            const end = Math.min(lines.length, index + contextLines + 1);
            const snippet = lines.slice(start, end);
            const matchLineIndex = index - start;
            
            matches.push({
                line_number: index + 1,
                snippet: snippet.join('\n'),
                match_line_index: matchLineIndex,
                context_start: start + 1,
                context_end: end
            });
        }
    });
    
    return matches;
}

// Helper function to search within repositories using GitHub Code Search API
async function searchCodeInRepos(accessToken, query, repositories, language, fileType, organization = null, context = null, onProgress = null) {
    const results = [];
    
    // Dynamic limits based on search scope
    let maxReposToSearch, maxResultsPerRepo;
    
    if (organization) {
        // For organization searches, use much higher limits or no limit
        maxReposToSearch = parseInt(process.env.MAX_ORG_REPOS_TO_SEARCH) || Number.MAX_SAFE_INTEGER; // Essentially no limit for orgs
        maxResultsPerRepo = parseInt(process.env.MAX_ORG_RESULTS_PER_REPO) || 20; // More results per repo for orgs
    } else {
        // For "all repos" searches, use reasonable limits to avoid performance issues  
        maxReposToSearch = parseInt(process.env.MAX_REPOS_TO_SEARCH) || 100; // Limit for user repos
        maxResultsPerRepo = parseInt(process.env.MAX_RESULTS_PER_REPO) || 10; // Standard results per repository
    }
    
    // Build search query
    let searchQuery = query;
    
    // Add language filter if specified
    if (language) {
        searchQuery += ` language:${language}`;
    }
    
    // Add file extension filter if specified
    if (fileType) {
        searchQuery += ` extension:${fileType}`;
    }
    
    // Search in specific repositories with dynamic limits and progress reporting
    const reposToSearch = maxReposToSearch === Number.MAX_SAFE_INTEGER ? repositories : repositories.slice(0, maxReposToSearch);
    
    for (let i = 0; i < reposToSearch.length; i++) {
        const repo = reposToSearch[i];
        try {
            const repoSearchQuery = `${searchQuery} repo:${repo.full_name}`;
            const searchParams = new URLSearchParams();
            searchParams.append('q', repoSearchQuery);
            searchParams.append('sort', 'indexed');
            searchParams.append('order', 'desc');
            searchParams.append('per_page', maxResultsPerRepo.toString()); // Configurable results per repo
            
            const searchUrl = `https://api.github.com/search/code?${searchParams.toString()}`;
            
            const response = await makeRequest(searchUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'GitSecureOps-CodeSearch-Bot',
                }
            });
            
            if (response.ok) {
                const searchData = await response.json();
                const repoResults = [];
                
                for (const item of searchData.items || []) {
                    try {
                        // Get the actual file content to extract better snippets
                        const fileContent = await getFileContent(accessToken, repo.full_name, item.path);
                        const snippets = extractSnippet(fileContent, query);
                        
                        const result = {
                            repository: repo,
                            file: {
                                name: item.name,
                                path: item.path,
                                url: item.html_url,
                                git_url: item.git_url,
                                sha: item.sha
                            },
                            matches: snippets,
                            score: item.score || 1
                        };
                        
                        results.push(result);
                        repoResults.push(result);
                        
                    } catch (fileError) {
                        // If we can't get file content, use the basic match info
                        const result = {
                            repository: repo,
                            file: {
                                name: item.name,
                                path: item.path,
                                url: item.html_url,
                                git_url: item.git_url,
                                sha: item.sha
                            },
                            matches: [{
                                line_number: 1,
                                snippet: 'Code preview unavailable',
                                match_line_index: 0,
                                context_start: 1,
                                context_end: 1
                            }],
                            score: item.score || 1
                        };
                        
                        results.push(result);
                        repoResults.push(result);
                    }
                }

                // Report progress if callback provided
                if (onProgress && repoResults.length > 0) {
                    onProgress({
                        repository: repo.full_name,
                        results: repoResults,
                        progress: {
                            current: i + 1,
                            total: reposToSearch.length,
                            percentage: Math.round(((i + 1) / reposToSearch.length) * 100)
                        }
                    });
                }

                if (context) {
                    context.log(`Found ${repoResults.length} code matches in ${repo.full_name}`);
                }
            }
            
            // Small delay to respect rate limits (increased for higher volume)
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (repoError) {
            if (context) {
                context.log(`Failed to search in ${repo.full_name}: ${repoError.message}`);
            }
            // Continue with other repositories
        }
    }
    
    return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

module.exports = async function (context, req) {
    context.log('GitHub Code Search function processed a request.');

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
        const organizations = req.body && req.body.organizations ? req.body.organizations : []; // Support multiple orgs
        const language = req.query.language || (req.body && req.body.language) || '';
        const fileType = req.query.extension || req.query.ext || (req.body && req.body.fileType) || '';
        const repositories = req.body && req.body.repositories ? req.body.repositories : [];
        const accessToken = req.headers.authorization?.replace('Bearer ', '') || '';
        const streaming = req.query.stream === 'true' || (req.body && req.body.streaming === true); // Support streaming mode

        // Combine single org and multiple orgs into one array
        const allOrganizations = [];
        if (organization) allOrganizations.push(organization);
        if (organizations && organizations.length > 0) {
            allOrganizations.push(...organizations.filter(org => org && !allOrganizations.includes(org)));
        }

        context.log(`Code search query: ${query}, Organizations: ${allOrganizations.join(', ') || 'none'}, Language: ${language}, FileType: ${fileType}, Streaming: ${streaming}`);

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

        // If no specific repositories provided, get repositories from user/organizations
        let targetRepositories = repositories;
        
        if (!targetRepositories || targetRepositories.length === 0) {
            targetRepositories = [];
            
            // Dynamic limits based on search scope
            let maxRepoFetch;
            if (allOrganizations.length > 0) {
                // For organization searches, use higher limit or no limit
                maxRepoFetch = parseInt(process.env.MAX_ORG_REPO_FETCH) || 1000; // Much higher limit for org searches
            } else {
                // For "all repos" searches, use reasonable limit to avoid performance issues
                maxRepoFetch = parseInt(process.env.MAX_USER_REPO_FETCH) || 100; // Limit for user repos
            }
            
            // If no organizations specified, search user's repos
            if (allOrganizations.length === 0) {
                const userRepos = await fetchRepositoriesForScope(accessToken, 'user:@me', maxRepoFetch);
                targetRepositories = userRepos;
            } else {
                // Fetch repositories from all specified organizations
                for (const org of allOrganizations) {
                    try {
                        const orgRepos = await fetchRepositoriesForScope(accessToken, `org:${org}`, maxRepoFetch);
                        targetRepositories = targetRepositories.concat(orgRepos);
                        
                        // Small delay between organization API calls
                        if (allOrganizations.length > 1) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    } catch (error) {
                        context.log(`Failed to fetch repositories for organization ${org}:`, error.message);
                        // Continue with other organizations
                    }
                }
            }
        }

        context.log(`Searching code in ${targetRepositories.length} repositories`);

        // Check if streaming is requested
        if (streaming) {
            // Set up Server-Sent Events headers
            context.res = {
                ...context.res,
                status: 200,
                headers: {
                    ...context.res.headers,
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
                isRaw: true
            };

            let allResults = [];
            let streamResponse = '';

            // Create progress callback for streaming
            const onProgress = (progressData) => {
                // Add new results to the beginning of the array (latest first)
                allResults.unshift(...progressData.results);
                
                // Send progress update
                const eventData = {
                    type: 'progress',
                    data: {
                        repository: progressData.repository,
                        newResults: progressData.results,
                        totalResults: allResults.length,
                        progress: progressData.progress,
                        allResults: allResults.slice(0, 50) // Send top 50 results to keep response manageable
                    }
                };
                
                streamResponse += `data: ${JSON.stringify(eventData)}\n\n`;
            };

            // Start streaming search
            try {
                const finalResults = await searchCodeInRepos(
                    accessToken, 
                    query, 
                    targetRepositories, 
                    language, 
                    fileType,
                    allOrganizations.length > 0 ? allOrganizations.join(',') : null,
                    context,
                    onProgress
                );

                // Send final completion event
                const completionEvent = {
                    type: 'complete',
                    data: {
                        success: true,
                        query: query,
                        organizations: allOrganizations.length > 0 ? allOrganizations : null,
                        language: language || null,
                        file_type: fileType || null,
                        total_results: finalResults.length,
                        repositories_searched: targetRepositories.length,
                        results: finalResults.slice(0, 100), // Send top 100 final results
                        metadata: {
                            search_time: new Date().toISOString(),
                            streaming: true
                        }
                    }
                };

                streamResponse += `data: ${JSON.stringify(completionEvent)}\n\n`;
                streamResponse += 'data: [DONE]\n\n';

                context.res.body = streamResponse;
                return;

            } catch (error) {
                // Send error event
                const errorEvent = {
                    type: 'error',
                    data: {
                        error: 'Code search failed',
                        message: error.message,
                        timestamp: new Date().toISOString()
                    }
                };

                streamResponse += `data: ${JSON.stringify(errorEvent)}\n\n`;
                context.res.body = streamResponse;
                return;
            }
        }

        // Non-streaming mode (original functionality)
        const codeResults = await searchCodeInRepos(
            accessToken, 
            query, 
            targetRepositories, 
            language, 
            fileType,
            allOrganizations.length > 0 ? allOrganizations.join(',') : null,
            context
        );

        context.log(`Found ${codeResults.length} code matches`);

        // Return formatted response
        context.res = {
            ...context.res,
            status: 200,
            body: {
                success: true,
                query: query,
                organization: organization || null,
                organizations: allOrganizations.length > 0 ? allOrganizations : null,
                language: language || null,
                file_type: fileType || null,
                total_results: codeResults.length,
                repositories_searched: targetRepositories.length,
                results: codeResults,
                metadata: {
                    search_time: new Date().toISOString(),
                    search_type: 'code',
                    results_count: codeResults.length
                }
            }
        };

    } catch (error) {
        context.log.error('Code search function error:', error);
        
        context.res = {
            ...context.res,
            status: 500,
            body: {
                error: 'Internal server error',
                message: 'An error occurred while processing your code search request',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        };
    }
};
