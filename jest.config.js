module.exports = {
  testEnvironment: "node",
  testTimeout: 60000,
  rootDir: ".",
  testMatch: [
    "**/tests/unit/test_*.js",
    "**/tests/adversarial/test_*.js",
    "**/tests/security/test_*.js",
    "**/tests/integration/test_*.js",
    "**/tests/load/test_*.js",
    "**/tests/e2e/test_*.js",
  ],
  testPathIgnorePatterns: ["/node_modules/"],
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/test_*.js"],
      testEnvironment: "node",
      testTimeout: 60000,
    },
    {
      displayName: "adversarial",
      testMatch: ["<rootDir>/tests/adversarial/test_*.js"],
      testEnvironment: "node",
      testTimeout: 60000,
    },
    {
      displayName: "security",
      testMatch: ["<rootDir>/tests/security/test_*.js"],
      testEnvironment: "node",
      testTimeout: 60000,
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/tests/integration/test_*.js"],
      testEnvironment: "node",
      testTimeout: 120000,
    },
    {
      displayName: "load",
      testMatch: ["<rootDir>/tests/load/test_*.js"],
      testEnvironment: "node",
      testTimeout: 180000,
    },
    {
      displayName: "e2e",
      testMatch: ["<rootDir>/tests/e2e/test_*.js"],
      testEnvironment: "node",
      testTimeout: 120000,
    },
  ],
};
