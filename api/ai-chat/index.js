const https = require('https');
const githubApi = require('../shared/githubApi');
const { TOOL_DEFINITIONS, isMutating } = require('../shared/agentTools');

/**
 * Azure Function: AI Agent Chat
 * POST /api/ai-chat
 *
 * Full agent loop with OpenAI tool/function calling.
 *
 * Request Body:
 *   { messages: ChatMessage[], token?: string, confirmed_action?: { tool, args } }
 *
 * Response:
 *   {
 *     response: string,                          — text for the user
 *     pending_action?: { id, tool, args, desc },  — needs user confirmation
 *     actions_taken?: [{ tool, args, result }],   — mutations that were executed
 *   }
 */

const AGENT_SYSTEM_PROMPT = `You are the GitSecureOps Agent — an AI assistant that can both **analyse** and **take actions** on the user's GitHub organization.

## Capabilities
You have tools to: search user access, list collaborators/members/teams/copilot-seats, add/remove collaborators, add/remove org members, manage teams, manage Copilot seats, and change repo visibility.

## Rules — FOLLOW STRICTLY
1. **Read-only tools** (list, search, get): use freely to gather data.
2. **Mutating tools** (add, remove, update): NEVER call them without first explaining exactly what you will do and asking for user confirmation.
   - Present the proposed action clearly and say: "Type **confirm** to proceed or **cancel** to abort."
   - Only after the user explicitly confirms should you call the mutating tool.
3. For bulk operations, list ALL affected items first, then ask for confirmation.
4. Never remove the last admin from a repository or organization.
5. Cap bulk operations at 25 items per confirmation round.
6. If a tool call fails, report the error and suggest alternatives.
7. Always say which org/repo/user you are operating on — be explicit.

## Formatting
- Use markdown: **bold**, \`code\`, bullet points, numbered lists.
- Use status indicators: ✅ success, ❌ failure, ⚠️ warning, 🔍 searching.
- After executing actions, show a summary table of results.
- Be concise.

## Context
The user is a GitHub organization administrator using the GitSecureOps dashboard. You have access to their GitHub token (server-side only) to execute API calls on their behalf.`;

/* ------------------------------------------------------------------ */
/*  HTTP helper (Azure OpenAI)                                         */
/* ------------------------------------------------------------------ */

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
        try { resolve({ statusCode: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ statusCode: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/* ------------------------------------------------------------------ */
/*  Tool executor — maps tool names to githubApi functions             */
/* ------------------------------------------------------------------ */

async function executeTool(toolName, args, token) {
  switch (toolName) {
    /* ---- Read ---- */
    case 'search_user_access': {
      const repos = args.scope === 'org'
        ? await githubApi.getOrgRepositories(token, args.org)
        : await githubApi.getUserRepositories(token);
      const found = [];
      for (const repo of repos) {
        try {
          const perm = await githubApi.getUserPermissionForRepo(token, repo.owner.login, repo.name, args.username);
          if (perm.permission && perm.permission !== 'none') {
            found.push({ repository: repo.full_name, permission: perm.permission });
          }
        } catch { /* skip repos we can't access */ }
      }
      return { username: args.username, access: found, total: found.length };
    }
    case 'list_repo_collaborators': {
      const collabs = await githubApi.getRepositoryCollaborators(token, args.owner, args.repo);
      const result = [];
      for (const c of collabs) {
        const perm = await githubApi.getUserPermissionForRepo(token, args.owner, args.repo, c.login);
        result.push({ username: c.login, permission: perm.permission });
      }
      return { repository: `${args.owner}/${args.repo}`, collaborators: result, total: result.length };
    }
    case 'list_user_repositories': {
      const repos = await githubApi.getUserRepositories(token);
      return { repositories: repos.map(r => ({ name: r.full_name, private: r.private, language: r.language })), total: repos.length };
    }
    case 'list_org_repositories': {
      const repos = await githubApi.getOrgRepositories(token, args.org);
      return { organization: args.org, repositories: repos.map(r => ({ name: r.full_name, private: r.private, language: r.language })), total: repos.length };
    }
    case 'list_org_members': {
      const members = await githubApi.getOrgMembers(token, args.org);
      return { organization: args.org, members: members.map(m => m.login), total: members.length };
    }
    case 'list_outside_collaborators': {
      const collabs = await githubApi.getOutsideCollaborators(token, args.org);
      return { organization: args.org, collaborators: collabs.map(c => c.login), total: collabs.length };
    }
    case 'list_org_teams': {
      const teams = await githubApi.getOrgTeams(token, args.org);
      return { organization: args.org, teams: teams.map(t => ({ name: t.name, slug: t.slug, members_count: t.members_count })), total: teams.length };
    }
    case 'list_team_members': {
      const members = await githubApi.getTeamMembers(token, args.org, args.team_slug);
      return { organization: args.org, team: args.team_slug, members: members.map(m => m.login), total: members.length };
    }
    case 'list_copilot_seats': {
      const data = await githubApi.getCopilotSeats(token, args.org);
      return {
        organization: args.org,
        total_seats: data.total_seats,
        seats: (data.seats || []).map(s => ({
          username: s.assignee?.login || 'unknown',
          last_activity: s.last_activity_at,
        })),
      };
    }
    case 'get_user_permission': {
      const perm = await githubApi.getUserPermissionForRepo(token, args.owner, args.repo, args.username);
      return { repository: `${args.owner}/${args.repo}`, username: args.username, permission: perm.permission };
    }

    /* ---- Write (only called after confirmation) ---- */
    case 'add_repo_collaborator':
      return githubApi.addRepoCollaborator(token, args.owner, args.repo, args.username, args.permission || 'push');
    case 'remove_repo_collaborator':
      return githubApi.removeRepoCollaborator(token, args.owner, args.repo, args.username);
    case 'add_org_member':
      return githubApi.addOrgMember(token, args.org, args.username, args.role || 'member');
    case 'remove_org_member':
      return githubApi.removeOrgMember(token, args.org, args.username);
    case 'remove_user_from_all_org_repos':
      return githubApi.removeUserFromAllOrgRepos(token, args.org, args.username);
    case 'remove_outside_collaborator':
      return githubApi.removeOutsideCollaborator(token, args.org, args.username);
    case 'add_team_member':
      return githubApi.addTeamMember(token, args.org, args.team_slug, args.username);
    case 'remove_team_member':
      return githubApi.removeTeamMember(token, args.org, args.team_slug, args.username);
    case 'add_copilot_seat':
      return githubApi.addCopilotSeat(token, args.org, args.username);
    case 'remove_copilot_seat':
      return githubApi.removeCopilotSeat(token, args.org, args.username);
    case 'update_repo_visibility':
      return githubApi.updateRepoVisibility(token, args.owner, args.repo, args.visibility === 'private');

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Build a human-readable description of a pending action             */
/* ------------------------------------------------------------------ */

function describeAction(toolName, args) {
  const descs = {
    add_repo_collaborator: () => `Add **${args.username}** to **${args.owner}/${args.repo}** with **${args.permission}** permission`,
    remove_repo_collaborator: () => `Remove **${args.username}** from **${args.owner}/${args.repo}**`,
    add_org_member: () => `Invite **${args.username}** to org **${args.org}** as **${args.role || 'member'}**`,
    remove_org_member: () => `Remove **${args.username}** from org **${args.org}**`,
    remove_user_from_all_org_repos: () => `Remove **${args.username}** from ALL repositories in **${args.org}**`,
    remove_outside_collaborator: () => `Remove outside collaborator **${args.username}** from **${args.org}**`,
    add_team_member: () => `Add **${args.username}** to team **${args.team_slug}** in **${args.org}**`,
    remove_team_member: () => `Remove **${args.username}** from team **${args.team_slug}** in **${args.org}**`,
    add_copilot_seat: () => `Assign Copilot seat to **${args.username}** in **${args.org}**`,
    remove_copilot_seat: () => `Remove Copilot seat from **${args.username}** in **${args.org}**`,
    update_repo_visibility: () => `Change **${args.owner}/${args.repo}** visibility to **${args.visibility}**`,
  };
  return (descs[toolName] || (() => `${toolName}(${JSON.stringify(args)})}`))();
}

/* ------------------------------------------------------------------ */
/*  Azure Function entry point                                         */
/* ------------------------------------------------------------------ */

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

  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5.2-chat';
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview';

  if (!endpoint || !apiKey) {
    context.res = {
      status: 503, headers: corsHeaders,
      body: JSON.stringify({ error: 'Azure OpenAI is not configured.' }),
    };
    return;
  }

  try {
    const { messages, token, confirmed_action } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      context.res = {
        status: 400, headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required field: messages (array)' }),
      };
      return;
    }

    const actionsTaken = [];

    /* ------------------------------------------------------------ */
    /*  Handle confirmed action execution                            */
    /* ------------------------------------------------------------ */
    if (confirmed_action && confirmed_action.tool && confirmed_action.args) {
      try {
        const result = await executeTool(confirmed_action.tool, confirmed_action.args, token);
        actionsTaken.push({ tool: confirmed_action.tool, args: confirmed_action.args, result });
      } catch (err) {
        actionsTaken.push({ tool: confirmed_action.tool, args: confirmed_action.args, error: err.message });
      }
    }

    /* ------------------------------------------------------------ */
    /*  Fetch live GitHub context                                    */
    /* ------------------------------------------------------------ */
    let ghContext = '';
    if (token) {
      try {
        const user = await githubApi.getAuthenticatedUser(token);
        const orgs = await githubApi.getUserOrganizations(token);
        ghContext = `\nAUTHENTICATED USER: ${user.login}\nORGANIZATIONS: ${orgs.map(o => o.login).join(', ') || 'none'}\n`;
      } catch { /* continue without context */ }
    }

    /* ------------------------------------------------------------ */
    /*  Build messages for OpenAI                                    */
    /* ------------------------------------------------------------ */
    const systemMessage = {
      role: 'system',
      content: AGENT_SYSTEM_PROMPT + ghContext,
    };

    // If we just executed a confirmed action, append the result as context
    const extraMessages = [];
    if (actionsTaken.length > 0) {
      const summaries = actionsTaken.map(a =>
        a.error
          ? `❌ Action **${a.tool}** failed: ${a.error}`
          : `✅ Action **${a.tool}** succeeded: ${JSON.stringify(a.result)}`
      ).join('\n');
      extraMessages.push({
        role: 'system',
        content: `The following actions were just executed after user confirmation:\n${summaries}\n\nSummarise the results for the user.`,
      });
    }

    const chatMessages = [
      systemMessage,
      ...messages.map(m => ({ role: m.role, content: m.content })),
      ...extraMessages,
    ];

    /* ------------------------------------------------------------ */
    /*  Agent loop — call OpenAI, execute read tools, repeat         */
    /* ------------------------------------------------------------ */
    const openaiUrl = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    const openaiHeaders = { 'Content-Type': 'application/json', 'api-key': apiKey };

    let pendingAction = null;
    const MAX_ITERATIONS = 8; // safety cap

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const result = await makeRequest(openaiUrl, { method: 'POST', headers: openaiHeaders }, {
        messages: chatMessages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
        max_completion_tokens: 2000,
      });

      if (result.statusCode !== 200) {
        context.log.error('Azure OpenAI error:', result.data);
        context.res = {
          status: 502, headers: corsHeaders,
          body: JSON.stringify({ error: 'AI service error.', details: result.data?.error?.message }),
        };
        return;
      }

      const choice = result.data.choices?.[0];
      if (!choice) break;

      const msg = choice.message;

      // No tool calls → final text response
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        const response = msg.content || 'No response generated.';
        context.res = {
          status: 200, headers: corsHeaders,
          body: JSON.stringify({ response, actions_taken: actionsTaken.length ? actionsTaken : undefined }),
        };
        return;
      }

      // Process tool calls
      chatMessages.push({ role: 'assistant', content: msg.content || null, tool_calls: msg.tool_calls });

      for (const toolCall of msg.tool_calls) {
        const toolName = toolCall.function.name;
        let args;
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          args = {};
        }

        if (isMutating(toolName)) {
          // Mutating → stop and ask for confirmation
          pendingAction = {
            id: toolCall.id,
            tool: toolName,
            args,
            description: describeAction(toolName, args),
          };

          // Give the model a message so it can frame the confirmation request
          chatMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              status: 'PENDING_CONFIRMATION',
              description: pendingAction.description,
              message: 'This action requires user confirmation. Ask the user to confirm.',
            }),
          });
        } else {
          // Read-only → execute immediately
          try {
            const toolResult = await executeTool(toolName, args, token);
            chatMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });
          } catch (err) {
            chatMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: err.message }),
            });
          }
        }
      }

      // If there's a pending mutating action, do one more OpenAI call
      // so the model can present the confirmation request, then return.
      if (pendingAction) {
        const finalResult = await makeRequest(openaiUrl, { method: 'POST', headers: openaiHeaders }, {
          messages: chatMessages,
          max_completion_tokens: 1000,
        });

        const finalText = finalResult.data?.choices?.[0]?.message?.content
          || `I'd like to: ${pendingAction.description}\n\nType **confirm** to proceed or **cancel** to abort.`;

        context.res = {
          status: 200, headers: corsHeaders,
          body: JSON.stringify({
            response: finalText,
            pending_action: pendingAction,
            actions_taken: actionsTaken.length ? actionsTaken : undefined,
          }),
        };
        return;
      }

      // Otherwise loop continues — model may want to call more read tools
    }

    // Fallback if loop exhausted
    context.res = {
      status: 200, headers: corsHeaders,
      body: JSON.stringify({ response: 'I completed my analysis. Let me know if you need anything else.' }),
    };
  } catch (err) {
    context.log.error('AI Chat error:', err);
    context.res = {
      status: 500, headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error', details: err.message }),
    };
  }
};
