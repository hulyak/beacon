// Jest setup file for VoiceOps AI integration tests

// Mock Next.js environment variables
process.env.NODE_ENV = 'test';

// Mock Google Cloud Functions Framework
jest.mock('@google-cloud/functions-framework', () => ({
  http: jest.fn((name, handler) => {
    // Store the handler for potential testing
    global.__mockHandlers = global.__mockHandlers || {};
    global.__mockHandlers[name] = handler;
    return handler;
  })
}));

// Mock console methods to reduce test noise
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
});

afterAll(() => {
  // Restore original console
  global.console = originalConsole;
});

// Global test utilities
global.testUtils = {
  // Helper to create mock requests
  createMockRequest: (body, headers = {}) => {
    return {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body),
      json: async () => body,
      get: (header) => headers[header.toLowerCase()] || null
    };
  },

  // Helper to create mock responses
  createMockResponse: () => {
    const response = {
      statusCode: 200,
      headers: {},
      body: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      },
      set: function(header, value) {
        this.headers[header] = value;
        return this;
      },
      send: function(data) {
        this.body = data;
        return this;
      }
    };
    return response;
  },

  // Helper to validate response schemas
  validateResponseSchema: (response, schema) => {
    const validation = schema.safeParse(response);
    if (!validation.success) {
      console.error('Schema validation failed:', validation.error.issues);
      return false;
    }
    return true;
  },

  // Helper to generate test scenarios
  generateTestScenarios: () => ({
    basic: [
      { scenarioType: 'supplier_failure', region: 'asia', severity: 'moderate' },
      { scenarioType: 'port_closure', region: 'europe', severity: 'severe' },
      { scenarioType: 'natural_disaster', region: 'north_america', severity: 'catastrophic' }
    ],
    edge: [
      { scenarioType: 'demand_surge', region: 'global', severity: 'minor' },
      { scenarioType: 'transportation_disruption', region: 'south_america', severity: 'severe' }
    ],
    invalid: [
      { scenarioType: 'invalid_type', region: 'asia', severity: 'moderate' },
      { scenarioType: 'supplier_failure', region: 'invalid_region', severity: 'moderate' },
      { scenarioType: 'supplier_failure', region: 'asia', severity: 'invalid_severity' }
    ]
  })
};

// Extend Jest matchers for better assertions
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveValidTimestamp(received) {
    const timestamp = new Date(received);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const pass = timestamp instanceof Date && 
                 !isNaN(timestamp.getTime()) && 
                 timestamp <= now && 
                 timestamp >= fiveMinutesAgo;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid recent timestamp`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid recent timestamp`,
        pass: false,
      };
    }
  },

  toHaveFinancialConsistency(received) {
    const { directCosts, opportunityCosts, laborCosts, materialCosts, logisticsCosts, totalImpact } = received;
    const calculatedTotal = directCosts + opportunityCosts + laborCosts + materialCosts + logisticsCosts;
    const pass = Math.abs(calculatedTotal - totalImpact) < 0.01; // Allow for floating point precision
    
    if (pass) {
      return {
        message: () => `expected financial impact to be inconsistent`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected total impact ${totalImpact} to equal sum of components ${calculatedTotal}`,
        pass: false,
      };
    }
  }
});

// Mock fetch for external API calls if needed
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  })
);

// Setup test database or external service mocks if needed
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
});

// Cleanup after each test
afterEach(() => {
  // Clean up any test artifacts
  jest.restoreAllMocks();
});