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
| KIN-13 | First-use continuity consent | Test a new account and a legacy account with no recorded decision: each sees accept/decline on Web chat and memory controls and native iOS/Android chat, memory, and Settings controls. Test accepted and declined accounts after relaunch: accepted remains enabled, declined remains off, neither is silently re-prompted or changed, and unrelated safety settings remain unchanged. A decision-less update is rejected. Make a choice on Web and confirm the same persisted state on iOS/Android, then make the converse native choice and confirm it on Web. |
| KIN-ENT-01 | Jessica Jones — United States availability | With country `US` selected, “Where can I watch Jessica Jones?” returns a natural direct answer only when a cited official title page supports the exact title, U.S. geography, a current statement, and the named service; otherwise it returns a clear limitation with legitimate clickable source links. |
| KIN-ENT-02 | Luke Cage — Disney+ availability | “Is Luke Cage available on Disney+?” never treats a generic Disney+ page or title mention as proof. A direct result requires exact, current, U.S.-relevant official evidence for that title and service; otherwise the response fails closed. |
| KIN-ENT-03 | The Woman King — availability | “Where can I watch The Woman King?” follows the same exact-title, selected-country, current-evidence rule and visibly cites any accepted source. |
| KIN-ENT-04 | Disney+ with no extra cost | With Disney+ selected and the no-extra-cost policy enabled, “I already have Disney+. Can I watch it without paying extra?” succeeds only when cited official text explicitly says the title is included with subscription. A saved service is never treated as an entitlement. |
| KIN-ENT-05 | Single-title conversational follow-up | Discuss Jessica Jones in one authenticated private session, then ask “Where can I watch it?” Kinfolk may resolve that single unambiguous title only from that session; it must not read unrelated sessions or long-term private memory. |
| KIN-ENT-06 | Ambiguous conversational follow-up | Discuss two distinct shows in one session, then ask an ambiguous follow-up. Kinfolk asks for clarification and makes no availability lookup or title assumption. |
| KIN-ENT-07 | Evidence reliability failures | Exercise an official confirming source plus stale evidence, geographic mismatch, same-provider conflicts, unavailable search, and no trustworthy evidence. Only the complete official confirming case may make a factual availability claim; all other cases give a truthful limitation and any legitimate available links. |
| KIN-ENT-08 | Named-city theater showtimes | Ask for a named movie’s showtimes in a member-provided city and country. Return a factual showtime only when a cited allow-listed official cinema page identifies exact title, city, country, ISO date, and local time; never invent theater names, dates, times, availability, or ticket URLs. |
| MED-01 | Community image/video | Select, upload, preview, post, reload, force-close, relaunch, and playback work; completed files survive a later-file failure. |
| NAT-01 | Native stability | Clean/upgrade install, every tab, denied permission, offline/slow network, expired session, lifecycle, repeated cold launch, and symbolicated crash reporting pass. |
| REL-01 | Build identity | EAS artifacts show the exact reviewed commit, iOS 104, Android 79, `com.melaninmaps.app`, and remote credentials. |
| REL-02 | Submission control | Automatic submission remains off; no public review or production release occurs without owner approval. |

## Kinfolk Entertainment — Controlled Integration Status (2026-10-17)

| Required status | Current factual state |
|---|---|
| SOURCE COMPLETE | **Yes.** Original implementation commit [`57f8da70`](https://github.com/Melaninmaps/melanin-maps-api/commit/57f8da7093dd4ee347f897b5c2688f7b9368dfff); preserved documentation head `fbd79208`. |
| INTEGRATION PREPARED | **Yes.** Isolated branch `integration/kinfolk-entertainment-current-authority-20261017` selectively composes the ten Entertainment commits onto current owner-candidate base `cc39bd4a`. It also contains first-use consent hardening commit `69980538`, which keeps undecided and legacy members behind an explicit accept/decline decision across Web and native entry points. |
| INTEGRATED | **No.** The moving authoritative candidate has not adopted this isolated branch. |
| STAGING VERIFIED / WEB VERIFIED / IOS VERIFIED / ANDROID VERIFIED / FOUNDER ACCEPTED | **No.** No staging surface, browser member flow, mobile build, device session, provider activation, or founder acceptance was performed. |

> **Controlled real-world boundary:** KIN-ENT-01 through KIN-ENT-08 require an authenticated, controlled application/staging session using the existing cited-web configuration. Offline fixtures and injected test data validate failure handling only; they are **not** proof of current streaming or theater availability. No paid provider, trial, account, subscription, migration execution, deployment, ticket flow, or mobile build is authorized by this record.

> **First-use consent boundary:** KIN-13 source contracts pass, including the decision-less update rejection and rendered Web/native disclosure paths. It still requires an authorized authenticated save/readback on a controlled surface, followed separately by the pending fresh-account production acceptance across the existing Web, iOS, and Android releases. No production modification or database migration has occurred.

The evidence packet must include raw logs, migration result, API requests/responses with sensitive values redacted, screenshots or recordings, signed artifact IDs and hashes, device/OS matrix, crash-report event IDs, and a final `GO_NO_GO.md`.
