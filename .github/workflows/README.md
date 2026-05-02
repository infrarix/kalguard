# GitHub Actions Workflows

This directory contains the CI/CD workflows for KalGuard.

## Workflows

### `release.yml` - CI & Release

Runs on every push to `main`:
1. **CI Job**: Build, test, format check
2. **Release Job**: Generate changesets, create release PRs, publish to npm

### `release-docs.yml` - Deploy Documentation

Deploys the Docusaurus site to GitHub Pages when changes are pushed to `main` in:
- `kalguard-docs/**`
- `docs/**`

## Required Secrets

To enable automatic release PR creation and npm publishing, configure these repository secrets:

### 1. `GH_PAT` (Required for releases)

**Purpose**: Allows the changesets action to create pull requests.

**Steps to create:**
1. Go to https://github.com/settings/tokens/new
2. **Token name**: `KalGuard Release Bot`
3. **Expiration**: No expiration (or 1 year + calendar reminder)
4. **Permissions**:
   - ✅ `repo` (full control of private repositories)
   - ✅ `workflow` (update GitHub Actions workflows)
5. Click **Generate token** and copy it
6. Go to repository settings → Secrets and variables → Actions
7. Click **New repository secret**
8. Name: `GH_PAT`
9. Value: Paste the token
10. Click **Add secret**

### 2. `NPM_TOKEN` (Required for publishing)

**Purpose**: Publishes packages to npm registry.

**Steps to create:**
1. Log in to https://www.npmjs.com/
2. Go to **Access Tokens** → **Generate New Token**
3. Select **Automation** (for CI/CD)
4. Copy the token
5. Add to repository secrets as `NPM_TOKEN`

## Troubleshooting

### Error: "GitHub Actions is not permitted to create or approve pull requests"

**Cause**: Missing or invalid `GH_PAT` secret.

**Solution**: 
1. Verify `GH_PAT` secret exists in repository settings
2. Ensure the token has `repo` and `workflow` permissions
3. Check token expiration date

### Error: "ELIFECYCLE Command failed with exit code 1" in tests

**Cause**: Missing test dependencies or outdated lockfile.

**Solution**:
1. Delete `pnpm-lock.yaml` and reinstall: `pnpm install`
2. Commit the updated lockfile

### Error: "baseUrl configuration" in docs deployment

**Cause**: Docusaurus `baseUrl` doesn't match GitHub Pages URL.

**Solution**: Ensure `kalguard-docs/docusaurus.config.ts` has:
```ts
url: 'https://infrarix.github.io',
baseUrl: '/kalguard/',
```

## Local Testing

Run the same checks that CI runs:

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Format check
pnpm format:check

# Build all packages
pnpm build

# Run tests with coverage
pnpm test:coverage
```
