const https = require('https');

/**
 * Azure Function: Generate Report
 * POST /api/generate-report
 * Body: { token: string, orgs: string[] }
 *
 * Generates a comprehensive security report across multiple organizations.
 * Returns CSV-formatted data for download.
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
    const { token, orgs, format } = req.body || {};
    if (!token || !orgs || !Array.isArray(orgs) || orgs.length === 0) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields: token, orgs (array)' }),
      };
      return;
    }

    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'GitSecureOps/2.0',
    };

    context.log(`Generating report for ${orgs.length} org(s)`);

    const results = [];

    for (const org of orgs.slice(0, 10)) {
      // limit to 10 orgs per request
      try {
        const [membersRes, members2FARes, reposRes] = await Promise.all([
          makeRequest('api.github.com', `/orgs/${org}/members?per_page=100`, headers),
          makeRequest('api.github.com', `/orgs/${org}/members?filter=2fa_disabled&per_page=100`, headers),
          makeRequest('api.github.com', `/orgs/${org}/repos?per_page=100&type=all`, headers),
        ]);

        const allMembers = Array.isArray(membersRes.data) ? membersRes.data : [];
        const no2FA = Array.isArray(members2FARes.data) ? members2FARes.data : [];
        const repos = Array.isArray(reposRes.data) ? reposRes.data : [];

        const publicRepos = repos.filter((r) => !r.private);
        const twoFACompliance =
          allMembers.length > 0
            ? Math.round(((allMembers.length - no2FA.length) / allMembers.length) * 100)
            : 100;

        results.push({
          org,
          totalMembers: allMembers.length,
          membersWithout2FA: no2FA.length,
          twoFACompliancePercent: twoFACompliance,
          totalRepos: repos.length,
          publicRepos: publicRepos.length,
          privateRepos: repos.length - publicRepos.length,
          membersWithout2FAList: no2FA.map((m) => m.login),
          publicReposList: publicRepos.map((r) => r.name),
        });
      } catch (err) {
        results.push({
          org,
          error: err.message,
          totalMembers: 0,
          membersWithout2FA: 0,
          twoFACompliancePercent: 0,
          totalRepos: 0,
          publicRepos: 0,
          privateRepos: 0,
          membersWithout2FAList: [],
          publicReposList: [],
        });
      }
    }

    // Build response based on format
    if (format === 'csv') {
      const csvHeader =
        'Organization,Total Members,Members without 2FA,2FA Compliance %,Total Repos,Public Repos,Private Repos\n';
      const csvRows = results
        .map(
          (r) =>
            `${r.org},${r.totalMembers},${r.membersWithout2FA},${r.twoFACompliancePercent},${r.totalRepos},${r.publicRepos},${r.privateRepos}`
        )
        .join('\n');

      context.res = {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="security-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
        body: csvHeader + csvRows,
      };
    } else {
      context.res = {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          generatedAt: new Date().toISOString(),
          organizationCount: results.length,
          results,
        }),
      };
    }
  } catch (error) {
    context.log.error('Report generation error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Report generation failed: ' + error.message }),
    };
  }
};
