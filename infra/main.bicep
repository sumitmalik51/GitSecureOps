targetScope = 'subscription'

@description('The environment name')
param environmentName string

@description('The Azure region where resources will be deployed')
param location string = 'eastus'

@description('The resource group name')
param resourceGroupName string

@description('GitHub Client ID for OAuth')
param githubClientId string = ''

@description('GitHub Redirect URI for OAuth')
param githubRedirectUri string = ''

@description('GitHub Client Secret for OAuth')
@secure()
param githubClientSecret string = ''

// Generate a unique resource token
var resourceToken = uniqueString(subscription().id, location, environmentName)
var resourcePrefix = 'gh'

// Create resource group
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: resourceGroupName
  location: location
  tags: {
    'azd-env-name': environmentName
  }
}

// Deploy the main resources
module main 'main-resources.bicep' = {
  name: 'main-resources'
  scope: rg
  params: {
    environmentName: environmentName
    location: location
    resourceToken: resourceToken
    resourcePrefix: resourcePrefix
    githubClientId: githubClientId
    githubRedirectUri: githubRedirectUri
    githubClientSecret: githubClientSecret
  }
}

// Outputs
output RESOURCE_GROUP_ID string = rg.id
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output STATICWEBAPP_URL string = main.outputs.STATICWEBAPP_URL
output STATICWEBAPP_NAME string = main.outputs.STATICWEBAPP_NAME
