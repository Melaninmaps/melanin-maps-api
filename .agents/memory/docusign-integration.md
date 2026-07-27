---
name: DocuSign integration
description: Full DocuSign e-signature integration — JWT auth, 3 document types, API routes, DB tracking, mobile UI.
---

## Architecture

- **Auth lib**: `artifacts/api-server/src/lib/docusign.ts` — JWT RS256 auth with 1-hour token cache. RSA key normalized with `.replace(/\\n/g, "\n")`.
- **DB table**: `lib/db/src/schema/docusign-envelopes.ts` → `docusign_envelopes` (envelopeId, businessId, userId, type, status, signerEmail, signerName, timestamps)
- **Routes**: `artifacts/api-server/src/routes/docusign.ts` — registered in routes/index.ts

## Env vars needed
- `DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_BASE_URL`, `DOCUSIGN_AUTH_URL` — plain env vars
- `DOCUSIGN_RSA_PRIVATE_KEY`, `DOCUSIGN_USER_ID` — Replit secrets

## Three document flows

| Flow | Trigger | Route |
|---|---|---|
| Seller Agreement | Business owner taps "Sign with DocuSign" in business-dashboard.tsx | `POST /api/docusign/seller-agreement` |
| Founding Agreement | Admin grants founding status; auto-sent async in businesses.ts | `POST /api/docusign/founding-agreement/:businessId` |
| Verification Certification | Business submits verification docs; auto-sent async in verification.ts | `POST /api/docusign/verification-certification` |

## Key routes
- `POST /api/docusign/seller-agreement` — creates embedded signing URL; updates sellerAgreementAcceptedAt on complete
- `POST /api/docusign/founding-agreement/:businessId` — admin only; sends founding agreement
- `GET /api/docusign/status/:envelopeId` — polls live status and updates DB + business
- `POST /api/docusign/webhook` — DocuSign Connect webhook (configure separately in DocuSign Admin)
- `GET /api/docusign/signed` — return URL shown after signing; updates DB best-effort
- `GET /api/docusign/consent-url` — admin only; returns the one-time JWT consent URL

## Critical: One-time JWT consent
Before any JWT auth call works, the DOCUSIGN_USER_ID user must grant consent by visiting the URL returned by `GET /api/docusign/consent-url` (admin endpoint). Without this, all DocuSign calls fail with `consent_required`.

Consent URL pattern:
```
https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature+impersonation&client_id=<INTEGRATION_KEY>&redirect_uri=https://www.docusign.com
```

## Anchor strings in documents
Documents use `\Sig\`, `\FullName\`, `\DateSigned\` as anchor strings for tab placement.

**Why:** DocuSign anchor-based tabs require the literal string to appear in the document HTML. These are the exact strings used in the signerTabs() helper.

## Sandbox vs production
- Current setup uses sandbox (`account-d.docusign.com`, `demo.docusign.net`). For production, update DOCUSIGN_BASE_URL to `https://na3.docusign.net/restapi` and DOCUSIGN_AUTH_URL to `https://account.docusign.com`.

## Webhook setup
Configure DocuSign Connect in DocuSign Admin:
- URL: `https://<domain>/api/docusign/webhook`
- Trigger: Envelope Completed
- Format: JSON
