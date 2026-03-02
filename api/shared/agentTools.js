/**
 * OpenAI Tool Definitions for the GitSecureOps AI Agent.
 *
 * Each tool maps to a function in `../shared/githubApi.js`.
 * Tools are classified as:
 *   - READ  → executed immediately, results fed back to the model
 *   - WRITE → requires user confirmation before execution
 */

/* ------------------------------------------------------------------ */
/*  Classification                                                     */
/* ------------------------------------------------------------------ */

const MUTATING_TOOLS = new Set([
  'add_repo_collaborator',
  'remove_repo_collaborator',
  'add_org_member',
  'remove_org_member',
  'remove_user_from_all_org_repos',
  'remove_outside_collaborator',
  'add_team_member',
  'remove_team_member',
  'add_copilot_seat',
  'remove_copilot_seat',
  'update_repo_visibility',
]);

function isMutating(toolName) {
  return MUTATING_TOOLS.has(toolName);
}

/* ------------------------------------------------------------------ */
/*  Tool Definitions (OpenAI function-calling format)                  */
/* ------------------------------------------------------------------ */

const TOOL_DEFINITIONS = [
  /* ---------- Read: Search & List ---------- */
  {
    type: 'function',
    function: {
      name: 'search_user_access',
      description:
        'Check if a GitHub user has any REAL access (org membership, team membership, outside collaborator, or direct repo access) across all orgs or a specific org. Does NOT count public repo read access. Returns org membership status, role, teams, and direct repo count.',
      parameters: {
        type: 'object',
        properties: {
          username: { type: 'string', description: 'GitHub username to search for' },
          org: { type: 'string', description: 'Optional: specific organization to check. If omitted, checks all orgs.' },
        },
        required: ['username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_repo_collaborators',
      description: 'List all collaborators of a specific repository and their permission levels.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner (user or org login)' },
          repo: { type: 'string', description: 'Repository name' },
        },
        required: ['owner', 'repo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_user_repositories',
      description: 'List all repositories the authenticated user owns or has access to.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_org_repositories',
      description: 'List all repositories in an organization.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
        },
        required: ['org'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_org_members',
      description: 'List all members of an organization.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
        },
        required: ['org'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_outside_collaborators',
      description: 'List all outside collaborators in an organization (non-member collaborators).',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
        },
        required: ['org'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_org_teams',
      description: 'List all teams in an organization.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
        },
        required: ['org'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_team_members',
      description: 'List all members of a specific team.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
          team_slug: { type: 'string', description: 'Team slug (URL-friendly name)' },
        },
        required: ['org', 'team_slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_copilot_seats',
      description: 'List all GitHub Copilot seat assignments in an organization.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
        },
        required: ['org'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_user_permission',
      description: 'Get the permission level a specific user has on a specific repository.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          username: { type: 'string', description: 'GitHub username' },
        },
        required: ['owner', 'repo', 'username'],
      },
    },
  },

  /* ---------- Write: Mutations (require confirmation) ---------- */
  {
    type: 'function',
    function: {
      name: 'add_repo_collaborator',
      description:
        'Add a user as a collaborator to a repository with specified permission level. ALWAYS confirm with the user before calling this.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          username: { type: 'string', description: 'GitHub username to add' },
          permission: {
            type: 'string',
            enum: ['pull', 'push', 'admin'],
            description: 'Permission level: pull (read), push (write), admin',
          },
        },
        required: ['owner', 'repo', 'username', 'permission'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_repo_collaborator',
      description:
        'Remove a user from a repository. ALWAYS confirm with the user before calling this.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          username: { type: 'string', description: 'GitHub username to remove' },
        },
        required: ['owner', 'repo', 'username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_org_member',
      description:
        'Invite a user to an organization. ALWAYS confirm with the user before calling this.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
          username: { type: 'string', description: 'GitHub username to invite' },
          role: {
            type: 'string',
            enum: ['member', 'admin'],
            description: 'Role in the organization',
            default: 'member',
          },
        },
        required: ['org', 'username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_org_member',
      description: 'COMPREHENSIVE removal: removes a user from ALL teams, ALL direct repo collaborator access, outside collaborator status, AND org membership. Equivalent to remove_user_from_all_org_repos. ALWAYS confirm first.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
          username: { type: 'string', description: 'GitHub username to remove' },
        },
        required: ['org', 'username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_user_from_all_org_repos',
      description:
        'COMPREHENSIVE removal: removes a user from ALL teams, ALL direct repo collaborator access, outside collaborator status, AND org membership in one operation. This fully revokes every form of access the user has in the org. This is the most thorough removal tool — use it when you need to completely cut off a user. ALWAYS confirm first.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
          username: { type: 'string', description: 'GitHub username to remove' },
        },
        required: ['org', 'username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_outside_collaborator',
      description: 'Remove an outside collaborator from an organization. Confirm first.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
          username: { type: 'string', description: 'GitHub username' },
        },
        required: ['org', 'username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_team_member',
      description: 'Add a user to a team. Confirm first.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
          team_slug: { type: 'string', description: 'Team slug' },
          username: { type: 'string', description: 'GitHub username' },
        },
        required: ['org', 'team_slug', 'username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_team_member',
      description: 'Remove a user from a team. Confirm first.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
          team_slug: { type: 'string', description: 'Team slug' },
          username: { type: 'string', description: 'GitHub username' },
        },
        required: ['org', 'team_slug', 'username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_copilot_seat',
      description: 'Assign a GitHub Copilot seat to a user. Confirm first.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
          username: { type: 'string', description: 'GitHub username' },
        },
        required: ['org', 'username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_copilot_seat',
      description: 'Remove a GitHub Copilot seat from a user. Confirm first.',
      parameters: {
        type: 'object',
        properties: {
          org: { type: 'string', description: 'Organization login' },
          username: { type: 'string', description: 'GitHub username' },
        },
        required: ['org', 'username'],
      },
    },
  },
  /* ---------- Read: Repo Review & Search ---------- */
  {
    type: 'function',
    function: {
      name: 'get_repo_details',
      description:
        'Get detailed information about a repository: description, language, topics, stars, forks, issues, license, visibility, and more. Always include the html_url link in your response.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner (user or org)' },
          repo: { type: 'string', description: 'Repository name' },
        },
        required: ['owner', 'repo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_repo_readme',
      description:
        'Get the README content of a repository. Use this to understand what a repo does, its setup instructions, architecture, or dependencies.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner (user or org)' },
          repo: { type: 'string', description: 'Repository name' },
        },
        required: ['owner', 'repo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_repo_languages',
      description:
        'Get the programming languages used in a repository and their byte counts.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner (user or org)' },
          repo: { type: 'string', description: 'Repository name' },
        },
        required: ['owner', 'repo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_repositories',
      description:
        'Search for repositories by keyword/topic. Can search within a specific org or globally. Returns matching repos with name, description, language, stars, and link. Always include the html_url link for each result.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (keywords, topic, technology, etc.)' },
          org: { type: 'string', description: 'Optional: limit search to this organization' },
        },
        required: ['query'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'update_repo_visibility',
      description:
        'Change a repository between public and private. This can have major implications — ALWAYS confirm first.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          visibility: {
            type: 'string',
            enum: ['public', 'private'],
            description: 'Desired visibility',
          },
        },
        required: ['owner', 'repo', 'visibility'],
      },
    },
  },
];

module.exports = { TOOL_DEFINITIONS, isMutating, MUTATING_TOOLS };
