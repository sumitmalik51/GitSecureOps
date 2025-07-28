#!/usr/bin/env node

// Configuration checker for Azure Static Web App deployment
// Run with: node check-config.js

console.log('🔍 Checking Azure Static Web App deployment configuration...\n');

const fs = require('fs');
const path = require('path');

// Check if required files exist
const requiredFiles = [
  '.github/workflows/azure-static-web-apps.yml',
  'package.json',
  'vite.config.ts'
];

let allFilesExist = true;

console.log('📁 Required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('');

// Check package.json scripts
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['build', 'dev'];
  
  console.log('📦 Package.json scripts:');
  requiredScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    console.log(`   ${exists ? '✅' : '❌'} ${script}: ${exists || 'missing'}`);
  });
  console.log('');
}

// Check environment variables in workflow
if (fs.existsSync('.github/workflows/azure-static-web-apps.yml')) {
  const workflow = fs.readFileSync('.github/workflows/azure-static-web-apps.yml', 'utf8');
  const requiredSecrets = [
    'AZURE_STATIC_WEB_APPS_API_TOKEN_YELLOW_PEBBLE_03A66440F',
    'VITE_GITHUB_CLIENT_ID',
    'VITE_GITHUB_REDIRECT_URI'
  ];
  
  console.log('🔐 GitHub workflow secrets referenced:');
  requiredSecrets.forEach(secret => {
    const referenced = workflow.includes(`secrets.${secret}`);
    console.log(`   ${referenced ? '✅' : '❌'} ${secret}`);
  });
  console.log('');
}

// Summary
console.log('📋 Next steps:');
console.log('   1. Get deployment token from Azure Portal → Static Web Apps → Manage deployment token');
console.log('   2. Add GitHub repository secrets (see AZURE_SETUP.md)');
console.log('   3. Update GitHub OAuth app callback URL');
console.log('   4. Push code to trigger deployment');
console.log('');

if (allFilesExist) {
  console.log('✅ Configuration files are ready for deployment!');
} else {
  console.log('❌ Some required files are missing. Please check the setup.');
}

console.log('\n📖 For detailed setup instructions, see: AZURE_SETUP.md');
