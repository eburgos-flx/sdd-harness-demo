/** @type {import('jest').Config} */
module.exports = {
  displayName: 'api',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@shared-types$': '<rootDir>/../../libs/shared-types/src/index.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/test/**/*.e2e-spec.ts',
  ],
  coverageDirectory: '../../coverage/apps/api',
};
