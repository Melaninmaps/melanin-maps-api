# Kinfolk Entertainment — Verified Cited Availability Source Handoff

**Status:** **SOURCE COMPLETE / AWAITING CONTROLLED INTEGRATION AND STAGING ACCEPTANCE**
**Repository:** `Melaninmaps/melanin-maps-api`
**Branch:** `feature/kinfolk-entertainment-web-search-first-20261016`
**Latest source commit:** `57f8da7093dd4ee347f897b5c2688f7b9368dfff` — `feat: verify cited entertainment availability`
**Predecessors included in branch history:** availability foundation `1f00d195`, personalization continuation `77beb137`, cited-web source extension `7c4dacf`.

## Completed source behavior

### 1. Narrow verified streaming answers

For a member’s **explicit current** question containing a specific title and selected country, Kinfolk uses the existing configuration-gated OpenAI cited-web adapter once. It may say, for example, that a title is currently available on a named service only when **all** of these deterministic checks pass:

1. The returned URL citation is safe HTTPS and belongs to a supported **official first-party streaming domain**.
2. The citation-associated text and citation metadata identify the **exact requested title**.
3. The citation-associated text identifies the member’s **requested country**.
4. The cited text has a direct **current availability** statement.
5. A supplied source date is not older than 45 days; undated evidence must still contain explicit current-language evidence.
6. The claimed service is identified in the cited text and agrees with the official source domain.

If the cited text explicitly supports it, Kinfolk can distinguish only these facts:

| Cited fact | Member-facing phrasing |
|---|---|
| Included with subscription | “The cited official title page identifies it as included with a subscription.” |
| Rental | “The cited official title page identifies a rental option.” |
| Purchase | “The cited official title page identifies a purchase option.” |
| Availability with no pricing/entitlement detail | “The cited official title page confirms viewing availability, but does not establish whether it is included or requires an extra charge.” |

`included_only` is applied before answering: only evidence explicitly supporting inclusion is eligible. A saved service is never treated as an entitlement.

### 2. Exact showtime answers

A showtime response is allowed only for a cited page hosted by an allow-listed official cinema operator and only when the cited text identifies the exact title, member-provided city, selected country, ISO date, and local start time. It returns the official source link but **does not create or infer a ticket URL**.

### 3. Conversation continuity, narrowly scoped

A follow-up such as “Where can I watch it?” resolves the title only if exactly one explicit title is unambiguous in the **current private session**. The lookup never reads another session or long-term memory. Availability replies and their existing source metadata are persisted through the established deterministic session pathway, so a subsequent explicit follow-up can resolve safely.

### 4. Safe failures

Kinfolk does **not** make a factual availability/showtime statement when the source is uncited, non-official, generic, ambiguous, stale, title-mismatched, geography-mismatched, price/entitlement-ambiguous under `included_only`, or conflicts with another cited claim for the same provider. It returns a clear limitation and legitimate source links where available.

## Citation and provider boundaries

- Existing Web/native source-link components continue to render citation links visibly and safely.
- Entertainment web search uses the existing cited OpenAI route only, with one low-budget query, a 10-second bound, and a five-minute non-member-specific cache. The entertainment path does **not** fall back to an uncited Tavily response.
- No live web request was made while developing or testing this change.
- No JustWatch, International Showtimes, Watchmode, MovieGlu, TMDB, account, trial, API key, payment, or other paid provider was configured or called.
- The existing provider abstraction is retained for a future separately approved integration.

## What is still not supported without a licensed provider

This is **not** a structured entertainment-data provider integration. Do not represent these as complete:

- provider-backed offers, subscription entitlement truth, price, rental/purchase catalog, or freshness SLA;
- broad provider/cinema coverage, theater inventories, ticket availability, ticket/deep links, or checkout;
- universal geographic coverage or a guarantee that the cited-web tool will return evidence;
- automatic monitoring, background lookup, notifications, device acceptance, staging acceptance, or member acceptance.

## Validation evidence

| Validation | Result |
|---|---|
| Database declaration build | Passed |
| API TypeScript | Passed |
| API focused regression suite | **21/21 passed** across 5 files |
| Web TypeScript + focused settings tests | Passed; **2/2** |
| Native TypeScript + focused settings tests | Passed with existing `--ignoreDeprecations 6.0` compatibility override; **2/2** |
| `git diff --check` before source commit | Passed |

The API regression coverage includes official-source acceptance; country mismatch; stale, generic, and ambiguous evidence; same-provider conflict; official cinema exact showtime requirements; citation-context parsing; cited source resolver integration; unavailable search; title/country/city prerequisites; and unambiguous session follow-up resolution.

## Controlled integration instruction

1. Resolve the authoritative Kinfolk candidate at integration time. Do not assume this branch is already in it.
2. Merge `57f8da7093dd4ee347f897b5c2688f7b9368dfff` only after its predecessors are present, or merge the full feature branch as one bounded unit.
3. Preserve newer Kinfolk safety, privacy, and citation handling during any `routes/kinfolk.ts` or `web-search.ts` conflict resolution.
4. Re-run the API, Web, and native focused suites recorded above. The next separate authorization should define controlled staging acceptance, not provider activation.
5. Keep automatic monitoring, push delivery, structured offers, ticket flows, and all provider activations disabled.

## Related records

- [Cited evidence research](../plans/KINFOLK_ENTERTAINMENT_CITED_EVIDENCE_RESEARCH_2026-10-16.md)
- [Provider decision packet](../plans/KINFOLK_ENTERTAINMENT_PROVIDER_DECISION_PACKET_2026-10-16.md)
- [Single ChatGPT handoff](CHATGPT_HANDOFF_KINFOLK_ENTERTAINMENT_DISCOVERY_2026-10-16.md)
- [Cumulative integration inventory](../../replit/combined-release/KINFOLK_CUMULATIVE_INTEGRATION_INVENTORY_2026-10-16.md)
- [Release acceptance matrix](../../replit/combined-release/ACCEPTANCE_MATRIX.md)
