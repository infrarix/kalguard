# Contributing to KalGuard

Thank you for your interest in contributing to **KalGuard** — the open-source AI Agent Runtime Security Platform. Every contribution matters, whether it's a bug report, feature request, documentation fix, or code change.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Branching Strategy](#branching-strategy)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Code Style & Formatting](#code-style--formatting)
- [Testing](#testing)
- [Release Process](#release-process)
- [Security Vulnerabilities](#security-vulnerabilities)
- [License](#license)

## Code of Conduct

This project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to **security@kalguard.dev**.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/kalguard.git
   cd kalguard
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Build all packages**:
   ```bash
   pnpm build
   ```
5. **Run tests**:
   ```bash
   pnpm test
   ```

## Development Setup

### Prerequisites

| Tool   | Version  |
| ------ | -------- |
| Node.js | ≥ 20.0.0 |
| pnpm   | ≥ 9.x    |

### Monorepo Structure

```
packages/
  core/       → @kalguard/core     (policy engine, prompt firewall, agent identity, tool mediator)
  sdk/        → @kalguard/sdk      (lightweight client & secure wrappers)
  sidecar/    → @kalguard/sidecar  (HTTP sidecar server, sandbox, OS enforcement)
  aarsp/      → kalguard           (umbrella re-export package)
```

### Useful Commands

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `pnpm build`             | Build all packages                       |
| `pnpm test`              | Run all tests                            |
| `pnpm test:coverage`     | Run tests with coverage report           |
| `pnpm format`            | Format all files with Prettier           |
| `pnpm format:check`      | Check formatting without modifying files |
| `pnpm changeset`         | Create a changeset for your changes      |
| `pnpm clean`             | Remove all build artifacts & node_modules |

## How to Contribute

### Reporting Bugs

Use the [Bug Report](https://github.com/AKsHaT123456A/kalguard/issues/new?template=bug_report.yml) issue template. Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)

### Requesting Features

Use the [Feature Request](https://github.com/AKsHaT123456A/kalguard/issues/new?template=feature_request.yml) template. Describe:

- The problem the feature would solve
- Your proposed solution
- Any alternatives you've considered

### Submitting Code

1. Create a branch from `main` following our [branching strategy](#branching-strategy).
2. Make your changes with tests.
3. Ensure all tests pass: `pnpm test`
4. Ensure code is formatted: `pnpm format:check`
5. Create a changeset: `pnpm changeset`
6. Push and open a Pull Request.

## Branching Strategy

### Branch Types

| Prefix       | Purpose                                     |
| ------------ | ------------------------------------------- |
| `main`       | Production-ready code; protected             |
| `feature/*`  | New features                                 |
| `fix/*`      | Bug fixes                                    |
| `hotfix/*`   | Critical production fixes                    |
| `docs/*`     | Documentation changes                        |
| `refactor/*` | Code refactoring without behavior change     |
| `chore/*`    | Maintenance tasks, dependency updates        |

### Naming Convention

```
<type>/<issue-id>-<short-description>
```

**Examples:**
- `feature/42-add-rate-limit-config`
- `fix/105-token-expiry-check`
- `docs/88-update-deployment-guide`

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) enforced by **commitlint** and **husky**.

### Format

```
type(scope): subject
```

### Types

| Type       | Description                    | Version Bump |
| ---------- | ------------------------------ | ------------ |
| `feat`     | New feature                    | Minor        |
| `fix`      | Bug fix                        | Patch        |
| `perf`     | Performance improvement        | Patch        |
| `docs`     | Documentation only             | None         |
| `style`    | Formatting, no code change     | None         |
| `refactor` | Code change, no new feature    | None         |
| `test`     | Adding or updating tests       | None         |
| `chore`    | Build process, tooling, deps   | None         |
| `ci`       | CI/CD configuration            | None         |

### Scopes

Scopes must match a package or area in the monorepo:

| Scope      | Description                         |
| ---------- | ----------------------------------- |
| `core`     | `@kalguard/core` package            |
| `sdk`      | `@kalguard/sdk` package             |
| `sidecar`  | `@kalguard/sidecar` package         |
| `kalguard` | `kalguard` umbrella package         |
| `docs`     | Documentation & Docusaurus site     |
| `release`  | Release-related changes             |
| `deps`     | Dependency updates                  |
| `ci`       | CI/CD workflows                     |
| `repo`     | Repository-level config & tooling   |

### Examples

```bash
feat(core): add wildcard matching to policy engine
fix(sidecar): handle malformed JSON in request body
docs(sdk): add usage examples to README
chore(deps): bump jsonwebtoken to 9.0.4
test(core): add edge-case tests for prompt firewall
ci(repo): add CodeQL security scanning workflow
```

### Breaking Changes

Append `!` after the scope and include `BREAKING CHANGE:` in the commit body:

```
feat(core)!: redesign PolicyEngine API

BREAKING CHANGE: PolicyEngine.evaluate() now requires a PolicyContext
instead of separate parameters.
```

Breaking changes trigger a **major** version bump.

## Pull Request Process

1. Fill out the PR template completely.
2. Link the related issue(s).
3. Ensure CI passes (build, tests, format check, commitlint).
4. Request review from at least one maintainer.
5. Address review feedback promptly.
6. Squash-merge into `main` after approval.

### PR Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Code is formatted (`pnpm format:check`)
- [ ] Changeset created (`pnpm changeset`)
- [ ] Documentation updated if needed
- [ ] No security vulnerabilities introduced

## Code Style & Formatting

- **Prettier** formats all code automatically. Configuration is in [`.prettierrc`](.prettierrc).
- **lint-staged** + **husky** run Prettier on every commit.
- TypeScript strict mode is enabled across all packages.

### Key Conventions

- Use `const` by default; `let` only when mutation is required.
- Prefer `readonly` on interfaces and type members.
- Fail closed: security-critical code must default to deny on error.
- Never expose raw errors to agents — always return structured `SecurityResponse`.
- Use `.js` extensions in ESM imports (TypeScript resolves `.ts` → `.js`).

## Testing

- All packages use **Jest** with `ts-jest` (ESM preset).
- Test files live in `packages/<name>/test/**/*.test.ts`.
- Coverage thresholds: **70%** minimum for branches, functions, lines, and statements.

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run a specific test file
NODE_OPTIONS=--experimental-vm-modules npx jest packages/core/test/policy/engine.test.ts
```

### Writing Tests

- Test each public function and exported class.
- Include positive, negative, and edge-case scenarios.
- Security tests: verify fail-closed behavior, injection detection, and auth enforcement.

## Release Process

KalGuard uses [Changesets](https://github.com/changesets/changesets) for versioning and releases.

### Creating a Changeset

After making changes, run:

```bash
pnpm changeset
```

Follow the prompts to describe your change and select the affected packages.

### How Releases Work

1. PRs merged to `main` with changesets trigger the Release workflow.
2. A "Version Packages" PR is automatically created.
3. Merging the version PR publishes packages to npm and creates GitHub Releases.

### Manual Release

```bash
pnpm build
pnpm changeset:version
pnpm changeset:publish
```

## Security Vulnerabilities

**Do not open a public issue for security vulnerabilities.**

Please report security issues responsibly by emailing **security@kalguard.dev** or using [GitHub Security Advisories](https://github.com/AKsHaT123456A/kalguard/security/advisories/new).

See [SECURITY.md](SECURITY.md) for our full security policy.

## License

By contributing to KalGuard, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).

## Pull Request Guidelines

- Make sure your PR addresses an issue or feature request.
- Describe your PR and provide context in the description.
- Keep your PR focused on a single change to make reviewing easier.
- Ensure your code follows the project's coding style and conventions.

## Code of Conduct and Licensing

Please ensure your contributions adhere to the project's [Code of Conduct](./CODE_OF_CONDUCT.md) and are licensed under the project's [License](./LICENSE).

## Need Help?

If you need further clarification or help, feel free to reach out by creating an issue or directly contacting the maintainers.

Thank you for your interest in contributing to PIVOTHEAD! We appreciate your efforts in making this project better.

Happy contributing!
