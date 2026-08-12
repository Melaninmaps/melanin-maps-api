# Copy and paste this prompt to Replit

```text
P0 REPAIR — LEGACY PUBLISHED TOPIC RESOLUTION, WEB/MOBILE LIBRARY DEEP LINKS, AND RAILWAY GROWTH-ENGINE PROOF

This is a narrowly scoped correction following independent live verification of deployment cbe60488.

## Verified production facts

The following production topic is real, enabled, and published:

```text
id: fbfbc161-5121-4eca-a0a4-c35731b010f6
name: African Diaspora History
category: diaspora
status: published
enabled: true
node_type: topic
```

The exact authenticated Kinfolk prompt:

```text
Tell me about African diaspora history and show me the Library sources.
```

returns HTTP 200 with a reply but `libraryAction: null`.

The new alias/name resolver is present, but it filters eligible member-visible node types to:

```text
book, general, chapter
```

It excludes the existing published legacy type `topic`, so it cannot return African Diaspora History even though the category aliases and title-message match are correct.

Additionally:

- The web URL `/library?topic=fbfbc161-5121-4eca-a0a4-c35731b010f6&focus=evidence` still loads the Library browse grid without opening the selected evidence panel.
- Mobile `LibraryActionPill` sends `{ topic, focus }` to `/(tabs)/library`, but that screen does not read either parameter.

## Strict no-touch boundary

Touch only:

- `artifacts/api-server/src/lib/library-growth-engine.ts` or the exact published-node resolver;
- the focused Kinfolk action integration test(s);
- `artifacts/web/src/pages/library.tsx` and narrowly required web router/deep-link code;
- `artifacts/mobile/app/(tabs)/library.tsx` plus minimal import(s) required to read navigation parameters and open the existing topic screen/panel;
- focused test files, diagnostics, and required generated deployment artifacts.

Do NOT modify database schema, Library source data, search-signal privacy logic, Kinfolk prompt/voice/model behavior, Map, business pages, community feedback, Safety Hub, auth, or unrelated mobile UI.

## Repair 1 — Include legacy published member-visible topics in resolver

Change only the eligibility predicate in `findMatchingPublishedLibraryNode` so it permits legacy published Library content with:

```sql
node_type IN ('book', 'general', 'chapter', 'topic')
```

Keep all existing safety filters:

```sql
enabled = TRUE
AND status = 'published'
```

Do not expose candidate/draft/disabled/private nodes. Do not normalize or rewrite existing production topic data in this fix.

The deterministic alias/title match already added must remain in place. For the exact African Diaspora prompt above, the output must be:

```json
{
  "type": "open_library_node",
  "topicId": "fbfbc161-5121-4eca-a0a4-c35731b010f6",
  "focus": "evidence",
  "label": "Open \"African Diaspora History\" in the Library"
}
```

## Repair 2 — Web deep link must visibly open selected evidence panel

Make the current web route reliably react to:

```text
/library?topic=<valid-topic-id>&focus=evidence
```

Required behavior:

1. Parse route search parameters using the active router/location state.
2. Re-evaluate after `topics` finishes loading.
3. Resolve the valid topic ID from the loaded member-visible topic list.
4. Set the existing selected-topic panel state and browse tab exactly once.
5. With `focus=evidence`, move visible focus/scroll to the real source list after the panel is mounted.
6. Keep invalid/missing topic IDs safely in normal browse mode, without loops or errors.
7. Do not retrieve or reveal draft/candidate/private topics from a query parameter.

## Repair 3 — Mobile must consume LibraryActionPill parameters

In `artifacts/mobile/app/(tabs)/library.tsx`:

1. Read `topic` and `focus` using the Expo Router parameter hook appropriate to the installed version (`useLocalSearchParams` or equivalent).
2. Once topics load and the passed topic is a member-visible published topic, navigate/open the existing `/library-topic` screen for that topic ID.
3. Propagate `focus=evidence` to the topic screen if supported; otherwise land on the topic screen now and create a separately scoped follow-up only for source-section focus.
4. Ignore invalid/missing values safely.
5. Do not add a parallel Library UI or duplicate topic state.

## Required automated tests — must run and pass before deploy

1. **Resolver legacy-type test:** enabled + published `node_type='topic'` African Diaspora History resolves from the exact prompt.
2. **Security regression:** draft/disabled `node_type='topic'` rows still never resolve.
3. **Chat integration:** `POST /api/kinfolk/chat` with the exact prompt returns HTTP 200, non-empty reply, and the exact non-null action above.
4. **Web deep-link test:** valid `/library?topic=<id>&focus=evidence` waits for async topic load, then visibly renders African Diaspora History and at least one source link.
5. **Web invalid-ID test:** browse grid remains usable; no selected panel/error loop.
6. **Mobile navigation unit/integration test:** `LibraryActionPill` params cause a route/open call for the expected topic ID; invalid ID does nothing unsafe.
7. **Regression test:** normal Library browse and manual topic opening still work.

## Mandatory Railway production proof — return query output, not screenshots only

Run the following after deploy against the Railway production database. Redact fingerprint values; return counts/statuses/IDs.

### A. Worker health and candidate summary

Use the real table/column names. The candidate status column may be `proposed_status`, not `status`.

```sql
SELECT
  COUNT(*) AS total_candidates,
  COUNT(*) FILTER (WHERE proposed_status = 'needs_review') AS needs_review,
  COUNT(*) FILTER (WHERE proposed_status = 'approved') AS approved,
  COUNT(*) FILTER (WHERE proposed_status = 'materialized') AS materialized,
  COUNT(*) FILTER (WHERE proposed_status = 'rejected') AS rejected,
  MAX(updated_at) AS latest_candidate_update
FROM library_growth_candidates;
```

Also provide the production admin response from:

```text
GET /api/admin/library-growth/worker-health
```

using a true administrator session. It must show worker state, last run, totals, error count, and no unhandled worker error.

### B. Production load-test exclusion proof

```sql
SELECT
  COUNT(*) FILTER (WHERE is_load_test = TRUE) AS load_test_signal_rows,
  COUNT(*) FILTER (WHERE is_load_test = TRUE AND learning_eligible = TRUE) AS erroneous_eligible_load_test_rows
FROM library_growth_signals;
```

Required acceptance condition:

```text
erroneous_eligible_load_test_rows = 0
```

If `load_test_signal_rows > 0`, every such row must have `learning_eligible = false`, and no candidate may be created from it. Return the equivalent aggregate/candidate check if linkage is derived through canonical subject keys.

### C. Production topic eligibility proof

```sql
SELECT id, topic_name, category, node_type, status, enabled
FROM knowledge_topics
WHERE id = 'fbfbc161-5121-4eca-a0a4-c35731b010f6';
```

Expected: `diaspora`, `topic`, `published`, and `true`.

## Deployment handoff

1. Run the focused test suite and return the exact output.
2. Use the approved two-commit/rebuild-from-HEAD deployment process and sync all runtime/static artifacts required by the production server.
3. Return feature SHA, rebuild SHA, Railway deployment ID, `railway_sha`, `built_from_sha`, matching bundle hashes, and `stale_bundle: false`.
4. Return the production database proof above.
5. Do not call this complete until Manus independently repeats the exact Kinfolk prompt and web deep-link journey.
```
