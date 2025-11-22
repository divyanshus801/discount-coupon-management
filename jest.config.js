module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/tests/**',
  ],
  testMatch: ['**/*.test.js'],
  verbose: true,
};
