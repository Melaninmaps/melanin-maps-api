# Future Build: Replit Prompt — Community-Driven Hyperlocal Slang and Place Mapping

**Status:** Deferred build specification. Do not implement in the current launch-repair release.  
**Founder objective:** Let members preserve neighborhood language and local knowledge—for example, a community-supported relationship between `Uptown` and a specified Philadelphia area—without allowing Kinfolk to assume that the same word means the same place in Atlanta, New York, Chicago, or any other city.

---

## Copy this exact instruction to Replit

```text
Build the MWM Hyperlocal Slang and Community Place-Alias system exactly as follows.

PRODUCT OUTCOME
Members may propose a local neighborhood name, historic name, community shorthand, transliteration, or culturally used place reference. Kinfolk may use an ACTIVE alias only inside its approved city/state/country scope. An alias is never a global synonym, never overrides an explicit city/address/map selection, and never becomes active solely because an LLM thinks it sounds plausible.

Example acceptance fixture, not live production fact:
- Proposed alias: "Uptown"
- Proposed canonical target: an approved Mount Airy neighborhood/place fixture
- City scope: Philadelphia, PA
Expected behavior:
- "Uptown in Philly" can resolve to the approved Philadelphia target after activation.
- "Uptown Atlanta" must never resolve to the Philadelphia target.
- "Uptown" with no city must ask: "Do you mean Uptown in which city?" unless one explicit user-selected city is present in that same request.

NON-NEGOTIABLE RESOLUTION ORDER
1. Explicit city/state/country in the current query is a hard filter.
2. Explicit user map selection or one-time location selection is secondary.
3. Explicit saved places may rank candidates but never override a conflicting current query.
4. Active scoped aliases may resolve only within the matching geography.
5. Canonical place name/address beats a nickname.
6. Semantic/vector similarity can rank candidates only after city/context eligibility.
7. If candidates remain ambiguous, ask one concise question. Never guess.

DATA MODEL — ADDITIVE MIGRATION ONLY
Create or use the following tables/relationships exactly. Do not delete existing business, map, Library, Kinfolk, or community data.

1. canonical_places
- id UUID primary key
- canonical_name TEXT not null
- place_type ENUM/check: country, region, state, county, city, neighborhood, district, venue, service_area
- parent_place_id nullable FK to canonical_places
- country_code, state_or_region_code
- latitude, longitude only when an approved canonical source supports them
- geocode_source_url
- status: active, held, archived
- UNIQUE(canonical_name, place_type, parent_place_id)

2. community_place_aliases
- id UUID primary key
- canonical_place_id FK required
- alias_text and normalized_alias required
- city_scope_place_id FK nullable but required for neighborhood/community names unless the canonical target itself is a country/state
- state_scope and country_scope
- alias_kind: neighborhood_name, historic_name, community_name, transliteration, local_short_name
- status: proposed, community_threshold_met, active, held, rejected, retired
- confidence numeric 0–1
- evidence_count integer
- proposed_by_user_id, reviewed_by_user_id, reviewed_at, rationale
- UNIQUE(normalized_alias, canonical_place_id, city_scope_place_id)

3. community_place_alias_evidence
- alias_id FK required
- evidence_type: member_proposal, member_confirmation, public_source, curator_research
- rotating one-way member_fingerprint for member evidence only
- source_url and source_tier for public/curator evidence
- created_at
- unique guard preventing the same member or source from counting twice

PRIVACY AND ACTIVATION RULES
- A normal member can propose up to 5 aliases/24 hours and confirm up to 20/24 hours.
- Members cannot confirm their own proposal.
- Exclude all is_load_test accounts.
- Never return member names, individual confirmations, or private posts with public alias data.
- A community-only alias moves from proposed to community_threshold_met only after 10 distinct, privacy-protected eligible member confirmations.
- An authorized curator can activate an alias earlier only with a credible public/local source or documented curator research.
- An ordinary member cannot activate/reject an alias. Admin/curator endpoints must return 403 to a normal tester.
- Do not notify businesses, Circle members, followers, or external contacts when an alias is proposed, confirmed, or activated.

API CONTRACT
POST /api/community/place-aliases
Authenticated member body:
{
  "aliasText": "Uptown",
  "canonicalPlaceId": "uuid",
  "cityScopePlaceId": "uuid",
  "aliasKind": "community_name",
  "rationale": "Optional local context",
  "publicSourceUrl": "optional HTTPS URL"
}
Returns proposed alias only. It must not claim that MWM verified it.

GET /api/community/place-aliases?term=&city=&state=
Authenticated response returns only active safe choices, including canonical display name, city/state scope, and a small label such as "Community place name". It never exposes private evidence or member counts below the disclosure threshold.

POST /api/community/place-aliases/:id/confirm
Authenticated member confirmation. Prevent self-confirmation and duplicates.

POST /api/admin/place-aliases/:id/approve
Authorized administrator/curator only. Requires status decision, written rationale, and provenance record. It must atomically set status and audit actor/time.

SERVER IMPLEMENTATION
1. Implement resolvePlaceAlias() before generic entity/vector retrieval in Kinfolk search.
2. Normalize text with Unicode normalization, lowercase, whitespace collapse, and punctuation-safe tokenization. Preserve display form separately.
3. Query aliases using parameterized SQL with current city/state/country hard filters.
4. Do not use substring matching alone for a global alias. The alias must match normalized term and scope.
5. If exactly one active candidate matches scope, return it with confidence and source label.
6. If zero or multiple candidates remain, return requiresClarification=true plus no more than three city-scoped options.
7. Pass only resolved canonical place IDs to business/map/Library retrieval. Never pass an unverified alias as an asserted location.
8. Use vector embeddings only after the hard-scoped candidate set exists. Vector score can order candidates; it cannot create a place relationship.

KIN FOLK RESPONSE RULES
- Explain a resolved local term once when helpful: "In Philadelphia, people sometimes use ‘Uptown’ for [approved place label]."
- Do not state that language as universally true or label it official unless source/curator status warrants that label.
- If current city is absent: ask one question instead of assuming based on name, demographic, prior browsing, or a large number of posts.
- Never infer ethnicity, neighborhood residence, nationality, language identity, political identity, health condition, religion, or income from a local term.
- Honor the member’s explicit language setting. If dual English/Spanish is selected, show bilingual clarification labels where appropriate; never infer Spanish from a name or neighborhood.

CLIENT IMPLEMENTATION
Allowed files only:
- community.tsx: Add “Teach Kinfolk a local place name” proposal flow with clear proposed/not-verified status.
- travel.tsx and only its existing Kinfolk type/client contract: show a concise disambiguation chip/question when API returns requiresClarification.
- map.tsx: when Kinfolk hands off an active resolved canonical place, pan/search by canonical place ID; do not send the raw alias as a map query.
- a small admin/curator alias review view in existing admin.tsx.
- direct route/schema/test files.

Do not rewrite login, sessions, map initialization, business claims, business feedback/safety scores, Library source links, What’s Happening, mobile, or unrelated Kinfolk prompt logic.

MANDATORY TESTS
ALIAS-01: Normal member proposes a Philadelphia-scoped local alias. Status remains proposed.
ALIAS-02: Same member attempts confirmation. Rejected.
ALIAS-03: Ten distinct eligible confirmations move the record to community_threshold_met without exposing identities.
ALIAS-04: Curator activates a sourced Philadelphia alias with written reason.
ALIAS-05: “Uptown in Philly” resolves only to approved Philadelphia fixture.
ALIAS-06: “Uptown Atlanta” excludes Philadelphia fixture.
ALIAS-07: “Uptown” with no city returns one clarification question, not a guessed place.
ALIAS-08: Explicit canonical address/place overrides a nickname.
ALIAS-09: Non-admin calls approval route and receives 403.
ALIAS-10: Load-test account evidence is excluded.
ALIAS-11: Follower-only community content cannot create public alias evidence or influence global Kinfolk retrieval.
ALIAS-12: Existing city/map/business searches retain their correct city filter and do not regress.

REQUIRED PROOF PACKAGE
Submit one narrow deployment SHA/bundle identity, migration/index proof, non-production alias fixtures, automated test output, a three-member privacy demonstration, admin 403/approval proof, browser recording of proposal and clarification flows, and rollback instructions. Do not activate a live alias, send notifications, or alter map/business data until independent verification passes.
```

## Founder-safe use note

This system lets a community teach MWM meaningful local language without turning a rumor or one person’s terminology into global truth. It supports **“claim your hood”** while keeping the underlying place canonical, scoped, reviewable, and privacy-protected.

## Relationship to existing documents

This prompt implements the place-alias portion of `MWM_Kinfolk_Cultural_Alias_and_Community_Geography_Addendum.md`. The addendum remains the governing cross-feature design; this document is the copy-and-paste build instruction Replit can use later.
