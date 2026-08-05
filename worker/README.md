# CyberWatch Scanner Worker

Passive external security scanner for CyberWatch (Phase 4).

Standalone **FastAPI** service — no RabbitMQ yet. The Go API can call `POST /scan` directly during development; a queue consumer can reuse `ScanService` later with minimal changes.

## Stack

- Python 3.12+
- FastAPI · Uvicorn · Pydantic
- Requests · BeautifulSoup4 · dnspython
- Structlog

## Structure

```text
worker/
├── app/
│   ├── main.py              # FastAPI entrypoint
│   ├── config.py            # Settings from env
│   ├── api/routes.py        # HTTP transport (POST /scan)
│   ├── scanners/            # Isolated passive checks
│   │   ├── dns.py
│   │   ├── http.py
│   │   ├── headers.py
│   │   ├── technology.py
│   │   ├── ports.py
│   │   └── risk.py
│   ├── models/schemas.py    # Request / response models
│   ├── services/            # ScanService orchestration
│   └── utils/               # Domain validation + logging
├── requirements.txt
└── README.md
```

Business logic lives in `ScanService` + scanners. Transport is only in `api/routes.py`.

## Pipeline

```text
domain → validate → DNS → HTTP → headers → technologies → ports → risk → JSON
```

## Setup

```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

```powershell
cd worker
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

- Health: http://localhost:8001/health  
- Docs: http://localhost:8001/docs  

## API

### `POST /scan`

```json
{ "domain": "example.com" }
```

Example response fields:

| Field | Meaning |
|-------|---------|
| `domain` | Normalized domain |
| `ip` | Resolved A record |
| `dns` | Resolution details |
| `http` | Reachability / status / timing |
| `technologies` | Rule-based detections |
| `headers` | Security header present / missing / value |
| `ports` | Common TCP ports (80, 443, 22, 21, 3306, 5432, 6379, 5672) |
| `riskScore` | 0–100 |
| `riskLevel` | `LOW` · `MEDIUM` · `HIGH` · `CRITICAL` |
| `findings` | title, description, severity, recommendation |

```powershell
curl -X POST http://localhost:8001/scan -H "Content-Type: application/json" -d "{\"domain\":\"example.com\"}"
```

## Config (optional `.env`)

```env
APP_ENV=development
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8001
HTTP_TIMEOUT_SECONDS=8
DNS_TIMEOUT_SECONDS=5
PORT_TIMEOUT_SECONDS=1.5
```

## Safety

- Passive checks only (no aggressive DNS enum / mass scanning)
- Short socket timeouts on a fixed common-port list
- Invalid domains return `400`

## Next phase

RabbitMQ will publish/consume scan jobs. Call `ScanService.run(domain)` from the consumer — no scanner changes required.
