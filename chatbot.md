GitSecureOps GitHub Search Chatbot – Documentation & Checklist
1. Project Overview

A chatbot integrated into your GitSecureOps frontend that allows logged-in users to query repositories for specific information. Examples:

“Give me all repos related to Azure Arc in organization X.”

“What is this file/function in repository Y?”

Key constraints:

No private repository data leaves your Azure environment.

Use Azure Functions + Graph API to fetch and process data internally.

Optional AI/LLM (like Azure OpenAI) is used only locally or with safe embeddings — no raw repo data sent out.

2. Architecture
Frontend (Static Web App)

Chat interface visible after GitHub login.

Sends user query to Function App via API call.

Environment variables:

VITE_FUNCTION_APP_URL – URL of Function App

VITE_GITHUB_CLIENT_ID – GitHub OAuth client ID

Backend (Azure Function App)

Receives chat queries.

Fetches repositories, files, or metadata using GitHub API (GraphQL or REST).

Optionally uses a local AI model to summarize or categorize results.

Returns results to frontend.

Optional AI Layer

Can be used for:

Summarizing code/files.

Classifying repos based on user query.

Autocomplete or suggestions.

Important: No private repo code is sent to Azure OpenAI; if using embeddings, store them internally.

3. Implementation Steps
Step 1: GitHub OAuth Integration

✅ Ensure user is authenticated.

✅ Use OAuth token to fetch repo info from Graph API.

✅ Store access token securely in function runtime (Azure Key Vault or Function App settings).

Step 2: Function App Setup

✅ Create function search-repos:

Input: Query string from frontend.

Output: List of repository links or files matching the query.

✅ Use GitHub REST/Graph API to fetch:

Repo names

File paths

Commit messages

✅ Optional: Implement filtering by org, topic, or language.

Step 3: Frontend Chat Interface

✅ Add a chat widget/modal visible after login.

✅ Send query to /api/search-repos.

✅ Display results with links, summaries, or file previews.

✅ Handle loading states & errors.

Step 4: Optional AI Processing

✅ Use Azure OpenAI on internal embeddings only.

✅ Generate summaries or insights.

✅ Ensure no raw code is sent outside your environment.

✅ Cache embeddings for repeated queries.

4. Security Considerations

✅ Do not expose OAuth tokens in frontend.

✅ Keep all private repo data within Azure Function.

✅ Log only metadata (repo names, counts) for monitoring.

✅ Use HTTPS for all API calls.

✅ Limit API usage by user role if needed.

5. Checklist Before Deployment
Task	Status
GitHub OAuth configured for dev/prod	☐
Azure Function App created	☐
Function search-repos implemented	☐
GitHub API access permissions verified	☐
Frontend chat component added	☐
API endpoint integration with frontend	☐
Optional AI processing added (internal only)	☐
Function App settings updated for OAuth	☐
Testing on dev environment	☐
Security review & token storage verified	☐
Deployment to prod	☐
6. Future Enhancements

Add autocomplete suggestions for queries.

Add filters by language, topics, or last updated.

Implement rate-limiting to protect GitHub API usage.

Add query history per user in a database for quick access.

Support multi-org search securely.