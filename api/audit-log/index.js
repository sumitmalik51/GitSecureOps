/**
 * Azure Function: Audit Log API
 * POST /api/audit-log — store an audit entry
 * GET  /api/audit-log — retrieve entries with optional filters (?action=login&limit=50)
 *
 * Uses in-memory store (resets on function cold start).
 * For production, swap with Azure Table Storage or Cosmos DB.
 */

// In-memory store (per function instance)
const auditStore = [];
const MAX_ENTRIES = 5000;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

module.exports = async function (context, req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    if (req.method === 'POST') {
      // Store a new audit entry
      const body = req.body;
      if (!body || !body.action || !body.actor) {
        context.res = {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Missing required fields: action, actor',
          }),
        };
        return;
      }

      const entry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: body.action,
        actor: body.actor,
        target: body.target || null,
        org: body.org || null,
        repo: body.repo || null,
        status: body.status || 'success',
        details: body.details || {},
      };

      auditStore.unshift(entry);
      if (auditStore.length > MAX_ENTRIES) {
        auditStore.length = MAX_ENTRIES;
      }

      context.log(`Audit log: ${entry.action} by ${entry.actor}`);

      context.res = {
        status: 201,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, entry }),
      };
    } else {
      // GET — return entries with optional filters
      const query = req.query || {};
      let entries = [...auditStore];

      if (query.action) {
        entries = entries.filter((e) => e.action === query.action);
      }
      if (query.actor) {
        entries = entries.filter((e) =>
          e.actor.toLowerCase().includes(query.actor.toLowerCase())
        );
      }
      if (query.org) {
        entries = entries.filter((e) => e.org === query.org);
      }
      if (query.status) {
        entries = entries.filter((e) => e.status === query.status);
      }

      const limit = parseInt(query.limit) || 100;
      const offset = parseInt(query.offset) || 0;
      const paged = entries.slice(offset, offset + limit);

      context.res = {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          total: entries.length,
          limit,
          offset,
          entries: paged,
        }),
      };
    }
  } catch (error) {
    context.log.error('Audit log error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
