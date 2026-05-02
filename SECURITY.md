# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |

## Reporting a Vulnerability

**Please do NOT open a public issue for security vulnerabilities.**

If you discover a security vulnerability in KalGuard, please report it responsibly:

1. **Email**: Send details to **security@kalguard.dev**
2. **GitHub Security Advisory**: [Create a private advisory](https://github.com/AKsHaT123456A/kalguard/security/advisories/new)

### What to include

- Description of the vulnerability
- Steps to reproduce
- Affected package(s) and version(s)
- Potential impact assessment
- Suggested fix (if any)

### Response Timeline

| Stage                | Timeline     |
| -------------------- | ------------ |
| Acknowledgement      | 48 hours     |
| Initial assessment   | 5 business days |
| Fix development      | 14 business days |
| Public disclosure     | After fix is released |

### Scope

The following are in scope for security reports:

- **@kalguard/core** — Policy engine bypass, prompt firewall evasion, token validation flaws
- **@kalguard/sdk** — Authentication bypass, credential leakage
- **@kalguard/sidecar** — HTTP server vulnerabilities, sandbox escape, audit log tampering
- **kalguard** — Any re-export that masks a vulnerability

### Out of Scope

- Vulnerabilities in dependencies (report upstream; we will update promptly)
- Denial-of-service attacks against local development servers
- Social engineering attacks

## Security Design Principles

KalGuard is built with these security-first principles:

1. **Fail Closed** — All errors result in deny decisions
2. **Zero Trust for Agents** — Agents are untrusted by default
3. **Least Privilege** — Capability-scoped tokens with short TTLs
4. **Defense in Depth** — Policy + prompt firewall + tool mediation + audit
5. **No Raw Error Exposure** — Structured SecurityResponse objects only

## Acknowledgments

We gratefully acknowledge security researchers who responsibly disclose vulnerabilities. Contributors will be credited in release notes (with permission).
