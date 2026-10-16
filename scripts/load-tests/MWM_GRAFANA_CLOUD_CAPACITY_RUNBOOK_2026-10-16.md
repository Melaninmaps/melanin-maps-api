# MWM distributed capacity test runbook — 2026-10-16

This is the **preparation record only**. It does not provision accounts, deploy code, create a Grafana account, configure a paid service, or run traffic against production.

## Purpose and boundaries

The previous 50-user run proved that Railway remained healthy but could not distinguish client delivery failures from complete application journeys. This runbook prepares a geographically distributed Grafana Cloud k6 test so that complete client-side response outcomes, the controlled test journey, and Railway resource observations are captured together.

The core test uses exactly four stages: **50, 100, 150, and 200 simultaneous virtual users**. A stage runs for ten minutes and then stops. The 200-user stage is the required upper bound; this is not a soak test and it does not auto-scale beyond 200 users.

The test may access only these member-visible read surfaces:

- sign-in and session identity;
- business discovery and one business profile;
- map viewport discovery;
- Community read feed;
- Events read list; and
- Library article list.

It deliberately does **not** send messages, create a post, save a place, follow a topic, upload media, create a reminder, access health data, use connected accounts, make a payment, or modify business data. Community posting is represented only by the existing server-side suppression behavior for `is_load_test` accounts and is not issued by the load script.

## Prepared source assets

| Asset | Purpose | Production state |
|---|---|---|
| `mwm-launch-capacity.k6.js` | Core member journey, 50–200 simultaneous VUs, strict stop thresholds | Prepared; not run |
| `mwm-kinfolk-ai-capacity.k6.js` | One short KinfolkAI prompt per isolated account at 4, 8, then 12 concurrent turns | Prepared; not run |
| `provisionCapacityTestUsers.ts` | Exact 200-account lifecycle with explicit provision, verify, and cleanup guards | Prepared; not run |
| `profile-view-policy.ts` | Prevents test accounts from adding synthetic profile views to real business analytics | Source candidate only; not deployed |

The identity source uses only the tightly namespaced accounts `mwm-capacity-001@capacity.mwm.internal` through `mwm-capacity-200@capacity.mwm.internal`. It neither changes nor deletes the existing `mwm-loadtest-*` and `manus.tester.*` cohorts. The new cohort is necessary because the present source does not provide a safe, shared external-runner credential lifecycle for the old accounts. Existing test accounts remain available and unaffected.

## Required deployment gates before traffic

The following gates are deliberately separate. No one may interpret preparation as permission to run the test.

1. **Deploy the narrow test-account profile-view safeguard.** Test users must return `recorded: false` from `POST /api/businesses/:id/view`, and a test-account business-detail request must not insert a profile-view row. This prevents test traffic from changing a real business's analytics.
2. **Provision exactly 200 dedicated accounts in the new namespace.** The lifecycle script refuses to write unless `CAPACITY_TEST_IDENTITY_WRITE_APPROVED=PROVISION_200_ISOLATED_TEST_USERS` is present and the password has at least 16 characters. It rejects any collision with an ordinary user and sets `is_load_test=true` and `marketing_opt_out=true`.
3. **Use one newly generated password only as a Grafana Cloud secret.** It must be supplied to the provisioning job as `CAPACITY_TEST_PASSWORD` and saved in Grafana Cloud as `mwm_capacity_200_password`. It must never be committed, pasted into chat, included in k6 environment variables, or emitted in results.
4. **Run identity verification.** The script must report exactly 200 present accounts, 200 `is_load_test` accounts, and zero ordinary-account collisions before starting traffic.
5. **Confirm live `/api/readyz` immediately before every stage.** A non-200 result cancels that stage.

The provisioner is a manual script, not a startup migration. After an approved production release, it must run once in a Railway production one-off execution context so it uses the production database; it must not be run from a laptop or Sandbox with copied database credentials.

## Grafana Cloud k6 configuration

Use a Grafana Cloud k6 **scripted** performance project, not browser testing. Grafana Cloud secrets are encrypted at rest and available only to active tests; `secrets.get()` retrieves them at runtime. The script keeps the password out of source and generated logs.[1]

Create one secret:

- **Name:** `mwm_capacity_200_password`
- **Value:** the same new password used during the isolated-account provisioning gate
- **Labels:** `mwm`, `capacity-test`, `non-production-identity`

Do not create any secret containing a production user credential, a Railway token, an OpenAI key, or an administrator session.

Create one ordinary cloud environment variable for each staged run:

```text
MWM_BASE_URL=https://www.mappingwithmelanin.com
MWM_AUDIT_SESSION=mwm-capacity-YYYYMMDD-stageNN-randomsuffix
MWM_TARGET_VUS=50 | 100 | 150 | 200
MWM_CORE_DURATION=10m
MWM_DISTRIBUTED_LOAD_ZONES=4
MWM_PROFILE_VIEW_GUARD=deployed
```

Configure **four U.S. load zones**, each carrying 25% of the virtual users. This is a safety requirement, not an optimization: the existing login protection is deliberately per source IP. With 50 VUs per zone at the 200-user maximum, the test avoids mistaking one concentrated load generator for a member-facing authentication failure. The `constant-vus` executor holds a fixed VU count for the stated duration.[2]

Run the core stages serially in this order:

1. 50 VUs for 10 minutes;
2. wait 15 minutes while reviewing Grafana and Railway results;
3. 100 VUs for 10 minutes;
4. wait 15 minutes while reviewing results;
5. 150 VUs for 10 minutes;
6. wait 15 minutes while reviewing results;
7. 200 VUs for 10 minutes.

**Stop and do not advance** if any stage shows unexpected 5xx responses, more than 1% failed core requests, a failed identity rate, failed full-journey rate, or a credible Railway resource alert. The k6 thresholds are configured with `abortOnFail`; Grafana Cloud evaluates cloud thresholds on an interval, so the stop can be delayed briefly after an observed breach.[3]

## Exact workload and measured outcomes

Each VU signs in once, checks authenticated identity, loads Philadelphia directory search, a bounded Philadelphia map viewport, Community read feed, Philadelphia events, Library articles, and one discovered business profile. It then rotates those same **read-only** routes every 6–10 seconds. The VU keeps its own secure session cookie; it does not share a user session with any other VU.

The runner records:

- complete 2xx JSON journey responses versus transport timeouts;
- per-route p95/p99 latency for sign-in, directory, profile, and map;
- unexpected 5xx count;
- successful sign-in and full-journey rate; and
- the exact audit-session header for correlated Railway log review.

Immediately after each stage, capture Railway API and PostgreSQL CPU, memory, response rate, error rate, logs, and `/api/readyz`. Results must separately state runner-side timeouts, server-side error responses, and completed client journeys. A healthy Railway deployment with a failed client journey is **not** a pass.

## Controlled KinfolkAI test

Run this only after a successful 200-user core stage and a separate authorization to incur model-provider usage.

The AI script executes exactly one low-risk prompt per isolated account. It uses no web research, no connected-app data, no image understanding, no health context, no reminders, and no persistent member data beyond the isolated test account's own bounded session/usage rows. It progresses through 4, then 8, then 12 concurrent turns—never more. The current application queue permits four active generations, so the higher stages intentionally measure queue behavior rather than force unlimited provider concurrency.

The controlled prompt is:

> In one concise sentence, explain what a community resource is.

This creates at most **24 answer turns** across all three AI stages. The live model configuration targets a 160,000-token-per-minute safety budget and caps visible answers at 600 tokens; the run therefore remains far below the route's one-minute token ceiling if stages remain serial and the 12-turn stage stays a single iteration per VU. The actual provider invoice cannot be predicted from source alone because input context and provider billing determine it. The execution receipt must report actual provider/model telemetry and stop if a provider-rate-limit, quota, or unexpected server failure occurs.

AI environment variables:

```text
MWM_BASE_URL=https://www.mappingwithmelanin.com
MWM_AUDIT_SESSION=mwm-ai-capacity-YYYYMMDD-stageNN-randomsuffix
MWM_AI_VUS=4 | 8 | 12
```

## Cleanup and evidence retention

After the approved test sequence and result export are complete, run the lifecycle script in `--mode=cleanup` only with `CAPACITY_TEST_IDENTITY_CLEANUP_APPROVED=REMOVE_200_ISOLATED_TEST_USERS`. It deletes sessions and users only in the exact `mwm-capacity-###@capacity.mwm.internal` namespace and never touches existing test cohorts or ordinary accounts.

Keep these receipts:

- Grafana k6 stage summaries and complete-response metrics;
- a timestamped Railway metric snapshot and filtered logs for every audit session;
- pre/post readiness checks;
- account lifecycle summaries containing counts only, never credentials or individual email addresses; and
- the final cleanup result.

## Cost and access position

No paid test has been initiated. Grafana Cloud must be checked at launch for the organization’s actual included performance-testing allowance and selected regional load-zone availability. The full core sequence consumes 5,000 virtual-user minutes, or **83.33 VU-hours**; the 200-user stage alone consumes **33.33 VU-hours**. The AI stages are only 24 one-iteration VUs and are negligible in runner duration but do consume model-provider usage.

If the configured Grafana plan cannot cover the staged test without payment, stop before creating a runner or starting traffic. Do not add a card, upgrade a plan, or substitute a paid service without a distinct authorization.

## Current status

- **Production infrastructure:** unchanged.
- **Accounts:** no new accounts provisioned.
- **Grafana Cloud:** no project, secret, or test run created by this task.
- **Core test source:** syntax-checked; not executed.
- **Test-only profile-view isolation:** focused unit test passed; source candidate still requires its own reviewed production deployment before the core script can run.

## References

[1]: https://grafana.com/docs/grafana-cloud/observe-and-act/testing/k6/author-run/manage-secrets/ "Grafana Cloud k6 secrets management"
[2]: https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/constant-vus/ "Grafana k6 constant virtual users"
[3]: https://grafana.com/docs/k6/latest/using-k6/thresholds/ "Grafana k6 thresholds and abort controls"
[4]: https://grafana.com/docs/k6/latest/using-k6/secret-source/cloud/ "Grafana Cloud secret source"
