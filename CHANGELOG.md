# Changelog

All notable changes to Lemon API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Secret scanning with Gitleaks (workflow + optional local hooks)
- Supply-chain hygiene with .npmrc and npm audit in CI
- PR template with security checklist
- Issue templates for bugs and feature requests
- Contributing guidelines

## [1.0.0] - 2025-12-28

### Added

- JWT-based authentication with access and refresh tokens
- Role-based access control (RBAC) with USER and ADMIN roles
- Token rotation and refresh mechanism
- Comprehensive audit logging for all operations
- Rate limiting on authentication endpoints
- Security headers (helmet middleware)
- CORS configuration
- PostgreSQL database with Prisma ORM
- RESTful API endpoints:
  - Authentication: register, login, refresh, logout
  - Items: CRUD operations with role-based access
  - Admin: user management endpoints
  - Me: current user profile and actions
- Comprehensive test suite with 39 security-focused tests
- GitHub Actions CI with automated testing
- CodeQL static analysis (SAST)
- Dependabot dependency scanning (SCA)
- Dependency Review for pull requests
- Security policy and vulnerability reporting process
- Professional documentation and security badges

### Security

- Password hashing with argon2
- Environment-based configuration
- Input validation with Zod schemas
- Error handling middleware with safe error responses
- Request ID tracking for audit trails
- Protected routes with JWT middleware
- Role-based authorization checks

[unreleased]: https://github.com/Qixpy/Lemon-api/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Qixpy/Lemon-api/releases/tag/v1.0.0
