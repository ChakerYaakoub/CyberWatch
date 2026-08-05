# CyberWatch Scanner Worker

Passive external security scanner for CyberWatch.

**Phase 4:** scanning engine (`ScanService`)  
**Phase 5:** dual transport — HTTP `/jobs` (dev) + RabbitMQ consumer (async)

## Stack

- Python 3.12+ · FastAPI · Uvicorn · Pydantic
- Requests · BeautifulSoup4 · dnspython · Structlog
- Pika · psycopg2 (persist results to the same PostgreSQL as the Go API)

## Structure

```text
worker/
├── app/
│   ├── main.py                 # FastAPI (HTTP)
│   ├── consumer.py             # RabbitMQ consumer
│   ├── config.py
│   ├── api/routes.py           # POST /scan · POST /jobs
│   ├── scanners/               # DNS · HTTP · headers · tech · ports · risk
│   ├── models/
│   ├── services/
│   │   ├── scan_service.py     # Core pipeline (unchanged by transport)
│   │   ├── job_processor.py    # Job → ScanService → DB
│   │   └── result_store.py     # PostgreSQL updates
│   └── utils/
├── requirements.txt
└── README.md
```

## Modes

| Mode | How jobs arrive | How to run |
|------|-----------------|------------|
| **HTTP (dev)** | Go `SCAN_MODE=http` → `POST /jobs` | `uvicorn app.main:app --port 8001` |
| **RabbitMQ** | Go `SCAN_MODE=rabbitmq` → `scan_jobs` | `python -m app.consumer` (+ optional uvicorn for `/scan`) |

`ScanService` never depends on RabbitMQ or HTTP.

## Setup

```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Fill DATABASE_* (same as backend-api) and RABBITMQ_URL if using the consumer
```

## Run — development (HTTP)

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

- Health: http://localhost:8001/health  
- Docs: http://localhost:8001/docs  
- Manual sync scan: `POST /scan` `{ "domain": "example.com" }`  
- Async job from API: `POST /jobs` (ScanJob JSON) → writes to PostgreSQL

## Run — RabbitMQ consumer

```powershell
# RabbitMQ must be running (e.g. docker run -p 5672:5672 rabbitmq:3-management)
python -m app.consumer
```

Topology (declared automatically):

| Resource | Name |
|----------|------|
| Exchange | `cyberwatch.scans` (topic, durable) |
| Queue | `scan_jobs` (durable, DLX) |
| Routing key | `scan.start` |
| Dead letter | `scan_dead_letter` |

Retries: up to **3** attempts, then dead-letter. Messages are persistent; consumer reconnects on connection loss.

## Pipeline

```text
ScanJob → RUNNING → ScanService → findings → COMPLETED | FAILED
```

Status lifecycle: `PENDING` → `QUEUED` → `RUNNING` → `COMPLETED` / `FAILED`

## PowerShell examples

```powershell
# Sync debug scan
Invoke-RestMethod -Method Post -Uri http://localhost:8001/scan -ContentType "application/json" -Body '{"domain":"example.com"}'

# Job payload (same shape as Go publisher)
Invoke-RestMethod -Method Post -Uri http://localhost:8001/jobs -ContentType "application/json" -Body '{"scanId":1,"companyId":1,"domain":"example.com","requestedBy":"admin","attempt":1}'
```
