# Crontech ↔ Zoobicon API Contract

This is the contract Zoobicon expects from Crontech so the AI Builder
can hand off generated projects for hosting. Built mocked on the
Zoobicon side; flip the `CRONTECH_PAT` env var to live once Crontech
ships the endpoints below.

**Owner on Zoobicon side:** `src/lib/crontech-sync.ts` + `src/app/api/crontech/deploy/route.ts`
**Auth:** Bearer PAT (one Zoobicon service token, optionally per-tenant
later)
**Versioning:** all endpoints under `/api/v1/`
**Base URL:** read from `CRONTECH_API_BASE`, defaults to `https://api.crontech.ai`

---

## 1. Push a project (primary)

```
POST {CRONTECH_API_BASE}/api/v1/projects

Headers:
  Authorization: Bearer <CRONTECH_PAT>
  Content-Type: application/json
  X-Crontech-Source: zoobicon-builder

Body:
{
  "name": "my-saas-landing",                 // slug, /^[a-z0-9-]{1,40}$/
  "files": {
    "App.tsx": "export default function App() { ... }",
    "components/Hero.tsx": "...",
    "package.json": "..."
  },
  "deps": {                                  // npm-style dep map
    "react": "^18.3.0",
    "framer-motion": "^12.0.0"
  },
  "meta": {
    "source": "zoobicon-ai-builder",
    "createdBy": "craig@zoobicon.com",       // Crontech SSO subject if known
    "prompt": "saas landing for a dog-walking app",
    "template": null,
    "visibility": "public"                   // or "admin_private"
  }
}
```

**Returns `201 Created`:**

```json
{
  "projectId": "ctp_abc123xyz",
  "url": "https://my-saas-landing.crontech.app",
  "status": "provisioning"
}
```

**Errors Zoobicon handles gracefully:**

| Code | Meaning | Zoobicon behaviour |
|------|---------|--------------------|
| 401  | Invalid PAT | UI shows "Crontech auth failed — check CRONTECH_PAT" |
| 409  | Slug already taken | Retry with `-2`, `-3`, etc. up to 5 times |
| 413  | Payload too large | UI prompts "Project too large — please split or upgrade" |
| 422  | Validation error | UI shows the `error.message` field verbatim |
| 5xx  | Upstream | UI shows "Crontech temporarily unavailable, try again" |

---

## 2. Check project status (polling)

```
GET {CRONTECH_API_BASE}/api/v1/projects/{projectId}
Headers:
  Authorization: Bearer <CRONTECH_PAT>
```

**Returns `200 OK`:**

```json
{
  "projectId": "ctp_abc123xyz",
  "url": "https://my-saas-landing.crontech.app",
  "status": "live",                       // "provisioning" | "live" | "failed"
  "lastDeployedAt": "2026-05-17T14:32:00Z"
}
```

Zoobicon polls this every 3s after the initial `POST` until `status`
flips to `"live"` or `"failed"`, then stops.

---

## 3. Update a project (edits / new builds)

When the user edits in the Zoobicon builder and re-deploys to the
same project:

```
PATCH {CRONTECH_API_BASE}/api/v1/projects/{projectId}
Headers:
  Authorization: Bearer <CRONTECH_PAT>
  Content-Type: application/json

Body: { "files": { ... }, "deps": { ... } }
```

Returns `200 OK` with the same shape as `GET`.

Crontech is expected to atomically swap the live build — no downtime,
no broken intermediate state. If a deploy fails validation, the live
version stays up and `status` reports `"failed"` with the next response.

---

## 4. Optional: delete a project

```
DELETE {CRONTECH_API_BASE}/api/v1/projects/{projectId}
Headers:
  Authorization: Bearer <CRONTECH_PAT>
```

Returns `204 No Content`. Used when the user clicks "Delete" in the
admin builds list.

---

## Auth model

- **Phase 1 (now):** one Zoobicon service PAT. All deploys attributed
  to Zoobicon; `meta.createdBy` tells Crontech which Zoobicon user
  triggered the deploy.
- **Phase 2 (when Crontech SSO lands):** Zoobicon attaches the
  customer's Crontech token in `X-Crontech-User-Token` so Crontech can
  bill the right tenant. Service PAT still used for the service-side
  authentication.

---

## What Zoobicon does NOT need from Crontech

- Domain registration: Zoobicon owns this via OpenSRS (revenue stream).
- AI Builder / Video Creator: Zoobicon-owned.
- Free Tools: client-side only.

What Crontech absorbs: auth, email, hosting, SSL, CDN, storage, SMS,
booking, CRM, invoicing, analytics, support inbox, cron scheduling,
audit log. See `ZOOBICON-REMOVE-LIST.md` for the full delegation map.

---

## Mocked path (Zoobicon side)

When `CRONTECH_PAT` is unset, `pushToCrontech()` returns a synthetic
`{ projectId: "mock-...", url: "https://<slug>.crontech.app", status:
"provisioning" }` so the UI can be exercised end-to-end before
Crontech ships. Set `CRONTECH_PAT` in the Zoobicon Vercel env to flip
to live calls — no code changes required.
