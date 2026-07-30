module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  transformIgnorePatterns: ['/node_modules/(?!(lit|@lit|lit-html|lit-element)/)']
};
