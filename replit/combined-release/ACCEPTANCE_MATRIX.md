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
| MED-01 | Community image/video | Select, upload, preview, post, reload, force-close, relaunch, and playback work; completed files survive a later-file failure. |
| NAT-01 | Native stability | Clean/upgrade install, every tab, denied permission, offline/slow network, expired session, lifecycle, repeated cold launch, and symbolicated crash reporting pass. |
| REL-01 | Build identity | EAS artifacts show the exact reviewed commit, iOS 104, Android 79, `com.melaninmaps.app`, and remote credentials. |
| REL-02 | Submission control | Automatic submission remains off; no public review or production release occurs without owner approval. |

## Open-platform / verified-minority flywheel source acceptance

The following rows are **source requirements only** for branch `fix/open-platform-verified-flywheel-20261017`. They are not staging, Web, iOS, Android, or founder acceptance evidence, and must be reconciled into the next stable Kinfolk authority rather than treated as a release merge.

| ID | Journey | Required result |
|---|---|---|
| BIZ-01 | General business access | A legitimate business can register and maintain a presence, and an authenticated business owner can use general KinfolkAI assistance, without self-identification, a claim, payment, or a membership tier being treated as ownership verification. |
| BIZ-02 | Verified-minority flywheel access | An approved owner of an active business with `verified = true` and a platform-controlled minority/diaspora value in `verified_designations` can receive targeted owner analytics, private community-need aggregates, business-insight summaries, privacy-protected aggregate skip-feedback, timing recommendations, market category signals, and business-improvement recommendations. |
| BIZ-03 | Denied nonqualifying access | An unverified, non-minority, suspended, self-identified-only, claimed-only, paid, or generic-member business receives the stable eligibility limitation and no targeted flywheel response. Self-reported `ownership_designations`, `black_owned`, and client-supplied survey ownership do not satisfy the gate. |
| BIZ-04 | Recheck before delivery | Revoking the approved owner link, removing the verified designation, or suspending the business prevents the next protected request and city-scoped feedback notification from delivery. No recipient is selected from `submitted_by_id` alone. |
| BIZ-05 | Private skip-feedback boundary | An authenticated member can select only a reviewed broad category. No free-text skip note is stored for new submissions, delivered to an inbox, surfaced to an owner, or supplied to an AI prompt. A category is available only after at least three distinct members selected it; legacy free-text rows are withheld. |
| BIZ-06 | Aggregate market and timing boundary | Market opportunities use category-level activity only, never raw member searches, and expose categories only at five or more events. Timing recommendations and timing reminders require both current verified-owner access and at least five recent views; insufficient data exposes neither hourly nor daily distributions. |
| BIZ-07 | Honest owner surfaces | Web and native owners receive a verification route and truthful explanation when the eligibility gate denies a protected benefit. The UI must not label that denial as a paid upgrade. Eligible owners may separately encounter the existing membership boundary. |
| BIZ-08 | General caption-assistance boundary | General owner caption assistance is bound to the current approved owner relationship and selected business, but remains available without a verified-minority designation. It uses owner-provided business context only; member review free text is not supplied to its AI prompt, and its wording does not label an unverified business as Minority-owned. |

**Terms copy review — flagged, not silently changed:** (1) Web Terms §6 says, “Refunds are not provided for partial billing periods” and routes exceptional cases to email, while native Terms → Membership & Payments says, “We offer refunds within 7 days of initial purchase if the Platform does not function as described.” These are different member-facing refund commitments and require founder/legal-approved harmonization. (2) Native Terms → Marketplace says MWM “does not set, guarantee, or enforce individual business policies,” then says MWM may “issue refunds directly to buyers … in cases of clear misconduct.” That may be a valid limited exception, but the exception should be explicitly reconciled before public release so it is not read as a general enforcement promise. (3) The Web terms have no corresponding marketplace-dispute/refund section, creating Web/native policy-parity ambiguity. No billing, refund, legal, provider, checkout, or production operation was changed in this source candidate.

**Source-only status: SOURCE COMPLETE.** The branch preserves the original verified-minority candidate while extending only adjacent protected-delivery boundaries. Focused source validation is complete: API, Web, and native no-emit TypeScript checks passed (native used the established `--ignoreDeprecations 6.0` compatibility flag); API focused suites passed **27/27**; Web passed **4/4**; native passed **4/4**; and `git diff --check` passed. This is not integrated into the moving Kinfolk authority. Authenticated application acceptance, staged push delivery, Web verification, iOS verification, Android verification, and founder acceptance remain unverified.

### Controlled authenticated acceptance — execute only after stable-authority integration

These journeys require the integrated source candidate, approved non-production accounts, and actual application interactions. They must not be substituted with unit fixtures, direct database edits, mocked provider responses, or production records. No staging operation is authorized by this matrix alone.

| ID | Actor and actual journey | Required result |
|---|---|---|
| BIZ-AT-01 | An authenticated owner of an active but unverified, self-identified-only, non-minority, suspended, claimed-only, or paid business opens Web, iOS, and Android owner surfaces. | General listing management and general KinfolkAI remain available. Each protected request is denied with the verified-minority eligibility code; UI explains verification and never tells the owner that payment will unlock the protected benefit. |
| BIZ-AT-02 | An authenticated, approved owner of an active platform-verified Minority-owned staging business opens analytics, private community needs, business-insight summary, market signals, action-plan cache/generation, improvement plan, timing controls, and feedback opt-in. | Protected benefit access succeeds only for that current owner and business. A different account, a revoked owner link, a designation removal, or a suspended status is denied on the next request. |
| BIZ-AT-03 | Three distinct authenticated staging members each select the same allowed skip-feedback category through the real member surface, observing owner output after the first, second, and third submission. | No individual output exists at one or two members. After the third distinct member, the owner sees only the category and aggregate count. No text entry, name, account ID, message, conversation, or notification is shown. |
| BIZ-AT-04 | The qualified owner requests a real action plan after BIZ-AT-03, with request/response logs redacted for identifiers. | Any included skip-feedback input is a thresholded category/count only. No member free text, private conversation, raw search, account identifier, or transcript reaches the model input or returned plan. |
| BIZ-AT-05 | Actual staging members create four, then five, same-area classified search events and four, then five, profile views for the qualified business. | Market output remains category-level and absent below threshold; it never reveals a raw query. Timing output omits hourly/daily distributions below five views and becomes available only after the fifth actual view. |
| BIZ-AT-06 | The qualified owner explicitly requests a timing reminder on a staging device after BIZ-AT-05, then repeats after owner-link revocation, designation removal, or business suspension. | One real staging push is delivered only while eligibility and the five-view threshold hold. The rechecked state blocks delivery and sends no recipient notification after eligibility changes. |
| BIZ-AT-07 | Repeat BIZ-AT-01 through BIZ-AT-04 through the actual Web, iOS, and Android clients using the authenticated accounts above. | All surfaces show the same verification-versus-membership distinction, category-only feedback contract, aggregate results, and absence of raw member data. iOS/Android evidence requires approved installed builds; source typechecks are not device acceptance. |
| BIZ-AT-08 | Review the rendered Web and native terms beside the approved legal decision for BIZ refund/marketplace wording. | The approved policy is consistent across surfaces, or the exact unresolved founder/legal exception remains visibly documented. No payment, refund, subscription, provider, or production action is performed as part of this review. |

The evidence packet must include raw logs, the separately authorized migration result **or an explicit record that no migration was authorized**, API requests/responses with sensitive values redacted, screenshots or recordings, signed artifact IDs and hashes, device/OS matrix, crash-report event IDs, and a final `GO_NO_GO.md`.
