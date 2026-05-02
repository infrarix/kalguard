/* eslint-disable no-undef */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['core', 'sdk', 'sidecar', 'kalguard', 'docs', 'release', 'deps', 'ci', 'repo']],
    'scope-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
  },
  ignores: [(message) => message.includes('[skip-commitlint]')],
};
