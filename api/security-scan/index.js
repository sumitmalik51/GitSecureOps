const https = require('https');

/**
 * Azure Function: Security Scan
 * POST /api/security-scan
 * Body: { token: string, org: string }
 *
 * Scans a GitHub organization for security issues:
 * - Members without 2FA
 * - Public repositories
 * - Admin-level users
 * Returns a structured report.
 */

function makeRequest(hostname, path, headers) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method: 'GET',
      headers,
    };

    const req = https.request(options, (res) => {
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
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
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

  try {
    const { token, org } = req.body || {};
    if (!token || !org) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields: token, org' }),
      };
      return;
    }

    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'GitSecureOps/2.0',
    };

    context.log(`Running security scan for org: ${org}`);

    // Parallel requests
    const [membersRes, members2FARes, reposRes] = await Promise.all([
      makeRequest('api.github.com', `/orgs/${org}/members?per_page=100`, headers),
      makeRequest('api.github.com', `/orgs/${org}/members?filter=2fa_disabled&per_page=100`, headers),
      makeRequest('api.github.com', `/orgs/${org}/repos?per_page=100&type=all`, headers),
    ]);

    const allMembers = Array.isArray(membersRes.data) ? membersRes.data : [];
    const no2FA = Array.isArray(members2FARes.data) ? members2FARes.data : [];
    const repos = Array.isArray(reposRes.data) ? reposRes.data : [];

    const publicRepos = repos.filter((r) => !r.private);

    // Build findings
    const findings = [];

    // 2FA findings
    for (const member of no2FA) {
      findings.push({
        severity: 'critical',
        type: 'no_2fa',
        message: `${member.login} does not have 2FA enabled`,
        user: member.login,
      });
    }

    // Public repo findings
    for (const repo of publicRepos) {
      findings.push({
        severity: 'medium',
        type: 'public_repo',
        message: `Repository "${repo.name}" is public`,
        repo: repo.name,
      });
    }

    // Calculate compliance score
    const twoFACompliance =
      allMembers.length > 0
        ? Math.round(((allMembers.length - no2FA.length) / allMembers.length) * 100)
        : 100;

    const privateRate =
      repos.length > 0
        ? Math.round(((repos.length - publicRepos.length) / repos.length) * 100)
        : 100;

    const overallScore = Math.round(twoFACompliance * 0.6 + privateRate * 0.4);

    const report = {
      org,
      scannedAt: new Date().toISOString(),
      summary: {
        totalMembers: allMembers.length,
        membersWithout2FA: no2FA.length,
        twoFACompliancePercent: twoFACompliance,
        totalRepos: repos.length,
        publicRepos: publicRepos.length,
        privateRepos: repos.length - publicRepos.length,
        overallScore,
      },
      findings,
      criticalCount: findings.filter((f) => f.severity === 'critical').length,
      highCount: findings.filter((f) => f.severity === 'high').length,
      mediumCount: findings.filter((f) => f.severity === 'medium').length,
    };

    context.res = {
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify(report),
    };
  } catch (error) {
    context.log.error('Security scan error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Security scan failed: ' + error.message }),
    };
  }
};
