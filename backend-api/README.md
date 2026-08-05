# CyberWatch Backend API

Go REST API for the CyberWatch External Attack Surface Monitoring Platform.

## Stack

- Go · Gin · GORM · PostgreSQL
- Keycloak (JWT via JWKS) for authentication & RBAC

## Structure

```
backend-api/
├── cmd/server/          # App entrypoint
├── internal/
│   ├── auth/            # Role constants (ADMIN, ANALYST)
│   ├── config/          # Loads env vars (.env)
│   ├── database/        # PostgreSQL connection + AutoMigrate
│   ├── models/          # GORM entities (Company, Scan, Vulnerability)
│   ├── repositories/    # Database access
│   ├── services/        # Business logic + validation
│   ├── handlers/        # HTTP handlers
│   ├── routes/          # Route registration + role guards
│   ├── middleware/      # CORS, logging, JWT auth, RBAC
│   └── response/        # Shared JSON helpers
└── migrations/          # SQL schema reference
```

## Database relations

```text
Company (1) ──────< (N) Scan (1) ──────< (N) Vulnerability
```

```mermaid
erDiagram
    COMPANY ||--o{ SCAN : has
    SCAN ||--o{ VULNERABILITY : has

    COMPANY {
        uint id PK
        string name
        string domain UK
        timestamp created_at
        timestamp updated_at
    }

    SCAN {
        uint id PK
        uint company_id FK
        string status
        int risk_score
        timestamp started_at
        timestamp finished_at
        timestamp created_at
        timestamp updated_at
    }

    VULNERABILITY {
        uint id PK
        uint scan_id FK
        string title
        string severity
        text description
        timestamp created_at
    }
```

**Scan status:** `PENDING` · `RUNNING` · `COMPLETED` · `FAILED`  
**Severity:** `LOW` · `MEDIUM` · `HIGH` · `CRITICAL`

## Setup

### 1. PostgreSQL

Create the database:

```sql
CREATE DATABASE cyberwatch;
```

### 2. Environment

```powershell
copy .env.example .env
```

Edit `.env`:

```env
APP_PORT=8080
APP_ENV=development
CORS_ORIGIN=http://localhost:5173

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=cyberwatch
DATABASE_SSLMODE=disable

KEYCLOAK_URL=https://<host>.cloud-iam.com/auth
KEYCLOAK_REALM=<your-realm>
KEYCLOAK_CLIENT_ID=cyberwatch-api
```

Keycloak vars are **required** — the server will not start without them.  
Full IdP setup: [`docs/KEYCLOAK.md`](../docs/KEYCLOAK.md).

### 3. Run

```powershell
cd backend-api
go mod tidy
go run ./cmd/server
```

- Health (public): http://localhost:8080/health  
- API (JWT required): http://localhost:8080/api/...

## Authentication

All `/api/*` routes require a valid Keycloak access token:

```http
Authorization: Bearer <access_token>
```

| Action | Roles |
|--------|-------|
| View dashboard / companies / scans | `ADMIN` or `ANALYST` |
| Create / update / delete company | `ADMIN` |
| Create scan | `ADMIN` or `ANALYST` |

| Status | Meaning |
|--------|---------|
| `401` | Missing / invalid token |
| `403` | Valid token, insufficient role |

Public: `GET /health`

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Health check |
| GET | `/api/dashboard` | ADMIN, ANALYST | Dashboard stats |
| GET / POST | `/api/companies` | GET: any · POST: ADMIN | List / create |
| GET / PUT / DELETE | `/api/companies/:id` | GET: any · write: ADMIN | Company CRUD |
| GET / POST | `/api/scans` | GET: any · POST: ADMIN, ANALYST | List / create (`PENDING`) |
| GET | `/api/scans/:id` | ADMIN, ANALYST | Scan + vulnerabilities |

```json
POST /api/companies
{ "name": "Demo Corporation", "domain": "demo.com" }

PUT /api/companies/1
{ "name": "Demo Corporation", "domain": "demo.com" }

POST /api/scans
{ "companyId": 1 }
```

## Responses

```json
{ "data": {} }
{ "error": "message" }
```

## Tests

```bash
go test ./...
```

Uses in-memory SQLite (no PostgreSQL or Keycloak required).
