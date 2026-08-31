# Replit Prompt — Final Authenticated Proof Required Before Cultural-Site Release

## Release status: blocked pending real-page proof

The isolated route diff and web build are necessary but not sufficient. **Do not deploy yet.** Cultural-site links are non-negotiable: the actual rendered pages must work through an authenticated session, survive direct refresh, and never redirect into `/places/:id`.

No source, generated source, API, schema, route, map, mobile, Kinfolk, preview, QR/waitlist, configuration, dependency, build, deployment, or data change is authorized by this request. This is a **read-only verification step** only.

## Required session

Use the existing disposable audit account, not a real owner/member account:

```text
email: monitor@mappingwithmelanin.com
password: Manus2026MWM%
```

If the browser test slot is occupied, wait for it or use the existing authenticated audit session. Do not bypass the early-access gate, alter its logic, disable authentication, create a new test account, or add test code to the repository.

You may use an ephemeral, non-tracked test script under `/tmp` if needed. Delete it afterward. Do not commit it.

## Required browser checks

For each URL below, in an authenticated audit session:

1. Open the URL as a direct navigation, not by clicking from a prior page.
2. Record the initial URL and final browser URL.
3. Wait for the detail page to settle.
4. Record the visible `<h1>` or title and a screenshot.
5. Confirm no 404 page and no generic “We could not load this cultural site” page appear.
6. Confirm the network request to `/api/cultural-sites/<id>` returns HTTP 200.
7. Confirm no request to `/api/places/<id>` is made for that cultural-site page.
8. Refresh the same direct URL once and repeat items 2–7.

| Site | Direct canonical URL | Expected rendered name |
|---|---|---|
| MLK House / historic site | `https://www.mappingwithmelanin.com/cultural-sites/162c3111-b895-43f8-9e46-dca341f12b87/martin-luther-king-jr-national-historic-site-162c3111` | `Martin Luther King Jr. National Historic Site` |
| Morehouse | `https://www.mappingwithmelanin.com/cultural-sites/3dcf7e76-ab4e-4a53-ba28-38875421340a/morehouse-college-3dcf7e76` | `Morehouse College` |
| Bud Billiken | `https://www.mappingwithmelanin.com/cultural-sites/bd0d4816-874e-4e62-ac50-e64f9c3fe09f/bud-billiken-parade-and-picnic-bd0d4816` | `Bud Billiken Parade and Picnic` |

For each of the six navigations above (three initial loads plus three refreshes), all of the following must be true:

```text
final URL begins with /cultural-sites/
final URL does not contain /places/
expected cultural-site name is rendered
/api/cultural-sites/<id> returns 200
/api/places/<id> is not requested
no 404 or generic load-error UI is rendered
```

## Unchanged place-route regression

Using one already-existing known-good place URL from the current test environment, perform one direct navigation and refresh. Confirm its URL remains under `/places/` and it still fetches from `/api/places/:id`. Do not create a place record or modify a fixture merely to run this check.

## Evidence package to return

Return all of the following, without deploying:

1. A table with six cultural-site navigations showing initial URL, final URL, expected name, rendered name, cultural API status, place API call count, and pass/fail.
2. Six screenshots: initial and refreshed render for MLK, Morehouse, and Bud Billiken.
3. The browser console error summary for every navigation.
4. A compact network summary showing one successful `/api/cultural-sites/:id` response per navigation and zero matching `/api/places/:id` requests.
5. The unchanged-place-route result.
6. The current source diff and `git diff --name-only` repeated unchanged from the prior proof.
7. Confirmation that no file, build output, deployment, or test artifact was committed or changed during verification.

## Stop conditions

Stop and do not deploy if any cultural page renders 404/error UI, any final URL becomes `/places/:id`, any cultural API request is non-200, any place API request occurs for a cultural ID, or the known-good place route regresses. Return the exact URL, screenshot, console/network evidence, and current source diff. Do not broaden the code change.

## Next action

Only after all verification evidence passes may a separate owner authorization request deployment of the isolated `App.tsx` route correction.
