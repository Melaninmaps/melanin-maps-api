# Mapping With Melanin™ — Required Authenticated Release Gate

## Why Static Internal Audits Missed the Failures

The previous internal checks correctly established that a deployment existed, a JavaScript bundle contained certain strings, and the public health endpoint responded. Those checks did **not** establish that the application executed the intended code in the real authenticated request path.

A bundle can contain `provenanceNote`, `legal_regulated`, or a `kinfolk_delivery_profiles` query while an active route continues to call a legacy classifier, an evidence-policy lookup throws before serialization, or the client hydrates its controls from old state. The public health probe cannot exercise any of those paths because it intentionally bypasses authentication and does not perform a chat completion, source lookup, preference save, or browser reload.

> **Release principle:** Code presence is not feature behavior. A Kinfolk change is complete only when the deployed, authenticated user journey passes its acceptance contract.

## Required Layers of Verification

| Layer | What it proves | What it cannot prove alone |
|---|---|---|
| Static bundle/commit check | The deployment contains expected code. | Active route wiring, database use, UI hydration, or model response behavior. |
| Public health probe | Railway process is alive and a provider probe is reachable. | Authenticated chat behavior, source-policy lookup, and user preferences. |
| Unit test | Individual policy functions behave as expected. | Middleware order, database migrations, client/server contract, or browser state. |
| Authenticated API integration | The deployed API returns the expected JSON schema. | Visual component rendering and full refresh behavior. |
| Authenticated browser E2E | A real member can complete the intended journey. | Native-only mobile behavior unless run in an emulator/TestFlight. |

All five layers are required for a high-consequence Kinfolk release. The last two are release-blocking.

## Non-Negotiable Kinfolk CI/CD Gates

A deployment modifying any Kinfolk router, evidence, provider, prompt, session, preference, or related client UI must satisfy the gates below against the deployed staging environment before it is called ready.

| Gate | Required assertion | Owner | Failure action |
|---|---|---|---|
| Migration verification | Required tables exist and the application role can read/write the new rows. | Backend engineer | Stop deployment. |
| Public health | `/api/kinfolk/health` returns `200 {"ok":true}`. | Platform engineer | Stop deployment. |
| Authenticated regulated route | Three Thailand visa/extension prompts return `200`, `intentClass: "legal_regulated"`, non-empty `provenanceNote`, and `sources` array. | Automated E2E | Stop deployment. |
| Authenticated cultural control | Philadelphia rapper prompt returns `200`, non-legal intent class, and no regulated provenance note. | Automated E2E | Stop deployment. |
| Preference persistence | Detailed → Save → server GET → full browser reload remains Detailed. | Automated E2E | Stop deployment. |
| Web UI rendering | Regulated response renders an explicit provenance panel beneath the message. | Automated E2E | Stop deployment. |
| Native verification | A simulator/TestFlight build verifies mobile provenance and Welcoming Environment badge behavior. | Mobile owner | Do not claim mobile complete. |
| Independent audit | Replit attaches test evidence; Manus performs the final external verification if requested. | Founder / QA | Do not make a launch claim until reconciled. |

## Required Evidence Packet

Before asking for an external audit, Replit must attach a single release record containing the commit SHA, Railway deployment ID and timestamp, staging environment URL, migration output with secrets redacted, public health response, automated test report, screenshots/video of the authenticated regulated chat and Detailed reload state, and the exact endpoint response bodies with any tokens or personal data redacted.

The release record must state `READY FOR INDEPENDENT AUDIT` only when every mandatory gate passes. If any test fails, the record must state `NOT READY` and name the failing endpoint, test, and owner.

## Deployment Discipline

Replit must not use source search, a successful build, a public health check, a manual one-off curl command, or a screenshot of an unauthenticated route as approval for a user-facing Kinfolk feature. Each can be included as supporting evidence, but none substitutes for the authenticated release gate.

Use the accompanying Playwright test as the required command:

```bash
E2E_BASE_URL='https://<staging-host>' \
E2E_KINFOLK_EMAIL='staging-kinfolk-tester@example.test' \
E2E_KINFOLK_PASSWORD='<staging-test-password>' \
pnpm playwright test MWM_Kinfolk_Authenticated_Release_Gate.spec.ts
```

The test intentionally refuses public production unless `ALLOW_PRODUCTION_E2E=true` is provided. This protects real members and ensures staging proves the behavior before release.

## No-Touch Guardrail

This release gate adds test coverage and deployment evidence only. It does not change authentication, Maps, Safety, Library, business listings, Circles, Marketplace, or the underlying database schema beyond the already approved Kinfolk changes.
