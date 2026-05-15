/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
      },
      moduleNameMapper: {
        '^next/navigation$': '<rootDir>/__mocks__/next-navigation.ts',
        '^next/image$': '<rootDir>/__mocks__/next-image.tsx',
        '^next/link$': '<rootDir>/__mocks__/next-link.tsx',
        '^.+/lib/api$': '<rootDir>/__mocks__/api.ts',
        '^.+/store/auth\\.store$': '<rootDir>/__mocks__/auth.store.ts',
        '^.+/lib/tokens$': '<rootDir>/__mocks__/tokens.ts',
      },
    },
    {
      displayName: 'middleware',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/middleware.test.ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
    },
  ],
};
