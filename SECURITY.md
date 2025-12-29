# Security Policy

## Supported Versions

We actively maintain and support the following versions:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in Lemon API, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security issues via:

- **GitHub Security Advisories**: Navigate to the [Security tab](../../security/advisories) and click "Report a vulnerability"
- This ensures the issue is handled privately until a fix is available

### What to Include

When reporting a vulnerability, please provide:

1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential impact and severity assessment
3. **Reproduction Steps**: Detailed steps to reproduce the issue
4. **Affected Versions**: Which versions are affected (e.g., main branch, specific commits)
5. **Proof of Concept**: Code snippets, screenshots, or logs demonstrating the issue
6. **Suggested Fix**: If you have suggestions for remediation (optional)

### Response Expectations

- **Acknowledgment**: We aim to acknowledge receipt within 48 hours
- **Updates**: We will provide status updates as we investigate
- **Timeline**: Best-effort basis; typical response within 7-14 days for initial assessment
- **Disclosure**: We follow coordinated disclosure practices and will work with you on a timeline

### Security Best Practices

When deploying Lemon API:

1. **Environment Variables**: Never commit `.env` files or expose secrets
2. **Database**: Use strong passwords and restrict network access
3. **HTTPS**: Always use TLS/HTTPS in production
4. **Updates**: Keep dependencies up to date (we use Dependabot)
5. **Access Control**: Follow principle of least privilege for database and API access
6. **Rate Limiting**: Configure appropriate rate limits for your use case
7. **Monitoring**: Enable audit logging and monitor for suspicious activity

### Security Automation

This project uses:

- **CodeQL** - Static Application Security Testing (SAST)
- **Dependabot** - Software Composition Analysis (SCA)
- **Dependency Review** - Blocks vulnerable dependencies in PRs
- **Automated Tests** - Security-focused test suite in CI

## Hall of Fame

We appreciate responsible disclosure. Contributors who report valid security issues will be acknowledged here (with their permission).

<!-- Security researchers who have helped improve Lemon API security will be listed here -->
