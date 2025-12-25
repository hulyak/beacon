#!/usr/bin/env node

/**
 * VoiceOps - ElevenLabs Integration Test
 * Tests the webhook integration between ElevenLabs and Cloud Functions
 * This test simulates ElevenLabs webhook calls and validates responses
 */

const https = require('https');
const http = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration
const config = {
  // These will be set to actual URLs after deployment
  functions: {
    analyzeRisks: process.env.ANALYZE_RISKS_URL || 'https://us-central1-your-project.cloudfunctions.net/voiceops-analyze-risks',
    runScenario: process.env.RUN_SCENARIO_URL || 'https://us-central1-your-project.cloudfunctions.net/voiceops-run-scenario',
    getAlerts: process.env.GET_ALERTS_URL || 'https://us-central1-your-project.cloudfunctions.net/voiceops-get-alerts'
  },
  timeout: 30000 // 30 seconds
};

// ElevenLabs webhook test scenarios
const testScenarios = [
  {
    name: 'Risk Analysis - Asia Logistics',
    function: 'analyzeRisks',
    payload: {
      region: 'asia',
      category: 'logistics'
    },
    expectedContent: ['risks', 'summary', 'riskLevel', '%', 'asia'],
    description: 'User asks: "What are the current logistics risks in Asia?"'
  },
  {
    name: 'Risk Analysis - Europe All Categories',
    function: 'analyzeRisks',
    payload: {
      region: 'europe',
      category: 'all'
    },
    expectedContent: ['risks', 'summary', 'riskLevel', 'europe'],
    description: 'User asks: "Show me all supply chain risks in Europe"'
  },
  {
    name: 'Risk Analysis - Global Overview',
    function: 'analyzeRisks',
    payload: {
      region: 'global'
    },
    expectedContent: ['risks', 'summary', 'riskLevel', 'global'],
    description: 'User asks: "What\'s the global supply chain situation?"'
  },
  {
    name: 'Scenario - Supplier Failure',
    function: 'runScenario',
    payload: {
      scenarioType: 'supplier_failure',
      region: 'asia',
      severity: 'moderate'
    },
    expectedContent: ['scenario', 'outcomes', 'recommendation', 'financialImpact', 'supplier'],
    description: 'User asks: "Run a supplier failure scenario in Asia"'
  },
  {
    name: 'Scenario - Port Closure',
    function: 'runScenario',
    payload: {
      scenarioType: 'port_closure',
      region: 'europe',
      severity: 'severe'
    },
    expectedContent: ['scenario', 'outcomes', 'recommendation', 'port', 'closure'],
    description: 'User asks: "What if a major European port closes?"'
  },
  {
    name: 'Scenario - Natural Disaster',
    function: 'runScenario',
    payload: {
      scenarioType: 'natural_disaster',
      region: 'asia',
      severity: 'catastrophic'
    },
    expectedContent: ['scenario', 'outcomes', 'recommendation', 'disaster', 'recovery'],
    description: 'User asks: "Simulate a major earthquake in Asia"'
  },
  {
    name: 'Alerts - Critical Priority',
    function: 'getAlerts',
    payload: {
      priority: 'critical',
      limit: 5
    },
    expectedContent: ['alerts', 'totalCount', 'criticalCount', 'critical'],
    description: 'User asks: "Show me critical alerts"'
  },
  {
    name: 'Alerts - High Priority Asia',
    function: 'getAlerts',
    payload: {
      priority: 'high',
      limit: 10,
      region: 'asia'
    },
    expectedContent: ['alerts', 'totalCount', 'high', 'asia'],
    description: 'User asks: "What are the high priority issues in Asia?"'
  },
  {
    name: 'Alerts - All Regions',
    function: 'getAlerts',
    payload: {
      priority: 'all',
      limit: 20
    },
    expectedContent: ['alerts', 'totalCount'],
    description: 'User asks: "Give me an overview of all current alerts"'
  }
];

// Error handling test scenarios
const errorScenarios = [
  {
    name: 'Invalid Region',
    function: 'analyzeRisks',
    payload: {
      region: 'invalid_region'
    },
    expectedStatus: 400,
    description: 'Test error handling for invalid region'
  },
  {
    name: 'Invalid Scenario Type',
    function: 'runScenario',
    payload: {
      scenarioType: 'invalid_scenario'
    },
    expectedStatus: 400,
    description: 'Test error handling for invalid scenario type'
  },
  {
    name: 'Missing Required Field',
    function: 'analyzeRisks',
    payload: {},
    expectedStatus: 400,
    description: 'Test error handling for missing required fields'
  }
];

/**
 * Make HTTP request to Cloud Function
 */
function makeRequest(url, payload, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'ElevenLabs-Webhook/1.0',
        'Origin': 'https://api.elevenlabs.io'
      },
      timeout: timeout
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Test health endpoints
 */
async function testHealthEndpoints() {
  log('blue', '\n🏥 Testing Health Endpoints');
  log('blue', '============================');

  const healthTests = [
    { name: 'Risk Analysis Health', url: config.functions.analyzeRisks + '-health' },
    { name: 'Run Scenario Health', url: config.functions.runScenario + '-health' },
    { name: 'Get Alerts Health', url: config.functions.getAlerts + '-health' }
  ];

  let passed = 0;
  
  for (const test of healthTests) {
    try {
      const response = await makeRequest(test.url, {}, 10000);
      
      if (response.statusCode === 200) {
        log('green', `✅ ${test.name}: Healthy`);
        passed++;
      } else {
        log('red', `❌ ${test.name}: HTTP ${response.statusCode}`);
      }
    } catch (error) {
      log('red', `❌ ${test.name}: ${error.message}`);
    }
  }

  return passed;
}

/**
 * Test ElevenLabs webhook scenarios
 */
async function testWebhookScenarios() {
  log('blue', '\n🎤 Testing ElevenLabs Webhook Scenarios');
  log('blue', '=======================================');

  let passed = 0;
  
  for (const scenario of testScenarios) {
    try {
      log('yellow', `\n🧪 ${scenario.name}`);
      log('blue', `   Description: ${scenario.description}`);
      log('blue', `   Payload: ${JSON.stringify(scenario.payload, null, 2)}`);
      
      const url = config.functions[scenario.function];
      const startTime = Date.now();
      
      const response = await makeRequest(url, scenario.payload);
      const duration = Date.now() - startTime;
      
      // Check status code
      if (response.statusCode === 200) {
        log('green', `   ✅ HTTP Status: ${response.statusCode} (${duration}ms)`);
        
        // Check response content
        const responseStr = JSON.stringify(response.body).toLowerCase();
        const missingContent = scenario.expectedContent.filter(
          content => !responseStr.includes(content.toLowerCase())
        );
        
        if (missingContent.length === 0) {
          log('green', `   ✅ Response Content: All expected fields present`);
          
          // Check response length (should be concise for voice)
          if (response.body.summary && response.body.summary.length < 500) {
            log('green', `   ✅ Response Length: Appropriate for voice (${response.body.summary.length} chars)`);
          } else if (response.body.recommendation && response.body.recommendation.length < 500) {
            log('green', `   ✅ Response Length: Appropriate for voice (${response.body.recommendation.length} chars)`);
          }
          
          passed++;
        } else {
          log('red', `   ❌ Missing Content: ${missingContent.join(', ')}`);
        }
        
        // Show sample response
        if (response.body.summary) {
          log('cyan', `   📝 Sample Summary: "${response.body.summary.substring(0, 100)}..."`);
        } else if (response.body.recommendation) {
          log('cyan', `   📝 Sample Recommendation: "${response.body.recommendation.substring(0, 100)}..."`);
        }
        
      } else {
        log('red', `   ❌ HTTP Status: ${response.statusCode}`);
        log('red', `   Error: ${JSON.stringify(response.body, null, 2)}`);
      }
      
    } catch (error) {
      log('red', `   ❌ Request Failed: ${error.message}`);
    }
  }

  return passed;
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  log('blue', '\n🚨 Testing Error Handling');
  log('blue', '=========================');

  let passed = 0;
  
  for (const scenario of errorScenarios) {
    try {
      log('yellow', `\n🧪 ${scenario.name}`);
      log('blue', `   Description: ${scenario.description}`);
      
      const url = config.functions[scenario.function];
      const response = await makeRequest(url, scenario.payload);
      
      if (response.statusCode === scenario.expectedStatus) {
        log('green', `   ✅ Expected Error: HTTP ${response.statusCode}`);
        passed++;
      } else {
        log('red', `   ❌ Unexpected Status: HTTP ${response.statusCode} (expected ${scenario.expectedStatus})`);
      }
      
    } catch (error) {
      log('red', `   ❌ Request Failed: ${error.message}`);
    }
  }

  return passed;
}

/**
 * Test CORS configuration
 */
async function testCORS() {
  log('blue', '\n🌐 Testing CORS Configuration');
  log('blue', '=============================');

  try {
    // Test OPTIONS request (CORS preflight)
    const url = new URL(config.functions.analyzeRisks);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://api.elevenlabs.io',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        if (res.statusCode === 204 || res.statusCode === 200) {
          log('green', '✅ CORS: Preflight request successful');
          resolve(1);
        } else {
          log('red', `❌ CORS: Preflight failed (HTTP ${res.statusCode})`);
          resolve(0);
        }
      });

      req.on('error', (error) => {
        log('red', `❌ CORS: ${error.message}`);
        resolve(0);
      });

      req.end();
    });
    
  } catch (error) {
    log('red', `❌ CORS Test Failed: ${error.message}`);
    return 0;
  }
}

/**
 * Generate ElevenLabs configuration
 */
function generateElevenLabsConfig() {
  log('blue', '\n⚙️  ElevenLabs Configuration');
  log('blue', '============================');

  const tools = [
    {
      name: 'analyze_risks',
      description: 'Analyze supply chain risks for a specific region or category',
      webhook: config.functions.analyzeRisks,
      parameters: {
        type: 'object',
        properties: {
          region: {
            type: 'string',
            enum: ['asia', 'europe', 'north_america', 'south_america', 'global'],
            description: 'Geographic region to analyze'
          },
          category: {
            type: 'string',
            enum: ['logistics', 'supplier', 'geopolitical', 'weather', 'demand', 'all'],
            description: 'Risk category to focus on'
          }
        },
        required: ['region']
      }
    },
    {
      name: 'run_scenario',
      description: 'Run what-if scenario simulations',
      webhook: config.functions.runScenario,
      parameters: {
        type: 'object',
        properties: {
          scenarioType: {
            type: 'string',
            enum: ['supplier_failure', 'port_closure', 'demand_surge', 'natural_disaster', 'transportation_disruption'],
            description: 'Type of scenario to simulate'
          },
          region: {
            type: 'string',
            enum: ['asia', 'europe', 'north_america', 'south_america'],
            description: 'Region where scenario occurs'
          },
          severity: {
            type: 'string',
            enum: ['minor', 'moderate', 'severe', 'catastrophic'],
            description: 'Severity level of the scenario'
          }
        },
        required: ['scenarioType']
      }
    },
    {
      name: 'get_alerts',
      description: 'Get active supply chain alerts and notifications',
      webhook: config.functions.getAlerts,
      parameters: {
        type: 'object',
        properties: {
          priority: {
            type: 'string',
            enum: ['all', 'high', 'critical'],
            description: 'Filter alerts by priority level'
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 20,
            description: 'Maximum number of alerts to return'
          },
          region: {
            type: 'string',
            enum: ['asia', 'europe', 'north_america', 'south_america'],
            description: 'Filter alerts by geographic region'
          }
        }
      }
    }
  ];

  log('green', '📋 ElevenLabs Tools Configuration:');
  console.log(JSON.stringify(tools, null, 2));

  return tools;
}

/**
 * Main test runner
 */
async function runIntegrationTest() {
  log('cyan', '🚀 VoiceOps ElevenLabs Integration Test');
  log('cyan', '======================================\n');

  log('blue', '📋 Configuration:');
  console.log(`  Risk Analysis: ${config.functions.analyzeRisks}`);
  console.log(`  Run Scenario: ${config.functions.runScenario}`);
  console.log(`  Get Alerts: ${config.functions.getAlerts}`);
  console.log(`  Timeout: ${config.timeout}ms\n`);

  let totalPassed = 0;
  let totalTests = 0;

  // Test health endpoints
  const healthPassed = await testHealthEndpoints();
  totalPassed += healthPassed;
  totalTests += 3;

  // Test webhook scenarios
  const webhookPassed = await testWebhookScenarios();
  totalPassed += webhookPassed;
  totalTests += testScenarios.length;

  // Test error handling
  const errorPassed = await testErrorHandling();
  totalPassed += errorPassed;
  totalTests += errorScenarios.length;

  // Test CORS
  const corsPassed = await testCORS();
  totalPassed += corsPassed;
  totalTests += 1;

  // Generate configuration
  generateElevenLabsConfig();

  // Summary
  log('cyan', '\n📊 Integration Test Results');
  log('cyan', '===========================');
  log('green', `✅ Passed: ${totalPassed}/${totalTests}`);
  
  const successRate = Math.round((totalPassed / totalTests) * 100);
  
  if (successRate >= 90) {
    log('green', '🎉 Integration test passed! ElevenLabs integration is ready.');
  } else if (successRate >= 70) {
    log('yellow', '⚠️  Integration test partially passed. Some issues need attention.');
  } else {
    log('red', '❌ Integration test failed. Multiple issues need to be resolved.');
  }

  log('blue', '\n🎯 Next Steps:');
  console.log('1. Deploy Cloud Functions if not already deployed');
  console.log('2. Update function URLs in this test script');
  console.log('3. Configure ElevenLabs agent with the generated tool configuration');
  console.log('4. Test voice interactions with sample phrases');
  console.log('5. Verify responses are concise and actionable');

  return successRate >= 90;
}

// Run the test if called directly
if (require.main === module) {
  runIntegrationTest().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log('red', `Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runIntegrationTest, makeRequest, testScenarios };