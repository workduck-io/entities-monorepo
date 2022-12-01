module.exports = {
  displayName: 'gpt3Prompt',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/stacks/gpt3Prompt',
};
