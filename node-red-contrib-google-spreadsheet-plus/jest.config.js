module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'lib/**/*.js',
        '!nodes/google-service-account.js',
        '!nodes/google-spreadsheet.js',
        '!lib/helpers.js',
        '!lib/errors/**',
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    coverageThreshold: {
        global: {
            branches: 85,
            functions: 95,
            lines: 95,
            statements: 95
        },
        './lib/': {
            branches: 90,
            functions: 95,
            lines: 95,
            statements: 95
        }
    },
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    verbose: true,
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/'
    ]
};
