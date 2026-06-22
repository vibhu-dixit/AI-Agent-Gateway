# AI Agent Gateway (Backend) — Phase 1

## Project Overview & Strategic Importance

In multi-agent architectures and autonomous swarm networks, specialized AI agents make independent downstream API decisions. Without centralized mediation, individual agent instances can quickly drain organizational capital through unmonitored runtime loops, execution errors, or malicious vector injection. 

This project implements an **AI Agent Gateway**—a critical infrastructure abstraction layer placed directly in front of internal agent platforms. It serves as a strict security proxy, rate-limiter, and budget monitor. By intercepting all inbound prompts, the gateway decouples agent runtime code from resource orchestration, verifying credentials and enforcing strict hard-budget limits *before* any language model computation occurs.

## Tech Stack
* **Framework:** NestJS (TypeScript)
* **ORM:** Prisma
* **Database:** PostgreSQL
* **Runtime:** Node.js

---

## Getting Started

### 1. Environment Configuration
Ensure your `backend/.env` contains your active PostgreSQL connection string:
```env
DATABASE_URL="postgresql://gateway_admin:gateway_secret_password@localhost:5432/ai_gateway?schema=public"
```
### 2. Dependency & Prisma Client Initialization
Install required dependencies and generate your database client using the legacy peer dependency configuration to bypass conflicting test library dependencies:
```
npm install --legacy-peer-deps
npx prisma generate
```
### 3. Visualizing & Seeding Data
To browse the database schema, add test API keys, or map organizational budget parameters, spin up Prisma Studio:
```
npx prisma studio
```
## Verification & Testing
Once your gateway dev server is running (`npm run start:dev`), validate the custom guardrails using the following curl operations in a bash terminal:
### Test 1: Enforce Header Check (Expected: `401 Unauthorized`)
```
curl -X POST http://localhost:3000/v1/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Agent!"}'
```
### Test 2: Invalidate Malicious / Untrusted Hash (Expected: `401 Unauthorized`)
```
curl -X POST http://localhost:3000/v1/agent/chat \
  -H "X-API-Key: gw_invalid_key_here" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Agent!"}'
```
### Test 3: Standard Flow Validation (Expected: `201 Success`)
Using a verified, active test key string linked to an organization with remaining budget:
```
curl -X POST http://localhost:3000/v1/agent/chat \
  -H "X-API-Key: gw_clean_test_key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Agent!"}'
```
### Troubleshooting
Error: `MODULE_NOT_FOUND` / `Cannot find module '.../dist/main'`
If your build fails immediately after a successful watch compilation with a stack trace indicating that Node cannot locate the compiled entry point:
```
node:internal/modules/cjs/loader:1503
  throw err;
  ^
Error: Cannot find module 'C:\Projects\AI-Agent-Gateway\backend\dist\main'
  code: 'MODULE_NOT_FOUND'
```
This occurs due to aggressive incremental cache strategies or a nested compiler directory fallback mirroring structure mismatch when external tsconfig targets compile outside your root directory.

### Resolution
Execute this sequence in PowerShell to explicitly drop all compiler metadata, wipe cached directories, and force a pristine build target graph:
```
Remove-Item -Force .\tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item -Force .\tsconfig.build.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\dist -ErrorAction SilentlyContinue
npm run start:dev
```