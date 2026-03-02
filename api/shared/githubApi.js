/**
 * Server-side GitHub API client for the AI Agent.
 *
 * Mirrors the relevant methods from the browser-side githubService.ts,
 * adapted for Node.js using the built-in `https` module.
 *
 * Every function takes a `token` parameter — the user's OAuth token
 * passed from the frontend via the request body.  The AI model never
 * sees this token.
 */

const https = require('https');

/* ------------------------------------------------------------------ */
/*  Low-level HTTP helper                                              */
/* ------------------------------------------------------------------ */

function ghRequest(path, { method = 'GET', token, body } = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path,
      method,
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GitSecureOps-Agent/2.0',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 204) return resolve({ statusCode: 204, data: null });
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('GitHub API timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/** Paginate a GitHub list endpoint (max 10 pages / 1000 items). */
async function ghPaginate(path, token, maxPages = 10) {
  const sep = path.includes('?') ? '&' : '?';
  const items = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await ghRequest(`${path}${sep}per_page=100&page=${page}`, { token });
    if (res.statusCode !== 200 || !Array.isArray(res.data) || res.data.length === 0) break;
    items.push(...res.data);
    if (res.data.length < 100) break;
  }
  return items;
}

function assertOk(res, action) {
  if (res.statusCode >= 200 && res.statusCode < 300) return;
  const msg = res.data?.message || res.data?.error || `HTTP ${res.statusCode}`;
  throw new Error(`GitHub API error (${action}): ${msg}`);
}

/* ================================================================== */
/*  Repositories                                                       */
/* ================================================================== */

async function getUserRepositories(token) {
  return ghPaginate('/user/repos?sort=updated&type=all', token);
}

async function getOrgRepositories(token, org) {
  return ghPaginate(`/orgs/${encodeURIComponent(org)}/repos?sort=updated`, token);
}

/* ================================================================== */
/*  Repository Collaborators                                           */
/* ================================================================== */

async function getRepositoryCollaborators(token, owner, repo) {
  return ghPaginate(`/repos/${owner}/${repo}/collaborators?affiliation=all`, token);
}

async function getUserPermissionForRepo(token, owner, repo, username) {
  const res = await ghRequest(`/repos/${owner}/${repo}/collaborators/${username}/permission`, { token });
  if (res.statusCode !== 200) return { permission: 'none' };
  return { permission: res.data.permission || 'none', role_name: res.data.role_name };
}

async function addRepoCollaborator(token, owner, repo, username, permission = 'push') {
  const res = await ghRequest(`/repos/${owner}/${repo}/collaborators/${username}`, {
    method: 'PUT',
    token,
    body: { permission },
  });
  assertOk(res, `add ${username} to ${owner}/${repo}`);
  return { status: 'added', repository: `${owner}/${repo}`, username, permission };
}

async function removeRepoCollaborator(token, owner, repo, username) {
  const res = await ghRequest(`/repos/${owner}/${repo}/collaborators/${username}`, {
    method: 'DELETE',
    token,
  });
  assertOk(res, `remove ${username} from ${owner}/${repo}`);
  return { status: 'removed', repository: `${owner}/${repo}`, username };
}

/* ================================================================== */
/*  Organization Members                                               */
/* ================================================================== */

async function getOrgMembers(token, org) {
  return ghPaginate(`/orgs/${encodeURIComponent(org)}/members`, token);
}

async function addOrgMember(token, org, username, role = 'member') {
  const res = await ghRequest(`/orgs/${encodeURIComponent(org)}/memberships/${username}`, {
    method: 'PUT',
    token,
    body: { role },
  });
  assertOk(res, `add ${username} to org ${org}`);
  return { status: 'invited', organization: org, username, role };
}

async function removeOrgMember(token, org, username) {
  const res = await ghRequest(`/orgs/${encodeURIComponent(org)}/members/${username}`, {
    method: 'DELETE',
    token,
  });
  assertOk(res, `remove ${username} from org ${org}`);
  return { status: 'removed', organization: org, username };
}

async function removeUserFromAllOrgRepos(token, org, username) {
  const summary = { username, organization: org, directRepos: 0, teams: 0, orgMembership: false, outsideCollab: false, errors: [] };

  // 1. Remove from all teams first (teams grant repo access)
  try {
    const teams = await getOrgTeams(token, org);
    const BATCH = 10;
    for (let i = 0; i < teams.length; i += BATCH) {
      const batch = teams.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map(async (team) => {
          try {
            const members = await getTeamMembers(token, org, team.slug);
            if (members.some((m) => m.login.toLowerCase() === username.toLowerCase())) {
              await removeTeamMember(token, org, team.slug, username);
              summary.teams++;
            }
          } catch { /* skip */ }
        })
      );
    }
  } catch (err) {
    summary.errors.push(`teams: ${err.message}`);
  }

  // 2. Remove direct collaborator access from all repos
  try {
    const repos = await getOrgRepositories(token, org);
    const BATCH = 10;
    for (let i = 0; i < repos.length; i += BATCH) {
      const batch = repos.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(async (repo) => {
          try {
            const res = await ghRequest(`/repos/${repo.owner.login}/${repo.name}/collaborators/${username}`, {
              method: 'DELETE',
              token,
            });
            return res.statusCode === 204 ? 'removed' : 'skipped';
          } catch { return 'skipped'; }
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value === 'removed') summary.directRepos++;
      }
    }
  } catch (err) {
    summary.errors.push(`repos: ${err.message}`);
  }

  // 3. Remove outside collaborator status
  try {
    const res = await ghRequest(`/orgs/${encodeURIComponent(org)}/outside_collaborators/${username}`, {
      method: 'DELETE',
      token,
    });
    if (res.statusCode === 204) summary.outsideCollab = true;
  } catch { /* not an outside collaborator */ }

  // 4. Remove org membership (this revokes ALL inherited access)
  try {
    const res = await ghRequest(`/orgs/${encodeURIComponent(org)}/members/${username}`, {
      method: 'DELETE',
      token,
    });
    if (res.statusCode === 204) summary.orgMembership = true;
  } catch (err) {
    summary.errors.push(`org membership: ${err.message}`);
  }

  return summary;
}

async function getOutsideCollaborators(token, org) {
  return ghPaginate(`/orgs/${encodeURIComponent(org)}/outside_collaborators`, token);
}

async function removeOutsideCollaborator(token, org, username) {
  const res = await ghRequest(`/orgs/${encodeURIComponent(org)}/outside_collaborators/${username}`, {
    method: 'DELETE',
    token,
  });
  assertOk(res, `remove outside collaborator ${username} from ${org}`);
  return { status: 'removed', organization: org, username };
}

/* ================================================================== */
/*  Teams                                                              */
/* ================================================================== */

async function getOrgTeams(token, org) {
  return ghPaginate(`/orgs/${encodeURIComponent(org)}/teams`, token);
}

async function getTeamMembers(token, org, teamSlug) {
  return ghPaginate(`/orgs/${encodeURIComponent(org)}/teams/${teamSlug}/members`, token);
}

async function addTeamMember(token, org, teamSlug, username) {
  const res = await ghRequest(
    `/orgs/${encodeURIComponent(org)}/teams/${teamSlug}/memberships/${username}`,
    { method: 'PUT', token }
  );
  assertOk(res, `add ${username} to team ${teamSlug}`);
  return { status: 'added', organization: org, team: teamSlug, username };
}

async function removeTeamMember(token, org, teamSlug, username) {
  const res = await ghRequest(
    `/orgs/${encodeURIComponent(org)}/teams/${teamSlug}/memberships/${username}`,
    { method: 'DELETE', token }
  );
  assertOk(res, `remove ${username} from team ${teamSlug}`);
  return { status: 'removed', organization: org, team: teamSlug, username };
}

/* ================================================================== */
/*  Copilot Seats                                                      */
/* ================================================================== */

async function getCopilotSeats(token, org) {
  const res = await ghRequest(`/orgs/${encodeURIComponent(org)}/copilot/billing/seats`, { token });
  if (res.statusCode !== 200) return { seats: [], total_seats: 0 };
  return { seats: res.data.seats || [], total_seats: res.data.total_seats || 0 };
}

async function addCopilotSeat(token, org, username) {
  const res = await ghRequest(`/orgs/${encodeURIComponent(org)}/copilot/billing/selected_users`, {
    method: 'POST',
    token,
    body: { selected_usernames: [username] },
  });
  assertOk(res, `add Copilot seat for ${username}`);
  return { status: 'added', organization: org, username };
}

async function removeCopilotSeat(token, org, username) {
  const res = await ghRequest(`/orgs/${encodeURIComponent(org)}/copilot/billing/selected_users`, {
    method: 'DELETE',
    token,
    body: { selected_usernames: [username] },
  });
  assertOk(res, `remove Copilot seat for ${username}`);
  return { status: 'removed', organization: org, username };
}

/* ================================================================== */
/*  Repo Visibility                                                    */
/* ================================================================== */

async function updateRepoVisibility(token, owner, repo, isPrivate) {
  const res = await ghRequest(`/repos/${owner}/${repo}`, {
    method: 'PATCH',
    token,
    body: { private: isPrivate },
  });
  assertOk(res, `set ${owner}/${repo} to ${isPrivate ? 'private' : 'public'}`);
  return { status: 'updated', repository: `${owner}/${repo}`, visibility: isPrivate ? 'private' : 'public' };
}

/* ================================================================== */
/*  User info helpers                                                  */
/* ================================================================== */

async function getAuthenticatedUser(token) {
  const res = await ghRequest('/user', { token });
  if (res.statusCode !== 200) throw new Error('Failed to fetch authenticated user');
  return res.data;
}

async function getUserOrganizations(token) {
  return ghPaginate('/user/orgs', token, 3);
}

/* ================================================================== */
/*  Exports                                                            */
/* ================================================================== */

module.exports = {
  // Repos
  getUserRepositories,
  getOrgRepositories,
  // Collaborators
  getRepositoryCollaborators,
  getUserPermissionForRepo,
  addRepoCollaborator,
  removeRepoCollaborator,
  // Org members
  getOrgMembers,
  addOrgMember,
  removeOrgMember,
  removeUserFromAllOrgRepos,
  getOutsideCollaborators,
  removeOutsideCollaborator,
  // Teams
  getOrgTeams,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  // Copilot
  getCopilotSeats,
  addCopilotSeat,
  removeCopilotSeat,
  // Visibility
  updateRepoVisibility,
  // User
  getAuthenticatedUser,
  getUserOrganizations,
};
