# Kinfolk Family Mode Chat Safety — Source Handoff

**State:** **SOURCE COMPLETE / AWAITING CONTROLLED INTEGRATION AND STAGING ACCEPTANCE**
**Branch:** `fix/kinfolk-family-mode-safety-20261016`
**Source commit:** [`85e066dbbd8917ac4a1dddaddea6f78e9515f5ef`](https://github.com/Melaninmaps/melanin-maps-api/commit/85e066dbbd8917ac4a1dddaddea6f78e9515f5ef)
**Base:** [`1ee1a2926bde9f148c212b749991e76b04ffb9a2`](https://github.com/Melaninmaps/melanin-maps-api/commit/1ee1a2926bde9f148c212b749991e76b04ffb9a2)

## Purpose

This narrowly repairs the gap where **Family Mode was only represented as a feed/community setting**. It now enforces a temporary family-safe delivery profile for the **Kinfolk request path**, including the earlier deterministic business-discovery path that can answer before the usual LLM prompt is constructed.

It does **not** create or modify a Family Mode database table. It uses the existing explicit member setting, `family_settings.family_mode_enabled`.

## Implemented behavior

| Surface | Source behavior |
|---|---|
| Member context | Kinfolk loads `family_mode_enabled` as `familyModeEnabled`. It is explicitly a delivery preference, **not** an age assertion. A missing table fails closed to the existing non-Family-Mode behavior so older source environments do not crash. |
| Ordinary Kinfolk chat | When enabled, a restricted adult-oriented request returns a friendly safe substitute before evidence research or generation. Full and lean prompts include the Family Mode instruction. |
| Prompt and delivery profile | Family Mode uses clear standard English, suppresses AAVE/regional/codeswitching personalization for that response, and uses a temporary conservative conversation voice. It does not write over saved voice or language settings. |
| Audience delivery | For the request only, the existing protective `13_15` policy is applied for non-under-13 members; an assured under-13 band stays under-13. The account’s actual age-assurance record is never changed. |
| Deterministic business discovery | The no-model business-discovery path independently reads the same setting before catalog retrieval, blocks restricted adult-venue queries, and applies the same protective audience band to eligible results. |
| Web controls | Kinfolk Experience Settings now contains a dedicated **Family Mode & Kinfolk chat safety** control using the existing authenticated Family Guidance endpoint. |
| Native disclosure | The existing Family Settings screen now accurately says that Family Mode also protects every Kinfolk chat and identifies the restricted recommendation categories. |

### Restricted request handling

The narrowly deterministic safeguard intercepts clear adult-oriented recommendation intent: adult entertainment, strip clubs, nightlife, explicit sexual content, casinos/sports betting, bar hopping, cocktail crawls, bars, breweries/brewpubs, and `18+`/`21+` requests. It returns safe alternatives—museums, bookstores, parks, family restaurants, classes, and age-appropriate events.

The model prompt also carries broader all-ages and no-adult-venue instructions for non-deterministic conversation. This is not represented as universal content moderation.

## Validation evidence

All of the following completed locally against the source candidate:

| Check | Result |
|---|---|
| Database declaration build | Passed |
| API TypeScript | Passed |
| API Family Mode safeguards | **2 files / 6 tests passed** |
| Web TypeScript | Passed |
| Web controls and existing Kinfolk Settings regression | **2 files / 7 tests passed** |
| Native TypeScript | Passed with the repository TypeScript 6 compatibility flag already used by this workstream |
| Native disclosure regression | **1 file / 2 tests passed** |
| Web production build | Passed; pre-existing source-map and bundle-size warnings only |
| `git diff --check` | Passed |

New test coverage:

- `artifacts/api-server/src/kinfolk/__tests__/family-mode-safety.test.ts`
- `artifacts/api-server/src/routes/__tests__/family-mode-kinfolk-contract.test.ts`
- `artifacts/web/src/__tests__/kinfolk-family-mode-control.test.ts`
- `artifacts/mobile/__tests__/family-mode-kinfolk-safety.test.ts`

## Controlled integration instructions

1. Resolve the latest authoritative Kinfolk candidate at integration time; do not assume the base above remains authoritative.
2. Create a separate integration worktree and merge/rebase this complete source commit as one bounded unit.
3. Resolve overlaps in `artifacts/api-server/src/routes/kinfolk.ts`, `member-context.ts`, and Kinfolk Settings intentionally. Preserve newer completed source work.
4. Run the validation set above, plus any candidate-specific Kinfolk chat, audience-policy, Family Guidance, discovery, Web settings, and native settings regressions affected by the actual merge.
5. Do **not** run migrations, deploy, activate providers, create mobile builds, start Device Farm, or modify production in the source-integration step.

## Bounded future staging acceptance (not executed)

After separate staging authorization, use a controlled owner/member test account and no paid provider:

1. Verify that Family Mode toggle state is readable and saveable through the existing Family Guidance control.
2. With Family Mode on, ask Kinfolk for a brewery/bar/nightclub recommendation in a known city; expect a safe substitute and no adult cards, ticket links, or adult social links.
3. With Family Mode on, ask for a museum, bookstore, or family restaurant; expect a useful family-safe response.
4. Verify the deterministic business-discovery route does not surface adult-venue results when Family Mode is on.
5. Turn Family Mode off; verify normal policy behavior resumes and that age assurance, saved voice, and language preferences are unchanged.
6. Repeat Web and native control/disclosure checks. Device Farm, if later authorized, must cover both iOS and Android separately.

## Explicitly incomplete / not claimed

- No deployment, migration execution, staging check, mobile build, Device Farm run, or member acceptance.
- No background monitoring or push notifications.
- No new content-moderation system, parental account hierarchy, or child/guardian identity inference.
- No external provider activation, paid request, or production data change.

## Integration references

- [Release acceptance matrix](../../replit/combined-release/ACCEPTANCE_MATRIX.md)
- [Cumulative integration inventory](../../replit/combined-release/KINFOLK_CUMULATIVE_INTEGRATION_INVENTORY_2026-10-16.md)
