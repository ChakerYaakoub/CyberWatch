# CyberWatch

## External Attack Surface Monitoring Platform

![CyberWatch](https://img.shields.io/badge/Project-CyberWatch-blue)
![React](https://img.shields.io/badge/Frontend-React%20TypeScript-61DAFB)
![Go](https://img.shields.io/badge/API-Go-00ADD8)
![Keycloak](https://img.shields.io/badge/Auth-Keycloak-red)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)

# Project overview

CyberWatch is a simplified **External Attack Surface Monitoring** platform inspired by products such as [AlgoSecure AlgoLightHouse](https://www.algosecure.fr/conseil/algolighthouse/).

It provides a full-stack application to:

- manage monitored companies
- launch external security scans
- detect publicly exposed weaknesses
- calculate a risk score
- display results on a security dashboard

# Current status

| Area | Status |
|------|--------|
| React frontend (dashboard, companies, scans) | **Done** |
| Go REST API + PostgreSQL | **Done** |
| Keycloak IAM (hosted Cloud-IAM) | **Done** |
| Python scanner worker (FastAPI `/scan`) | **Done** |
| RabbitMQ async jobs | Planned |
| Redis / Elasticsearch / Docker / CI | Planned |

# Business context

Companies expose domains, websites, APIs, and public services on the Internet.

CyberWatch helps analysts answer:

> What is publicly exposed, and what is a potential security risk?

# Architecture

Solid lines = **working today**. Dashed lines = **planned**.

```mermaid
flowchart TB
  User["User<br/>ADMIN or ANALYST"]

  subgraph Client["Frontend — Done"]
    FE["React app<br/>Chakra · Vite · oidc-client-ts"]
  end

  subgraph IdP["Identity — Done"]
    KC["Keycloak Cloud-IAM<br/>clients: cyberwatch-frontend · cyberwatch-api<br/>roles: ADMIN · ANALYST"]
  end

  subgraph APILayer["Backend — Done"]
    API["Go API :8080<br/>Gin · JWT · RBAC"]
    DB[("PostgreSQL<br/>companies · scans · vulnerabilities")]
  end

  subgraph Scanner["Scanner — Done"]
    Worker["Python worker :8001<br/>FastAPI · DNS · HTTP · headers · tech · ports · risk"]
  end

  subgraph Future["Async jobs — Planned"]
    MQ[["RabbitMQ<br/>scan_jobs"]]
  end

  User -->|"opens UI"| FE
  FE -->|"1. OIDC login / logout"| KC
  KC -->|"tokens"| FE
  FE -->|"2. REST /api/* + Bearer JWT"| API
  API -->|"3. verify JWT (JWKS)"| KC
  API -->|"4. CRUD / queries"| DB
  API -.->|"5. POST /scan (dev)"| Worker
  API -.->|"6. publish job"| MQ
  MQ -.->|"7. consume"| Worker
  Worker -->|"8. findings JSON"| API
```

### How pieces relate (today)

| From | To | Relation |
|------|-----|----------|
| User | React | Uses dashboard / companies / scans |
| React | Keycloak | Login via OIDC + PKCE (`cyberwatch-frontend`) |
| React | Go API | Authenticated REST calls with access token |
| Go API | Keycloak | Validates JWT signature using realm JWKS |
| Go API | PostgreSQL | Stores companies, scans, vulnerabilities |
| Go API | User roles | `ADMIN` / `ANALYST` enforce write permissions |
| Python worker | — | Standalone `POST /scan` passive engine (RabbitMQ later) |

### Auth flow

```mermaid
sequenceDiagram
  actor User
  participant FE as React
  participant KC as Keycloak
  participant API as Go API
  participant DB as PostgreSQL

  User->>FE: Open app
  FE->>KC: Redirect login (OIDC + PKCE)
  User->>KC: Authenticate
  KC->>FE: Redirect /auth/callback + tokens
  FE->>API: GET/POST /api/... Authorization Bearer
  API->>API: Validate JWT (JWKS) + check role
  API->>DB: Query / write
  DB->>API: Data
  API->>FE: JSON { data } or error
```

### Planned async scan flow

Worker is ready today via HTTP. RabbitMQ replaces the direct call in the next phase.

```mermaid
flowchart LR
  FE[React: Start scan] --> API[Go API]
  API -.->|dev: HTTP| W[Python worker POST /scan]
  API -.->|next: queue| MQ[RabbitMQ]
  MQ -.-> W
  W -->|JSON findings| API
  API --> DB[(PostgreSQL)]
  DB --> FE2[Dashboard / scan details]
```

# Technology stack

## Frontend (`frontend/`)

- React · TypeScript · Vite · Chakra UI
- React Router · TanStack Query · Axios · Recharts
- oidc-client-ts (no local login page)
- UI: AlgoSecure-inspired green / navy · light & dark mode

**Pages:** Dashboard · Companies · Scan details · `/auth/callback` · `/silent-renew`

## Backend (`backend-api/`)

- Go · Gin · GORM · PostgreSQL
- JWT via Keycloak JWKS
- RBAC middleware on `/api/*` (`GET /health` is public)

## Scanner worker (`worker/`)

- Python 3.12+ · FastAPI · Uvicorn · Pydantic
- Passive checks: DNS · HTTP · security headers · technologies · common ports · risk score
- `POST /scan` — see [`worker/README.md`](worker/README.md)

## Authentication (Keycloak)

| Role | Can do |
|------|--------|
| `ADMIN` | Create / update / delete companies · view all · create scans |
| `ANALYST` | View dashboard / companies / scans · create scans |

Setup: [`docs/KEYCLOAK.md`](docs/KEYCLOAK.md)

## Planned

| Component | Role |
|-----------|------|
| RabbitMQ | Async `scan_jobs` (replace direct HTTP to worker) |
| Redis | Cache dashboard / scan status |
| Elasticsearch | Worker logs / events |

# Database

```mermaid
erDiagram
  COMPANY ||--o{ SCAN : "has many"
  SCAN ||--o{ VULNERABILITY : "has many"

  COMPANY {
    uint id PK
    string name
    string domain UK
  }

  SCAN {
    uint id PK
    uint company_id FK
    string status
    int risk_score
  }

  VULNERABILITY {
    uint id PK
    uint scan_id FK
    string title
    string severity
  }
```

One **company** has many **scans**. One **scan** has many **vulnerabilities**.

**Scan status:** `PENDING` · `RUNNING` · `COMPLETED` · `FAILED`  
**Severity:** `LOW` · `MEDIUM` · `HIGH` · `CRITICAL`

# Project structure

```text
CyberWatch/
├── frontend/           # React UI + OIDC
├── backend-api/        # Go REST API + JWT/RBAC
├── worker/             # Python passive scanner (FastAPI)
├── docs/               # Keycloak setup
├── infrastructure/     # Planned — Docker
├── DEVELOPMENT_PLAN.md
└── README.md
```
# Getting started

**Need:** Node.js, Go, PostgreSQL, Cloud-IAM Keycloak ([guide](docs/KEYCLOAK.md))

```powershell
# API
cd backend-api
copy .env.example .env   # DATABASE_* + KEYCLOAK_*
go mod tidy
go run ./cmd/server      # http://localhost:8080/health

# UI
cd frontend
copy .env.example .env   # VITE_API_URL + VITE_KEYCLOAK_*
npm install
npm run dev              # http://localhost:5173 → Keycloak
```

More detail: [`backend-api/README.md`](backend-api/README.md) · [`frontend/README.md`](frontend/README.md)

# Development order

| # | Phase | Status |
|---|-------|--------|
| 1 | React dashboard | **Done** |
| 2 | Go API + PostgreSQL | **Done** |
| 3 | Keycloak OIDC + JWT RBAC | **Done** |
| 4 | Python scanner worker | **Done** |
| 5 | RabbitMQ | Next |
| 6–9 | Redis · ES · Docker · CI/CD | Planned |

Full checklist: [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md)

# Security rules

- No secrets in source — use `.env`
- Validate API inputs
- Protect `/api/*` with JWT + roles
- Passwords live in Keycloak only

# Project objective

Show the ability to build a secure full-stack cybersecurity monitoring platform with a distributed architecture close to real products — inspired by AlgoSecure AlgoLightHouse.
