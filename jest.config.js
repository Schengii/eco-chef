module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/platforms/', '/plugins/'],
  transformIgnorePatterns: ['/node_modules/(?!(lit|@lit|lit-html|lit-element)/)'],
  collectCoverageFrom: [
    'ui-src/services/**/*.ts',
    'ui-src/controllers/**/*.ts',
    'ui-src/models/**/*.ts',
    'api/**/*.ts',
    '!**/*.spec.ts',
    '!**/*.d.ts'
  ],
  coverageThreshold: {
    global: { statements: 65, branches: 58, functions: 62, lines: 65 }
  }
};
