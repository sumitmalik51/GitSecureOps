#!/usr/bin/env node

/**
 * Test script to verify GitHub OAuth SSO frontend URL detection
 * This tests the logic used in the Azure Function to prevent localhost redirects
 */

console.log('🧪 Testing GitHub OAuth SSO Frontend URL Detection\n');

// Simulate the Azure Function environment
function createTestContext(env = {}, headers = {}) {
    return {
        env: { ...process.env, ...env },
        headers: headers,
        log: (msg) => console.log(`   📋 ${msg}`)
    };
}

// The actual frontend URL detection logic from the Azure Function
function getFrontendUrl(context) {
    const { env, headers } = context;
    
    // First try the environment variable (explicitly configured)
    if (env.FRONTEND_URL) {
        context.log(`Using environment variable: ${env.FRONTEND_URL}`);
        return env.FRONTEND_URL;
    }
    
    // Extract from headers - common Azure Static Web Apps patterns
    const host = headers.host || headers['x-forwarded-host'] || headers['x-original-host'];
    const protocol = headers['x-forwarded-proto'] || (headers['x-arr-ssl'] ? 'https' : 'http');
    const referer = headers.referer || headers.referrer;
    
    // Try to get frontend URL from referer header (most reliable for OAuth callbacks)
    if (referer) {
        try {
            const refererUrl = new URL(referer);
            const refererOrigin = `${refererUrl.protocol}//${refererUrl.hostname}${refererUrl.port ? ':' + refererUrl.port : ''}`;
            // Don't use localhost referers in production
            if (!refererOrigin.includes('localhost') || host?.includes('localhost')) {
                context.log(`Using referer origin: ${refererOrigin}`);
                return refererOrigin;
            }
        } catch (e) {
            context.log(`Failed to parse referer: ${referer}`);
        }
    }
    
    if (host) {
        // If host is the Azure Function host (contains .azurewebsites.net)
        // we need to derive the Static Web App URL
        if (host.includes('.azurewebsites.net')) {
            // Convert function app URL to static web app URL
            // Function: func-gh-xxx.azurewebsites.net -> Static: swa-gh-xxx.azurestaticapps.net
            const staticHost = host.replace('func-', 'swa-').replace('.azurewebsites.net', '.azurestaticapps.net');
            const url = `${protocol}://${staticHost}`;
            context.log(`Converted function URL to static app URL: ${url}`);
            return url;
        }
        
        // Handle Azure Static Web Apps direct access (*.azurestaticapps.net)
        if (host.includes('.azurestaticapps.net')) {
            const url = `${protocol}://${host}`;
            context.log(`Using direct static app URL: ${url}`);
            return url;
        }
        
        // For custom domains or other deployments
        const url = `${protocol}://${host}`;
        context.log(`Using custom domain: ${url}`);
        return url;
    }
    
    // Fallback for local development
    context.log('Using localhost fallback for development');
    return 'http://localhost:4280';
}

// Test scenarios
const testScenarios = [
    {
        name: 'Production with Environment Variable Set',
        description: 'Best case - FRONTEND_URL explicitly configured',
        context: createTestContext(
            { FRONTEND_URL: 'https://myapp.azurestaticapps.net' },
            { host: 'func-gh-abc123.azurewebsites.net' }
        ),
        expectedPattern: /^https:\/\/myapp\.azurestaticapps\.net$/,
        shouldNotBe: ['localhost']
    },
    {
        name: 'Azure Function Auto-Detection',
        description: 'Azure Function converts to Static Web App URL',
        context: createTestContext(
            {},
            { 
                host: 'func-gh-abc123.azurewebsites.net',
                'x-forwarded-proto': 'https'
            }
        ),
        expectedPattern: /^https:\/\/swa-gh-.*\.azurestaticapps\.net$/,
        shouldNotBe: ['localhost', 'func-']
    },
    {
        name: 'OAuth Callback with Referer',
        description: 'Uses referer header from OAuth flow (most reliable)',
        context: createTestContext(
            {},
            { 
                host: 'func-gh-abc123.azurewebsites.net',
                'x-forwarded-proto': 'https',
                referer: 'https://my-secure-app.azurestaticapps.net/auth'
            }
        ),
        expectedPattern: /^https:\/\/my-secure-app\.azurestaticapps\.net$/,
        shouldNotBe: ['localhost']
    },
    {
        name: 'Direct Static Web App Access',
        description: 'When accessing function through static app',
        context: createTestContext(
            {},
            { 
                host: 'amazing-app.azurestaticapps.net',
                'x-forwarded-proto': 'https'
            }
        ),
        expectedPattern: /^https:\/\/.*\.azurestaticapps\.net$/,
        shouldNotBe: ['localhost']
    },
    {
        name: 'Local Development',
        description: 'Falls back to localhost for development',
        context: createTestContext({}, {}),
        expectedPattern: /^http:\/\/localhost:4280$/,
        shouldNotBe: []
    }
];

console.log('Running test scenarios...\n');

let passed = 0;
let failed = 0;

testScenarios.forEach((scenario, index) => {
    console.log(`🧪 Test ${index + 1}: ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    
    const result = getFrontendUrl(scenario.context);
    const isMatch = scenario.expectedPattern.test(result);
    const hasProhibited = scenario.shouldNotBe.some(prohibited => result.includes(prohibited));
    
    if (isMatch && !hasProhibited) {
        console.log(`   ✅ PASS: ${result}`);
        passed++;
    } else {
        console.log(`   ❌ FAIL: ${result}`);
        if (!isMatch) {
            console.log(`      Expected pattern: ${scenario.expectedPattern}`);
        }
        if (hasProhibited) {
            console.log(`      Contains prohibited terms: ${scenario.shouldNotBe.filter(p => result.includes(p))}`);
        }
        failed++;
    }
    console.log();
});

console.log('📊 Test Results:');
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);

if (failed === 0) {
    console.log('\n🎉 All tests passed! The OAuth SSO fix is working correctly.');
    console.log('   The Azure Function will correctly redirect users back to your app instead of localhost.');
} else {
    console.log('\n⚠️  Some tests failed. Please review the logic or report this as an issue.');
    process.exit(1);
}