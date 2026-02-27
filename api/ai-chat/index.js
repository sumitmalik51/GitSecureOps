const https = require('https');

/**
 * Azure Function: AI Chat
 * POST /api/ai-chat
 *
 * Proxies chat messages to Azure OpenAI and enriches the system prompt
 * with live GitHub org data for security-aware responses.
 *
 * Environment Variables:
 *   AZURE_OPENAI_ENDPOINT    — e.g. https://your-resource.openai.azure.com
 *   AZURE_OPENAI_API_KEY     — API key for Azure OpenAI
 *   AZURE_OPENAI_DEPLOYMENT  — Deployment name (e.g. gpt-4o)
 *   AZURE_OPENAI_API_VERSION — API version (default: 2024-08-01-preview)
 *
 * Body: { messages: ChatMessage[], token?: string }
 * Response: { response: string }
 */

const SYSTEM_PROMPT = `You are the GitSecureOps Security Copilot — an expert AI assistant specializing in GitHub organization security, access management, compliance, and DevSecOps best practices.

Your capabilities:
- Analyze GitHub organization security posture
- Provide actionable security recommendations
- Assess 2FA compliance and authentication risks
- Identify repository visibility risks and secret exposure
- Review access control policies and outside collaborator risks
- Guide users on branch protection, Dependabot, and secret scanning
- Advise on CI/CD security and supply chain hardening

Formatting guidelines:
- Use markdown with headers (##, ###), bold (**text**), and bullet points
- Include risk indicators: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low
- Provide numbered action steps with specific GitHub settings references
- Be concise but thorough — aim for actionable advice
- When analyzing data, include percentages and comparisons
- Always end with concrete next steps

Context: You are integrated into a GitHub security management dashboard. The user is an organization administrator managing GitHub security. Respond only to security, GitHub, DevOps, and software engineering topics. Politely decline unrelated requests.`;

function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'POST',
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function fetchGitHubContext(token) {
  if (!token) return null;

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitSecureOps/2.0',
  };

  try {
    // Get first org
    const orgsRes = await makeRequest('https://api.github.com/user/orgs?per_page=1', {
      method: 'GET',
      headers,
    });
    if (orgsRes.statusCode !== 200 || !orgsRes.data.length) return null;

    const orgName = orgsRes.data[0].login;

    // Parallel fetches
    const [reposRes, membersRes] = await Promise.all([
      makeRequest(`https://api.github.com/orgs/${orgName}/repos?per_page=100&sort=updated`, {
        method: 'GET', headers,
      }),
      makeRequest(`https://api.github.com/orgs/${orgName}/members?per_page=100`, {
        method: 'GET', headers,
      }),
    ]);

    const repos = reposRes.statusCode === 200 ? reposRes.data : [];
    const members = membersRes.statusCode === 200 ? membersRes.data : [];

    const publicRepos = repos.filter(r => !r.private).length;

    return `
LIVE GITHUB ORG DATA:
- Organization: ${orgName}
- Total repos: ${repos.length} (${publicRepos} public, ${repos.length - publicRepos} private)
- Team members: ${members.length}
- Forked repos: ${repos.filter(r => r.fork).length}
- Archived repos: ${repos.filter(r => r.archived).length}
- Most active repos: ${repos.slice(0, 5).map(r => r.name).join(', ')}
`;
  } catch (err) {
    return null;
  }
}

module.exports = async function (context, req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
    return;
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Check Azure OpenAI configuration
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5.2-chat';
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview';

  if (!endpoint || !apiKey) {
    context.res = {
      status: 503,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.',
      }),
    };
    return;
  }

  try {
    const { messages, token } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required field: messages (array)' }),
      };
      return;
    }

    // Fetch live GitHub context if token provided
    const ghContext = await fetchGitHubContext(token);

    // Build the messages array with system prompt
    const systemMessage = {
      role: 'system',
      content: SYSTEM_PROMPT + (ghContext ? `\n\n${ghContext}` : ''),
    };

    const chatMessages = [
      systemMessage,
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    // Call Azure OpenAI
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const result = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
    }, {
      messages: chatMessages,
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.9,
    });

    if (result.statusCode !== 200) {
      context.log.error('Azure OpenAI error:', result.data);
      context.res = {
        status: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'AI service error. Please try again.',
          details: result.data?.error?.message || 'Unknown error',
        }),
      };
      return;
    }

    const response = result.data.choices?.[0]?.message?.content || 'No response generated.';

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify({ response }),
    };
  } catch (err) {
    context.log.error('AI Chat error:', err);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
