/**
 * Jest Configuration
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'api/**/*.js',
    'validators/**/*.js',
    'sandbox/**/*.js',
    'storage/**/*.js',
    'config/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],

  // Coverage thresholds
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Force exit after tests complete
  forceExit: true
};
