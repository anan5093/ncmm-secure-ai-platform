# 🔐 NCMM Secure Intelligence Platform

> National Critical Mineral Mission (NCMM) secure RAG platform for classified intelligence workflows.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Required-47A248?logo=mongodb&logoColor=white)
![OPA](https://img.shields.io/badge/Open%20Policy%20Agent-Enabled-7B61FF)
![Local%20Dev](https://img.shields.io/badge/Mode-Local%20Developer%20Edition-blue)

**Hardware target:** 8GB RAM (local-dev profile)  
**Classification levels:** RESTRICTED (CL1) → COSMIC TOP SECRET (CL5)

---

## Table of Contents

- [What this project does](#what-this-project-does)
- [Why this project is useful](#why-this-project-is-useful)
- [System screenshots](#system-screenshots)
- [Architecture overview](#architecture-overview)
- [Getting started](#getting-started)
- [Usage examples](#usage-examples)
- [Running tests](#running-tests)
- [Developer utilities](#developer-utilities)
- [Security invariants](#security-invariants)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [License](#license)
- [Where to get help](#where-to-get-help)
- [Maintainers and contributors](#maintainers-and-contributors)

---

## What this project does

The NCMM Secure Intelligence Platform ingests classified mineral intelligence documents and provides secure, role-aware query responses using a Retrieval-Augmented Generation (RAG) pipeline.

It combines:
- **ABAC policy enforcement** (clearance, department, port isolation)
- **Hybrid retrieval** (FAISS + BM25 + RRF + Cross-Encoder)
- **Prompt-injection defense** (3-layer firewall)
- **Auditable secure access** through JWT-authenticated APIs and admin telemetry

---

## Why this project is useful

### Key features

- **Defense-in-depth security model** across auth, policy, retrieval, and prompt layers
- **Policy-driven access control** with Open Policy Agent (OPA)
- **High-relevance retrieval** using semantic + lexical ranking fusion
- **Operational visibility** with health, metrics, and admin APIs
- **Developer-friendly local setup** for constrained hardware

### Benefits for developers

- Ready-to-run local environment for secure AI experimentation
- Clear separation between backend, frontend, policies, scripts, and tests
- Seeded data and ABAC users for fast validation of role-based behavior

---

## System screenshots

### Secure Login & Mandate Vision
![Login Page](Docs/screenshots/login_page.png)

### Admin Dashboard — Telemetry & Metrics
![Admin Metrics](Docs/screenshots/admin_dashboard_metrics.png)

### Admin Dashboard — System Health
![Admin Health](Docs/screenshots/admin_dashboard_health.png)

### Admin Dashboard — Security Logs
![Admin Logs](Docs/screenshots/admin_dashboard_logs.png)

### Admin Dashboard — Secure Query Testing
![Admin Query](Docs/screenshots/admin_dashboard_query.png)

---

## Architecture overview

```text
User Query (React) → JWT Auth → OPA Pre-Filter → FAISS (k=50) + BM25 (k=50)
    → RRF Fusion (top-20) → Cross-Encoder (top-K) → Firewall (L1→L2→L3)
    → Mock LLM / Ollama → Response with Citations
```

**Five security layers:**
1. **JWT Middleware** — role-based bearer token validation
2. **OPA ABAC** — clearance + department + port policy enforcement
3. **Firewall L1** — Unicode normalization + control character stripping
4. **Firewall L2** — injection/jailbreak classifier + heuristics
5. **Firewall L3** — XML structured prompt vault with citation controls

---

## Getting started

### Prerequisites

| Requirement | Version | Check |
|---|---|---|
| Node.js | >= 20.0.0 | `node --version` |
| npm | >= 9.0.0 | `npm --version` |
| Docker + Docker Compose | Latest | `docker --version` |

### 1) Clone and install

```bash
git clone https://github.com/anan5093/ncmm-secure-ai-platform.git
cd ncmm-secure-ai-platform

npm install
cd backend && npm install && cd ..
cd frontend && npm install --legacy-peer-deps && cd ..
```

### 2) Configure environment

```bash
cp .env.example .env
```

Update `.env` as needed (JWT secret, MongoDB URI, OLLAMA URL).

### 3) Start infrastructure

```bash
docker-compose up -d
```

### 4) Initialize indexes + seed data

```bash
node scripts/setup/init_db_indexes.js
node scripts/seed/seed_abac_policies.js
node scripts/seed/run_seed_ingestion.js
```

### 5) Run services

In separate terminals:

```bash
cd backend && node src/server.js
```

```bash
cd backend && npm run mock-llm
```

```bash
cd frontend && npm run dev
```

### 6) Open the platform

| Service | URL |
|---|---|
| React UI | http://localhost:5173 |
| Express API | http://localhost:3000 |
| API health | http://localhost:3000/health |
| Prometheus metrics | http://localhost:3000/metrics |
| OPA health | http://localhost:8181/v1/health |

---

## Usage examples

### Test credentials

| Username | Password | Role | Clearance | Port |
|---|---|---|---|---|
| `r.sharma` | `vizag-inspector-pass-2025` | Port Inspector | CL2 | VIZAG |
| `a.mehta` | `jnpt-inspector-pass-2025` | Port Inspector | CL2 | JNPT |
| `p.krishnan` | `logistics-analyst-pass-2025` | Logistics Analyst | CL3 | — |
| `s.iyer` | `mission-director-pass-2025` | Mission Director | CL5 | — |
| `admin` | `sysadmin-pass-2025` | Sysadmin | CL1 | — |

### Login and query API

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"r.sharma","password":"vizag-inspector-pass-2025"}'
```

```bash
curl -s -X POST http://localhost:3000/api/v1/query \
  -H "Authorization: AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the current lithium carbonate stockpile level?"}'
```

---

## Running tests

Use the repository-level Jest config:

```bash
npx jest --config tests/jest.config.js
```

Useful subsets:

```bash
npx jest --testPathPattern="tests/unit" --config=tests/jest.config.js
npx jest --testPathPattern="tests/adversarial" --config=tests/jest.config.js
```

OPA policy tests:

```bash
docker run --rm -v "$PWD/policies:/policies" openpolicyagent/opa test /policies -v
```

---

## Developer utilities

Generate test JWT tokens:

```bash
node scripts/dev/generate_test_jwt.js --role ROLE_MISSION_DIRECTOR
node scripts/dev/generate_test_jwt.js --role ROLE_PORT_INSPECTOR --port JNPT
```

Quick health checks:

```bash
node scripts/dev/check_db_health.js
node scripts/dev/verify_faiss_index.js
```

---

## Security invariants

| Invariant | Enforcement |
|---|---|
| No CL5 data to CL<5 users | OPA pre-filter + post-retrieval controls |
| Port isolation between VIZAG/JNPT inspectors | OPA port-based ABAC rules |
| Sysadmin blocked from intelligence corpus | Explicit deny logic in policies |
| Prompt injection/jailbreak filtering | Firewall L1 + L2 + L3 chain |
| JWT kept out of localStorage | React auth state in memory |
| `/metrics` endpoint restricted | Localhost-only check in backend |

---

## Troubleshooting

| Problem | Action |
|---|---|
| MongoDB connection failed | Start dependencies with `docker-compose up -d` |
| OPA timeout | Verify OPA is healthy at `http://localhost:8181/v1/health` |
| LLM unavailable | Start mock server using `cd backend && npm run mock-llm` |
| FAISS index missing | Re-run `node scripts/seed/run_seed_ingestion.js` |

---

## Project structure

```text
ncmm-secure-ai-platform/
├── backend/                 # Express API, ingestion, retrieval, firewall, telemetry
├── frontend/                # React + Vite client (login/chat/admin)
├── policies/                # OPA Rego policies and tests
├── scripts/                 # setup, seeding, and dev utilities
├── tests/                   # unit, adversarial, security suites
├── Docs/                    # design, requirements, setup, and test reports
├── docker-compose.yml       # MongoDB + OPA stack
└── .env.example             # local environment template
```

---

## Documentation

- [Requirements](Docs/Requirements.md)
- [System Design](Docs/Design.md)
- [Task Backlog](Docs/Task.md)
- [Debug Session Log](Docs/DEBUG_SESSION.md)
- [Comprehensive Test Results](Docs/TEST_RESULTS_COMPREHENSIVE.md)
- [Query Test Results](Docs/QUERY_TEST_RESULTS.md)
- [No-Docker Setup Guide](Docs/SETUP_NO_DOCKER.md)

---

## License

This project is licensed under the MIT License. See the [MITLicense](MITLicense) file for details.

---

## Where to get help

- Open an issue in the repository for bugs, feature requests, or setup problems
- Review `Docs/SETUP_NO_DOCKER.md` if Docker is not viable on your machine
- Check `Docs/DEBUG_SESSION.md` and test result documents for known implementation history

---

## Maintainers and contributors

This project is maintained by the repository owner and contributors in `anan5093/ncmm-secure-ai-platform`.

Contributions are welcome via pull requests. Before submitting:
1. Keep changes scoped and security-aware
2. Run relevant tests locally
3. Update affected documentation when behavior changes

If your team uses additional contribution policies, add a `CONTRIBUTING.md` file and link it here.
