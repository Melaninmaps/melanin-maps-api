# Copy and paste this prompt to Replit

```text
P0 FOLLOW-UP — REPAIR KINFOLK → LIBRARY ACTION RESOLUTION AND WEB DEEP LINK

This is a narrow fix based on independent production verification of deployment bd67211b. Do not treat the existence of source code as proof of user-facing behavior.

## Verified production failures

### Failure 1 — Kinfolk returns no Library action

Authenticated request from an isolated load-test account:

```text
POST /api/kinfolk/chat
Prompt: “Tell me about African diaspora history and show me the Library sources.”
HTTP 200
intentClass: culture_entertainment
reply: present
libraryAction: null    ← FAILURE
```

The verified active Library topic exists:

```text
id: fbfbc161-5121-4eca-a0a4-c35731b010f6
name: African Diaspora History
category: diaspora
node type: general
enabled: true
```

The current resolver maps `culture_entertainment` only to category `culture`, then performs a strict category match. That misses the valid `diaspora` topic.

### Failure 2 — web Library deep link does not open the selected Book

The valid URL:

```text
/library?topic=fbfbc161-5121-4eca-a0a4-c35731b010f6&focus=evidence
```

loads the Library browse grid, not the selected African Diaspora History evidence panel. The topic exists in the live 256-topic API response. The effect code is present but does not produce the member-facing outcome.

## Strict no-touch boundary

Touch only:

- `artifacts/api-server/src/lib/library-growth-engine.ts` or the direct resolver module;
- `artifacts/api-server/src/routes/kinfolk.ts` only if needed to call the corrected resolver;
- `artifacts/web/src/pages/library.tsx` and narrowly required router/deep-link client code;
- focused tests, migration-free diagnostics, and deployment artifact sync.

Do NOT modify login/auth, database schema, Library evidence data, Kinfolk model/prompt/voice behavior, Map rendering, business pages, community feedback, Safety Hub, mobile UI, or unrelated routes.

## Required repair 1 — category aliases and deterministic published-node matching

Replace the one-to-one intent category string map with a deterministic alias resolver. It must not expose candidates, raw demand signals, or unpublished nodes.

At minimum:

```text
culture_entertainment → [culture, diaspora, heritage, history, community_culture]
medical_health → [health]
legal_regulated → [legal]
financial_regulated → [financial]
business_discovery → [business]
hobby_lifestyle → [lifestyle]
general_knowledge/current_information → [general, history, education, geography]
```

Use a safe resolver order:

1. If destination is present, prefer an enabled published geography node matching canonical geography/title aliases.
2. For a known subject such as African diaspora history, use case-insensitive canonical title/normalized-name keyword matching before broad category fallback.
3. Match only `enabled = TRUE`, `status = 'published'`, and allowed member-visible node types (`book`, `general`, `chapter`, `geography` as appropriate).
4. If multiple valid topics match, choose deterministically by exact normalized-title match, evidence quality/source count, credibility score, and stable ID tie-breaker.
5. Return null only when no published eligible topic exists.

For the verified prompt above, the response MUST include exactly one non-null action shaped like:

```json
{
  "type": "open_library_node",
  "topicId": "fbfbc161-5121-4eca-a0a4-c35731b010f6",
  "focus": "evidence",
  "label": "Open \"African Diaspora History\" in the Library"
}
```

## Required repair 2 — reliable web deep-link behavior

Make `/library?topic=<id>&focus=evidence` reliably open the selected `KnowledgeBookPanel` after the topic list has loaded.

Required implementation behavior:

1. Parse `topic` and `focus` with a router/location-aware hook, not a fragile interval that can miss asynchronous state updates.
2. React when the loaded `topics` array changes as well as when the URL changes.
3. Resolve the ID from the existing live topic list.
4. Set the active/browse view and selected topic once, without a race condition or five-second silent failure.
5. Preserve normal browse behavior when `topic` is absent or invalid.
6. With `focus=evidence`, place keyboard/focus/scroll attention on the visible sources area after the panel opens, without changing page layout elsewhere.
7. Do not fetch or reveal draft/candidate/private nodes from query strings.

## Mandatory automated tests

Add tests that fail before this repair and pass after it:

1. Resolver unit test: `culture_entertainment` + African Diaspora History returns the exact live topic ID above.
2. Resolver unit test: a valid `diaspora` category node is returned for a culture/heritage request.
3. Resolver security test: drafts, disabled nodes, candidates, and private signal data cannot become actions.
4. Chat integration test: the African diaspora prompt returns HTTP 200, non-empty reply, and the exact `open_library_node` action.
5. Web component/integration test: open `/library?topic=<id>&focus=evidence`, wait for the topic API, then assert the selected panel title and at least one visible source link.
6. Invalid topic ID test: remains safely in browse mode and has no error loop.
7. Regression test: ordinary Library browse/category navigation still works.

## Required administrator proof — no screenshots-only claim

Run and return these exact read-only production outputs after deploy. Redact any personal values; aggregate counts and IDs are enough.

### A. Worker health and candidate totals

```sql
SELECT
  COUNT(*) AS total_candidates,
  COUNT(*) FILTER (WHERE status = 'needs_review') AS needs_review,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved,
  COUNT(*) FILTER (WHERE status = 'materialized') AS materialized,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
  MAX(updated_at) AS latest_candidate_update
FROM library_growth_candidates;
```

Return the authenticated `GET /api/admin/library-growth/worker-health` response from an actual admin account as well.

### B. Load-test exclusion proof

```sql
SELECT
  COUNT(*) FILTER (WHERE is_load_test = TRUE) AS load_test_signal_rows,
  COUNT(*) FILTER (WHERE is_load_test = TRUE AND learning_eligible = TRUE) AS erroneous_eligible_load_test_rows,
  COUNT(*) FILTER (WHERE is_load_test = TRUE AND candidate_id IS NOT NULL) AS erroneous_load_test_candidate_links
FROM library_growth_signals;
```

Required result:

```text
load_test_signal_rows = 0 OR all load-test rows are learning_eligible = false;
erroneous_eligible_load_test_rows = 0;
erroneous_load_test_candidate_links = 0.
```

If the actual schema has different column names, return the equivalent query and explain the mapping. Do not omit this proof.

## Deployment and independent verification handoff

1. Commit only this narrow repair plus generated production artifacts required by the static server.
2. Follow the two-commit/rebuild-from-HEAD deployment process so root `web-static/` and runtime artifacts are synchronized.
3. Return: feature commit SHA, rebuild SHA, Railway deployment ID, `railway_sha`, `built_from_sha`, matching bundle hashes, and `stale_bundle: false`.
4. Return the six passing tests, admin proof above, and a browser recording or screenshot sequence showing the actual Kinfolk prompt, non-null action, action click, selected Library panel, and live source links.
5. Do not call the feature complete until Manus independently repeats the end-to-end test.
```
