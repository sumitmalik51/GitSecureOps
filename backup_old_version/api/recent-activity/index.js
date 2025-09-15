const https = require('https');

/**
 * Azure Function to fetch recent activity (PRs, commits, issues) from GitHub
 * Uses zero external dependencies for consistency with other functions
 */

function makeRequest(hostname, path, headers) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method: 'GET',
      headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function fetchRecentActivity(accessToken, organizations, daysBack = 7) {
  const activities = [];
  const since = new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000)).toISOString();
  
  const headers = {
    'Authorization': `token ${accessToken}`,
    'User-Agent': 'GitSecureOps-ActivityFeed/1.0',
    'Accept': 'application/vnd.github.v3+json'
  };

  try {
    // For each organization, fetch repos and their recent activity
    for (const org of organizations) {
      // Get repositories for the organization
      const reposResponse = await makeRequest(
        'api.github.com',
        `/orgs/${org}/repos?sort=updated&direction=desc&per_page=20`,
        headers
      );

      if (reposResponse.statusCode !== 200) {
        console.log(`Failed to fetch repos for ${org}: ${reposResponse.statusCode}`);
        continue;
      }

      const repos = Array.isArray(reposResponse.data) ? reposResponse.data : [];

      // For each repo, fetch recent PRs, commits, and issues
      for (const repo of repos.slice(0, 10)) { // Limit to 10 repos per org to avoid rate limits
        try {
          // Fetch recent PRs
          const prsResponse = await makeRequest(
            'api.github.com',
            `/repos/${repo.full_name}/pulls?state=all&sort=updated&direction=desc&per_page=5`,
            headers
          );

          if (prsResponse.statusCode === 200 && Array.isArray(prsResponse.data)) {
            for (const pr of prsResponse.data) {
              if (new Date(pr.updated_at) >= new Date(since)) {
                activities.push({
                  id: `pr-${pr.id}`,
                  type: 'pull_request',
                  title: pr.title,
                  repo: repo.full_name,
                  user: pr.user.login,
                  avatar: pr.user.avatar_url,
                  url: pr.html_url,
                  state: pr.state,
                  merged: pr.merged_at !== null,
                  created_at: pr.created_at,
                  updated_at: pr.updated_at,
                  timestamp: pr.updated_at,
                  important: pr.state === 'closed' && pr.merged_at !== null
                });
              }
            }
          }

          // Fetch recent commits
          const commitsResponse = await makeRequest(
            'api.github.com',
            `/repos/${repo.full_name}/commits?since=${since}&per_page=5`,
            headers
          );

          if (commitsResponse.statusCode === 200 && Array.isArray(commitsResponse.data)) {
            for (const commit of commitsResponse.data) {
              activities.push({
                id: `commit-${commit.sha}`,
                type: 'commit',
                title: commit.commit.message.split('\n')[0].substring(0, 100),
                repo: repo.full_name,
                user: commit.author ? commit.author.login : commit.commit.author.name,
                avatar: commit.author ? commit.author.avatar_url : null,
                url: commit.html_url,
                sha: commit.sha.substring(0, 7),
                created_at: commit.commit.author.date,
                updated_at: commit.commit.author.date,
                timestamp: commit.commit.author.date,
                important: false
              });
            }
          }

          // Fetch recent issues
          const issuesResponse = await makeRequest(
            'api.github.com',
            `/repos/${repo.full_name}/issues?state=all&sort=updated&direction=desc&since=${since}&per_page=5`,
            headers
          );

          if (issuesResponse.statusCode === 200 && Array.isArray(issuesResponse.data)) {
            for (const issue of issuesResponse.data) {
              // Skip pull requests (they appear in issues API too)
              if (issue.pull_request) continue;

              activities.push({
                id: `issue-${issue.id}`,
                type: 'issue',
                title: issue.title,
                repo: repo.full_name,
                user: issue.user.login,
                avatar: issue.user.avatar_url,
                url: issue.html_url,
                state: issue.state,
                number: issue.number,
                created_at: issue.created_at,
                updated_at: issue.updated_at,
                timestamp: issue.updated_at,
                important: issue.assignee !== null || issue.labels.some(l => l.name.toLowerCase().includes('urgent'))
              });
            }
          }

          // Small delay to avoid hitting rate limits too hard
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (repoError) {
          console.log(`Error fetching activity for ${repo.full_name}:`, repoError.message);
          continue;
        }
      }
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      success: true,
      activities: activities.slice(0, 100), // Limit to 100 activities
      metadata: {
        total_count: activities.length,
        organizations: organizations,
        days_back: daysBack,
        fetch_time: new Date().toISOString()
      }
    };

  } catch (error) {
    throw error;
  }
}

module.exports = async function (context, req) {
  // Set CORS headers for Static Web Apps
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: corsHeaders,
      body: ''
    };
    return;
  }

  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      context.res = {
        status: 401,
        headers: corsHeaders,
        body: {
          success: false,
          error: 'No access token provided'
        }
      };
      return;
    }

    // Get query parameters
    const organizations = req.query.organizations ? req.query.organizations.split(',') : [];
    const daysBack = parseInt(req.query.days) || 7;

    if (organizations.length === 0) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: {
          success: false,
          error: 'No organizations specified'
        }
      };
      return;
    }

    const result = await fetchRecentActivity(accessToken, organizations, daysBack);

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: result
    };

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: {
        success: false,
        error: error.message || 'Failed to fetch recent activity'
      }
    };
  }
};
