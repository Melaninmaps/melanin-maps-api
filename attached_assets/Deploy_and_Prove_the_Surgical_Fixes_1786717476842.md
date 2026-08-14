# Deploy and Prove the Surgical Fixes

## 1. Apply source changes

Apply the Kinfolk patch to the single existing `POST /kinfolk/chat` handler in `map/routes/kinfolk.ts`; do not create a second route. Apply the map patch to `map/web/map.tsx` and update the `GET /businesses/map-pins` SQL in `map/routes/businesses.ts`. Apply the events compatibility mount in the route index and the claim payload normalization in both the client and server. Run TypeScript compilation and the existing test suite.

## 2. Apply database patch safely

Run `05_beta_safety_sql.sql` in staging first. Capture the counts before and after. Do not hard-delete duplicate records. Verify that confirmed duplicate rows have `is_duplicate=true`, `permanently_hidden=true`, and a non-null `duplicate_of_id` where the audit identified a canonical row.

## 3. Configure Railway

Set the browser-safe Google Maps key under the exact frontend environment variable expected by the build—normally `VITE_GOOGLE_MAPS_API_KEY`. Rebuild the frontend after changing it. Do not expose a server-only secret in client code. If the key cannot be configured for beta, keep the useful list/search fallback and change the UI text from “coming soon” to “Map provider is not configured.”

For the free beta, set the payment feature flag that the current app uses to disable checkout, upgrade, and billing initialization. Billing must not be on the startup-critical path.

## 4. Run the redacted regression test

```bash
export BASE_URL='https://api-server-production-a991.up.railway.app'
export TEST_EMAIL='disposable-tester@example.com'
export TEST_PASSWORD='use-the-disposable-password'
npx tsx 06_surgical_regression_tests.ts > surgical-regression-result.json
```

The output must contain only booleans, statuses, counts, and the final gate result. Never print `Authorization`, response bodies, cookies, UUIDs, or session tokens.

## 5. Required browser proof

Replit must return screenshots or a short screen recording showing:

1. `/map` rendering the map canvas and visible pins.
2. The phrase `Black-owned grocery stores in Atlanta` returning results in the map sidebar and map canvas.
3. Exact search `Wadada` returning the expected business.
4. The Divine Nine Library topic opening with description, source links, and Follow control.
5. KinfolkAI visibly rendering the food, pop-culture, and Library-topic answers.
6. Makeda or another business profile showing the brighter color treatment, Save, Check In, and contribution controls.

## 6. Release gate

The patch is not accepted on the basis of a successful local test. Acceptance requires:

- a deployed commit SHA;
- a reachable Railway URL;
- HTTP 200 for the three Kinfolk prompts, or a documented 503 retry response under deliberate provider throttling—but never an unexplained 500;
- HTTP 200 for both `/api/events` and `/api/community/events` during compatibility period;
- exact Wadada search returning at least one matching record;
- map API and map UI both showing consistent filtered data;
- zero public duplicate/hidden records in SQL verification;
- 30/30 redacted login results;
- no exposed tokens in logs or attached evidence.

If any one of the critical gates fails, label the deployment `NOT READY` and do not call the task complete.
