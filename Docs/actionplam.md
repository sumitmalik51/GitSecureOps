TODO: Infra + CI/CD for GitOps WebApp
1. Define Infrastructure

 Decide on resource group name (e.g., rg-gitsecureops-dev).

 Decide region (e.g., eastus).

 Create:

 Azure Static Web App (for React frontend).

 Azure Function App (for GitHub OAuth + APIs).

 Azure Storage Account (optional: logs, images, or state).

 Azure Key Vault (store GitHub Client Secret securely).

📌 Tools: You can use Bicep / ARM / Terraform.

2. Infrastructure as Code (IaC)

 Write a Bicep template (preferred since you’ve used it before) that provisions:

Static Web App

Function App

Key Vault + Secret injection

 Parametrize values (app name, GitHub secret, region).

 Test deployment with az deployment group create.

3. GitHub Action Workflow – CI/CD

 Create .github/workflows/deploy.yml.

 Add triggers:

on: push to main branch.

Optional: workflow_dispatch for manual runs.

 Job steps:

Checkout code

Login to Azure (using service principal)

Deploy infra via Bicep (if not exists / update)

Build React app (npm install && npm run build)

Deploy frontend to Static Web App

Deploy function (Azure Function API for GitHub OAuth)

4. GitHub Secrets

 update api to use these two creds to store gh app keys
 GH_WEB_APP
GH_WEB_APP_SECRET