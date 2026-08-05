# CyberWatch Development Plan

## Goal

Build a small but realistic cybersecurity monitoring platform.

**Priorities:** functional app · clean architecture · security · demo quality

---

## Progress

| Phase | Topic | Status |
|-------|-------|--------|
| 1 | Frontend (React) | **Done** |
| 2 | Go API + PostgreSQL | **Done** |
| 3 | Keycloak IAM | **Done** |
| 4 | Python scanner worker | **Done** |
| 5 | RabbitMQ async pipeline | **Done** |
| 8 | Docker Compose | **Done** |
| 9 | Demo preparation | Planned |
| 10 | GitHub Actions (CI/CD) | Planned |
| 6 | Redis | Later |
| 7 | Elasticsearch | Later |

---

## System relations

```mermaid
flowchart TB
  User["User ADMIN / ANALYST"] --> FE[React frontend]
  FE -->|"OIDC"| KC[Keycloak]
  FE -->|"Bearer JWT"| API[Go API]
  API -->|"JWKS verify"| KC
  API --> DB[(PostgreSQL)]
  API -->|"SCAN_MODE=http"| WorkerHTTP[Worker POST /jobs]
  API -->|"SCAN_MODE=rabbitmq"| MQ[RabbitMQ scan_jobs]
  MQ --> WorkerRMQ[Worker consumer]
  WorkerHTTP --> DB
  WorkerRMQ --> DB
```

| Relation | Status |
|----------|--------|
| User → React → Keycloak → API → PostgreSQL | **Done** |
| Python `ScanService` + `POST /scan` | **Done** |
| Dual transport HTTP `/jobs` + RabbitMQ | **Done** |

---

## Phase 1–4 ✅

See earlier sections in git history / package READMEs.

- Frontend: [`frontend/README.md`](frontend/README.md)
- API: [`backend-api/README.md`](backend-api/README.md)
- Keycloak: [`docs/KEYCLOAK.md`](docs/KEYCLOAK.md)
- Worker scanners: [`worker/README.md`](worker/README.md)

---

## Phase 5 — RabbitMQ + dual mode ✅

**Do not remove HTTP.** Switch with env:

| `SCAN_MODE` | Behavior |
|-------------|----------|
| `http` (default) | Go publishes to `WORKER_URL/jobs` (async background) |
| `rabbitmq` | Go publishes to exchange `cyberwatch.scans` / queue `scan_jobs` |

**Flow:** `POST /api/scans` → create `PENDING` → publish job → `QUEUED` → **202 Accepted**  
Worker: `RUNNING` → `ScanService` → store vulns + score → `COMPLETED` / `FAILED`

**Retry:** 3 attempts → `scan_dead_letter`

**Frontend:** Scan details polls every 3s while `PENDING` / `QUEUED` / `RUNNING`

### Dev run (HTTP)

```powershell
# Worker
cd worker
uvicorn app.main:app --reload --port 8001

# API (.env): SCAN_MODE=http, WORKER_URL=http://localhost:8001
cd backend-api
go run ./cmd/server
```

### Async run (RabbitMQ)

```powershell
docker run -d --name cyberwatch-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Worker consumer
cd worker
python -m app.consumer

# API (.env): SCAN_MODE=rabbitmq, RABBITMQ_URL=amqp://guest:guest@localhost:5672/
```

---

## Phase 8 — Docker Compose ✅

Stack under `infrastructure/docker-compose.yml`:

- **Services:** frontend · backend-api · worker · postgres · rabbitmq  
- **Not included:** Redis · Elasticsearch · Keycloak (Cloud-IAM stays external)  
- **Network:** `cyberwatch-network`  
- **Volumes:** `postgres_data` · `rabbitmq_data`  
- **Secrets:** single `infrastructure/.env` (create once from `.env.example` only if `.env` does not exist yet)

```powershell
make start
make stop
```

See root [`README.md`](README.md) for URLs, volumes, and `SCAN_MODE` notes.

## Phase 6–7 · 9–10

Redis · Elasticsearch (later) · Demo prep · CI/CD — planned.

---

## Security rules

- No secrets in code · env vars only
- JWT + roles on API · Keycloak owns passwords
- Worker: passive checks only · durable queue messages · DLQ on final failure
