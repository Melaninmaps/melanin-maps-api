# Kinfolk Contextual Intelligence V1 — Audit Record

## Release identity

- Required base SHA: `e367ad2d44b7f3bf078a084531d231b0bd1d44c0`
- Branch: `feature/kinfolk-contextual-intelligence-v1`
- Candidate SHA: the PR head containing this audit file (reported in the PR and delivery response; a Git commit cannot embed its own SHA).
- Scope: API server and website only.
- Default mode: `KINFOLK_CONTEXTUAL_INTELLIGENCE_V1=off`.

## Feature authorization proof

Configuration resolves only to `off`, `staff`, or `on`; blank and invalid values fail closed to `off`. `staff` eligibility is derived from the existing authenticated administrator/active-tester policy. `on` still requires authentication. No request header, query value, cookie, or body field can activate V1.

## Architecture and source-policy proof

The route preserves deterministic authentication, tier/rate limits, high-consequence routing, and governed business handling before contextual intelligence. The gated path then:

1. creates a bounded semantic plan using deterministic routing for clear turns and at most one structured planner call for genuine ambiguity;
2. applies the existing Kinfolk history limits before any planner call;
3. searches approved/published Library evidence and existing entity-resolution sources before live research;
4. reuses the Living Library OpenAI-native provider with Tavily fallback;
5. limits retrieval to three query variants, eight accepted documents, safe HTTPS URLs, canonical deduplication, and an eight-second budget;
6. ranks official, primary, research, reporting, criticism, creator, reference, and audience-discourse evidence;
7. requires dated/corroborated support for current claims and verified metadata for creator links;
8. constrains synthesis to accepted evidence and strictly parses optional cards and links;
9. retains existing response enforcement, business allowlisting, session persistence, Library governance, and explicit-memory controls.

Functional creator URL parameters are retained while tracking parameters are removed. Model-proposed media and relationships survive only when their evidence URL matches accepted evidence.

## Backward compatibility

`reply` remains a complete plain-text answer. Existing `sources`, `followUpSuggestions`, `libraryAction`, recommendations, itinerary, and depth controls retain their shapes. New `answerMode`, `structuredContent`, `mediaLinks`, `relatedConnections`, and `researchStatus` fields are additive and may be ignored by TestFlight Build 105 without exposing raw JSON.

## Privacy proof

- Planner input contains bounded turn history, not a free-form profile.
- Explicitly provided, consented preferences may only rank plausible interpretations.
- No race, nationality, ethnicity, gender, religion, health status, ownership, or other identity is inferred.
- Search activity does not write member memory.
- Repeated non-sensitive interest may produce a non-blocking consent offer; no memory is written without the existing explicit `consent: true` path.
- No model path writes entities, relationships, businesses, published Library content, or pending content automatically.
- Telemetry records task mode, retrieval state, source count, latency, and degraded reason—never raw questions, histories, prompts, tokens, credentials, or private memory.

## Sanitized acceptance-fixture report

All fixtures use mocked providers/repositories and assert behavior and provenance rather than canned production wording.

| Turn | Verified outcome |
|---|---|
| Generic ingredient cooking question | Deterministic `recipe_options`; no planner call; multiple practical directions allowed. |
| Specific pot-roast request | `recipe_instructions` structure with ingredients, steps, temperature/time, and food-safety evidence. |
| Underspecified cultural conflict | Ranked candidate meanings; below-threshold ambiguity returns one clarification instead of a guessed answer. |
| Named current cultural conflict | Current, mixed-evidence `cultural_consensus` with criteria and another defensible view. |
| “Best” cultural-work question | `ranked_perspectives` with a declared rubric and evidence-backed alternatives. |
| Named public person | `entity_explorer` without needless clarification; pathways require approved sources. |
| Actresses/editorial-scope question | Diaspora-centered scope is editorial framing, never a claim about member identity; broader alternatives remain available. |
| Age-related blood-pressure question | Existing medical/high-consequence route remains dominant; authoritative evidence only. |
| Current metric with provider failure | Degraded result states the verification gap and cannot invent a number or citation. |
| Cultural turn followed by cooking | Current turn switches domains; prior context does not trap routing. |
| Single Brazil-related search | No memory write or demographic inference. |
| Repeated Brazil-related searches | Only a consent offer is permitted; fixture confirms no write. |

Additional fixtures cover staff authorization, safe URL filtering, tracking-only canonicalization, creator resource-ID preservation, provider fallback, document/query caps, canonical deduplication, evidence-bound links, published-only Library retrieval, and Build 105 compatibility.

## Verification

### Passing checks

- API focused suite: 9 files, 116 tests passed.
- Web focused suite: 3 files, 15 tests passed.
- Website TypeScript check passed.
- API TypeScript check passed after a forced shared-library declaration rebuild.
- Untouched base API TypeScript check passed.
- `git diff --check` passed.
- Independent architecture/security review passed after three correction rounds.

### Local preview

The candidate API and web workflows were started. The unauthenticated `/travel` request correctly reached the existing early-access/auth boundary with no rendering crash. Contextual cards themselves were verified through deterministic component tests because authenticated staff fixture data is not available in the preview session.

## Changed files

- `artifacts/api-server/src/kinfolk/contextual-intelligence-mode.ts`
- `artifacts/api-server/src/kinfolk/semantic-turn-planner.ts`
- `artifacts/api-server/src/kinfolk/contextual-research-orchestrator.ts`
- `artifacts/api-server/src/kinfolk/contextual-internal-retrieval.ts`
- `artifacts/api-server/src/kinfolk/contextual-answer-contract.ts`
- `artifacts/api-server/src/kinfolk/contextual-url.ts`
- `artifacts/api-server/src/routes/kinfolk.ts`
- Five contextual API test files under `artifacts/api-server/src/kinfolk/__tests__/`
- `artifacts/web/src/components/kinfolk/KinfolkChatPresentation.tsx`
- `artifacts/web/src/pages/travel.tsx`
- `artifacts/web/src/__tests__/kinfolk-contextual-content.test.ts`
- This audit document.

## Release-boundary confirmation

- `artifacts/mobile` is unchanged from the required base SHA.
- No production deployment occurred.
- No EAS build or update occurred.
- No iOS or Android binary was created or uploaded.
- No TestFlight upload or App Review submission occurred.
- No Apple certificate, provisioning profile, bundle identifier, or credential changed.
- Build 105 remains untouched.