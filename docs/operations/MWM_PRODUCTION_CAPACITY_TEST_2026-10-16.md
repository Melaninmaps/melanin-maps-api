# MWM Production Capacity and Routing Assessment — 2026-10-16

## Purpose and boundary

This record captures the founder-requested **50-concurrent-user production capacity check** and the subsequent read-only inspection of the live request path.

- **Test start:** 2026-10-16T06:44:00Z
- **Production service:** `api-server` on Railway production
- **No production deployment, schema change, directory write, content write, KinfolkAI prompt, upload, preference update, or notification was performed.**
- **No real member account was used.** The 50 identities were pre-existing internal test/audit identities: 30 isolated load-test identities and 20 dedicated audit identities. The latter were restricted to read-only endpoints because their live `is_load_test` flag was not set.
- Credentials and cookies were retained only in process memory and were never logged or written to this record.

## Tested journey

Each simulated identity executed only:

1. Email/password login.
2. Authenticated identity read.
3. Paginated public business-list read (`limit=20`).
4. Map-pin read.
5. Library-topic read.
6. Events read.

The runner stopped a user after its first failed read to avoid retry storms. It intentionally excluded all mutation and AI routes.

## Result — not certified at 50 end-to-end users

The strict client-side pass criterion was a complete response body for every read. Only **1 of 50** simulated journeys completed all planned steps. The run therefore **does not certify production for 50 simultaneous end-to-end user journeys**.

This is not evidence of database exhaustion or a service crash:

| Server-side observation during the 50-user run | Result |
|---|---:|
| Login responses | 50 / 50 HTTP 200 |
| Login service-side latency | p50 4,891 ms; p95 6,605 ms; max 6,994 ms |
| Authenticated identity responses | 50 / 50 HTTP 200 |
| Identity service-side latency | p50 20 ms; p95 2,729 ms; max 3,563 ms |
| Business-list responses | 50 / 50 HTTP 200 |
| Business-list service-side latency | p50 1,086 ms; p95 1,282 ms; max 1,572 ms |
| Map-pin requests reaching the app | 32 / 32 HTTP 200 |
| Map-pin service-side latency | p50 210 ms; p95 258 ms; max 263 ms |
| Database pool waiters | 0 throughout; configured maximum 50 |
| Highest observed active pool size | 19 |
| API CPU high-water mark | 30.14% |
| API memory high-water mark | 0.7153 GiB |
| Production readiness after testing | HTTP 200; `status: ok`; `db: ok`; pool waiting 0 |

Railway HTTP logs show the application generated successful responses for every login, identity, and business-list request that reached it. The simultaneous client received timeouts or incomplete response bodies for many later reads despite those server-side 200 responses. The observed failure is therefore in the **end-to-end delivery path under the burst** (the single-source test egress, edge/proxy path, or response delivery), not a demonstrated PostgreSQL pool bottleneck.

## Additional bounded public-read checks

A follow-up read-only curl ramp against `GET /api/businesses?limit=20` confirmed that the test source/delivery path itself was unstable:

| Concurrent requests | Complete HTTP 200 transfers | Client timing |
|---:|---:|---|
| 10 | 9 / 10 | p50 9.43 s; p95 10.44 s |
| 20 | 20 / 20 | p50 6.41 s; p95 6.84 s |
| 50 public business-list headers | Not a valid pass measurement | Multiple client timeout/partial-body errors; the first script recorded headers but not curl exit codes, so it is intentionally excluded from completion-rate claims. |
| 50 Philadelphia viewport-map reads | Not a valid pass measurement | Multiple client timeout/partial-body errors; excluded from completion-rate claims for the same reason. |

The non-monotonic 10-versus-20 result reinforces that a single Sandbox egress source is not a reliable substitute for an independent distributed user-load service. It does **not** prove that 20 is a hard product limit; it establishes only a conservative, observed lower bound for one constrained source.

## Routing and proxy configuration diagnosis

### Verified current path

| Layer | Verified state | Implication |
|---|---|---|
| `www.mappingwithmelanin.com` | Direct Railway custom-domain CNAME; valid certificate; `Server: railway-hikari`; Railway edge `bru1` | The live Web/API traffic is not delivered through Cloudflare. |
| `api.melaninmaps.com` | Direct Railway custom-domain CNAME on port 8080; valid certificate; same Railway edge | The separate API hostname uses the same Railway delivery path. |
| Bare `mappingwithmelanin.com` | Separate Cloudflare-addressed redirect route | This redirect is not in the successful `www` or API request path and is not a candidate cause of the load-test delivery behavior. |
| Railway service topology | One API replica in `sfo`; no TCP proxy; no staged Railway changes | There is no horizontal failover or request-distribution headroom at the application layer. |
| HTTP protocol and encoding | HTTP/2 works on the Railway-generated domain, API custom domain, and Web custom domain; browser-compatible gzip is active for the tested list/map payloads | Neither missing HTTP/2 nor missing compression explains the observed timeouts. |
| Railway edge logs | Test-window routes returned 200 and report empty `upstreamErrors` | No Railway upstream/proxy failure was recorded for the captured requests. |
| Dynamic directory/map response policy | All dynamic responses send `Cache-Control: private, no-store, max-age=0` and vary on `Authorization`, `Cookie`, and location | Shared edge caching is intentionally disabled, including for anonymous directory/map reads. |

## What should **not** be changed now

1. **Do not change Cloudflare redirect rules or proxy settings as a first response.** Cloudflare is not on the `www`/API data path that was tested.
2. **Do not increase Express, Node, browser, or proxy timeouts.** The application and Railway edge recorded completed 200 responses; a longer client timeout would only conceal an unverified delivery-path issue.
3. **Do not add response compression.** The production endpoints negotiate gzip already.
4. **Do not change database-pool limits.** The test had no pool waiters and the API had ample CPU and memory headroom.

## Safest staged remediation if an independent test reproduces the failure

1. **Enable Railway tracing before the repeat test.** Current Railway tracing and auto-instrumentation are disabled. Tracing will correlate a future client request ID with edge timing and application spans; it is observability, not a functional traffic change.
2. **Increase only the API service from one to two replicas in `sfo`, then repeat the same read-only test.** This is the smallest infrastructure scaling adjustment. It adds application-level concurrency and redundancy; it is not justified as a database remedy. Confirm session storage compatibility in the release check before scaling.
3. **Add a safe public-response cache policy in application code, not a blanket proxy rule.** For truly anonymous, non-location-aware business-list and bounded viewport-pin reads only, send a short shared-cache directive such as `public, s-maxage=30, stale-while-revalidate=60`. Keep all authenticated or personalized responses `private, no-store` exactly as they are. This requires separating public responses from cookie/authorization-aware responses and preserving invalidation on profile, map, lifecycle, and eligibility changes.
4. **Only after that separation, optionally proxy the `www` host through an edge/CDN that honors the explicit public cache policy.** Do not cache authenticated API responses, do not key a shared cache on member cookies, and do not cache admin routes.
5. **If failures still occur with two replicas and an independent runner, escalate to Railway with the exact test window, Railway request IDs, edge `bru1`, empty upstream-error records, and full-body timeout evidence.** Railway Hikari edge read/idle limits are provider-managed; they are not exposed as an application-level timeout setting in this service configuration.

This is a recommendation sequence only. No DNS, Cloudflare, Railway, proxy, replica, caching, application, directory, or credential change was made.

## Conclusion

> **Current verified conclusion:** MWM production remained live and database-healthy during the test, and the API serviced the concurrent login/list workload without logged journey-endpoint 5xx or pool queuing. However, a complete end-to-end 50-user pass was not achieved, so no claim that the current configuration sustains 50 simultaneous member journeys is justified.

The next trustworthy step is the same bounded read-only journey from an **independent multi-region external load runner** that records complete response bodies and per-request network timings. That separates Sandbox/source-egress effects from Railway edge/proxy delivery and produces an actionable capacity threshold.

## Workspace and storage

- **Authoritative workspace:** `/home/ubuntu/mwm-kinfolk-nozip-map-restoration`
- **Branch:** `candidate/kinfolk-current-website-social-verification-20261015`
- **Storage after test:** 15 GiB free of 51 GiB (71% used), above the 10 GiB hard floor and at the 15 GiB warning threshold.
- This test created no source-code changes. Existing unrelated enrichment evidence files remain unstaged and were not modified by this capacity exercise.

## Founder-directed next step — independent external load test proposal

### Recommended option: Grafana Cloud k6 Free

Use **Grafana Cloud k6 Free** for one controlled, protocol-level production test. It is independent of the Sandbox and supports public load zones, encrypted test secrets, and complete-response assertions. Grafana’s free tier is advertised as **$0 with no credit card required** and includes **500 virtual-user hours (VUH) each month**. A test using 50 protocol virtual users for at most two minutes consumes at most `(50 × 2) / 60 = 1.67 VUH`; Grafana bills protocol VUs at 1x and has a one-VUH minimum. The proposed test is therefore within the free tier with an expected service cost of **$0**. [1] [2]

The currently configured Grafana connector is disabled, so Grafana Cloud is not known to be an already-usable account in this task. Enabling it or creating a Grafana Cloud account is a future setup step and must not occur until explicitly approved.

### Exact bounded test shape

- **Load:** exactly 50 protocol VUs; one journey per existing dedicated test identity; no ramp beyond the 50-VU maximum.
- **Duration:** one controlled iteration per VU; hard test cap of two minutes, with no automatic retry or soak loop.
- **Regions:** distribute the 50 VUs evenly between two public Grafana Cloud load zones—for example US East and US West—so the receipt can distinguish one-zone/network behavior from a production-wide result. Grafana supports explicit percentage distribution across public zones. [3]
- **Journey:** reuse the existing safe sequence: login, authenticated identity, business-list read, map-pin read, Library-topic read, and events read. Retain its stop-on-failure behavior.
- **Excluded routes:** all mutations, uploads, notifications, payments, content generation, KinfolkAI/model calls, and browser-VU testing.
- **Full-response definition:** each route must return the expected 2xx status, a complete non-empty body, valid JSON where applicable, and the expected top-level object/field. Receiving an HTTP header without a complete body is a failure.
- **Credentials:** reuse the 30 isolated load-test identities and 20 dedicated audit read-only identities, but place the 50-account credential mapping in one encrypted Grafana Cloud k6 secret—not source code, logs, Git, or the test result. Grafana Cloud k6 secrets are encrypted at rest, retrievable only by the active test by name, and redact values from the UI, scripts, and generated logs. The per-secret 24 kB limit is sufficient for a compact 50-account test map. [4]
- **Output:** persist only masked cohort/account labels, route result, HTTP status, full-body completion, timeout/error class, client p50/p95/max latency by route and load zone, and Railway CPU/memory/network/pool observations for the exact test window.

### How the test will classify a result

| Result pattern | Interpretation |
|---|---|
| Both public zones complete all 50 journeys; Railway stays healthy | The Sandbox/client test source was the likely cause of the earlier failures. |
| Both public zones show incomplete bodies or timeouts while Railway reports edge/upstream latency or errors | A production delivery or capacity issue; investigate Railway with the correlated request IDs and timestamps. |
| Only one public zone fails | A zone-to-edge routing or regional delivery issue, not a general database-capacity conclusion. |
| Railway CPU, memory, or pool waiters rise materially while complete responses deteriorate | A production service/database capacity issue; preserve the receipt and stop further tests. |

### Secondary existing-service option: GitHub Actions plus open-source k6

The GitHub integration is already enabled and the repository has a release-evidence workflow, but it has no capacity-test workflow. The current integration cannot read the repository’s Actions-secret inventory (`403`), so the existing 50-account credentials are **not confirmed as provisioned** for GitHub Actions. A future manual-only workflow could use Grafana’s official setup/run k6 actions and repository secrets, but it would be one hosted-runner location rather than the recommended two-zone measurement. [5]

A five-minute GitHub-hosted Linux 2-core job has a ceiling of **$0.03** if no included minutes remain (`5 × $0.006/minute`); otherwise it uses included minutes and costs $0. GitHub documents 2,000 included minutes/month for Free and Free organizations, 3,000 for Pro/Team, and more for Enterprise. The actual available allowance and repository billing setup were not inspected and should not be assumed. [6]

### Authorization boundary

No Grafana account, connector, secret, script, workflow, CI secret, runner, production configuration, DNS, Cloudflare setting, database setting, or paid test was created or changed by this research. Before any test, obtain explicit approval for the exact k6 script, the 50-VU/two-minute cap, load-zone distribution, secret storage method, and the stated $0 free-tier boundary.

## References

[1]: https://grafana.com/pricing/ "Grafana Cloud pricing — Performance Testing (k6)"
[2]: https://grafana.com/docs/grafana-cloud/platform/pricing-and-usage/performance-testing/ "Grafana Cloud Performance Testing pricing"
[3]: https://grafana.com/docs/grafana-cloud/observe-and-act/testing/k6/author-run/use-load-zones/ "Grafana Cloud k6 load zones"
[4]: https://grafana.com/docs/grafana-cloud/observe-and-act/testing/k6/author-run/manage-secrets/ "Grafana Cloud k6 secrets management"
[5]: https://grafana.com/docs/learning-paths/automate-k6-cicd/add-pipeline-step/ "Add k6 as a CI/CD pipeline step"
[6]: https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions "GitHub Actions billing"

## Founder-authorized 200-user preparation — 2026-10-16

The founder authorized preparation of a **distributed staged test to 200 simultaneous users**, with a controlled KinfolkAI capacity check after the core journey, while prohibiting execution of a paid test or infrastructure change without a separate approval.

### Prepared, not executed

- Added a Grafana Cloud k6 core-journey script with fixed 50, 100, 150, and 200-VU stages, ten minutes per stage, strict complete-body thresholds, and an audit-session correlation header.
- Added a separate one-turn-per-user KinfolkAI script for 4, 8, and 12 concurrent turns only. It excludes web research, connected apps, images, health data, reminders, uploads, notifications, and all user-facing mutations.
- Added an exact 200-account lifecycle candidate using only the `mwm-capacity-001` through `mwm-capacity-200` test namespace. The lifecycle has explicit provision, verify, and cleanup guards, rejects ordinary-account collisions, and never logs credentials.
- Added a narrow source-only business-profile-view safeguard: an `is_load_test` account can load a real public profile without adding synthetic view analytics to that business. The core k6 script refuses to run until this safeguard is deployed.
- Added [the operational runbook](../../scripts/load-tests/MWM_GRAFANA_CLOUD_CAPACITY_RUNBOOK_2026-10-16.md) with Grafana secret handling, four-zone execution configuration, exact gates, stop conditions, receipts, and cleanup steps.

### Validation

Focused source validation passed: 3 test files / 11 tests, including the profile-view test-account policy, exact identity lifecycle boundaries, and the existing enrichment API contract. Both k6 scripts passed JavaScript syntax checks and `git diff --check` passed.

The API package typecheck has **no errors in the new capacity-test source**. It still exits non-zero with the pre-existing 17 `pausedAt` declaration errors in `src/routes/kinfolk.ts`; these are unrelated to this preparation and were not modified.

### Bounds and current status

The four core stages total **5,000 VU-minutes / 83.33 VU-hours**. The maximum stage is **200 VUs for 10 minutes / 33.33 VU-hours**. The AI sequence permits exactly **24 turns** across its three stages and never exceeds the application’s existing four-active-generation queue.

No production deployment, Railway/DNS/Cloudflare/database configuration change, Grafana account/project/secret, test identity, user session, live traffic, or KinfolkAI provider request has been created by this preparation. Storage remains **15 GiB free** of 51 GiB, at the warning threshold and above the 10 GiB hard floor.
