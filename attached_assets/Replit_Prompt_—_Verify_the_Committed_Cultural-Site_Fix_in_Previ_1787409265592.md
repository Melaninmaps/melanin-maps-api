# Replit Prompt — Verify the Committed Cultural-Site Fix in Preview Before Production

## Important correction to the prior verification

The prior authenticated run correctly failed, but it tested **current production**, which does not yet contain the committed `App.tsx` route correction. Therefore it could only prove that production is still broken; it did not test whether the isolated source fix works.

Do **not** deploy. First run the committed isolated revision in the current Replit web preview/staging workflow and test that revision itself.

No source edit, route edit, API/data/schema change, migration, mobile/build change, preview change, public-art change, deployment, or commit is authorized by this request. This is a read-only runtime-verification step only.

## Required preview/staging setup

1. Confirm the current checked-out revision contains the already-committed `App.tsx` route correction.
2. Start or use the existing **web-only** preview/staging workflow for that revision. Do not start mobile workflows.
3. Record the exact preview/staging base URL and revision identifier.
4. Authenticate with the existing disposable audit account through the normal sign-in UI:

```text
email: monitor@mappingwithmelanin.com
password: Manus2026MWM%
```

Do not bypass the early-access gate, disable authentication, alter test data, or add a test account.

## Required preview/staging checks

Use these preview/staging paths exactly. Replace only `<PREVIEW_BASE_URL>` with the active web workflow URL.

| Site | URL path | Expected `<h1>` |
|---|---|---|
| MLK House / historic site | `/cultural-sites/162c3111-b895-43f8-9e46-dca341f12b87/martin-luther-king-jr-national-historic-site-162c3111` | `Martin Luther King Jr. National Historic Site` |
| Morehouse | `/cultural-sites/3dcf7e76-ab4e-4a53-ba28-38875421340a/morehouse-college-3dcf7e76` | `Morehouse College` |
| Bud Billiken | `/cultural-sites/bd0d4816-874e-4e62-ac50-e64f9c3fe09f/bud-billiken-parade-and-picnic-bd0d4816` | `Bud Billiken Parade and Picnic` |

For every site, perform two browser operations: an initial direct navigation and one hard refresh of the same route.

For all six loads, prove all conditions below:

```text
1. Final URL remains under /cultural-sites/.
2. Final URL never becomes /places/:id.
3. The expected cultural-site name renders as the detail title.
4. No “Cultural site not found” or “We could not load this cultural site” UI appears.
5. GET /api/cultural-sites/<id> is made and returns HTTP 200.
6. No GET /api/places/<same-id> request is made.
7. No browser console error is recorded.
```

Use the browser network log or an ephemeral, non-tracked browser harness to capture request URLs and statuses. Do not retain screenshots/scripts/reports in the repository and do not commit them.

## Place-route check

Do not reuse the invalid `example-hbcu` fixture from the failed production report. Identify one **existing, known-good place record** from the active preview data and provide its actual ID/path first. Then perform one initial navigation and refresh to confirm:

```text
- the URL remains under /places/
- GET /api/places/<id> returns 200
- its expected place title renders
```

If there is no known-good place fixture, state that fact and omit this check; do not invent a record or change data. That omission does not block cultural-site verification, but it must be explicitly reported.

## Evidence to return

Before any deployment request, return:

1. The preview/staging base URL and exact revision identifier.
2. A six-row cultural-site evidence table showing initial/refresh run, final URL, rendered `<h1>`, cultural API status, matching place API call count, console errors, and pass/fail.
3. Six screenshots, retained only long enough to attach to the response (not committed to the repository).
4. A network summary proving six `200` responses from `/api/cultural-sites/:id` and zero `/api/places/:id` requests for those IDs.
5. The place-route result or explicit verified reason it could not be run.
6. Current `git diff --name-only` and confirmation that no file changed during this verification.

## Stop conditions

Stop and return the exact evidence if even one cultural-site initial load or refresh fails, redirects to `/places`, shows error UI, misses a 200 cultural API response, makes a place API call for a cultural ID, or logs a console error. Do not alter the source or broaden scope.

## Next action

Only after this **preview/staging** verification passes should Replit request separate owner approval to deploy the existing isolated `App.tsx` route correction. After a later deployment, the same six checks must be repeated on `https://www.mappingwithmelanin.com` before the release is called complete.
