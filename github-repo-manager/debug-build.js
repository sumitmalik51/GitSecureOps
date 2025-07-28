#!/usr/bin/env node

// Build verification script
console.log('🔧 Build Environment Check...\n');

console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);

// Check if crypto.hash is available
try {
  const crypto = require('crypto');
  if (typeof crypto.hash === 'function') {
    console.log('✅ crypto.hash is available');
  } else {
    console.log('❌ crypto.hash is NOT available');
    console.log('Available crypto methods:', Object.getOwnPropertyNames(crypto).filter(name => typeof crypto[name] === 'function'));
  }
} catch (error) {
  console.log('❌ Crypto module error:', error.message);
}

// Check Vite availability
try {
  const viteVersion = require('vite/package.json').version;
  console.log('✅ Vite version:', viteVersion);
} catch (error) {
  console.log('❌ Vite not found:', error.message);
}

// Check environment variables
console.log('\n🌍 Environment Variables:');
const envVars = ['VITE_GITHUB_CLIENT_ID', 'VITE_GITHUB_REDIRECT_URI', 'NODE_OPTIONS'];
envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✅ Set' : '❌ Not set'}`);
});

console.log('\n📦 Package.json scripts:');
try {
  const pkg = require('./package.json');
  Object.entries(pkg.scripts || {}).forEach(([name, script]) => {
    console.log(`  ${name}: ${script}`);
  });
} catch (error) {
  console.log('❌ Could not read package.json');
}
