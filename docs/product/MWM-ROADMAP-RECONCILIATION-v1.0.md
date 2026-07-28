# Mapping With Melanin™ — Roadmap Reconciliation Report
**Manus AI Independent Review → Replit Response**  
**Version:** 1.0  
**Date:** July 28, 2026  
**Status:** READ-ONLY — Planning and documentation only  
**Authorization phrase:** "Please implement." — required before any item below touches code or production  

---

## CONFIRMATION: NO CHANGES MADE

No code was written. No schema was changed. No migrations were created. No production deployments were triggered. No Apple/Google builds were modified. No workflow configurations were altered. This document is exclusively a planning reconciliation.

---

## SECTION A — GOVERNING DOCUMENT COMMITMENT

### A1. Roadmap commitment status

**Manus requirement:** The complete 8-section plan and 189-capability register must be committed to `docs/product/` and version-controlled before Build 98 begins.

**STATUS: COMPLETED THIS SESSION**

The unified plan now exists at:

| Document | Path | Version | Capabilities |
|---|---|---|---|
| Build-Phase Inventory | `docs/product/MWM-BUILD-PHASE-INVENTORY-v1.0.md` | 1.0 | 189 capabilities across Sections A–I |
| This reconciliation | `docs/product/MWM-ROADMAP-RECONCILIATION-v1.0.md` | 1.0 | All Manus findings addressed |
| Foundation Build Strategy | `docs/vision/FOUNDATION_BUILD_STRATEGY.md` | In repo July 26 | Build 97–106+ trust phases |
| Build 97 Scope and Roadmap | `docs/product/BUILD_97_SCOPE_AND_ROADMAP.md` | In repo July 26 | Phases 1–9, 29 outputs |
| Future-State Register | `docs/product/FUTURE_STATE_REGISTER.md` | In repo | FSR-001 through FSR-055 |

**Commit SHA:** The documents are in the repository. The current HEAD SHA can be obtained from Railway via `RAILWAY_GIT_COMMIT_SHA` on next production deploy. This reconciliation document is committed alongside the inventory.

**Change log process:** Every future founder decision is appended to the Founder Decisions section of the Inventory (Section 6) and to this reconciliation's Section P (Founder Decision Register). No capability may be removed from the register without explicit founder approval. The inventory version number increments on any material change.

**Total capability count:** 189 capabilities placed across 9 builds. 7 capabilities marked PLACEMENT REQUIRES FOUNDER APPROVAL (Sundown Towns, Mardi Gras Indians correction, Asian diaspora 7 communities, MENA communities, Ambassador compensation model, economic impact methodology, pricing evolution model).

---

## SECTION B — MANUS VERDICT SUMMARY TABLE

| Build | Manus verdict | Replit response | Net result |
|---|---|---|---|
| 97 | APPROVE AS WRITTEN | ACCEPTED — with 2 carry-forward conditions noted | No change to scope; conditions documented |
| 98 | APPROVE WITH CONDITIONS | ACCEPTED — all 4 conditions adopted | Build 98 revised |
| 99/100 | SPLIT + RESEQUENCE | ACCEPTED — split into Build 99 and Build 100 as specified | Builds 99 and 100 now distinct |
| 100/101 | APPROVE WITH CONDITIONS + pull 2 items earlier | ACCEPTED — crisis block and session deletion pulled to next server-only safety deploy | Build 100/101 revised |
| 102 | APPROVE WITH CONDITIONS | ACCEPTED — all 4 conditions adopted, consent architecture expanded to platform-wide | Build 102 revised |
| 103 | SPLIT MANDATORY | ACCEPTED — split into 103a / 103b / 103c / 103d | Four separate builds defined |
| 104 | APPROVE WITH CONDITIONS | ACCEPTED — all 3 conditions adopted | Build 104 revised |
| 105 | APPROVE WITH CONDITIONS | ACCEPTED — all 4 conditions + internal resequence adopted | Build 105 revised |
| 106+ | DEFER / NOT ENOUGH INFORMATION | ACCEPTED — orchestration deferred; explainability constraint carried forward | No change |

---

## SECTION C — LINE-BY-LINE RECONCILIATION

### C1. STRUCTURAL PROBLEM 1 — Live AAVE/profanity coupling defect

**Manus finding:** `kinfolk.ts` line 1018 prompt text reads "User has opted into Level 3 cultural voice. Casual profanity is permitted." This contradicts the founder's explicit instruction that profanity must be a separate, explicit opt-in and that AAVE must never be treated as synonymous with profanity. The schema has no separate profanity field — only `aaveLevel smallint`.

**Decision:** ACCEPT

**Evidence basis:** Verified. `user_preferences` contains `aaveLevel smallint` only. The system prompt in `kinfolk.ts` fuses profanity permission to `aaveLevel=3`. This is a live defect in the founding voice system, not a future-state gap.

**Roadmap section changed:** Build 100/101 — Three-setting voice decoupling, expanded in Build-Phase Inventory Section 2 (Build 100/101).

**New assigned build:** Build 100/101 (schema + full decoupling). PLUS: `aaveLevel=3 → profanity permitted` prose removed from system prompt in the next server-only safety deploy (Build 1.5 per Manus's table), as a minimal prompt correction that does not require a new binary.

**Dependency:** New schema columns must exist before the system prompt references them.

**Founder decision required:** None — founder approved three-setting model today (Professional/Friendly/Local/Home + Standard/Community-Informed/Community Native + None/Mild/Explicit; profanity never tied to tier; AAVE never implies profanity).

**Acceptance gate:** Schema field proof (`community_voice`, `cultural_language_level`, `profanity_opt_in` columns visible in schema); matrix test AAVE-level × profanity × family × tier; adversarial prompt test confirming deterministic profanity gate; binary-level verification that AAVE Level 3 does not enable profanity.

---

### C2. STRUCTURAL PROBLEM 2 — Cultural registry architecturally fragile

**Manus finding:** The 36-city founding registry is hardcoded TypeScript, duplicated across three route files (`kinfolk.ts` lines 143–592, `maps.ts` line 99 inline construction per-request, `travel.ts` line 14). It has no citations, no version dates, no review dates, no founding/living separation, no rollback capability. Any Living Community Layer or diaspora expansion inherits this fragility.

**Decision:** ACCEPT

**Evidence basis:** Verified. Three separate hardcoded constant objects containing the same cities. A correction to one does not propagate to others. The `archive_contributions` table (Layer Two schema) exists with 0 rows and no routes — it cannot be connected to a hardcoded TS constant.

**Roadmap section changed:** New Build 100 added (Manus resequence Step 4) — Registry migration lands here. Build-Phase Inventory Build 99/100 scope revised. Inventory Section 3C (KinfolkAI Cultural Intelligence) item "Founding Cultural Registry (Layer One)" status updated: currently "hardcoded — migration to DB required in Build 100."

**New assigned build:** Build 100 — registry migration. The DB target model (pseudocode from Manus §7):
```
cities(id, name, state, aliases[])
communities(id, city_id, name, type)           -- e.g., Black Miami, Haitian Miami
neighborhoods(id, city_id/community_id, name)
cultural_profiles(id, entity_id, entity_type, layer, status, review_date, version)
language_terms(id, profile_id, term, category, display_text, sources[], status, contested_flag, rollback_to)
historical_claims(id, profile_id, claim_text, citation_ids[], reviewer_ids[], status)
source_citations(id, url, title, author, year, type)
cultural_reviewers(id, user_id, communities_served[], review_history_count, conflict_check_required)
```

**Dependency:** Cities/communities/neighborhoods entities defined in Build 103a (for city-as-container product feature). However, the registry migration to DB tables must happen in Build 100 before "Things You'll Hear" ships. The registry migration does not need to wait for the full 103a entity model — it can use a simpler `city_name` FK initially, with the entity re-parenting happening in 103a.

**Founder decision required:**
- Approval of the founding-registry migration method (cell-for-cell, TS constants retained as flagged read-only fallback until parity proven)
- Registry-parity acceptance test format approved by founder before eliminating the TypeScript fallback

**Acceptance gate:**
- `grep` for CITY_VOICES constant shows exactly one definition in the codebase (not three)
- Registry-parity test: every city, every term from the original TS constant is present in the DB with `layer='founding'` and `version=1`
- TS fallback is behind a feature flag
- Rollback demo: a term can be reverted to a prior version in the DB
- No new cultural registry may be created as a hardcoded TypeScript object

---

### C3. STRUCTURAL PROBLEM 3 — Data model missing core entities

**Manus finding:** Across 186 schema tables, absent: city entity, community entity, neighborhood entity, consent-record table, citation model, language-term table, Life Chapter (only flat 8-value `journeyType` enum with jsonb phases), Ambassador data model (only `trustLevel=4` flag).

**Decision:** ACCEPT

**Evidence basis:** Verified. Cities are `varchar` strings in businesses and user tables. No `consent_records` table. Cultural sites have `verified_source varchar(255)` only. `life_journeys` has flat enum phases in jsonb. Ambassador model is `trustLevel=4` only.

**Roadmap section changed:** Build-Phase Inventory Section 2 and 5. New builds created: Build 99 (citation/source model v1), Build 100 (language-term tables as part of registry migration), Build 102 (platform-wide consent records), Build 103a (city/community/neighborhood entities), Build 103b (Life Chapter entity), Build 105 (Ambassador data model).

**New assigned build per entity:**

| Missing entity | Assigned build | Dependency |
|---|---|---|
| Platform-wide consent-record table | 102 | None — build once, use for 100–106 |
| Citation/source model (cultural claims) | 99 | Moderation queue must exist first |
| City / community / neighborhood entities | 103a | None — pure data model build |
| Language-term registry tables | 100 | Registry migration in Build 100 |
| Life Chapter (distinct from Journey) | 103b | Consent architecture from 102 |
| Journey (with chapter_id FK) | 103b | Life Chapter entity |
| Milestones (as individual rows, not jsonb) | 103b | Journey entity |
| Journey settings (visibility, pause, export) | 103b | Journey entity |
| Ambassador profile (profile, expertise, communities, contributions, impact) | 105 | schema-first before engine work |
| Consented attribution events | 99 | None — collection starts early |
| Signal aggregation layer | 103d | Attribution events from Build 99+ |
| Recommendation reason records | 100/101 | Kinfolk trust build |
| Visibility tiers (Share / Ask / Always Private) | 102–103b | Cross-Role Privacy Standard |
| Learning items | 99 | None |
| Contested-content and rollback status | 100 | Language-term tables |
| Creator audience signal | 103d | Signal aggregation layer |
| Community need signal | 103d | Signal aggregation layer |
| Licensing + removal-state on contributions | 105 | Ambassador schema |

**Founder decision required:** Approval of the 103a/103b/103c/103d split (added to founder decision register).

**Acceptance gate:** After each build, a schema audit confirms the listed entities exist with migration evidence (not feature-flag only). Drizzle migration file committed.

---

### C4. STRUCTURAL PROBLEM 4 — Build 103 dangerously overloaded

**Manus finding:** Build 103 combines (a) Chapter→Journey data-model refactor, (b) My Story, (c) Cultural Journeys, (d) city-as-container entity model, and (e) Business Intelligence — the two highest-privacy-risk systems with the largest data-model refactor in one release. Must be split.

**Decision:** ACCEPT

**Roadmap section changed:** Build 103 in Build-Phase Inventory Section 2 is now replaced by four builds:

| Build | Primary purpose | Sequence |
|---|---|---|
| **103a** | City/community/neighborhood entities; registry re-parented onto them; city-as-container (data model, no user-facing diaspora expansion yet) | First — unblocks everything |
| **103b** | Life Chapters + Journeys + milestones as separate records + My Story; explicit-confirmation-only journey creation; private defaults; pause/delete/notification control/export; age and family safeguards; no automatic journey creation from search or sensitive behavior | After 102 consent architecture |
| **103c** | Cultural Journeys / diaspora community layers — ONLY after cultural-governance framework operating with named reviewers and a completed review cycle | Last in 103 sequence |
| **103d** | Signal aggregation + proportional interpretation + Business Intelligence six engines — on aggregation layer, not raw data | After 103a entities exist; parallel with 103b if separate owners |

**Dependency between 103 builds:** 103a → (103b and 103d in parallel) → 103c

**Founder decision required:** Founder approval of 103a/103b/103c/103d split (added to decision register).

**Acceptance gate:** Each 103 build ships and is verified independently against the stop-safe rule before the next begins.

---

### C5. BUILD 97 — APPROVE AS WRITTEN (2 carry-forward conditions)

**Manus finding:** Scope is coherent, stop-safe, already submitted. Two conditions carry forward rather than block: (a) stability evidence must be the post-`23d0d661` observation window; (b) language-correction sweep (Priority 2 "Black-owned" contextual rule) must be verified in the shipped binary.

**Decision:** ACCEPT

**Roadmap section changed:** Build 97 acceptance criteria in Inventory Section 2 updated to explicitly require:
- Stability evidence = post-fix window (commit `23d0d661` pool-exhaustion fix forward), not the 5-connection pool document predating July incidents
- Binary-level language verification: the "Black-owned" contextual rule must be confirmed in the TestFlight/Play Console binary, not only source code inspection

**New assigned build:** 97 (unchanged).

**Dependency:** None new.

**Founder decision required:** None new for Build 97 scope.

**Acceptance gate:** Updated Build 97 acceptance criteria:
1. All 11 submission release gates passed
2. "Community Member" label visible on profile — verified on physical device against submitted binary
3. Map loads correctly — verified on physical iOS and Android devices against submitted binary
4. "Black-owned" contextual rule verified in binary (not source only) — automated grep-in-binary check or manual QA
5. Stability evidence: Railway logs clean for 24-hour window POST commit `23d0d661` (not pre-fix documentation)
6. POST /api/auth/login-email → 200 in <2s on Railway production (not dev)

---

### C6. BUILD 98 — APPROVE WITH CONDITIONS (4 conditions)

**Manus conditions:**
1. Replace boolean role flags with a `user_roles` relation (role, grantedAt, grantedBy, status) — Build 98 is cheapest moment; every later build reads roles
2. Community Organization eligibility policy (FD-CO-001) is an unanswered founder decision
3. Role additions need an audit trail from day one (who added which role when)
4. "HBCU restored" must be verified on-device against the shipped binary

**Decision:** ACCEPT ALL 4

**Roadmap section changed:** Build 98 in Inventory Section 2 revised. `user_roles` relation replaces boolean flags requirement added. Role audit trail added to data/schema work. Binary verification of HBCU strip added to acceptance tests.

**New assigned build:** 98 (unchanged; scope additions only).

**Dependency:** Build 97 Apple approval.

**Founder decision required:**
- Community Organization eligibility types (nonprofit only? informal groups? faith organizations?) — required before Build 98 Community Org role implementation begins
- Community Organization eligibility cannot be inferred by Replit; must be a documented founder decision

**Acceptance gate:**
- `user_roles` table exists in schema with migration evidence; boolean flags `isBusinessOwner` / `isContentCreator` / `isCommunityOrganizer` / `isInfluencer` retained as computed views for backward compatibility during transition
- Role additions and grants are recorded in `user_roles` with `grantedAt` timestamp and `grantedBy` actor
- HBCU horizontal strip verified on physical device against the Build 98 binary (not source inspection)
- Route-permission matrix updated: every role-gated route checks `user_roles` relation, not boolean flags

---

### C7. BUILD 99 — SPLIT FROM BUILD 100 (Contribution foundations)

**Manus correction:** Build 99/100 fails moderation-before-contribution test. Living Legacy media submissions must not open before content ownership policy, oral-history release forms, and moderation exist (repo sequencing: Phase 8 = Build 105+ is correct). "Things You'll Hear" must use the new registry structure from day one, not ship as another hardcoded dataset. Structured mentorship needs safeguards in the same build.

**Decision:** ACCEPT — split into Build 99 (below) and Build 100 (C8).

**Build 99 scope (revised):**
- Trust progression UI (surfaced on profile)
- Surfaced reviews (review helpfulness counts visible)
- Saved heritage places (FSR-010)
- Living Legacy **nominations only** (suggest-a-story text, no media upload) — schema partially exists
- Moderation queue v1 (for all community contributions — text, nominations, "Things You'll Hear" submissions)
- Citation/source model v1 (source_citations table, minimum: url + title + author + year + type)
- Consented attribution-event collection begins (explicit user confirmation before recording "this guidance influenced my visit")
- Search-history retention cap (unbounded jsonb on prefs row → capped, with TTL)
- Learning items table (foundation for Library → Discovery evolution)

**Explicitly NOT in Build 99:**
- Living Legacy media uploads (Build 105)
- "Things You'll Hear" content (Build 100 — requires registry migration first)
- Structured mentorship (Build 100)
- HBCU alumni connections (Build 100)

**Dependency:** Build 97 + 98 complete. Moderation queue v1 must exist before any community contribution surface opens.

**Founder decision required:**
- Living Legacy placement confirmed: nominations in Build 99, media in Build 105

**Acceptance gate:**
- Living Legacy nomination form submits text only; no media upload UI or route exists in Build 99
- Moderation queue v1 is operational before any nomination is live-visible (no contribution bypasses moderation)
- `source_citations` table exists with migration evidence
- Attribution event collection: user is explicitly shown consent moment before any attribution event is recorded
- Search history retention: `user_preferences.searchHistory` is capped (max entries + TTL enforced at write time)

---

### C8. BUILD 100 — Registry migration + Mentorship + "Things You'll Hear"

**Manus correction:** "Things You'll Hear" is governed cultural language content — shipping it before the registry is restructured creates a second hardcoded dataset to migrate later. It must ship as structured, cited, versioned records from day one. Mentorship needs safeguards, reporting, and disclaimer in the same build.

**Decision:** ACCEPT

**Build 100 scope:**
- Structured mentorship with safeguards (communication boundaries, in-app reporting for misuse, professional-relationship disclaimer) — 18+ unless different minor policy is approved
- "Things You'll Hear" — first entries as structured records in the new language-term tables (not a new hardcoded object), with citations, review status, review date
- "Things Locals Appreciate" — same structure
- HBCU alumni connections
- **Cultural registry migration (founding layer):** all 36-city CITY_VOICES, CITY_LOCAL_TERMS content migrated to `cultural_profiles` + `language_terms` + `source_citations` tables as `layer='founding'`, `version=1`, cell-for-cell. TS constants retained as flagged read-only fallback until parity is proven. Registry-parity acceptance test passes before TypeScript fallback is removed.

**Dependency:** Build 99 moderation queue v1 operational. Language-term tables defined in schema before "Things You'll Hear" content is authored.

**Founder decision required:**
- Approval of founding-registry migration method (cell-for-cell, TS fallback retained)
- Minor policy for mentorship (18+ or different age policy)

**Acceptance gate:**
- `grep CITY_VOICES` returns one definition; all content is DB-sourced
- Registry-parity test: every entry from original TS constants present in DB with `layer='founding'`
- Mentorship: communication boundaries enforced (no direct external contact exchange in-app); reporting route exists; disclaimer visible before mentorship enrollment
- "Things You'll Hear" entries have `citation_id` FK — entries without citations are blocked from publishing

---

### C9. BUILD 100/101 — KinfolkAI Trust, Voice, and Family (revised)

**Manus conditions:**
1. Voice decoupling requires schema — separate fields for `community_voice`, `cultural_language_level`, `formality`, `city_voice`, `profanity_opt_in` (default false), `audio_voice`
2. Family Mode wiring: absent at route level (zero `familyMode`/`contentFilter` references in `kinfolk.ts` verified) — minimal guard ships in server-only safety deploy; full wiring lands here
3. Crisis block and session deletion are pull-earlier candidates — both are small, server-side, low-risk; ship in next server-only safety deploy
4. Memory must ship with transparency panel in the same build — never memory before transparency

**Decision:** ACCEPT ALL 4

**Revised Build 100/101 scope:**
- Three-setting voice decoupling: new schema columns `community_voice` (enum: professional/friendly/local/home), `cultural_language_level` (enum: standard/community_informed/community_native), `profanity_opt_in` (boolean, default false, separate consent moment), `audio_voice`, `code_switching` (enum: always/ask_me/never), `voice_mode` (persistent, replaces per-request parameter)
- AAVE/profanity coupling removed from system prompt (this phrase removed from `buildSystemPrompt`)
- Full Family Mode wiring: deterministic pre-prompt and post-response enforcement (not prompt-only) — Family Mode is independent of membership tier (tested invariant)
- KinfolkAI context decomposition: modular context builders (preference, voice, cultural, business/event retrieval, city/community, journey, safety/family enforcement, citation/source attribution, recommendation reasoning) each with scoped retrieval and token budget
- Memory management UI ("What KinfolkAI Knows About Me" transparency panel)
- KinfolkAI session deletion (individual thread + full history wipe)
- `kinfolk_memory` table (explicit memory items the user has saved/shared, separate from session log)
- Recommendation reason records (`recommendation_reasons` table)
- Source attribution in KinfolkAI responses (verified fact vs. community trend vs. AI inference vs. sponsored — four distinct labels)
- Tier-appropriate response depth fully implemented
- Private conversations excluded from shared cultural registry — enforced as a tested invariant, not only a policy statement
- Proactivity and notification limits (FSR-049) answered before journey check-ins ship

**PULLED EARLIER to server-only safety deploy (Build 1.5):**
- Crisis-intervention hard stop (Compassion Protocol, three-level: stress → distress → emergency; not prompt-only)
- KinfolkAI session deletion route (`DELETE /kinfolk/sessions/:id` and `DELETE /kinfolk/sessions`)
- Minimal Family Mode deterministic guard (one-line check before buildSystemPrompt execution)
- Search-history retention cap

**Dependency:** Build 100 registry migration complete (cultural context module needs DB source).

**Founder decision required:**
- Chat history retention period
- Maximum memory depth by tier (Community Member / Navigator / Trailblazer)
- Minimum platform age and AAVE/language level cap for teen accounts
- Proactivity limits (how often Kinfolk can initiate check-ins)

**Acceptance gate:**
- Schema: separate `community_voice`, `cultural_language_level`, `profanity_opt_in`, `audio_voice`, `code_switching`, `voice_mode` columns — migration evidence
- Matrix test: AAVE-level × profanity × family × tier — profanity setting never changes based on AAVE level; Family Mode never changes based on tier
- Family Mode: deterministic code enforces it (adversarial prompt test: prompt injection cannot bypass family mode)
- Memory transparency panel shows what Kinfolk has stored, allows per-item deletion
- Session deletion: `DELETE /kinfolk/sessions` → all rows removed from DB → confirmed on GET
- Source attribution: 10 diverse queries reviewed by founder; every response carries attribution type label
- Private chat invariant test: chatting about a location does not modify any shared registry entry

---

### C10. BUILD 102 — Verified Community Member + Platform-Wide Consent Architecture

**Manus conditions:**
1. Five-step vendor evaluation must produce evidence before any code
2. `trust.ts` PAID_TIERS → `memberType ≠ "individual"`
3. Consent-record architecture must be platform-wide (not verification-only) — highest-leverage schema decision in the roadmap
4. Legal review is a hard gate, not a parallel activity (BIPA statutory damages)

**Decision:** ACCEPT ALL 4

**Revised Build 102 scope:**
- **Platform-wide consent-record table** (built once, used by Builds 100–106): `consent_records(id, user_id, category, scope, version, granted_at, revoked_at, audit_trail)`
- Consent categories to include: kinfolk_memory, voice_personalization, cultural_journey_history, attribution_events, life_journeys, biometric_verification, marketing, analytics
- Verified Community Member: provider-hosted flow after vendor evaluation + legal review complete
- `trust.ts` PAID_TIERS → `memberType ≠ "individual"` (any non-free tier qualifies)
- Visibility tiers (Share by Default / Ask Me Each Time / Always Private) schema-backed per Cross-Role Privacy Standard

**Dependency:** Build 100/101 complete. Vendor evaluation evidenced. Legal review complete (BIPA/CUBI minimum, national review for international members).

**Founder decision required:**
- Final vendor selection (Stripe Identity vs. Veriff — 5-step evaluation documented before any code)
- Verification data retention period (legal minimum per BIPA)
- Badge exact wording ("Community Verified ✔")
- What member sees if vendor is unavailable (graceful degradation UX)

**Acceptance gate:**
- `consent_records` table: migration evidence; every new sensitive data collection in Builds 102–106 inserts a consent row before writing the data
- Legal review evidence: documented sign-off on BIPA/CUBI compliance before verification implementation begins
- Vendor: live dashboard pricing screenshot; Expo SDK compatibility test result; consent framework review; international coverage confirmation — all four documented
- `trust.ts` parity test: any non-"individual" memberType qualifies; named allowlist removed

---

### C11. BUILD 103a — City / Community / Neighborhood Entities

**Manus requirement:** Pure data-model build. City/community/neighborhood entities created. Registry re-parented onto them. City-as-container concept grounded in real schema. No user-facing diaspora expansion yet.

**Decision:** ACCEPT

**Build 103a scope:**
- `cities(id, name, state, country, aliases[])` table
- `communities(id, city_id, name, type, layer)` table — e.g., Black Miami, Haitian Miami, Little Havana
- `neighborhoods(id, city_id, community_id, name)` table
- Registry re-parent: `cultural_profiles` gains `city_id` FK (replacing `city_name` varchar); `language_terms` gains `community_id` FK
- City-as-container API (no user-visible community layer picker yet — that is Build 103c)
- No diaspora content expansion yet — founding 36-city content re-parented only

**Dependency:** Build 100 (registry migration in DB) must be complete before re-parenting onto new entities.

**Founder decision required:** None — pure infrastructure.

**Acceptance gate:**
- `cities` / `communities` / `neighborhoods` tables exist with migration evidence
- All 36 founding cities have corresponding rows in `cities` table
- `cultural_profiles.city_id` FK resolves correctly for all existing profiles
- No hardcoded city-name string in any KinfolkAI route (grep test)

---

### C12. BUILD 103b — Life Chapters, Journeys, My Story (with privacy defaults)

**Manus requirements:**
- `life_chapters` (user-declared, open type list — not closed enum)
- `journeys(chapter_id, …)`
- `milestones` as individual rows (not jsonb — so they can be individually edited/deleted)
- `journey_settings` (visibility, notifications on/off, paused, exportable)
- Explicit-confirmation-only journey creation — AI cannot create or close a journey without user confirmation UI
- Journey creation must NOT use search history or sensitive behavior as trigger
- Private by default
- Pause, delete, notification control, export
- Age and family safeguards — youth journeys require age assurance and parental-consent decisions before they ship

**Decision:** ACCEPT

**Build 103b scope:**
- `life_chapters(id, user_id, chapter_type, custom_label, status, visibility, created_at, archived_at)`
- `journeys(id, chapter_id, title, description, status, visibility, paused, notification_enabled, created_at, completed_at, consent_recorded_at)`
- `milestones(id, journey_id, title, note, business_id nullable, place_id nullable, created_at, deleted_at)` — soft-delete for reversibility
- `journey_settings(journey_id, visibility_tier, notify_on_milestone, auto_suggest_off, exportable)`
- Journey creation: requires explicit user confirmation UI before any DB write — UX flow evidence required
- Suggestion inputs allowlist: KinfolkAI may suggest a journey only from explicitly stated preferences, not from search history or sensitive-behavior patterns
- Age safeguard: teen HBCU exploration (a named teenager scenario in the founder's vision) requires parental-consent decision before going live
- My Story: screen over all chapters/journeys, opening with "Here's the story we've been building together"
- Export: `GET /api/journeys/export` returns a downloadable summary of the user's journey history

**Dependency:** Build 102 consent architecture. Build 103a city entities. Age/family policy decisions required before teen journeys ship.

**Founder decision required:**
- Minor policy for youth journeys (what age requires parental consent, what personalization is disabled for minors)
- Proactivity limits for journey check-ins (how often Kinfolk can prompt a journey update)
- Notification governance (what may trigger from inferred vs. stated context)

**Acceptance gate:**
- No Journey is created in the DB without a consent row in `consent_records` with category = `life_journeys`
- UX flow evidence: screen recording or Playwright test showing user confirmation before journey creation
- grep test: journey-suggestion code does not read `searchHistory` jsonb or any health/relationship/pregnancy-adjacent search term
- Delete endpoint: `DELETE /api/journeys/:id/milestones/:mid` removes the row; verified on GET
- Export endpoint: returns user-readable JSON with journey + milestone content
- Privacy default: newly created journeys have `visibility_tier = 'always_private'` unless user explicitly changes

---

### C13. BUILD 103c — Cultural Journeys / Diaspora Community Layers

**Manus requirement:** Cultural Journeys and diaspora community layers ship ONLY after the cultural-governance framework has completed a real review cycle with named reviewers.

**Decision:** ACCEPT

**Build 103c prerequisite gate (non-negotiable before implementation begins):**
- Cultural governance framework operational: named reviewers per community layer documented; reviewer qualifications defined; conflict-of-interest rules operational
- At least one completed review cycle (a real cultural claim was submitted, reviewed by two named reviewers, cited, and published through the moderation queue)
- Indigenous content: reviewers from the relevant Nation or community confirmed before any Indigenous layer goes live
- No community may be treated as a smaller/less-developed expansion layer — every community uses the same 16-category depth standard and citation threshold as the founding Black-city registry

**Build 103c scope (after governance gate passes):**
- Cultural Journey cards in Library (first cohort: Miami, NYC, LA, Houston, DC, Philadelphia, Minneapolis, Boston/Brockton, Newark, Orlando per founder-approved priority order)
- Diaspora community layer picker on map (stackable, user-selected)
- "If this is your first time..." section standard in every community profile
- Cultural Passport (My Passport — "First HBCU," "First Powwow," etc.)
- Curiosity Lists (full implementation on citation-backed content)

**Dependency:** Build 103a entities. Build 100 language-term tables + moderation queue. Cultural governance framework operational with real review cycle completed.

**Founder decision required:**
- First community reviewers confirmed by name (not just role)
- Cultural review thresholds confirmed (2 reviewers for ordinary claims; 3 for contested historical claims; Indigenous Nation representatives for any Indigenous content)

**Acceptance gate:**
- Governance framework documentation specifies named reviewers for at least 3 of the 10 first-cohort communities before any community layer is published
- Review cycle evidence: at least one completed moderation cycle (submission → review → citation → approval → published) documented before 103c ships
- Indigenous content: reviewer from relevant community confirmed in writing before any Indigenous layer ships
- Community layer comparison test: Black Miami layer and Haitian Miami layer both have equal depth (same 16 categories)

---

### C14. BUILD 103d — Signal Aggregation + Business Intelligence

**Manus requirement:** Business Intelligence must be built on a signal aggregation and proportional-interpretation layer — not on raw data, seeded data, or individually identifiable data. Cannot ship before the aggregation layer exists.

**Decision:** ACCEPT

**Build 103d prerequisite:**
- Signal aggregation layer operational (scheduled jobs, hand-rolled aggregations replaced by indexed joins, cap on `kinfolk_search_events` + `attribution_events` table sizes per Manus §13)
- Attribution events being collected since Build 99 (consented, explicit user confirmation)
- Seeded and beta-test data excluded from all aggregation (isSeeded/isBetaTest flags on businesses and events excluded from signal queries — tested with a seeded-exclusion test)

**Build 103d scope:**
- Community need signal table (anonymized, aggregated — never individual)
- Creator audience signal table (anonymized, aggregated)
- Business Intelligence six engines: Identity, Community Intelligence Briefings, Growth Coach, Opportunity, Partnership, Celebration — briefings derived from aggregated signals only, never raw conversations or individual member behavior
- Proportional interpretation: Community Signal Strength Standard (Prevalence/Volume/Momentum/Relevance/Confidence) implemented in signal queries, not doc-only
- Business Intelligence Briefing cadence (weekly or as decided by founder)

**Dependency:** Build 103a entities. Signal aggregation layer operational. Attribution events available since Build 99. Proportionality implementation reviewed by founder.

**Founder decision required:**
- Community Intelligence Briefing cadence
- Briefing opt-in vs. default
- Voice tone learning opt-in mechanism for business owners

**Acceptance gate:**
- Business Intelligence query does not join individual user tables — verified in SQL review
- Aggregation exclusion test: a seeded business with `isSeeded=true` does not appear in any intelligence briefing
- Proportionality test: a signal from 1 person does not surface with the same weight as a signal from 50 unique people
- Briefing content reviewed by founder: 5 sample briefings reviewed and approved as "observations, not analytics dashboards"
- Monthly cost dashboard showing LLM costs for Business Intelligence before feature goes live

---

### C15. BUILD 104 — Kinfolk Circles Launch

**Manus conditions:**
1. Meetup safety guidelines and Meet-up Verification must be in scope (not deferred)
2. Public/discoverable Circles founder decision required before launch
3. Circle content excluded from community-signal aggregation until Cross-Role Privacy Standard technical separation is implemented

**Decision:** ACCEPT ALL 3

**Revised Build 104 scope (unchanged from prior plan plus additions):**
- Circles navigation entry point (feature already built — 6 DB tables, mobile screens)
- Meet-up Verification and real-world safety guidelines IN SCOPE (not deferred)
- Safety reporting for Circle incidents
- Public Circles feature: conditional on founder decision (FD-P7-001)
- Circles excluded from signal aggregation: verified as a DB-layer query exclusion, not only as a promise

**Dependency:** Build 103b (identity + consent architecture for Circle privacy). Build 103a (entity model for Circle-based saved places).

**Founder decision required:**
- Public/discoverable Circles (FD-P7-001) — yes or no, before launch

**Acceptance gate:**
- Meet-up Verification endpoint verified on physical device at launch
- Safety guidelines visible before any Circle coordinates a meetup
- Query test: no signal aggregation job joins Circle activity tables
- Circle privacy test: a Circle member's saved place does not appear in public community signals

---

### C16. BUILD 105 — Cultural Ambassador System (schema-first)

**Manus conditions:**
1. Ambassador data model does not exist — schema-first work must precede engine work
2. Community Impact Engine requires consented attribution data collected since Build 99 — no impact reports from empty tables
3. Compensation/content ownership/licensing must be founder decisions + legal review before creators contribute displayed content
4. External-reach and community-impact metrics must be structurally separated — community impact is primary

**Decision:** ACCEPT ALL 4

**Revised Build 105 scope:**
- **Ambassador schema first** (before any engine): `ambassador_profiles(id, user_id, communities_served[], expertise_areas[], application_or_invitation, status, verified_at)`, `ambassador_contributions(id, ambassador_id, type, content, license_type, removal_state, submitted_at, reviewed_at)`, `community_impact_events(id, contributor_id, type, value, consented_at, attribution_method)`, `external_reach_stats(id, ambassador_id, platform, metric_type, value, recorded_at)` — separated tables, never mixed in one dashboard query
- Community Impact reports populated from consented attribution events collected since Build 99 (if Build 99 collection was not sufficient, impact reports launch with honest low numbers, not synthetic data)
- "From the Community" media submission pipeline: `from_community_submissions(id, creator_id, media_url, consent_version, license_type, can_remove, removal_requested_at, review_status, reviewed_by, published_at)`
- Living Legacy media submissions (full, not just nominations)
- Pay It Forward: flagged for Apple IAP analysis before design freeze (compensation through the app requires IAP review; physical-world payouts are fine)
- External reach shown separately from community impact with clear labeling (not same UI section)

**Dependency:** Build 103b consent architecture. Attribution events from Build 99. Content ownership and licensing legal review complete. Ambassador compensation model decided.

**Founder decision required:**
- Ambassador compensation/recognition model (required before ambassador portal ships)
- Content ownership confirmed as database fields (license type, granted rights, removal-requested state) — not only UI copy
- Living Legacy content ownership model (creator owns, MWM licenses display, can remove) — legal review required

**Acceptance gate:**
- Ambassador schema migration evidence
- Impact report populated from consented attribution events only — no synthetic or seeded data
- `from_community_submissions.license_type` is a database enum, not a UI label
- `from_community_submissions.removal_requested_at` column exists; a removal request results in content being taken offline within SLA
- Apple IAP analysis documented before Pay It Forward compensation design is finalized
- Community impact dashboard section and external reach section are distinct UI components from separate DB queries

---

### C17. BUILD 1.5 — Server-Only Safety Deploy (no binary; PENDING AUTHORIZATION)

**Manus requirement (pulled-earlier safety items):** Crisis block, session deletion, minimal Family Mode guard, search-history retention cap, SESSION_SECRET rotation check, regression tests for DB pool and monitoring.

**Decision:** ACCEPT — designating as Build 1.5 (server-only deploy, between Build 97 and 98)

**STATUS: PENDING AUTHORIZATION** — do not implement until founder separately authorizes implementation with "Please implement."

**Build 1.5 scope (server-only, no new EAS binary required):**
- KinfolkAI crisis-intervention hard stop: deterministic pre-response check for crisis keywords → mandatory Compassion Protocol path, cannot be bypassed by prompt injection
- KinfolkAI session deletion route: `DELETE /kinfolk/sessions/:id` and `DELETE /kinfolk/sessions`
- Minimal Family Mode deterministic guard: one-line check before `buildSystemPrompt()` execution — if `familyModeEnabled = true`, system prompt is forced to safe-content configuration
- AAVE/profanity coupling removal from system prompt: the phrase "Casual profanity is permitted" removed from `buildSystemPrompt` for `aaveLevel=3` path (profanity remains unavailable by default until Build 100/101 schema ships the separate setting)
- Search-history retention cap: `user_preferences.searchHistory` jsonb array capped at a defined maximum (e.g., 50 entries) with TTL
- SESSION_SECRET rotation: confirm documented in `docs/` and rotation procedure verified
- Regression tests: pool exhaustion test confirms the `23d0d661` fix holds under concurrent connections; monitoring service does not probe production DB directly

**Dependency:** None — all server-side changes, no binary required.

**Founder decision required:** Authorization to implement Build 1.5 ("Please implement." for this build specifically).

**Acceptance gate:**
- Adversarial test: crisis keyword in KinfolkAI chat → Compassion Protocol response confirmed (no deflection, no error)
- Session deletion: `DELETE /kinfolk/sessions` → all sessions removed → GET confirms empty
- Family Mode guard: `familyModeEnabled=true` user cannot receive adult content through any KinfolkAI response path (adversarial prompt injection test)
- Pool test: 30 concurrent authenticated requests → pool does not exhaust

---

## SECTION D — MISSING CAPABILITIES RECONCILIATION (Manus §5, 20 items)

| # | Missing capability | Manus "must exist by" | Replit response | Assigned build | Dependency | Acceptance gate |
|---|---|---|---|---|---|---|
| 1 | Platform-wide consent-record architecture | Build 102 | ACCEPT — built once in 102, used by 100–106 | 102 | None | Consent row written before every sensitive data write; schema review |
| 2 | Citation/source model for cultural claims | Build 99/100 (before "Things You'll Hear") | ACCEPT — citation model v1 in Build 99, language-term citations in Build 100 | 99 (schema) / 100 (content citations) | Moderation queue v1 | `source_citations` table; "Things You'll Hear" entry blocked without citation_id FK |
| 3 | City/community/neighborhood entities | Build 103a (before Cultural Journeys) | ACCEPT — pure data-model build 103a | 103a | None | All 36 cities in cities table; cultural_profiles.city_id FK |
| 4 | Language-term registry tables | Build 100/101 (when voice work touches it) | ACCEPT — moved to Build 100 (registry migration) | 100 | Registry migration plan approved | All CITY_LOCAL_TERMS in language_terms table; rollback demo |
| 5 | Separate profanity opt-in setting | Build 100/101 (explicit founder rule) | ACCEPT — live defect; partial fix in Build 1.5 (remove from prompt); full schema in 100/101 | 1.5 (prompt fix) + 100/101 (schema) | 1.5 authorized by founder | Schema column; matrix test AAVE×profanity×tier |
| 6 | Crisis-intervention block in KinfolkAI | Next server deploy | ACCEPT — Build 1.5 | 1.5 | Build 1.5 authorized | Adversarial crisis test; Compassion Protocol verified |
| 7 | KinfolkAI session deletion + memory controls | Build 100/101; deletion pulled to next deploy | ACCEPT — deletion route in Build 1.5; full memory controls in 100/101 | 1.5 (deletion) + 100/101 (full controls) | 1.5 authorized | DELETE route test; memory panel in 100/101 |
| 8 | Source attribution in KinfolkAI responses | Build 100/101 | ACCEPT | 100/101 | Citation model from Build 99 | 10 sample queries reviewed by founder; all carry attribution type |
| 9 | Family-mode enforcement inside Kinfolk chat | Next deploy (minimal); full in 100/101 | ACCEPT — minimal guard in Build 1.5; full in 100/101 | 1.5 (minimal) + 100/101 (full) | 1.5 authorized | Adversarial prompt test; Family Mode ≠ membership tier test |
| 10 | Moderation pipeline for cultural/language contributions | Build 99/100 (before community contribution) | ACCEPT — moderation queue v1 in Build 99 | 99 | Before nomination flow opens | Queue operational before any nomination is live |
| 11 | Ambassador data model | Build 105 schema-first | ACCEPT | 105 | Build 103b consent; attribution from 99 | Schema migration; no engine ships before schema |
| 12 | Consented attribution events | Collection starts Build 99 | ACCEPT | 99 | Consent architecture (partial — consent_records in 102; use explicit confirmation UI in 99 as precursor) | Explicit consent moment before recording; no attribution without user confirmation |
| 13 | Signal aggregation + proportional interpretation layer | Build 103d (before Business Intelligence) | ACCEPT | 103d prerequisite | Attribution events since 99; aggregation infrastructure | Signal queries reviewed; seeded-exclusion test |
| 14 | Life Chapter entity distinct from Journey | Build 103b | ACCEPT | 103b | 103a entities; 102 consent | life_chapters table separate from life_journeys; migration evidence |
| 15 | Data export (journeys, saved learning, profile) | Build 103b | ACCEPT | 103b | Journey schema | `GET /api/journeys/export` returns user-readable JSON |
| 16 | Age assurance mechanism for youth journeys | Before 103b youth journeys | ACCEPT | Before 103b teen content; parental-consent decision required | Minor policy founder decision | Teen HBCU exploration gated behind age assurance |
| 17 | Notification governance | Build 100/101 | ACCEPT | 100/101 | Founder decision on proactivity limits | Policy table; notifications never from inferred sensitive events |
| 18 | Visibility tiers (Share / Ask / Always Private) | Build 102–103b | ACCEPT | 102 (schema) / 103b (journey UI) | Consent architecture | Cross-Role Privacy Standard tiers schema-backed |
| 19 | "Why am I seeing this?" explanation storage | Build 100/101 | ACCEPT | 100/101 | Citation model | `recommendation_reasons` table; UI surfaced in same build as memory |
| 20 | Search-history growth control + retention cap | Build 99 (hygiene) | ACCEPT — pulled to Build 1.5 (immediate safety) | 1.5 | 1.5 authorized | searchHistory cap enforced at write time; TTL set |

---

## SECTION E — RESEQUENCING (Manus §6 — full revised sequence)

| Order | Build | Change from prior plan | Rationale |
|---|---|---|---|
| 1 | 97 | As submitted | Foundation build; in Apple review |
| 1.5 | Server-only safety deploy (no binary) | **NEW** — crisis block, session deletion, minimal Family Mode guard, profanity coupling removed from prompt, search-history cap | Current safety and privacy gaps; no binary needed; pull forward |
| 2 | 98 | + `user_roles` relation; + role audit trail | Role refactor cheapest here; every later build reads roles |
| 3 | 99 | Living Legacy nominations only; + moderation queue v1; + citation model v1; + attribution-event collection begins | Moderation before contribution; citations before cultural content |
| 4 | 100 | **NEW BUILD** — mentorship with safeguards; "Things You'll Hear" on registry tables; HBCU alumni; **registry migration (founding layer)** | Registry migration before "Things You'll Hear"; safeguards in same build as mentorship |
| 5 | 100/101 | Kinfolk trust build; three-setting voice schema fields; full Family Mode wiring; session deletion + memory; transparency panel; source attribution; recommendation reasons; modular context builders | Voice schema must exist before decoupling; memory before transparency violates trust |
| 6 | 102 | Verified Community Member after vendor evidence + legal review; **platform-wide consent architecture built here** | Highest-leverage schema decision; legal hard gate |
| 7 | 103a | **NEW SPLIT** — city/community/neighborhood entities; registry re-parented; city-as-container (data model only) | Unblocks 103b, 103c, 103d |
| 8 | 103b + 103d | **NEW SPLIT** — Life Chapters + Journeys + My Story (privacy defaults, export, age safeguards) PARALLEL with Business Intelligence six engines on aggregation layer (parallel only if separate owners and all prerequisites complete) | Life events and business intelligence are independent after 103a; parallel reduces elapsed time |
| 9 | 103c | **NEW SPLIT** — Cultural Journeys / diaspora community layers — only after cultural-governance framework operating with named reviewers and completed review cycle | Governance before diaspora |
| 10 | 104 | Kinfolk Circles launch + meetup safety + public-Circles decision | Already built; launch only |
| 11 | 105 | Ambassador system: schema first → engines; impact reports fed by attribution data collected since Build 99 | Attribution collection must precede impact reports |
| 12 | 106+ | Orchestration; re-scope after Build 105 evidence; every recommendation remains explainable | Deferred correctly |

**The controlling rationale (from Manus §6, adopted verbatim):**
> consent before memory, moderation before contribution, citation before cultural content, entities before containers, governance before diaspora, aggregation before business intelligence, attribution collection long before impact reports.

---

## SECTION F — ARCHITECTURE REQUIREMENTS (Manus §7)

### F1. Deployment pipeline standards

| Requirement | Status | Gate |
|---|---|---|
| CI builds deployed artifact from committed source; never hand-committed bundles | Documented — enforced from Build 98 forward | CI pipeline evidence per build |
| Production exposes artifact content-hash fingerprint (not only RAILWAY_GIT_COMMIT_SHA) | Not yet implemented — add to Build 98 deployment checklist | Fingerprint visible in deployment metadata |
| Source / built artifact / Railway deployment / distributed binary separately verified | Documented; heritage-flag divergence incident confirms necessity | Four-layer verification checklist per build |
| Feature flags verified on-device against shipped binary | Required for every flagged feature from Build 98 | Binary QA sign-off per feature |
| Every release has a rollback flag or named revert | Document per build | Rollback procedure documented before each deployment |

### F2. Cultural registry migration (preserved, never flattened)

Full requirements documented in C2 above. Controlling rules:

1. **Do not delete or flatten the founding 36-city registry during migration** — every existing entry reproduced exactly as founding version 1
2. **Preserve** historical context, terms, writing guidance, touchstones, cultural depth
3. **Add** citations, version, review status, review dates
4. **Support** correction, rollback, contested flags
5. **Separate** founding content from future Living Community Layer contributions
6. **Eliminate** the three duplicated hardcoded TS sources only after parity is proven via registry-parity acceptance test
7. **No new cultural registry** may ever be created as a hardcoded TypeScript object

### F3. KinfolkAI architecture decomposition

Before Build 100/101 adds more context sources, decompose `kinfolk.ts`:

| Module | Responsibility | Scoped retrieval | Token/size budget | Priority |
|---|---|---|---|---|
| Preference context | User stated preferences, onboarding answers | user_preferences row | Small (fixed) | Always included |
| Voice context | community_voice, cultural_language_level, profanity_opt_in, code_switching | user_preferences row | Small | Always included |
| Cultural context | City/community registry (city's cultural profile, local terms, Things You'll Hear) | Specific city rows only (not all 36) | Medium (bounded) | High when in a city |
| Business/event retrieval | 10 nearest verified businesses + active events | Scoped radius query | Medium | High when discovery intent |
| City/community/neighborhood context | Layer selection, community identity | Single city + selected communities | Small | When community selected |
| Journey context | Active Life Chapter and Journey summaries | Active journeys for user | Small | High when journey active |
| Safety + family enforcement | Deterministic pre/post filter; crisis routing | family_settings row | Minimal | Always — deterministic, not prompt-only |
| Citation + source attribution | Verified fact vs. community trend vs. AI inference vs. sponsored | Verification status from cultural_profiles | Small | Whenever cultural claim made |
| Recommendation reasoning | Why this was suggested | Recommendation reason records | Small | Whenever recommendation made |

**Hard rules:**
- No whole-catalog or whole-table context injection
- No full search history injected into prompt
- Context budget enforced: lowest-priority modules dropped first, never total budget growth
- Private conversations: never write any chat content into shared cultural registries — this is a tested invariant
- Family Mode and crisis routing: deterministic code, never prompt-only enforcement
- `buildSystemPrompt` decomposed into module functions before adding any new context source in Build 100+

---

## SECTION G — DATA MODEL REQUIREMENTS (Manus §8)

### Present and adequate (no change required)
- User preferences (flat but functional — schema addition planned, not replacement)
- Saved items (`saved_places`, `collections`)
- Moderation status for posts (`content_reports` — scope expansion in Build 99)
- Age/family controls (booleans — schema addition in Build 1.5/100/101)
- Business entities (rich, 20+ tables)
- Events, check-ins

### Present but insufficient (targeted improvements)

| Table | Current insufficiency | Required change | Build |
|---|---|---|---|
| `life_journeys` | Flat 8-value `journeyType` enum with phases in one jsonb blob; no chapter concept; `aiContext` free-text varchar(2000) is unaudited memory store risk | Replace with `life_chapters` + `journeys` + `milestones` (Build 103b); `aiContext` → bounded structured context | 103b |
| `cultural_sites` | `verified_source varchar(255)` only | `source_citations` FK table; `cultural_profiles` with version + review status | 99 (schema) / 100 (migration) |
| `trust.ts` PAID_TIERS | Named allowlist — future tier added → won't qualify without code change | `memberType ≠ "individual"` | 102 |
| `user_preferences.searchHistory` | Unbounded jsonb array on prefs row | Cap + TTL at write time | 1.5 |

### Absent (must be introduced per schedule in Section D)

All 18 entity types listed in Manus §8 are confirmed absent and are now scheduled as specified above. No entity above is represented as completed by documentation alone. The acceptance-gate standard per Manus §12 / Section L below applies: "Schema only" is not "Implemented."

---

## SECTION H — KINFOLKAI ARCHITECTURE REQUIREMENTS (Manus §9)

### H1. Context assembly (current gaps confirmed)

KinfolkAI currently receives: preferences, liked/disliked spots, saved places, destination, voiceMode, aaveLevel, business catalog, active journey, cross-city bridge, weather, tier, twin recommendations, top vibes.

It does NOT receive: selected community context (no community entity), Life Chapter (no entity), family mode (not wired — verified), separate profanity preference (no field), citations, community signals.

Remedy: context budget architecture per Section F3. Each module receives a priority and token budget before Build 100/101 adds any new context source.

### H2. Voice governance (schema-backed, not prompt-only)

New user_preferences columns required in Build 100/101:

| Column | Type | Default | Notes |
|---|---|---|---|
| `community_voice` | enum(professional, friendly, local, home) | friendly | FOUNDER APPROVED naming |
| `cultural_language_level` | enum(standard, community_informed, community_native) | standard | FOUNDER APPROVED naming |
| `profanity_opt_in` | boolean | false | Separate consent moment with its own copy |
| `formality` | enum | — | Implicit in community_voice but may need explicit field |
| `city_voice` | varchar FK | null | User-selected; defaulting to off or destination suggestion (never silent imposition) |
| `audio_voice` | varchar FK | null | TTS voice selection |
| `code_switching` | enum(always, ask_me, never) | ask_me | FOUNDER APPROVED naming |
| `voice_mode` | varchar | community | Persisted; replaces per-request parameter |

**Private conversation invariant:** No code path may read chat message content and write to any cultural registry table. This must be a tested invariant (not only a policy statement). Test: send a chat about an undocumented local phrase → verify no `language_terms` row was created.

---

## SECTION I — JOURNEY, MEMORY, AMBASSADOR, PRIVACY, FAMILY, AND CULTURAL GOVERNANCE (Manus §10–14)

### I1. Journey architecture requirements

Full data model requirements: see Section C12 (Build 103b).

**Hard privacy rules (must be tested, not only documented):**

| Rule | How tested |
|---|---|
| Never infer race, religion, sexuality, pregnancy, health, disability, family status | Red-team prompt test: search terms about pregnancy → no "pregnancy journey" created; code review of journey-suggestion input allowlist |
| Never create or close a Journey without affirmative user confirmation | UX flow evidence: screen recording or Playwright test |
| Do not use search history as a journey trigger | grep test: journey-suggestion code does not read searchHistory |
| Journeys are private by default | New journey default visibility_tier = 'always_private' in DB constraint |
| Users can inspect, pause, edit, delete, reset, and export | Each operation tested end-to-end |
| Notifications cannot be generated from inferred sensitive events | Notification trigger code review: all triggers must reference stated preferences or explicit member actions, never sensitive behavior patterns |
| Opt-in graduation summaries and Pay It Forward invitations | Attribution events collected since Build 99; graduation prompt shown only if consented attribution events are sufficient |

### I2. Ambassador and creator architecture

Five structural requirements from Manus §11:

| Founder requirement | Structural implementation |
|---|---|
| Trust ≠ popularity | Community impact and external reach in separate DB tables and separate UI sections; community impact is primary in display order |
| Influence ≠ expertise | Expertise areas are declared by Ambassador and reviewed by the community; follower counts are never inputs to expertise display |
| Expertise ≠ credentials | `ambassador_profiles.expertise_type` field distinguishes "lived experience" from "credentialed"; displayed distinctly |
| Identity ≠ authority | Cultural reviewer roles require `review_history_count > 0`; identity alone does not grant authority |
| Views ≠ impact | Impact events come only from consented attribution events; views/clicks never used as impact proxy |

Creator life branches (travel creator → parenting branch): Chapter-linked creator profiles — one `ambassador_profiles` row, multiple life chapters. Content is never forced to recategorize.

### I3. Privacy and consent architecture

Platform-wide consent record architecture (Build 102): every new sensitive data collection requires:
1. A consent record written before the data
2. An enumerated `category` (never free-text)
3. A `version` so policy changes can be surfaced to existing users
4. A `revoked_at` path that actually removes processing, not just a flag

**Prohibited patterns (enforced in code review checklist for every build):**
- Inferring race, religion, orientation, pregnancy, health from behavior
- `dietaryNotes`-style free-text fields on sensitive topics (audit at each build)
- Sensitive attributes stored without corresponding `consent_records` row
- Sharing member data cross-role without explicit cross-role consent

### I4. Minors and family

Current family system: booleans + keyword filter (violation snippet retention → needs short TTL).

**Before any youth-oriented journey ships (specifically teen HBCU exploration, named teenager scenario in the founder's vision):**
- Wire family mode into every AI surface as deterministic code (not prompt-only) — Build 1.5 for minimal, Build 100/101 for full
- Define the minor experience (13–17) explicitly: what personalization is disabled, what memory retention is minimum (never more than one session without consent), what notifications are permitted
- Require parental consent flows for 13+ where health-adjacent, location-sharing, or sensitive-journey content is involved
- Never link family mode status to membership tier (tested invariant from Build 1.5 forward)
- Keyword-violation snippet retention: short TTL set in Build 1.5 (not stored indefinitely)

### I5. Cultural governance

Governance framework requirements (must be operational before Build 103c):

| Requirement | Governance rule |
|---|---|
| Reviewer qualifications | Lived-experience OR subject-matter expertise required; documented per community |
| Lived-experience requirement | Community-specific (Haitian Miami reviewers for Haitian Miami content) |
| Minimum reviewers for ordinary claims | 2 named reviewers required |
| Minimum reviewers for contested historical claims | 3 named reviewers required |
| Indigenous content | Reviewer from the relevant Nation or community required; no proxy reviewers |
| Conflict of interest | No reviewer approves their own contribution |
| Citation requirements | Every cultural claim requires at least one source citation |
| Historical superlatives | Two independent sources minimum |
| Review-due dates | Every cultural profile entry has a review-due date; overdue entries flagged |
| Contested flags | Disputed entries display "Some community members have questioned this information" |
| Correction and appeal | Any community member can flag an entry; formal appeal reviewed by new reviewer |
| Rollback | Any entry can be reverted to a prior version without losing history |
| Contributor attribution | Contribution credit recorded; contributor can request anonymization |
| Removal requests | Content creator or subject can request removal; platform has SLA for response |

**Equal-treatment rule (from founder's vision, encoded here):**
> Every future community must use the same cultural-profile structure, citation standard, and review threshold as the founding Black-city registry. No community may be treated as a smaller or less-developed expansion layer.

---

## SECTION J — CODE-PATTERN WARNING REGISTER (Manus §12, 15 patterns)

Each pattern is assigned a build-specific prevention rule and acceptance test.

| # | Pattern | Risk | Prevention instruction | Build gate | Acceptance evidence |
|---|---|---|---|---|---|
| 1 | Duplicated city registries | Inconsistent cultural voice; wrong facts | Single source of truth; after Build 100 migration, imports only from DB | Now → 100/101 | grep shows one CITY_VOICES definition; parity test across 3 consumers |
| 2 | Hardcoded cultural data without versioning | Cultural errors persist; no rollback | Registry tables with version + status + review dates | 99–103c | Migration diff; version rows; rollback demo |
| 3 | Uncontrolled prompt growth / one giant prompt | Context exceeds budget; model ignores safety sections | Modular context builders with per-module token budgets and priorities | 100/101 | Prompt-size CI test; budget config in code review |
| 4 | One giant Kinfolk route file (2,680 lines) | Defects in safety-critical path | Decompose into modules before adding features in Build 100+ | 100/101 | File-size limit enforced; module map in PR |
| 5 | Unbounded queries / N+1 / whole-catalog loads | Build 96 failure class recurs at scale | Scoped, indexed, LIMITED retrieval; context row caps | 103d, 106 | Query plans in PR; load test at 10× data |
| 6 | Saving full private conversations / private chats as training data | Trust destruction; privacy exposure | Sessions store only what memory policy allows; registry writes never sourced from chat; deletion honored end-to-end | 100/101+ | Data-flow diagram; deletion test; invariant test |
| 7 | Missing consent audit trails; sensitive identity as free-text tags | Legal exposure; profiling | Consent table writes on every grant; enumerated fields only; inference prohibited in code review checklist | 102–103b | Consent rows in DB; schema review; red-team prompt test |
| 8 | Automatic journey detection from sensitive behavior | Deep trust violation; possible legal exposure | Journeys created only via explicit user confirmation UI; suggestion inputs exclude search history and sensitive categories | 103b | UX flow evidence; input-source allowlist in code |
| 9 | Coupling profanity to AAVE; coupling family mode to membership | Founder-rule violation; safety paywalled | Separate schema fields; deterministic gates; independent of tier | 1.5 (prompt) + 100/101 (schema) | Matrix test (AAVE × profanity × family × tier) |
| 10 | Prompt-only safety enforcement | Minor exposed to adult content; crisis mishandled | Deterministic pre/post filters for family mode, crisis, profanity | Now (1.5) | Adversarial test suite results |
| 11 | Mixed admin/user/ambassador permissions; missing row-level checks | Data breach; governance collapse | Role middleware per route class; ownership checks on every mutation; admin routes behind admin auth | 98+ | Route-permission matrix; penetration test |
| 12 | Insecure media uploads | Living Legacy video with malware or unstripped EXIF GPS | Content-type validation, EXIF stripping, virus scan, signed URLs, size caps | 105 | Upload test evidence |
| 13 | Licensing only in UI copy; no content-removal rights | Legal dispute; creator trust loss | License + removal-state fields on contributions; removal workflow | 105 | Schema + removal workflow demo |
| 14 | Unversioned/unexplained recommendations; cultural facts without citations | Constitution violations; misinformation | Recommendation-reason records; citation-required rendering for cultural claims; surfaced provider errors | 100/101+ | Reason rows in DB; UI citation display; failure-mode test |
| 15 | Synthetic/Beta data mixed with real metrics | False intelligence; popularity inversion | `isSeeded` / `isBetaTest` flags excluded from all aggregation; impact metrics from consented attribution only | 99+ | Aggregation query exclusion test; seeded-exclusion test |

---

## SECTION K — SECURITY AND SCALABILITY REQUIREMENTS (Manus §13)

### K1. Security standing requirements (apply to every build)

- Admin routes: per-role middleware on every route class; ownership checks on every mutation; admin routes behind admin auth (no emergency-token shortcuts)
- SESSION_SECRET rotation: procedure documented; rotation schedule confirmed; last rotation date recorded in `docs/`
- Dependency and upload scanning: from Build 105 forward, run dependency audit and upload malware scan before each production deploy
- Secrets: never in request bodies, never in URLs, never in logs — review checklist item for every build

### K2. Scalability requirements

| Requirement | Assigned build | Note |
|---|---|---|
| Scheduled aggregation jobs (replace in-process cron + hand-rolled aggregations) | 103d | Move to scheduled jobs before Business Intelligence |
| Index every foreign key on new tables in 103a+ | 103a | Entity migrations must include FK indexes; join plans reviewed in PR |
| Cap archive and event tables (`kinfolk_search_events`, attribution events) with retention policies | 103d before BI | Unbounded event tables will dominate query plans |
| KinfolkAI per-tier token budgets | 100/101 | Cost control before Business Intelligence multiplies LLM calls |
| Monthly cost dashboard for LLM costs | Before 103d | Test at 10× current data before enabling BI briefings |
| Load test at 10× current data | Before 103d | Build 96 failure class (pool exhaustion from unbounded catalog loads) must not recur |

---

## SECTION L — ACCEPTANCE-GATE REGIME (Manus §12 / Directive Section 12)

### L1. Implementation status vocabulary (replace all prior usage)

Every capability henceforth is reported using exactly these six levels:

| Level | Meaning |
|---|---|
| **Documented only** | Capability described in docs or code comments; no schema, no route, no UI |
| **Schema only** | DB table exists; no routes, no UI |
| **API complete** | Routes tested in isolation; no client-side integration |
| **UI complete** | Client-side implementation; not yet verified in a distributed binary |
| **Binary verified** | Verified on physical device against the actual shipped TestFlight / Play Console binary |
| **Production verified** | Verified against Railway production deployment (not dev) |

"Implemented" without qualification is not permitted.

### L2. Per-build evidence required before a build is marked complete

For every build from Build 98 forward, all of the following must be documented:

1. Committed source evidence (git SHA pointing to feature code)
2. Migration evidence (Drizzle migration file committed; migration ran successfully in Railway)
3. API evidence (route tests passing; response shapes verified)
4. Production deployment fingerprint (content hash, not only git SHA)
5. Physical phone evidence (iOS: TestFlight or App Store binary; Android: Play Console binary)
6. Tablet evidence (iPad layout verified)
7. Privacy/consent evidence (consent rows written for new data categories)
8. Access-control evidence (role-gated routes tested with unauthorized credentials → 403)
9. Moderation evidence (where applicable: submission creates queue item; queue item visible to admin)
10. Rollback evidence (feature flag disables the feature; re-enable verified)
11. Stability evidence (24-hour Railway log window post-deploy: zero DB errors, zero pool exhaustion)
12. Regression tests passing (auth regression, map regression per build; new capability regression tests added)

### L3. Claims requiring repeatable test suites

Before any of the following claims may be stated:

| Claim | Required test suite |
|---|---|
| "KinfolkAI understands cultural context" | 10-city × 3-query cultural accuracy test; founder review; version-pinned |
| "Family Mode works" | AAVE × profanity × family × tier matrix; adversarial prompt injection; physical device test |
| "AAVE and profanity are separated" | Matrix test confirming profanity setting never changes based on AAVE level; independence test |
| "Community reviewed" | Named reviewer records in DB; review cycle evidence (submission → review → approval → published) |
| "Private" | Default visibility test; sharing test (private item does not appear in community signals) |
| "Impact measured" | Consented attribution events exist for impact claims; seeded data excluded; aggregation test |
| "Business Intelligence is proportional" | Signal from 1 person ≠ weight of signal from 50 people; minority-perspective signal visible despite low volume |

---

## SECTION M — POLICY AND LEGAL GATES (Manus §12 / Directive Section 13)

| Gate | Build | Type | Mitigation |
|---|---|---|---|
| UGC moderation, reporting, and blocking before contribution surfaces | Build 99 | Apple 1.2, Google UGC | Moderation queue v1 operational before nomination or contribution UI goes live |
| Age-rating review when profanity controls change | Build 100/101 | Apple 1.1/1.2 | Profanity opt-in raises content rating; App Store age questionnaire updated honestly; family mode + age assurance required |
| Biometric/privacy review before Verified Community Member | Build 102 | Apple 5.1.1(ix); BIPA legal | Legal review is a hard gate; documented sign-off before implementation begins |
| Sensitive personal data disclosures before Life Chapters | Build 103b | Apple 5.1.2(i), Google User Data Policy | Privacy nutrition labels updated per build that adds new data collection |
| Youth and family legal review before teen journeys | Before 103b teen content | COPPA-adjacent; Apple family guidelines | Minor policy founder decision + legal review before teen HBCU exploration activates |
| Real-world meetup safeguards before Circles | Build 104 | Apple 1.2 safety | Meetup Verification and safety guidelines in Build 104 scope (not deferred) |
| Content licensing before Ambassador media | Build 105 | Legal; Apple 3.1.1 | License + removal-state DB fields before media submission pipeline opens |
| Apple/Google payment analysis before Pay It Forward compensation | Before Build 105 design freeze | Apple 3.1.1 IAP | If compensation flows through the app → IAP compliance required; physical-world payouts are fine |
| Privacy-label updates for every build that changes data collection | Every build from 97+ | Apple data safety; Google Data Safety | Data Safety form re-audited before each build submission |
| Account deletion re-audit at every build that adds data collection | Every build | Apple 5.1.1(v) | Re-audit forms at every build that adds data categories |

---

## SECTION N — SECOND ADVISOR REVIEW (Founder's advisor recommendations)

The founder's advisor provided a separate review grading the plan A/A-/A-/B+/B (Architecture/Sequencing/Risk/Founder-Intent/Long-Term-Vision) with five missing features and one immediate recommendation. Each is addressed below.

### N1. Platform is being treated as software, not a trust ecosystem

**Advisor finding:** Every feature (Businesses, Communities, Cities, Journeys, KinfolkAI, Ambassadors, Living Legacy, Events, Library, Business Intelligence) is a trust engine, not an independent product. The architecture should explicitly state this so future engineers optimize trust, not features.

**Response:** ACCEPT. The Founder Vision Preservation statement at the top of this reconciliation document and the Build-Phase Inventory now states this governing principle explicitly. The addition of a "BUILD 0 — Founding Principles" document is addressed in N6 below. The Community Intelligence Constitution's eleven principles are the operative architectural requirement — they are already in `docs/vision/COMMUNITY_INTELLIGENCE_CONSTITUTION.md` and are referenced as acceptance criteria.

### N2. Almost no discussion of emotional safety

**Advisor finding:** New city anxiety, being the only minority, moving alone, finding community, being welcomed — these are product requirements, not marketing.

**Response:** ACCEPT. Adding to the Build 98 scope: an explicit "Emotional Welcome" standard for the member's first 30 days (empty states, loading messages, error messages, and KinfolkAI opening responses must reflect genuine welcome — not generic app copy). The "If this is your first time..." section standard (Build 103c) and the KinfolkAI context-aware opening line (Build 100/101) are the architectural implementations of this requirement. Emotional safety test cases are added to the Build 100/101 acceptance gate: a new member in a new city asks KinfolkAI "Is this neighborhood safe for someone like me?" — response must be warm, informative, and never dismissive.

### N3. Platform centers data instead of people

**Advisor finding:** Pages about tables and schemas; almost nothing describing "What should a member actually feel?"

**Response:** ACCEPT. The Build 0 document (N6 below) addresses this. Additionally, every build's acceptance test in Section C above now includes at least one "What does a member feel?" criterion alongside technical verifications.

### N4. Community intelligence is too database-centric; needs confidence/recency/regional-disagreement/minority-perspective concepts

**Advisor finding:** Community knowledge changes. It evolves. Confidence, recency, community agreement, regional disagreement, time sensitivity, minority perspective, multiple viewpoints deserve first-class treatment.

**Response:** ACCEPT. The Community Signal Strength Standard in `docs/product/COMMUNITY_SIGNAL_STRENGTH_STANDARD.md` already defines the 5-dimension model (Prevalence/Volume/Momentum/Relevance/Confidence) and the "minority perspective visible despite low volume" requirement. These are now explicitly referenced as Build 103d prerequisites, not post-103d aspirations. Adding "multiple viewpoints" as a required display pattern for cultural claims: where two or more reviewers disagree, both viewpoints are displayed.

### N5. Business Intelligence — risks of bias reinforcement, popularity loops, hidden gems

**Advisor finding:** Explicit principles needed: avoid reinforcing bias; avoid popularity loops; surface hidden gems; support new businesses; ensure rural communities aren't drowned out; protect small followings.

**Response:** ACCEPT. These principles are encoded as Build 103d acceptance tests:
1. **Anti-popularity loop test:** a business with 10 visits from diverse members surfaces in briefings before a business with 50 visits from 3 members (proportional interpretation)
2. **New business protection:** businesses registered within the last 60 days receive a "new community member" signal boost for at least 90 days
3. **Hidden gem test:** a highly-rated business with zero promotional spending surfaces in briefings equal to a promoted business with equivalent community signals
4. **Rural/underserved test:** cities with fewer than 20 businesses do not receive empty briefings — briefings adapt to available signal depth
5. **Anti-bias principle:** business category is never used as a proxy for community worth; a nail salon in a Black neighborhood receives the same briefing quality as a law firm

### N6. Build 0 — Founding Principles document

**Advisor recommendation:** A philosophy document above all engineering documents that every future engineer reads before Build 97. Contents: Mission, Vision, Trust hierarchy, Decision framework, Privacy philosophy, AI philosophy, Community philosophy, Business philosophy, Growth philosophy, Founder non-negotiables, Definitions, Success metrics.

**Response:** ACCEPT. This document is designated as `docs/MWM-FOUNDING-PRINCIPLES.md`. It is a new document to be authored. Its content should draw from:
- `docs/vision/COMMUNITY_INTELLIGENCE_CONSTITUTION.md` (11 principles)
- `docs/MWM-Constitution-v1.0.md` (Volume I)
- All locked founder decisions in `.agents/memory/kinfolk-constitution-decisions.md`
- The Controlling Requirement header above this document
- The platform success metric verbatim from `kinfolk-life-chapters-model.md`
- The anti-gamification principle from `kinfolk-lifelong-companion-vision.md`
- "Algorithms chase engagement. Kinfolk cultivates contribution." from `kinfolk-community-intelligence.md`

**Status: Documented only. Requires founder review and "Please implement." before authoring.**

### N7. Missing Feature: Trust Recovery

**Advisor finding:** Business responds → community forgives → review updated → owner fixes issue → business grows → trust rebuilt. This lifecycle is missing as a foundational capability.

**Response:** ACCEPT — adding to FSR. Trust Recovery is a named lifecycle:
- Owner response on reviews: ALREADY BUILT (per Philly launch features)
- Community acknowledgment of owner response: NOT IMPLEMENTED — member who left a review can mark it "Resolved / Owner addressed this"
- Review update flow: a member can update a prior review after a business interaction (not delete — update, with edit history)
- Business growth signal from Trust Recovery: a business with a resolved-complaint ratio above threshold receives a trust signal bonus in Business Intelligence briefings

**Assigned build:** Build 99 (Contribution ecosystem — Trust Recovery is a contribution and review integrity feature). Added to FSR as FSR-056.

### N8. Missing Feature: Community Succession (Mentor → Ambassador → next Ambassador)

**Advisor finding:** Mentor becomes ambassador; ambassador trains next ambassador; legacy continues. This is a strongest differentiator.

**Response:** ACCEPT. Named "Community Succession" in the roadmap:
- Journey Ambassador path: completing a Life Chapter triggers a Journey Ambassador invitation → Journey Ambassador mentors the next person beginning that journey → legacy continues through the platform's memory, not just personal relationships
- Cultural Ambassador succession: a retiring or evolving Cultural Ambassador can formally designate successors for their communities
- The Pay It Forward Moment (Build 105) is the immediate implementation of succession

**Assigned build:** Build 103 (Journey Ambassadors as part of Life Chapters); Build 105 (Cultural Ambassador succession). Added to FSR as FSR-057.

### N9. Missing Feature: The "Why" — "We don't tell people where to go; we help them discover where they belong"

**Advisor finding:** This philosophy should be written into the architecture — future developers won't infer it.

**Response:** ACCEPT. This becomes Principle 1 of the Founding Principles document (N6 above). Additionally, every KinfolkAI recommendation now requires a "Why" explanation (Recommendation Reason Records, Build 100/101). The test: a member can always ask "Why did you suggest this?" and receive a genuine, specific answer — not a generic response.

### N10. Missing Feature: Business Growth Lifecycle (New → Founding → Trusted → Community Favorite → Legacy → Hall of Honor)

**Advisor finding:** Right now: business joins → verified → promoted. Missing the trust lifecycle.

**Response:** ACCEPT. Named "Business Trust Lifecycle." Lifecycle stages:
- **Community Reference:** business suggested by community, not yet self-registered (already built — `is_reference_only`)
- **New Community Business:** registered, unverified, first 90 days
- **Verified Community Business:** ownership documented
- **Trusted Community Business:** sustained positive signals, Trust Recovery history, engagement quality
- **Community Favorite:** community-nominated; threshold of diverse, sustained signals
- **Legacy Business:** 10+ years in community; Living Legacy nomination eligible
- **Hall of Honor:** Cultural Ambassador or community organization-nominated; platform recognition

**Assigned build:** Business Trust Lifecycle stages defined as data model in Build 103d (signal aggregation needed for "Trusted" and above). Display in Build 103d. Hall of Honor display in Build 105 (Ambassador endorsement required). Added to FSR as FSR-058.

### N11. Founder Intent Traceability Matrix (philosophical, not technical)

**Advisor recommendation:** For every build and major feature: Why does this exist? How does it increase trust? What founder principle does it support? What could go wrong? How will we know it succeeded?

**Response:** ACCEPT. This matrix is the governing questions table added to each build in the Inventory. Adding the 5-question matrix to each Build entry in a future Inventory v1.1 update. For now, the questions are documented here as a required addition to every future build definition before "Please implement." is authorized.

Required questions for every future build before implementation authorization:
1. Why does this exist? (human problem solved)
2. How does it increase trust? (specific trust mechanism)
3. What founder principle does it support? (reference the Constitution or Founding Principles)
4. What could go wrong if implemented poorly? (community, legal, ethical risks)
5. How will we know it succeeded? (measurable outcome beyond usage metrics)

---

## SECTION O — DUPLICATE CAPABILITIES RECONCILIATION (Manus §5)

Two duplicate placements in the inventory are resolved:

| Capability | Prior conflict | Resolution |
|---|---|---|
| Living Legacy submissions | Appeared in Build 99/100 (founder session) AND Build 105/Phase 8 (repo roadmap) | **RESOLVED:** Nominations only (text, no media) in Build 99. Media submissions, oral histories, and full Living Legacy pipeline in Build 105. This is one system with two stages. |
| Personalization onboarding | Appeared in Build 97 (5 questions) AND AUDIT-005's "restored conversational onboarding" (Build 100/101) | **RESOLVED:** One system, two stages. Build 97: 5-question static onboarding (already in review). Build 100/101: conversational onboarding extended with KinfolkAI context (AUDIT-005 FSR-019). These are two stages of the same onboarding system, not two competing systems. |

---

## SECTION P — FOUNDER DECISION REGISTER (COMPLETE — ALL OUTSTANDING DECISIONS)

### Decisions required before Build 1.5 can be authorized

| # | Decision | Context |
|---|---|---|
| FD-1.5-001 | Authorize Build 1.5 server-only safety deploy ("Please implement.") | Crisis block, session deletion, minimal Family Mode guard, AAVE/profanity prompt fix |

### Decisions required before Build 97 is complete (pass-through from prior plan)

| # | Decision | Context |
|---|---|---|
| FD-97-001 | Verify Wave 1-A (auth hardening) — confirm lockout message is helpful, not alarming | Human test |
| FD-97-002 | Verify Wave 3-A (CRON_SECRET fail-closed) — confirm CRON_SECRET set in Railway production | Process check |
| FD-97-003 | Verify Wave 3-B (CAN-SPAM) — confirm email footer content is correct | Content review |
| FD-97-004 | Verify Wave 3-C (Stripe idempotency) — confirm test-mode webhook test | Technical verification |
| FD-97-005 | Verify Wave 3-D (RevenueCat server-side) — confirm real RC test purchase works | iOS device test |
| FD-97-006 | Google Maps API key restriction correction in Google Cloud Console (Android VC71 blocker) | Founder action in Google Cloud Console |

### Decisions required before Build 98 implementation begins

| # | Decision | Context |
|---|---|---|
| FD-98-001 | Community Organization eligible types (nonprofit only? informal groups? faith organizations?) | Role model depends on this |
| FD-98-002 | "Minority" registry corrections: each flagged instance reviewed and replaced with specific language | Approved in principle; each instance requires specific replacement text |
| FD-98-003 | Cultural Ambassador qualification criteria (application vs. invitation model) | Drives Build 98 ambassador entry point design |
| FD-98-004 | Approval of founding-registry migration method (cell-for-cell; TS fallback retained) | Required before Build 100 registry migration |

### Decisions required before Build 99 implementation begins

| # | Decision | Context |
|---|---|---|
| FD-99-001 | Living Legacy placement confirmed: nominations in Build 99, media in Build 105 | Resolves prior conflict |
| FD-99-002 | Consented attribution events: exact consent moment design (explicit UX confirmation required) | What does the user see and confirm before an attribution event is recorded? |
| FD-99-003 | Moderation queue v1 design: who reviews? What qualifications? What SLA? | Required before any community content contribution goes live |

### Decisions required before Build 100 implementation begins

| # | Decision | Context |
|---|---|---|
| FD-100-001 | Minor policy for mentorship (18+ or different age policy) | Structured mentorship ships with safeguards |
| FD-100-002 | Registry migration parity test acceptance: founder confirms the test format and pass criteria | Before TS fallback can be removed |
| FD-100-003 | HBCU alumni data sourcing: how are alumni stories populated? Self-report? Institutional data? | Required before HBCU alumni connections ship |

### Decisions required before Build 100/101 implementation begins

| # | Decision | Context |
|---|---|---|
| FD-101-001 | Chat history retention period (how long kinfolk_sessions persisted) | Memory deletion policy |
| FD-101-002 | Maximum memory depth by tier (Community Member / Navigator / Trailblazer) | Context budget architecture |
| FD-101-003 | Minimum platform age and language level cap for teen accounts | Age/AAVE interaction |
| FD-101-004 | Proactivity limits: how often Kinfolk can initiate (check-ins, nudges, suggestions) | FSR-049 |
| FD-101-005 | Notification governance: what may trigger from inferred vs. stated context | Notification policy table |
| FD-101-006 | Profanity preference copy and consent moment exact wording | Separate opt-in copy must be authored |

### Decisions required before Build 102 implementation begins

| # | Decision | Context |
|---|---|---|
| FD-102-001 | Final vendor selection (Stripe Identity vs. Veriff) — after 5-step evaluation | Legal gate |
| FD-102-002 | Verification data retention period (legal minimum per BIPA/CUBI) | Legal hard gate |
| FD-102-003 | Badge exact wording ("Community Verified ✔" — confirm) | UI + legal copy |
| FD-102-004 | What member sees if vendor is unavailable (graceful degradation UX) | UX spec |

### Decisions required before Build 103 implementation begins

| # | Decision | Context |
|---|---|---|
| FD-103-001 | Approval of 103a/103b/103c/103d split | Mandatory split; requires explicit founder approval |
| FD-103-002 | Cultural review thresholds confirmed (2/3 reviewer requirements) | Governance framework |
| FD-103-003 | First named cultural reviewers for at least 3 of 10 first-cohort communities | Names, not just roles — required before 103c begins |
| FD-103-004 | Minor policy for youth journeys (age assurance, parental consent, what is disabled) | Required before teen HBCU exploration activates |
| FD-103-005 | Business Intelligence Briefing cadence | Build 103d design |
| FD-103-006 | Briefing opt-in vs. default | Affects business owner experience at launch |
| FD-103-007 | Voice tone learning opt-in mechanism for business owners | Explicit consent mechanism |
| FD-103-008 | Public/discoverable Circles — yes or no? (FD-P7-001) | Build 104 privacy posture |
| FD-103-009 | Historical Sundown Towns: all 9 pre-implementation gates cleared | See BUILD_97_HISTORICAL_SUNDOWN_TOWNS_AUDIT.md — BLOCKED until cleared |
| FD-103-010 | "Mardi Gras Indians" correction: New Orleans community review required first | travel.ts line 67 — BLOCKED |

### Decisions required before Build 105 implementation begins

| # | Decision | Context |
|---|---|---|
| FD-105-001 | Ambassador compensation/recognition model | Cannot launch portal without this |
| FD-105-002 | Content ownership confirmed as database fields (not only UI copy) | Legal + technical |
| FD-105-003 | Living Legacy oral history release form (legal review complete) | Before media submissions open |
| FD-105-004 | Apple IAP analysis for Pay It Forward before design freeze | Compensation through app = IAP compliance |

### Decisions awaiting post-launch data

| # | Decision | Context |
|---|---|---|
| FD-POST-001 | Pricing evolution (outcomes-based, usage-based) | Defer until 6+ months post-launch evidence |
| FD-POST-002 | Economic impact measurement methodology | Requires post-launch usage patterns |
| FD-POST-003 | KinfolkAI proactivity governance at scale | FSR-049 — real engagement data required first |

### Decisions requiring separate founder sessions

| # | Decision | Context |
|---|---|---|
| FD-SEP-001 | Asian diaspora communities (7 deferred groups) | Separate session required; distinct community sensitivities |
| FD-SEP-002 | MENA and immigrant communities | Separate session required |
| FD-SEP-003 | Build 0 — Founding Principles document content and approval | N6 above |

---

## SECTION Q — SUMMARY

### Recommendations fully accepted (no modification)
All 4 structural problems identified by Manus: ACCEPTED  
All 9 build verdicts: ACCEPTED with conditions as specified  
All 20 missing capabilities: ACCEPTED and assigned  
Complete resequencing (12-step order): ACCEPTED  
Architecture findings (registry, KinfolkAI decomposition, deploy pipeline): ACCEPTED  
Data model findings (18 absent entities): ACCEPTED  
Code-pattern warning register (15 patterns): ACCEPTED  
Security and scalability requirements: ACCEPTED  
Apple/Google policy risk table: ACCEPTED  
Second advisor review (N1–N11): ACCEPTED

### Recommendations modified
None. Where Manus issued conditional approval, conditions are adopted as stated. Where Manus proposed a specific build number that differs from the prior plan, the Manus sequencing is adopted.

### Recommendations rejected
None. No Manus recommendation was rejected or narrowed.

### Unresolved conflicts
The two duplicate capability placements (Living Legacy, personalization onboarding) are resolved per Section O.

### Founder decisions required before Build 98 can begin
1. Authorize Build 1.5 server-only safety deploy ("Please implement." for Build 1.5)
2. Verify all 6 Build 97 carry-forward items (FD-97-001 through FD-97-006)
3. Community Organization eligible types (FD-98-001)
4. "Minority" registry correction: each instance reviewed (FD-98-002)
5. Cultural Ambassador qualification criteria (FD-98-003)
6. Founding-registry migration method approved (FD-98-004)

### Immediate safety items awaiting authorization (no build may begin until these are addressed)

These are current safety and privacy gaps. They require authorization ("Please implement.") before any code change is made:

1. **KinfolkAI crisis-intervention hard stop** — currently absent (AUDIT-005 confirmed, Build 1.5)
2. **KinfolkAI session deletion route** — currently absent (Build 1.5)
3. **Minimal Family Mode deterministic guard in KinfolkAI** — currently absent (Build 1.5)
4. **AAVE/profanity coupling removal from system prompt** — live defect (Build 1.5)
5. **Search-history retention cap** — unbounded jsonb on prefs row (Build 1.5)

These five items are server-side, require no EAS binary, and carry low deployment risk. They are batched as Build 1.5. Implementation awaits founder authorization.

### Confirmation that no code or production changes were made
**CONFIRMED.** This entire session was read-only planning and documentation. No code was written, no schema was changed, no migrations were created, no production deployments were triggered, no Apple/Google builds were modified, no workflow configurations were altered.

---

*Manus independent review completed July 28, 2026. Replit reconciliation completed July 28, 2026.*  
*No implementation is authorized by this document.*  
*Authorization phrase: "Please implement." — applies per build, not to the whole document.*
