# Mapping With Melanin — Controlled 30-Tester Capacity Test Plan

**Status:** Prepared for owner approval. **No traffic has been generated.**  
**Purpose:** Validate that the live platform can support a realistic first-wave tester cohort without crashes, connection-pool starvation, error spikes, or KinfolkAI degradation.

## Scope and city roster

The working roster uses the 20 domestic cities from the prior geographic audit plus **Phuket** as the international scenario. This creates 21 location scenarios. The proposed 30 virtual tester sessions distribute one tester to every domestic city, two to Phuket, and the remaining eight across the highest-likelihood initial-use cities.

| Base city scenarios: one session each | Additional concurrent sessions | Total |
|---|---:|---:|
| Philadelphia, Atlanta, Houston, Washington DC, Los Angeles, New York, Chicago, New Orleans, Detroit, Baltimore, Memphis, Dallas, Miami, Charlotte, Columbia SC, Birmingham, Oakland, Newark, Richmond, Nashville | — | 20 |
| Phuket | 1 additional session | 2 |
| Philadelphia, Atlanta, Houston, Washington DC, Los Angeles, New York, Chicago, Miami | 1 additional session each | 8 |
| **Total** |  | **30 simultaneous tester identities** |

> If Phuket is intended to replace one of the 20 domestic cities rather than be an additional international scenario, identify the city to replace before the test starts. The current plan treats Phuket as additive because it is a campaign-critical destination.

## Two safe approaches

| Approach | What it proves | Tradeoffs | Setup complexity |
|---|---|---|---|
| **Isolated pre-production rehearsal** | Whether the application, database settings, connection pool, and Kinfolk request path can handle the full 30-session pattern without affecting real testers | Most controlled and safest, but only predictive if the environment, limits, and provider integrations match production | Moderate |
| **Controlled production canary** | Exact live behavior of Railway, the production database, client assets, authentication, and OpenAI-backed KinfolkAI | Creates real but tightly capped traffic; requires explicit owner approval, live monitoring, test accounts, and a kill switch | Moderate to high |

The recommended sequence is an isolated rehearsal followed by a short, explicitly approved production canary. The production canary must be a **load test**, not a synthetic attempt to simulate user-created community activity. It must not post public reviews, create community notifications, trigger business-demand signals, send outreach, modify real profiles, or create durable social data.

## Test traffic profile

The objective is to reproduce normal early-tester behavior rather than create a single endpoint spike. Each virtual tester uses an isolated test account and a unique city assignment.

| Phase | Concurrent sessions | Duration | Traffic behavior | Continue only when |
|---|---:|---:|---|---|
| Baseline | 1 | 3 minutes | Login/session restore, travel page load, preferences read, one browse action | Health is green; no 5xx or authentication failures |
| Warm ramp | 5 | 5 minutes | Staggered arrivals; browse/map/session reads; a limited KinfolkAI sample | Error rate remains below 1%; no restarts |
| Mid-load | 15 | 10 minutes | City-specific browse pattern; one Kinfolk query for a controlled subset; read-only preference validation | Latency and database wait metrics remain within thresholds |
| Full cohort | 30 | 15 minutes | All cities active, 1–2 actions/minute per session, maximum one Kinfolk request per tester | No abort threshold is crossed |
| Recovery | 0 new sessions | 10 minutes | Observe API, database, and worker recovery | Connections return to baseline; no queued work remains |

### Per-tester action mix

| Action class | Approximate share | Guardrail |
|---|---:|---|
| Route loads, directory/map browsing, saved-session reads | 60% | Read-only requests; location values limited to the assigned test city |
| KinfolkAI chat | 25% | At most one controlled, non-sensitive query per tester; arrivals staggered to protect model and database capacity |
| Taste Profile read/hydration check | 10% | Read-only; no repeated save loops |
| One controlled preference save in isolated test accounts | 5% | Only for explicitly designated accounts; reset after the test |

## Required test queries

Each query is informational and avoids sensitive-profile signals. The query list samples location routing, cultural context, and controlled Kinfolk response load without producing public activity.

| Scenario | Example query |
|---|---|
| Philadelphia | “Find a community-friendly place for dinner in Philadelphia.” |
| Atlanta | “What is the vibe for Black-owned brunch in Atlanta?” |
| Houston | “Help me plan a relaxed Saturday in Houston.” |
| Washington DC | “Show a culturally rich afternoon in Washington DC.” |
| Los Angeles | “What should I explore in Los Angeles this weekend?” |
| New York | “Find a community-friendly coffee stop in New York.” |
| Chicago | “Suggest a family-friendly Chicago activity.” |
| New Orleans | “What is a good cultural experience in New Orleans?” |
| Detroit | “Suggest a Detroit small-business discovery route.” |
| Baltimore | “Where can I find community-centered food in Baltimore?” |
| Memphis | “Plan a Memphis music and food afternoon.” |
| Dallas | “Suggest a welcoming Dallas wellness activity.” |
| Miami | “What is a relaxed Miami community outing?” |
| Charlotte | “Find a community-friendly Charlotte weekend stop.” |
| Columbia SC | “Suggest a Columbia SC cultural discovery.” |
| Birmingham | “What is a welcoming Birmingham community spot?” |
| Oakland | “Plan a relaxed afternoon in Oakland.” |
| Newark | “Find a culturally relevant Newark activity.” |
| Richmond | “What should I explore in Richmond?” |
| Nashville | “Plan a Nashville music-and-food outing.” |
| Phuket | “Help me plan a community-aware birthday dinner in Phuket.” |

## Monitoring requirements

The test is not authorized to start until Replit confirms that the following production or pre-production monitoring views are open for the full test window.

| Surface | Monitor | Required visibility |
|---|---|---|
| Railway service | Request count, 2xx/4xx/5xx rates, p50/p95 latency, CPU, memory, deploy/restart events | Live dashboard and logs |
| PostgreSQL/Supabase-compatible database | Active connections, max connections, connection waits, query latency, lock waits, CPU/memory | Live metrics or `pg_stat_activity`/connection dashboard |
| KinfolkAI/OpenAI path | Request count, response latency, provider failures, rate-limit events, timeout events | Application logs plus provider/error telemetry |
| Authentication/session path | Login/session refresh success rate, 401/403 rate | Application logs and Railway request metrics |
| Browser client | Failed asset loads, uncaught errors, API error states | Test-run artifacts and browser console capture |

## Go/no-go and abort thresholds

The values below are conservative release thresholds. Replit may propose tighter limits based on actual Railway plan limits and database sizing, but may not relax them without owner approval.

| Signal | Green | Pause / investigate | Abort immediately |
|---|---|---|---|
| HTTP 5xx rate | 0% | Any isolated 5xx requiring diagnosis | ≥1% over 60 seconds or three consecutive 5xx on the same critical route |
| HTTP 429 rate | 0% | Any unexpected 429 | Sustained 429s for 30 seconds |
| Static/read API p95 | ≤2.5 seconds | 2.5–4 seconds | >4 seconds for two consecutive minutes |
| KinfolkAI p95 | ≤20 seconds | 20–30 seconds | >30 seconds or unexpected timeout/connection errors |
| Railway CPU or memory | <70% sustained | 70–80% sustained | >80% sustained, OOM indication, or restart |
| Database active connection utilization | <70% of configured ceiling | 70–80% or measurable waits | >80%, connection waits, pool exhaustion, or lock growth |
| Authentication failures | 0% unexpected | One isolated failure | Repeated unexpected 401/403s or session-loss pattern |

**Kill switch:** Stop new virtual users immediately, cancel in-flight requests where possible, and preserve logs/metrics. Do not retry blindly. The owner is notified first within five minutes if an abort condition is reached.

## Decision rule: whether to increase the connection pool

Do **not** increase the database connection pool because 30 testers exist on paper. Increase it only if the controlled test proves all of the following: active connections are persistently above 70% of the configured maximum, connection-acquisition waits occur, and application latency/error behavior improves when the pool is raised in an isolated rehearsal.

A larger pool can make an undersized database less stable if it increases concurrent database work beyond available CPU or memory. If the test shows application CPU, database CPU, or OpenAI latency—not connection waits—is the bottleneck, changing the pool will not solve the risk.

## Required test setup from Replit

Before the owner approves the production canary, Replit must provide:

1. **Thirty isolated test identities** or an authorized equivalent test-session mechanism. Test accounts must be clearly identifiable and excluded from community feeds, business analytics, demand signals, notifications, influencer matching, and Search-to-Brick aggregation.
2. A header, account flag, or run identifier such as `mwm-load-test-YYYYMMDD` that allows all test events to be filtered from operational data.
3. A documented reset procedure for the small number of permitted preference writes.
4. Live Railway and database monitoring access or an on-call engineer who will watch the required metrics throughout the window.
5. The configured application connection-pool maximum, database connection maximum, Railway resource limits, and any OpenAI/AI-rate-limit constraints.
6. A written confirmation that the Apple review window is not active, or that the test is running on an isolated environment. No traffic test should be introduced during an Apple review freeze.

## Owner approval required before execution

This plan has intentionally not run any load against production. To authorize the controlled production canary after the rehearsal, reply with a clear statement such as:

> “I approve the 30-session controlled capacity test on [environment] during [time window]. Abort on the stated thresholds. Do not create public community, business, or demand-signal data.”

Once approved and the monitoring/test-account prerequisites are confirmed, the test can be executed and a capacity recommendation will be based on observed metrics rather than assumptions.
