# Admin Browser Compatibility Repair

## Scope

Repair the known **Admin Business Inventory** failure in an isolated branch based on the active production source revision `13cbfe467bac8c0341d7a4ba8f0490c3e886d359`.

The observed behavior is that an Admin filter request can be rejected or malformed while the UI treats it as a successful empty result. This can present as zero businesses or as filters that appear not to update. The repair must make Chrome and Safari/WebKit expose the same truthful result: a successful filter response updates the inventory; a failed response retains the last confirmed inventory and shows an actionable error.

## Implementation

- Add a small, reusable Admin-response parser under `artifacts/web/src/lib/` that:
  - reads the JSON body once;
  - rejects non-2xx responses with the server message and HTTP status when available;
  - rejects non-JSON or malformed payloads with a clear response error;
  - does not alter authentication, authorization, session storage, cookies, request credentials, or server permissions.
- Apply the helper only to the Admin Business Inventory loader in `artifacts/web/src/pages/admin.tsx`.
- Validate that a success response has the expected inventory array before replacing displayed rows.
- On a rejected/malformed request, preserve the most recently confirmed rows and totals, stop the loading state, and render an explicit filter error explaining that the requested result was not applied.
- Leave existing city-filter confirmation, stale-request protection, business actions, administrator permission checks, API contracts, server routes, and all other dashboard tabs unchanged.

## Boundaries

- No changes to administrator roles, API authorization, cookies, SameSite policy, token persistence, API endpoints, database data, business records, mobile app code, Kinfolk, community, Safety, or deployment configuration.
- No production deployment, mobile build, database write, merge, or unrelated refactor in this task.
- Browser-specific permission prompts remain out of scope; the test target is equivalent web request/result handling in Chromium and WebKit.

## Project Structure

| Path | Responsibility |
|---|---|
| `artifacts/web/src/lib/adminResponse.ts` | Reusable, typed validation of an Admin JSON response before UI state is changed. |
| `artifacts/web/src/pages/admin.tsx` | Business Inventory state and the single consumer of the compatibility helper. |
| `artifacts/web/src/__tests__/admin-business-inventory-response.test.ts` | Focused success, HTTP failure, malformed-body, and stale-data-protection coverage. |
| `docs/ADMIN_BROWSER_COMPATIBILITY_REPAIR_*` | Scope, evidence, and completion record for this isolated repair. |

## Evidence Approach

Run the focused source tests plus the web typecheck. Use headless Chromium and WebKit against the same deployed environment for anonymous transport parity and test the response-handling branch with deterministic mocked responses. Because an authenticated Safari session is not available in this sandbox, do not claim a real-user Safari login reproduction; record that as remaining device verification.