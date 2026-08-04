# CyberWatch Frontend

React + TypeScript dashboard for the CyberWatch External Attack Surface Monitoring Platform.

## Stack

- React + TypeScript + Vite
- Chakra UI
- React Router
- TanStack Query
- Axios
- Recharts

## Getting started

1. Ensure the Go API is running on port `8080`.
2. Configure env:

```powershell
copy .env.example .env
```

```env
VITE_API_URL=http://localhost:8080/api
```

3. Start the UI:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Auth

Login is still mocked (any email/password). Keycloak comes later.

All other data comes from the Go API:

- `GET /api/dashboard`
- `GET|POST /api/companies`
- `GET|POST /api/scans`
- `GET /api/scans/:id`
