module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1'
  },
  rootDir: 'src',
  testMatch: ['<rootDir>/modules/email/**/*.spec.ts'],
  collectCoverageFrom: [
    'modules/email/**/*.ts',
    '!modules/email/**/*.spec.ts',
    '!modules/email/**/*.module.ts',
    '!modules/email/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageDirectory: '../coverage/email',
};