# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Infra Control** — NestJS 11 backend API for infrastructure management (servers, VMs, rooms, UPS). Built with TypeORM + PostgreSQL, JWT + 2FA auth, and real-time WebSocket support via Socket.io.

## Commands

```bash
pnpm install              # install dependencies
pnpm start:dev            # dev server with hot reload (nest start --watch)
pnpm dev                  # alternative dev with ts-node-dev

pnpm build                # compile to dist/
pnpm start:prod           # run compiled production build

pnpm test                           # run all unit tests
pnpm test -- src/modules/auth       # run tests for a specific module
pnpm test -- src/modules/auth/__tests__/auth.controller.spec.ts  # single file
pnpm test:watch                     # watch mode
pnpm test:cov                       # coverage (global threshold: 80%)
pnpm test:cov -- src/modules/auth   # coverage for one module
pnpm test:e2e                       # e2e tests (test/jest-e2e.json config)

pnpm lint                 # lint + auto-fix
pnpm format               # prettier + eslint fix

pnpm migration:generate   # generate TypeORM migration (uses ts-node + dotenv)
pnpm migration:run:dev    # run migrations in dev (ts-node)
pnpm migration:run        # run migrations against compiled dist/
```

API is available at `http://localhost:3000`. Swagger docs at `http://localhost:3000/docs`.

## Architecture

### DDD / Feature-First Structure

Every module under `src/modules/` follows a strict three-layer DDD layout:

```
src/modules/<feature>/
├── application/
│   ├── controllers/      # HTTP entry points, route guards, Swagger decorators
│   ├── dto/              # Request/response DTOs (class-validator)
│   ├── use-cases/        # One class per use case, exported via index.ts array
│   ├── services/         # Application-layer services (e.g. TokenService)
│   ├── listeners/        # EventEmitter2 event handlers
│   ├── schedulers/       # @nestjs/schedule cron jobs
│   └── gateway/          # WebSocket gateways (Socket.io)
├── domain/
│   ├── entities/         # TypeORM entities (source of truth for DB schema)
│   ├── interfaces/       # Repository interfaces / domain contracts
│   ├── services/         # Domain services (pure business logic, no HTTP)
│   └── exceptions/       # Domain-specific exceptions
├── infrastructure/
│   ├── repositories/     # TypeORM repository implementations
│   ├── strategies/       # Passport strategies (JWT)
│   └── guards/           # Infrastructure-level guards
└── <feature>.module.ts
```

### Core Layer (`src/core/`)

Cross-cutting concerns shared across all modules:

- `config/` — TypeORM config, data-source (used by CLI), environment validation
- `guards/` — `JwtAuthGuard`, `RolesGuard`, `PermissionGuard`, rate-limit guards (base + variants for auth/sensitive/API/dashboard routes)
- `interceptors/` — Logging, response transformation
- `filters/` — Global exception filters
- `decorators/` — `@Roles()`, `@RequirePermissions()`, custom param decorators
- `services/` — `EncryptionService` (AES for sensitive DB fields), `PythonExecutorService` (shells out to `ups_manager` scripts), `YamlConfigService`

### Key Modules

| Module | Purpose |
|---|---|
| `auth` | JWT login/register, 2FA (Speakeasy + QRCode), refresh tokens, password reset via email |
| `users` | User CRUD, role assignment, permission management |
| `roles` / `permissions` | RBAC — roles have permissions, users have roles |
| `vmware` | Core VMware integration: connects to vCenter via `PythonExecutorService`, VM discovery (WebSocket), live migration orchestration |
| `servers` / `vms` / `ilos` | Infra entities with TypeORM persistence; iLO = HP iLO management interfaces |
| `ups` | UPS battery monitoring, SNMP integration |
| `dashboard` | Modular dashboard widget configuration per user |
| `presence` | Real-time user presence via Socket.io gateway |
| `redis` | Shared Redis client (ioredis via `@liaoliaots/nestjs-redis`) — used for caching, rate limiting, migration event queues |
| `email` | Transactional emails via Nodemailer + Handlebars templates (`src/modules/email/infrastructure/templates/*.hbs`) |
| `audit` / `history` | Audit trail and action history logging |
| `releases` | Fetches GitHub release info for front + back repos via `GITHUB_TOKEN` |
| `prometheus` | Exposes `/metrics` endpoint via `prom-client` |

### VMware / Python Bridge

`PythonExecutorService` shells out to the `ups_manager` Python project to perform VMware operations. The `vmware` module orchestrates discovery sessions and migration plans, communicating progress to the frontend via WebSocket gateways (`VmwareDiscoveryGateway`, `MigrationGateway`).

### Authentication Flow

1. `POST /auth/login` → returns `accessToken` or `{ requiresTwoFactor: true, twoFactorToken }` if 2FA is enabled
2. `POST /auth/2fa/verify` with `twoFactorToken` → returns full `accessToken`
3. All protected routes require `JwtAuthGuard` (global) + optional `RolesGuard` / `PermissionGuard`
4. Access tokens are short-lived (15m); refresh token rotates via `POST /auth/refresh` (httpOnly cookie)

### Path Aliases

Configured in `tsconfig.json` and Jest `moduleNameMapper`:

- `@/` → `src/`
- `@core/` → `src/core/`
- `@modules/` → `src/modules/`

### Testing Conventions

- Unit tests live alongside source as `*.spec.ts` inside `__tests__/` folders
- Reusable mock factories are in `__mocks__/` (e.g. `createMockUser.ts`)
- DTOs are tested for class-validator constraints in their own `__tests__/` subfolder
- Jest coverage excludes: entities, modules, migrations, repositories, providers, index files (see `package.json` `collectCoverageFrom`)

### Monitoring

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001` (admin/admin)
- Metrics endpoint: `http://localhost:3000/metrics`
- Grafana dashboards and datasource config are in `grafana/`

## Environment

Copy `.env-example` to `.env`. Key variables:

- `ENCRYPTION_KEY` — 32-char hex string for AES encryption of sensitive DB fields
- `GITHUB_TOKEN` — required for the `releases` module to fetch release data
- `REDIS_TLS=true` — Redis requires TLS in production (Raspberry Pi native install)
- In production, PostgreSQL and Redis run natively on Raspberry Pi (not Docker)
