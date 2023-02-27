const alias = process.env.SASS_ALIAS;
const legacyOnly = alias && alias < 'sass-1.45';

module.exports = {
    testEnvironment: 'jest-environment-node-single-context',
    setupFilesAfterEnv: ['./test/sass-mock.js'],
    testPathIgnorePatterns: [
        '/node_modules/',
        ...( legacyOnly ? ['/index.test.js', '/sass-functions.test.js'] : [])
    ]
};
