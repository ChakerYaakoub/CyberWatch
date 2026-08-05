# CyberWatch Frontend

React + TypeScript dashboard for the CyberWatch External Attack Surface Monitoring Platform.

## Stack

- React · TypeScript · Vite
- Chakra UI · React Router · TanStack Query · Axios · Recharts
- oidc-client-ts (Keycloak OIDC + PKCE)

## Structure

```
frontend/
├── src/
│   ├── app/             # Router, providers, theme
│   ├── auth/            # OIDC config, AuthProvider, ProtectedRoute, tokens
│   ├── components/      # Layout + dashboard UI
│   ├── hooks/           # TanStack Query hooks
│   ├── pages/           # Dashboard, Companies, ScanDetails, OIDC callbacks
│   ├── services/        # Axios API clients
│   ├── types/           # Shared TypeScript types
│   └── utils/           # Mappers / helpers
├── .env.example
└── package.json
```

There is **no local login page** — authentication is handled by hosted Keycloak.

## Setup

1. Configure Keycloak — see [`docs/KEYCLOAK.md`](../docs/KEYCLOAK.md)
2. Ensure the Go API is running on port `8080`
3. Configure env:

```powershell
copy .env.example .env
```

```env
VITE_API_URL=http://localhost:8080/api
VITE_KEYCLOAK_URL=https://<host>.cloud-iam.com/auth
VITE_KEYCLOAK_REALM=<your-realm>
VITE_KEYCLOAK_CLIENT_ID=cyberwatch-frontend
```

Keep the `/auth` suffix when your Keycloak admin URL contains `/auth`.

4. Start the UI:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — unauthenticated users are redirected to Keycloak.

## Authentication

- Login / logout via Keycloak (Authorization Code + PKCE)
- Callback: `/auth/callback` · silent renew: `/silent-renew`
- Axios attaches `Authorization: Bearer <access_token>` on API calls
- On `401`, the app re-triggers Keycloak login

| Role | UI capabilities |
|------|-----------------|
| `ADMIN` | Full access — manage companies (create / edit / delete) |
| `ANALYST` | View dashboard / companies / scans; start scans |

## Routes

| Path | Auth | Page |
|------|------|------|
| `/` | Protected | Dashboard |
| `/companies` | Protected | Companies |
| `/scans/:id` | Protected | Scan details |
| `/auth/callback` | Public (OIDC) | Keycloak redirect handler |
| `/silent-renew` | Public (OIDC) | Silent token renew iframe |

## Scripts

```bash
npm run dev      # Vite dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
```
