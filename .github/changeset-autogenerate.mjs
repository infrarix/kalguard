import { execSync } from 'child_process';
import fs from 'fs';

// Get the most recent commit message
const commitMessage = execSync('git log -1 --format=%s').toString().trim();

// Define valid scopes matching KalGuard monorepo packages
const validScopes = ['core', 'sdk', 'sidecar', 'kalguard'];

// Define regex patterns
const commitPatterns = {
  major: /^BREAKING CHANGE: (.+)/,
  minor: /^feat\(([^)]+)\): (.+)/,
  patch: /^fix\(([^)]+)\): (.+)/,
};

// Identify type, package, and description
let packageScope = null;
let changeType = null;
let description = null;

if (commitPatterns.major.test(commitMessage)) {
  changeType = 'major';
  description = commitMessage.match(commitPatterns.major)?.[1];
} else if (commitPatterns.minor.test(commitMessage)) {
  const scope = commitMessage.match(commitPatterns.minor)?.[1];
  if (validScopes.includes(scope)) {
    changeType = 'minor';
    packageScope = scope;
    description = commitMessage.match(commitPatterns.minor)?.[2];
  }
} else if (commitPatterns.patch.test(commitMessage)) {
  const scope = commitMessage.match(commitPatterns.patch)?.[1];
  if (validScopes.includes(scope)) {
    changeType = 'patch';
    packageScope = scope;
    description = commitMessage.match(commitPatterns.patch)?.[2];
  }
}

// Scope → npm package name mapping
const scopeToPackage = {
  core: 'kalguard-core',
  sdk: 'kalguard-sdk',
  sidecar: 'kalguard-sidecar',
  kalguard: 'kalguard',
};

// Generate and write changeset if valid package found
if (packageScope && scopeToPackage[packageScope]) {
  description = description?.trim() || 'No description provided.';
  const packageName = scopeToPackage[packageScope];

  const changesetContent = `---
'${packageName}': ${changeType}
---

${description}
`;

  fs.writeFileSync(`.changeset/auto-${Date.now()}.md`, changesetContent);
  console.log(`✅ Changeset file created for package: ${packageName}`);
} else {
  console.log('⚠️ No valid package scope found in commit message. Valid scopes are: ' + validScopes.join(', '));
}
