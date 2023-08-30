module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  watchman: false,
  moduleNameMapper: {
    '^@themeConfig$': '<rootDir>/themeConfig.js',
  },
}
