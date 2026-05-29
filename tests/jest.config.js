module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js', '<rootDir>/tests/unit/**/*.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js', '<rootDir>/tests/integration/**/*.js'],
      testEnvironment: 'node',
      testTimeout: 30000
    },
    {
      displayName: 'adversarial',
      testMatch: ['<rootDir>/tests/adversarial/**/*.test.js', '<rootDir>/tests/adversarial/**/*.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'load',
      testMatch: ['<rootDir>/tests/load/**/*.test.js', '<rootDir>/tests/load/**/*.js'],
      testEnvironment: 'node',
      testTimeout: 120000
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js', '<rootDir>/tests/e2e/**/*.js'],
      testEnvironment: 'node',
      testTimeout: 60000
    },
    {
      displayName: 'security',
      testMatch: ['<rootDir>/tests/security/**/*.test.js', '<rootDir>/tests/security/**/*.js'],
      testEnvironment: 'node'
    }
  ]
};
