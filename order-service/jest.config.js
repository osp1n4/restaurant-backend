module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/app.ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  coverageReporters: ['html', 'text', 'lcov', 'json'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Reporte de Pruebas Unitarias - Dashboard Analíticas',
        outputPath: './reporte-tests-unitarios.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
        theme: 'defaultTheme',
        logo: '',
        executionTimeWarningThreshold: 5,
        dateFormat: 'dd/mm/yyyy HH:MM:ss',
        sort: 'status'
      }
    ]
  ]
};

