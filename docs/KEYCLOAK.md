# Keycloak Setup — CyberWatch

CyberWatch uses **hosted Keycloak ([Cloud-IAM](https://www.cloud-iam.com/))** as the Identity Provider.  
Do **not** store passwords in the Go API or React app.

## 1. Deploy Keycloak (Cloud-IAM)

1. Create an account at https://www.cloud-iam.com/
2. Create a **Managed Keycloak** deployment (Freemium is fine)
3. Wait until status is **Running**
4. Open the **Deployment admin URL** and sign in with the credentials from the Cloud-IAM completion email

| Field | Placeholder |
|-------|-------------|
| Deployment name | `<your-deployment-name>` |
| Admin console | `https://<host>.cloud-iam.com/auth/admin/<realm>/console/` |
| Base URL (for `.env`) | `https://<host>.cloud-iam.com/auth` |

The **realm** is usually the deployment name in lowercase. Use the exact name Cloud-IAM gives you.

> Admin console login configures Keycloak only. It is **not** the CyberWatch app user login.

## 2. Environment variables

All apps share **one** file: [`infrastructure/.env`](../infrastructure/.env.example).

```powershell
copy infrastructure\.env.example infrastructure\.env
```

```env
# API
KEYCLOAK_URL=https://<host>.cloud-iam.com/auth
KEYCLOAK_REALM=<your-realm>
KEYCLOAK_CLIENT_ID=cyberwatch-api

# Frontend
VITE_API_URL=http://localhost:8080/api
VITE_KEYCLOAK_URL=https://<host>.cloud-iam.com/auth
VITE_KEYCLOAK_REALM=<your-realm>
VITE_KEYCLOAK_CLIENT_ID=cyberwatch-frontend
```

Keep the `/auth` suffix when your admin URL contains `/auth`. Restart Go API and Vite after changes.

| App | Port |
|-----|------|
| Go API | `8080` |
| React (Vite) | `5173` |
| Keycloak | Cloud URL (HTTPS) |

## 3. Configure Keycloak

Select your realm in the admin console (top-left).

### Frontend client (public)

1. **Clients** → **Create client**
2. Client type: OpenID Connect
3. Client ID: `cyberwatch-frontend`
4. Client authentication: **Off**
5. Standard flow: **On**
6. Direct access grants: **Off**
7. Save, then set:

**Valid redirect URIs**

```text
http://localhost:5173/auth/callback
http://localhost:5173/*
http://localhost:5173/
http://localhost:5173
http://localhost:5173/silent-renew
```

**Valid post logout redirect URIs**

```text
http://localhost:5173/*
http://localhost:5173/
http://localhost:5173
```

**Web origins**

```text
http://localhost:5173
```

### API client

| Setting | Value |
|---------|-------|
| Client ID | `cyberwatch-api` |
| Client authentication | On |
| Standard flow | Off |
| Direct access grants | Off |

The API does not log users in. It validates JWT access tokens via:

```text
{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/certs
```

### Roles

Create these **realm roles** (exact names, uppercase):

| Role | Permissions |
|------|-------------|
| `ADMIN` | Manage companies (create / update / delete); full dashboard & scans |
| `ANALYST` | View dashboard, companies, scans; create scans |

### Users

1. **Users** → **Add user**
2. Set username / email
3. **Credentials** → set password (**temporary = Off** for local demo)
4. **Role mapping** → assign `ADMIN` and/or `ANALYST`
5. Logout and login again in the app after changing roles (roles are in the token)

| Example user | Roles |
|--------------|-------|
| admin@example.com | ADMIN |
| analyst@example.com | ANALYST |

Without `ADMIN`, company create / edit / delete actions stay hidden.

## 4. Auth flow

```text
React app → protected route (no session)
  → Keycloak login
  → redirect to http://localhost:5173/auth/callback
  → oidc-client-ts stores access token
  → Axios: Authorization: Bearer <token>
  → Go API validates JWT via JWKS
  → role middleware: ADMIN / ANALYST
```

## 5. Verify

1. Start PostgreSQL, Go API, and the React app
2. Open `http://localhost:5173` → Keycloak login
3. ADMIN → can create / edit / delete companies
4. ANALYST → can start scans; delete company returns `403`
5. API without token → `401`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **Client not found** | Create client ID exactly `cyberwatch-frontend`, matching `VITE_KEYCLOAK_CLIENT_ID` |
| **Invalid parameter: redirect_uri** | Add the Valid redirect URIs listed above on `cyberwatch-frontend`, save, restart Vite |
| **Infinite redirect loop** | Ensure `/auth/callback` is allowed; hard-refresh or clear site data for `localhost:5173` |
| **Cannot add / edit companies** | Assign realm role `ADMIN`, then logout and login again |
| **Admin console password** | Use the Cloud-IAM completion email credentials, not a CyberWatch app user |
