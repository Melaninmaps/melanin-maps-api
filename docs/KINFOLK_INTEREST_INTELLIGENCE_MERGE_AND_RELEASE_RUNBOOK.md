# Kinfolk Interest Intelligence — Combined Merge & Release Runbook

**Feature branch:** `feature/kinfolk-interest-intelligence-20261015` at `2770c6788cba4b71219b3fcf1ad848c7d33619f1`

**Authoritative cumulative candidate discovered at integration time:** `staging/kinfolk-full-candidate-20261014` at `f818056c93840794ad08c9bb90b68f2500635a25`.

**Completed repair source:** `candidate/mwm-kinfolk-voice-meaning-live` at `8779b90969f2fe42017830259dfdb823eaf7a8e6`. It is already an ancestor of the authoritative candidate, so the prescribed repair-first order is preserved in the branch ancestry without creating a duplicate merge.

**Combined source candidate:** `integration/kinfolk-interest-intelligence-source-candidate-20261015`, initially merged as `3ca91dc80f66dc51838b93672817f7b8463ecabb` before this runbook receipt.

**Merge requirement:** Complete and validate the separate repair work first. Do **not** deploy this feature branch by itself and do **not** apply the feature migration to shared staging before the combined candidate exists.

## What this branch adds

- A **member-controlled interest layer**, separate from private memory, using only broad non-sensitive labels.
- Controls for **repeated-topic recognition** and **proactive discoveries**, both defaulting to off.
- A reviewable interest lifecycle: manual add/confirm, pause, restore, remove, and deterministic expiry for time-bound signals.
- A compact **For You** experience in native and web, using only governed MWM business listings and active future MWM events.
- Useful actions: open, save a business, share, and “not interested.” Recommendation feedback never changes an interest profile on its own.
- Item-level Circle sharing: only a confirmed, non-temporary interest can be shared with a Circle. Saves, chat, search text, profile data, and private activity are not shared.
- A cached, request-path schema readiness gate so the additive feature migration is available even when broad startup migration writers are intentionally disabled.
- Member-requested external opportunity discovery through the existing citation-only research adapter: explicit consent, city/state input, source/date gates, deduplication, freshness expiry, and manual/daily/weekly limits. External cards are explicitly source-confirmed—not MWM-verified—and never use an uncited fallback.
- Explicit documented hard requirements for quiet/low-sensory, wheelchair access, price, age suitability, service animals, sensory support, and category exclusions. Unknown evidence fails closed.
- Persistent, scoped recommendation feedback: more-like-this category boosts; wrong-assumption/dismissal; hide category; and stop-topic all affect subsequent recommendation selection without silently changing a broad member profile.
- An actual member-approved recommendation-to-Circle route that creates an existing `circle_suggestions` record, preserving the established Circle voting and planning workflow. Interest sharing remains a separate, item-level action.

## Safeguards deliberately enforced

| Concern | Release behavior |
|---|---|
| Silent profiling | No recommendation is based on a tentative signal; permanent use requires an explicit confirmation or an explicitly saved existing profile category. |
| Sensitive/third-party content | Health/wellness, family/caregiving, disability, identity, relationship, financial, exact-location, and “for someone else” contexts fail closed. |
| Chat/search privacy | Raw chat messages and raw search text are not stored by this layer. Only an allow-listed broad label, source, count, state, and possible expiry are retained. |
| Business claims | Ordinary business results use the existing documented-discovery eligibility predicate. No claim is inferred from name, image, or social media. |
| Event freshness | Events must be active and future-dated before they appear. Age-restricted events are withheld for youth/unknown audiences. |
| External research and cost | The default is off and manual. A member must request the bounded research check after opting in. Only the existing configured citation-only provider path is used; no paid provider is activated, no uncited fallback is used, and no background collection occurs. |

## Actual combined-candidate integration record

The integration used the current authoritative cumulative candidate rather than the older assumed baseline. The verified repair was already contained in that source, so `git merge --no-ff origin/candidate/mwm-kinfolk-voice-meaning-live` correctly reported `Already up to date`; Interest Intelligence was then merged second. No conflict was produced and no automatic conflict resolution occurred.

```bash
set -euo pipefail

BASE_REF='origin/staging/kinfolk-full-candidate-20261014' # f818056c...
REPAIR_REF='origin/candidate/mwm-kinfolk-voice-meaning-live' # 8779b909..., already contained
FEATURE_REF='feature/kinfolk-interest-intelligence-20261015' # 2770c678...
CANDIDATE_REF='integration/kinfolk-interest-intelligence-source-candidate-20261015'

# Start from the discovered cumulative candidate, then verify repair ancestry
# before merging Interest Intelligence second. Do not force a redundant repair merge.
git fetch origin --prune
git switch -C "$CANDIDATE_REF" "$BASE_REF"
git merge-base --is-ancestor "$REPAIR_REF" "$BASE_REF" || git merge --no-ff "$REPAIR_REF" -m 'merge: Kinfolk repair workstream'
git merge --no-ff "$FEATURE_REF" -m 'merge: Kinfolk Interest Intelligence'

# Resolve a conflict intentionally; never take an automatic resolution in these areas:
# - artifacts/api-server/src/routes/kinfolk.ts
# - artifacts/api-server/src/lib/startup-migrations.ts
# - artifacts/mobile/components/KinfolkSettingsControlCenter.tsx
# - artifacts/web/src/components/kinfolk/KinfolkExperienceSettings.tsx

git diff --check
pnpm install --frozen-lockfile --ignore-scripts --reporter=append-only

pnpm --filter @workspace/api-server exec vitest run \
  src/kinfolk/__tests__/interest-intelligence-service.test.ts \
  src/kinfolk/__tests__/interest-intelligence-completion.test.ts \
  src/__tests__/kinfolk-interest-intelligence-contract.test.ts \
  src/kinfolk/__tests__/kinfolk-feedback-flywheel-contract.test.ts \
  src/kinfolk/__tests__/kinfolk-route-wiring.test.ts \
  src/kinfolk/__tests__/kinfolk-chat-and-preferences.api.test.ts \
  src/kinfolk/__tests__/governed-requirement-evidence.test.ts \
  src/kinfolk/__tests__/local-business-discovery.test.ts --reporter=verbose
pnpm --filter @workspace/web exec vitest run \
  src/__tests__/kinfolk-interest-intelligence.test.ts \
  src/__tests__/kinfolk-experience-settings.test.ts \
  src/__tests__/kinfolk-behavioral-evidence.test.ts \
  src/__tests__/circles-private-invite-only.test.ts --reporter=verbose
NODE_OPTIONS=--max-old-space-size=8192 \
  pnpm --filter @workspace/mobile exec vitest run \
  __tests__/kinfolk-interest-intelligence.test.ts \
  __tests__/kinfolk-behavioral-evidence.test.ts \
  __tests__/kinfolk-settings-control-center.test.ts \
  __tests__/business-discovery-contract.test.ts --reporter=verbose

pnpm --filter @workspace/api-server exec tsc -p tsconfig.json --noEmit --pretty false
pnpm --filter @workspace/web exec tsc -p tsconfig.json --noEmit --pretty false
NODE_OPTIONS=--max-old-space-size=8192 \
  pnpm --filter @workspace/mobile exec tsc -p tsconfig.json --noEmit --pretty false
pnpm --filter @workspace/web run build

git push -u origin "$CANDIDATE_REF"
```

## Isolated staging acceptance gate

After Railway deploys the **combined candidate** to its isolated non-production environment, validate in this order:

1. Confirm the service is healthy and the feature’s `kinfolk_interest_intelligence_v1` additive migration has completed via its request-path schema gate.
2. Authenticate with a dedicated test member. Confirm `/api/kinfolk/interest-intelligence` returns all three controls as `false` for an untouched account and an empty recommendation list.
3. Add a safe explicit interest such as `street photography` in `arts_and_culture`; turn on proactive discoveries; confirm every recommendation explains the matching interest and appears only from a governed business or a current MWM event.
4. Turn on repeated-topic recognition. Send the same **non-sensitive** topic twice, then confirm it is displayed as a **tentative** review item, not an automatic recommendation. Confirm it, then check that it can be paused and deleted.
5. Submit negative cases—baby product, a friend’s needs, health/wellness, caregiving, financial, family, and protected-characteristic phrasing—and confirm they do not create an interest record.
6. Save a non-sensitive business twice and verify a reviewable discovery signal is tentative; save a health/wellness business and verify no signal is produced.
7. With two test members in a test Circle, explicitly share one confirmed non-temporary interest. Confirm Circle suggestions use only that shared interest and disclose no other profile, save, search, chat, or member identity information.
8. Exercise `View`, `Save`, `Share`, and `Not interested`. Confirm “Not interested” removes only that recommendation and reports `automaticallyChangesInterestProfile: false`.
9. Verify on web and native: **Kinfolk Settings → Your interests & discoveries** loads, controls persist, removal works, and For You is absent while proactive discovery is off.

## TestFlight gate

Create a TestFlight build **only if all of the following are true**:

- The repair merge and this feature merge are both clean and reviewed.
- The combined candidate passes the script above without skipped failures.
- The isolated staging acceptance gate passes, including all negative privacy cases.
- The staging service logs contain no recurring schema-readiness or recommendation failures.
- The team has explicitly selected the combined candidate commit for release.

## Integration validation receipt — 2026-10-15

The following completed on the merged integration worktree. No deployment, database migration execution, provider activation, notification delivery, or mobile build was performed.

| Check | Result |
|---|---|
| Dependency consistency (`pnpm install --frozen-lockfile --ignore-scripts`) | Pass |
| Interest Intelligence and adjacent API tests | Pass — 87 tests across 7 files |
| Web Interest Intelligence, behavioral controls, and private-Circle tests | Pass — 7 tests across 3 files |
| Native Interest Intelligence, behavioral controls, settings, and discovery tests | Pass — 23 tests across 4 files |
| API, web, and native TypeScript checks | Pass |
| Web production build | Pass (non-blocking existing source-map and chunk-size warnings only) |
| Merge conflict marker scan and whitespace check | Pass |

### Inherited test-suite failures deliberately not changed

These failures were discovered by the wider targeted suites but are not caused by the feature integration. The failing test files are unchanged from `f818056c…`, and the Interest Intelligence diff does not alter the asserted routes/components.

1. `artifacts/api-server/src/kinfolk/__tests__/kinfolk-route-wiring.test.ts`: **5 stale string-contract assertions** fail against the already-current cumulative candidate. The assertions require older `verifiedImageUrls` and current-research code-shapes that are absent in both `f818056c…` and the integration candidate. This requires a separate intentional Kinfolk route-test reconciliation; it is not safe to change in this integration task.
2. `artifacts/web/src/__tests__/kinfolk-experience-settings.test.ts`: **1 stale wording assertion** requires the literal `never chat memory` in `PrivatePlacesSettings`. That wording is absent in both `f818056c…` and the integration candidate; the only merged settings change is adding the two Interest Intelligence components.

Neither inherited defect blocks the feature-specific, conversation-signal, settings, For You, business/event discovery, or Circle-path tests listed above. They remain explicit release follow-ups and prevent a claim that the entire historical Kinfolk suite is green.

## Rollback behavior

- Turn **proactive discoveries off** for a member to stop new For You recommendations immediately.
- Turn **repeated-topic recognition off** to stop future behavioral signal collection immediately; existing items remain reviewable until the member removes them.
- If a deployment rollback is needed, revert the application commit. The migration is additive and does not alter business eligibility, user roles, Circle membership, existing memories, saves, or underlying directory data.
