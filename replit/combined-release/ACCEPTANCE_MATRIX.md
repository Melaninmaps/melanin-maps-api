# Combined Release Acceptance Matrix

The combined candidate is **NO-GO** until each row is PASS against the reviewed feature commit, approved test database, website build, iOS 104, and Android 79. Browser evidence cannot substitute for native-device evidence.

| ID | Journey | Required result |
|---|---|---|
| COM-01 | Public post, everyone may comment | Unblocked member can load, add, reload, and delete own comment; count stays synchronized. |
| COM-02 | Followers/connections only | Accepted follower or connection may comment; unrelated member sees a clear restriction. |
| COM-03 | Comments off | Everyone except the author is blocked; existing comments are not exposed improperly. |
| COM-04 | Followers-only/private post | Only authorized relationships can view or comment. |
| COM-05 | Two-way block | Neither blocker nor blocked member can read or write the discussion. |
| COM-06 | Comment moderation | Unsafe content is rejected; member can report; duplicate pending report is suppressed. |
| COM-07 | Comment notification | Post author receives one non-critical notification; self-comment sends none. |
| COM-08 | Web comment dialog | Loading, empty, restricted, retry, submit, delete, and report states work at desktop and mobile widths. |
| COM-09 | Native comment modal | Same states pass on installed iOS and Android builds through force-close/relaunch. |
| HAP-01 | Submit article/update | HTTPS public source, summary, topic, and locality submit to pending moderation. |
| HAP-02 | Unsafe source | HTTP, malformed, private/reserved host, or unsafe redirect is rejected before storage. |
| HAP-03 | Pending privacy | Submitter/admin can see pending item; other members cannot. |
| HAP-04 | Approval | Approved item appears and creates one linked Community discussion post. |
| HAP-05 | Rejection/dispute | Rejected or disputed item is removed from ordinary feeds; linked post is restricted. |
| HAP-06 | Personalization | Explicit interests rank first, locality outranks wider scopes when relevant, freshness decays, and engagement contributes. |
| HAP-07 | Diversity guard | More than two consecutive results from one category are deferred when alternatives exist. |
| HAP-08 | For You/Latest and scopes | Web and native controls return deterministic, recoverable results. |
| HAP-09 | Confirmation/report | Members cannot confirm their own item, may toggle another approved item, and may report incorrect information. |
| HAP-10 | Explicit avoids | A category in `avoidCategories` is absent from For You even when it otherwise matches an interest; Latest remains chronological. |
| HAP-11 | Consented topic-interest events | Missing consent is rejected; approved category/topic identifiers persist and affect ranking; raw search, chat, URL, and member-note text are never stored. |
| HAP-12 | Normalized home state | Full state names and postal codes normalize to one stored state code and produce deterministic state ranking. |
| HAP-13 | Local boundary and expansion | Local initially includes only home/favorite cities; another city in the same state appears only after the member explicitly selects state expansion on web/native. |
| HAP-14 | Governed synonyms | Reviewed `redistricting → politics` affects interests/avoids; an ungoverned phrase does not. |
| KIN-01 | Stable general question | “Can I look at a lunar eclipse?” receives a useful conversational answer, not the insufficient-Library placeholder. |
| KIN-02 | Current/high-stakes research | Current political, health, legal, or safety question uses research and displays valid sources or a clearly labeled fallback. |
| KIN-03 | Research soft miss | Insufficient approved sources fall through to a useful bounded answer; fabricated citations are never shown. |
| KIN-04 | Conversational modes | Big Cousin, Professor, Business Manager, and Best Friend alter tone—not facts or safety rules. |
| KIN-05 | Image question | Member uploads one/two images, sees previews, sends, receives a vision response, and can recover from upload failure. |
| KIN-06 | Image ownership/privacy | Another member’s URL and expired/invalid image fail; Kinfolk images are private and short-lived. |
| KIN-07 | Health image | Response separates observation from diagnosis, accounts for skin-tone presentation without inferring ethnicity, checks urgent red flags, and recommends care appropriately. |
| KIN-08 | Explicit memory | Nothing is saved without opt-in; approved memory is visible and forgettable on web/iOS/Android. |
| KIN-09 | Sensitive recall | Fertility/IVF and other sensitive memory appears only in a related conversation and never becomes cross-member intelligence. |
| KIN-10 | Citations | Website and native source links open safely and correspond to returned research metadata. |
| KIN-11 | Production private-memory control | Without the exact production enable flag, memory CRUD returns `PRIVATE_MEMORY_DISABLED`, private content is not loaded into prompts or sessions, and settings cannot re-enable it. |
| KIN-12 | Database control documentation | Plaintext legacy rows remain inaccessible while production memory is disabled; least privilege, encrypted transport/storage, backup retention, access audit, deletion, and future field-encryption requirements are documented. |
| KIN-13 | Cultural language principle | Kinfolk understands more ways of speaking than it attempts to imitate; no request, location, or identity causes accent performance, forced slang, or a persona change. |
| KIN-14 | Separate language choices | Regional comprehension, regional speaking style, cultural-language preference, and profanity controls are independently persisted; comprehension can be on while speaking style is off. |
| KIN-15 | Verified place-name resolution | A canonical, source-backed place reference resolves aliases and regional pronunciations. Tchoupitoulas Street in New Orleans is a required controlled recognition fixture. |
| KIN-16 | Bounded transcription context | Only approved, relevant place-name context reaches the transcription provider; the raw transcript stays visible, suggestions are optional, and ambiguity yields a focused clarification rather than an invented place. |
| KIN-17 | Pronunciation evidence | TTS pronunciation for a governed proper name is accepted only after provider output is compared with an authoritative source or qualified local-speaker review; a generic prompt is not treated as proof. |
| KIN-18 | Persona preservation | Big Cousin, Best Friend, Professor, and Business Manager retain their selected personality, factual standards, safety rules, and synthetic speaker while respecting enabled regional-comprehension preferences. |
| KIN-19 | Scoped member correction | A pronunciation/meaning correction is consented, private by default, viewable, editable, deletable, and excluded from shared cultural data unless separately sourced and reviewed. |
| KIN-20 | High-stakes clarity | Medical, safety, legal, and financial turns do not introduce regional style; the member receives clear, standard-language guidance. |
| KIN-21 | Cross-platform dialect parity | The same preference and verified place result pass on Web, iOS, and Android with source/request evidence and native-device voice evidence where audio is enabled. |
| KIN-22 | Family Mode Kinfolk override | With Family Mode enabled, both standard and deterministic local-discovery Kinfolk paths apply a family-safe delivery profile, limit recommendations to all-ages options, and return a safe substitute for adult-oriented requests. The setting must not mutate age assurance, saved voice, or language preferences. |
| MED-01 | Community image/video | Select, upload, preview, post, reload, force-close, relaunch, and playback work; completed files survive a later-file failure. |
| NAT-01 | Native stability | Clean/upgrade install, every tab, denied permission, offline/slow network, expired session, lifecycle, repeated cold launch, and symbolicated crash reporting pass. |
| REL-01 | Build identity | EAS artifacts show the exact reviewed commit, iOS 104, Android 79, `com.melaninmaps.app`, and remote credentials. |
| REL-02 | Submission control | Automatic submission remains off; no public review or production release occurs without owner approval. |

The evidence packet must include raw logs, migration result, API requests/responses with sensitive values redacted, screenshots or recordings, signed artifact IDs and hashes, device/OS matrix, crash-report event IDs, and a final `GO_NO_GO.md`.


## Regional Dialect Intelligence & Multilingual Foundation — Completion Status

**Source implementation commit:** `d9af34636b7c547758334185cee2705cb1f415b8`

| Area | DOCUMENTED | SOURCE IMPLEMENTED | INTEGRATED | STAGING VERIFIED | DEVICE VERIFIED | MEMBER ACCEPTED | Evidence / remaining dependency |
|---|---:|---:|---:|---:|---:|---:|---|
| Cultural-language principle and release criteria (KIN-13–KIN-21) | Yes | Yes | Yes | No | No | No | Existing acceptance criteria remain the controlling staging/device evidence standard. |
| Explicit English/Spanish foundation and separate regional comprehension/style controls | Yes | Yes | Yes | No | No | No | Stored controls are source complete; detection, switching, and translation remain disabled. |
| Governed place-language schema, evidence, versioning, and resolver | Yes | Yes | Yes | No | No | No | No production reference is seeded. A controlled source/evidence review must approve references before they can supply provider context. |
| Bounded transcription context and raw-transcript review | Yes | Yes | Yes | No | No | No | Focused provider-handler regression passed; later staging must confirm request contents and ambiguity behavior. |
| Reviewed TTS pronunciation guidance | Yes | Yes | Yes | No | No | No | Prompt guidance is source-only. Recorded output, authoritative/local-speaker comparison, and device playback remain required under KIN-17. |
| Private member corrections | Yes | Yes | Yes | No | No | No | Authenticated create/list/edit/pause/delete source behavior is present; must be exercised on the approved test database. |
| Web controls | Yes | Yes | Yes | No | No | No | Web typecheck, focused regression suite, and production build passed. |
| Native controls | Yes | Yes | Yes | No | No | No | Native typecheck (with existing TypeScript 6 compatibility override) and focused regression suite passed; no mobile build or device run was created. |

> **Status boundary:** This source work is not deployable evidence by itself. No migration, deployment, provider activation, seeded reference data, mobile build, Device Farm session, or member acceptance occurred in this workstream.

## Family Mode Kinfolk Chat Safety — Source Status

**Source candidate:** Pending commit on `fix/kinfolk-family-mode-safety-20261016`.

| Area | DOCUMENTED | SOURCE IMPLEMENTED | INTEGRATED | STAGING VERIFIED | DEVICE VERIFIED | MEMBER ACCEPTED | Evidence / remaining dependency |
|---|---:|---:|---:|---:|---:|---:|---|
| Request-time Family Mode context | Yes | Yes | No | No | No | No | The existing, explicit `family_settings.family_mode_enabled` control is loaded as a delivery preference only; it does not alter age assurance. |
| Standard and lean Kinfolk chat | Yes | Yes | No | No | No | No | Family Mode forces a temporary Business Manager-style delivery, suppresses regional/AAVE personalization, adds a family-safe prompt block, and returns a safe alternative for restricted requests. |
| Deterministic business discovery | Yes | Yes | No | No | No | No | The early no-model discovery path reads the same setting, applies the protective audience band, and blocks adult-venue recommendations before catalog retrieval. |
| Web and native disclosure | Yes | Yes | No | No | No | No | Web Kinfolk Settings now exposes the existing Family Mode setting; native Family Settings accurately disclose that the protection also covers Kinfolk chats. |

> **Family Mode status boundary:** This is source-only work. It has not been deployed, migrated, device-tested, or member-accepted. It does not add background monitoring, push delivery, or new content moderation claims.

## Kinfolk Entertainment Discovery & Availability — Completion Status

**Source implementation commit:** `1f00d195cb12ded23a0ccded6fbb80bbc7e52ec4`

| Area | DOCUMENTED | SOURCE IMPLEMENTED | INTEGRATED | STAGING VERIFIED | DEVICE VERIFIED | MEMBER ACCEPTED | Evidence / remaining dependency |
|---|---:|---:|---:|---:|---:|---:|---|
| Provider selection and licensing boundary | Yes | Yes | No | No | No | No | JustWatch is the proposed streaming provider and International Showtimes the proposed theatrical provider; neither is contracted, configured, or called. The source candidate is preserved for controlled integration. |
| Current-availability / showtime guard | Yes | Yes | No | No | No | No | Explicit current questions never reach model-memory availability claims. The source result is deterministic and provider-disabled. |
| Explicit entertainment preferences and consent | Yes | Yes | No | No | No | No | Streaming services and country are explicit, private, clearable settings. Ordinary subscription/favorite chat prompts for consent rather than saving. |
| Web and native controls | Yes | Yes | No | No | No | No | Both platforms expose service/country settings and clearly label live data as unavailable. No offer/showtime card is rendered without an attributed provider response. |
| Streaming offers, rentals/purchases, and showtimes | Yes | No | No | No | No | No | Requires a separately authorized provider contract/key, attribution implementation, staging database migration, controlled provider-response inspection, location checks, and device acceptance. |

> **Status boundary:** No provider account, trial, key, paid service, live request, scraping, migration, deployment, mobile build, Device Farm run, ticket checkout, or member acceptance occurred. Kinfolk does not currently claim live availability or showtimes.

## Kinfolk Entertainment Personalization & Provider-Readiness — Continuation Status

**Source continuation commit:** `77beb13794a1d77f14f5d0ae122f1d82fbee3236`

| ID | Journey | Required result |
|---|---|---|
| ENT-01 | Ordinary entertainment conversation | Questions about movies, television, music, books, actors, entertainment history, and culture retain the selected Kinfolk persona and existing research/citation behavior; they do not require a provider or enter a live-availability flow. |
| ENT-02 | Natural subscription change | “I have Netflix,” “I switched from Hulu to Max,” and “I cancelled Peacock” create a specific reviewable preference plan; nothing persists until the member confirms. Unrelated saved services remain unchanged. |
| ENT-03 | No-extra-cost policy | The member can enable, disable, review, and clear an included-only policy. With provider-shaped fixture data, only subscription-included, free, or ad-supported options matching saved services remain; rental/purchase offers are excluded. |
| ENT-04 | Streaming availability boundary | A current availability request requires an explicit title and country. If no approved provider is connected, Kinfolk returns a truthful unavailable state with no invented service, offer, price, purchase, rental, or link. |
| ENT-05 | Theater/showtime boundary | “What Black movies are playing near me?” and “Find me a showing tonight” request an explicit city/country/title as needed; no background location, inferred home/family location, cinema, showtime, or ticket link is stored or invented. |
| ENT-06 | Provider payload integrity | Approved provider results show only validated HTTPS destinations, explicit attribution, a freshness timestamp, and provider-provided offer/showtime fields. Provider failure remains a recoverable unavailable state. |
| ENT-07 | Web and native consent parity | Web and installed iOS/Android builds display confirm/dismiss consent controls, settings edits/deletions, no-extra-cost controls, provider-unavailable copy, and do not write preferences on a plain chat message. |
| ENT-08 | Provider approval and non-production validation | Before any provider is configured, written commercial/attribution approval, a non-production credential, a narrow test database, controlled title/city fixtures, provider-output review, and no-checkout verification are recorded. |

| Area | DOCUMENTED | SOURCE IMPLEMENTED | INTEGRATED | STAGING VERIFIED | DEVICE VERIFIED | MEMBER ACCEPTED | Evidence / remaining dependency |
|---|---:|---:|---:|---:|---:|---:|---|
| Subscription changes, consent, private retention, and no-extra-cost preference | Yes | Yes | No | No | No | No | Deterministic parser, member-confirmed endpoint, and Web/native consent/settings source tests are present. No preference was written in this workstream. |
| Offline provider-shaped offers and showtimes | Yes | Yes | No | No | No | No | Test-only fixtures validate filtering, city/country/title gates, safe HTTPS links, attribution structure, and provider failure. No live data was requested. |
| Provider decision packet | Yes | Yes | No | No | No | No | Current public commercial/evaluation research is recorded; contracts, credentials, terms confirmation, controlled integration, and non-production testing remain required. |
| Web and native continuation controls | Yes | Yes | No | No | No | No | Source typechecks and focused tests pass; no mobile build, Device Farm session, or member test occurred. |

> **Continuation status boundary:** This is **SOURCE COMPLETE / AWAITING PROVIDER APPROVAL AND STAGING ACCEPTANCE**. It does not authorize a provider trial, account, API key, payment, migration, deploy, mobile build, Device Farm run, live result, ticket link, or member acceptance.
