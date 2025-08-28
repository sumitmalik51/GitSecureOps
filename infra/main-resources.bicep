@description('The environment name')
param environmentName string

@description('The Azure region where resources will be deployed')
param location string

@description('The resource token for unique naming')
param resourceToken string

@description('The resource prefix')
param resourcePrefix string

@description('GitHub Client ID for OAuth')
param githubClientId string

@description('GitHub Client Secret for OAuth (secure)')
@secure()
param githubClientSecret string = ''

@description('GitHub Redirect URI for OAuth')
param githubRedirectUri string

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'log-${resourcePrefix}-${resourceToken}'
  location: location
  tags: {
    'azd-env-name': environmentName
  }
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Azure Key Vault for secure storage of secrets
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${resourcePrefix}-${resourceToken}'
  location: location
  tags: {
    'azd-env-name': environmentName
  }
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    enabledForDeployment: false
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    accessPolicies: []
  }
}

// User-assigned managed identity
resource userIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${resourcePrefix}-${resourceToken}'
  location: location
  tags: {
    'azd-env-name': environmentName
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'ai-${resourcePrefix}-${resourceToken}'
  location: location
  kind: 'web'
  tags: {
    'azd-env-name': environmentName
  }
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// Storage Account for Azure Functions
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'st${resourcePrefix}func${resourceToken}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  tags: {
    'azd-env-name': environmentName
  }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

// App Service Plan for Azure Functions
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'plan-${resourcePrefix}-${resourceToken}'
  location: location
  tags: {
    'azd-env-name': environmentName
  }
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: false
  }
}

// Function App for GitHub OAuth API
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: 'func-${resourcePrefix}-${resourceToken}'
  location: location
  kind: 'functionapp'
  tags: {
    'azd-env-name': environmentName
    'azd-service-name': 'gitsecureops-api'
  }
  identity: {
    type: 'SystemAssigned, UserAssigned'
    userAssignedIdentities: {
      '${userIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      cors: {
        allowedOrigins: [
          'https://${staticWebApp.properties.defaultHostname}'
          'http://localhost:4280'
        ]
        supportCredentials: true
      }
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      nodeVersion: '~20'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'GH_WEB_APP'
          value: githubClientId
        }
        {
          name: 'GH_WEB_APP_SECRET'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=github-client-secret)'
        }
        {
          name: 'FRONTEND_URL'
          value: 'https://${staticWebApp.properties.defaultHostname}'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
      ]
    }
  }
}

// Store GitHub Client Secret in Key Vault
resource githubClientSecretKv 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: 'github-client-secret'
  parent: keyVault
  properties: {
    value: githubClientSecret
  }
}

// Key Vault access policy for Function App (both system and user assigned identities)
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  name: 'add'
  parent: keyVault
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: functionApp.identity.principalId
        permissions: {
          secrets: [
            'get'
          ]
        }
      }
      {
        tenantId: subscription().tenantId
        objectId: userIdentity.properties.principalId
        permissions: {
          secrets: [
            'get'
          ]
        }
      }
    ]
  }
}

// Diagnostic settings for Function App
resource functionAppDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'functionapp-diagnostics-${resourceToken}'
  scope: functionApp
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        category: 'FunctionAppLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

// Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: 'swa-${resourcePrefix}-${resourceToken}'
  location: location
  tags: {
    'azd-env-name': environmentName
    'azd-service-name': 'gitsecureops-web'
  }
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: false
      appBuildCommand: 'npm run build'
      outputLocation: 'dist'
      appLocation: '/'
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

// Configure Static Web App settings
resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2022-09-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    REACT_APP_GITHUB_CLIENT_ID: githubClientId
    REACT_APP_GITHUB_REDIRECT_URI: githubRedirectUri
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
  }
}

// Outputs
output STATICWEBAPP_URL string = staticWebApp.properties.defaultHostname
output STATICWEBAPP_NAME string = staticWebApp.name
output FUNCTIONAPP_NAME string = functionApp.name
output APPLICATION_INSIGHTS_CONNECTION_STRING string = appInsights.properties.ConnectionString
output APPLICATION_INSIGHTS_INSTRUMENTATION_KEY string = appInsights.properties.InstrumentationKey
