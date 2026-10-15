# Kinfolk Interest Intelligence — Combined Merge & Release Runbook

**Feature branch:** `feature/kinfolk-interest-intelligence-20261015`

**Merge requirement:** Complete and validate the separate repair work first. Do **not** deploy this feature branch by itself and do **not** apply the feature migration to shared staging before the combined candidate exists.

## What this branch adds

- A **member-controlled interest layer**, separate from private memory, using only broad non-sensitive labels.
- Controls for **repeated-topic recognition** and **proactive discoveries**, both defaulting to off.
- A reviewable interest lifecycle: manual add/confirm, pause, restore, remove, and deterministic expiry for time-bound signals.
- A compact **For You** experience in native and web, using only governed MWM business listings and active future MWM events.
- Useful actions: open, save a business, share, and “not interested.” Recommendation feedback never changes an interest profile on its own.
- Item-level Circle sharing: only a confirmed, non-temporary interest can be shared with a Circle. Saves, chat, search text, profile data, and private activity are not shared.
- A cached, request-path schema readiness gate so the additive feature migration is available even when broad startup migration writers are intentionally disabled.

## Safeguards deliberately enforced

| Concern | Release behavior |
|---|---|
| Silent profiling | No recommendation is based on a tentative signal; permanent use requires an explicit confirmation or an explicitly saved existing profile category. |
| Sensitive/third-party content | Health/wellness, family/caregiving, disability, identity, relationship, financial, exact-location, and “for someone else” contexts fail closed. |
| Chat/search privacy | Raw chat messages and raw search text are not stored by this layer. Only an allow-listed broad label, source, count, state, and possible expiry are retained. |
| Business claims | Ordinary business results use the existing documented-discovery eligibility predicate. No claim is inferred from name, image, or social media. |
| Event freshness | Events must be active and future-dated before they appear. Age-restricted events are withheld for youth/unknown audiences. |
| AI spend | This feature adds **no model call, search, scraping, or external recommender call**. It uses deterministic in-product ranking and existing governed data only. |

## Exact combined-candidate script

Run this **only after** the repair workstream has a reviewed commit or remote branch. Substitute the actual repaired ref for `REPAIR_REF`.

```bash
set -euo pipefail

BASE_REF='origin/staging/kinfolk-full-candidate-20261014'
REPAIR_REF='REPLACE_WITH_REPAIRED_COMMIT_OR_BRANCH'
FEATURE_REF='origin/feature/kinfolk-interest-intelligence-20261015'
CANDIDATE_REF='staging/kinfolk-repair-interest-intelligence-20261015'

# Start from the known staging candidate, then combine repair first and feature second.
git fetch origin --prune
git switch -C "$CANDIDATE_REF" "$BASE_REF"
git merge --no-ff "$REPAIR_REF" -m 'merge: Kinfolk repair workstream'
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
  src/__tests__/kinfolk-interest-intelligence-contract.test.ts --reporter=verbose
pnpm --filter @workspace/web exec vitest run \
  src/__tests__/kinfolk-interest-intelligence.test.ts --reporter=verbose
NODE_OPTIONS=--max-old-space-size=8192 \
  pnpm --filter @workspace/mobile exec vitest run \
  __tests__/kinfolk-interest-intelligence.test.ts --reporter=verbose

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

## Rollback behavior

- Turn **proactive discoveries off** for a member to stop new For You recommendations immediately.
- Turn **repeated-topic recognition off** to stop future behavioral signal collection immediately; existing items remain reviewable until the member removes them.
- If a deployment rollback is needed, revert the application commit. The migration is additive and does not alter business eligibility, user roles, Circle membership, existing memories, saves, or underlying directory data.
