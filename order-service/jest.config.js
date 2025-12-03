module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Test Report - Review Module',
        outputPath: './test-reports/test-report.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
        theme: 'darkTheme',
        dateFormat: 'yyyy-mm-dd HH:MM:ss',
        sort: 'status',
        executionTimeWarningThreshold: 5,
        useCssFile: false,
        includeObsoleteSnapshots: true,
        customScriptPath: null,
      }
    ]
  ],
  coverageReporters: ['html', 'text', 'lcov', 'json-summary']
};
