module.exports = {
  collectCoverageFrom: [
    '<rootDir>/src/Components/**/*.{jsx, tsx}',
    '<rootDir>/src/App.{jsx, tsx}',
  ],
  coverageReporters: ['html', 'text', 'text-summary', 'cobertura'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/libs/@react-native-async-storage/async-storage.ts',
    '^@react-native-vector-icons/ionicons$': '<rootDir>/__mocks__/libs/@react-native-vector-icons/ionicons.tsx',
  },
  preset: 'react-native',
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/*.test.ts?(x)', '**/*.test.js?(x)'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native' +
    '|@react-native' +
    '|@react-native-community' +
    '|@react-navigation' +
    '|react-native-reanimated' +
    '|react-redux' +
    '|@react-native-async-storage' +
    '|@react-native-picker' +
    ')',
  ],
};
