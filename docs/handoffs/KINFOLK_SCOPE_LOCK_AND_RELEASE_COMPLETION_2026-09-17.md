# KinfolkAI scope lock and release-completion matrix

**Prepared by:** Manus AI  
**Date:** 2026-09-17  
**Applies to:** Mapping with Melanin website, iOS, Android, API, database, and directory data  
**Release boundary:** Preserve existing users, authentication, login, Apple/OIDC sign-in, password reset, sessions, and existing waitlist rows. The website administrator dashboard may read the one combined web/mobile waitlist. No feature may create, delete, or bulk-modify users or waitlist records during deployment.

## The honest current answer

**No: the items in the attached implementation package are not all included in the real release source today.** The package is a useful design and code proposal, but a file in `/home/ubuntu/kinfolkai_audit/implementation` is not a production feature unless the matching behavior has been integrated into `Melaninmaps/melanin-maps-api`, tested, deployed, and validated in the website plus native builds.

Some requested foundations are present. The current source has general Kinfolk chat, governed public-business retrieval, full-name and typo-aware business search, parts of location-aware ranking, business detail routes, voluntary support-designation controls, a basic VIBE search screen, privacy foundations, comments API support, user/business mention foundations, a Living Library, Resource list empty states, a web Access Ledger, and the mobile temporary-password screen. Those foundations do **not** make the complete requested experience ready.

Several exact requirements remain incomplete. The most important examples are: Check-In still requires an email address; Financial Literacy opens an external link instead of a safe in-app no-provider state; Community still contains Events and Happening Now; active composers remain busy; public profile/DM/Circle behavior is incomplete and current DM authorization must be strengthened before expansion; VIBES are not yet one canonical cross-platform taxonomy/search contract; unreviewed directory candidates are not public; and Kinfolk’s public provider health check is still failing. No release will be described as complete until each row below is verified.

## What the attached package contributes

The attached package contains viable **implementation proposals** for Check-In profile recipients, VIBES import, neutral fallback artwork, recommendation sheets, compact filters, Community controls, profile privacy, Library summaries, Resources fallbacks, and related schema patterns. It is not ignored. It is the starting material for the remaining feature branches. However, it cannot be copied into production unchanged because it uses assumptions that do not always match the real schema and authorization model. For example, the proposal Check-In SQL assumes identifiers that conflict with the current `safety_checkins` and `users` types; it must be adapted through an additive, repository-matched migration.

The requested blanket removal or hiding of businesses based solely on Asian or LGBTQIA+ identity will not be implemented. The supported product behavior is a user-controlled, factual, voluntary, source-backed support filter. It can combine labels such as Black-owned, woman-owned, Divine Nine, veteran-owned, disability-owned, or LGBTQIA+-owned only when the business has explicitly self-described that designation or reviewers have attributable evidence. No designation is inferred; an absent designation never hides a listing by default.

## Completion matrix

A row is **complete** only when its real-source implementation, API/database contract, website, iOS, Android, automated tests, staging test, and production validation are all complete. A design document, static component, Git branch, passing typecheck, or GitHub merge alone does not satisfy that definition.

| Requested outcome | Current status | Required work before it can be marked complete |
|---|---|---|
| Kinfolk general chat and trustworthy business recommendations | **Partially implemented** | Retain general chat. Restrict recommendation cards/results to published, governed business records. Do not turn external web findings or review candidates into recommendations. Add the mobile/web recommendation sheet only after real visible listing IDs are returned. |
| Nearby, relevant, typo-tolerant business search; map pins open listings | **Partially implemented** | Use one relevance-plus-consented-location ranking contract across web, iOS, Android, and Kinfolk. Make every public marker open its detail route. Add factual braider and child-care tags, factual reviewed hours, and transparent no-data/gap responses. |
| Large source-backed inventory and international locations | **Review-only; not published** | Stage each candidate with official social, source URL, confirmed address, duplicate/enrichment match, validated coordinates, regulated-service review where needed, and a human approval. The current 217 accepted candidates remain review-only; no target count is claimed as live. |
| VIBES, categories, aliases, and typo search everywhere | **Partially implemented** | Build one versioned canonical VIBES contract from the workbook. Keep category/subcategory separate from VIBES. Add a dry-run, checksum-pinned importer and a public-view-only search endpoint. Wire Map, Discover, Search, mobile, and Kinfolk to the same contract. |
| Business page wording and unclaimed artwork | **Partially implemented** | Retain the existing detail-page format and neutral, category-appropriate icon fallback. Remove all remaining public `Community/founder-listed` variants from web/mobile strings and templates. Add field-level sourced metadata rules for phone, official links, hours, specialties, languages, accessibility, and audiences. |
| Resources remain in-app with a useful no-provider state | **Partially implemented** | Add shared web/native resource-provider result states: loading, empty, retryable error, and unknown resource. Replace the Financial Literacy external coach jump with an in-app provider result that truthfully returns `providers: []` when none is public. |
| Library short/long AI explanations and Happening Now under Library | **Partially implemented** | Kinfolk must return a concise cited summary and Library deep link; Library contains the source-cited long version. Remove embedded Community Events/Happening Now, keep dedicated Events routes, and implement equivalent web/mobile Library Happening Now filters and empty/error states. |
| Check-In profile recipients instead of required email | **Not implemented** | Add a repository-matched, additive recipient relation and consent setting. Add server-side eligible-profile lookup, accepted-relationship, block, privacy, access, opt-out, and ownership checks. Create recipients atomically; write durable in-app notifications; use push only with permission. Preserve existing email Check-In rows and do not use placeholder emails. |
| Consistent safety wording, explicit precise location, and Discovery heritage | **Partially implemented** | Consolidate the exact labels: `Report Police or ICE`, `Submit Safety Tip`, and `Report an Unsafe Space`. Require a deliberate safety-feature disclosure before requesting precise location; provide manual fallback; only expose coarse geography by default. Remove Cultural Heritage Explorer from Safety and add it to Discovery. |
| Social feed, simple composer, comment controls, privacy, and mentions | **Partially implemented** | Remove Community Events/Happening Now and eliminate the intentional pre-feed gap. Simplify composer to text, Guidelines, and audience preview. Wire author-only `Everyone / Followers / Off` policy controls to the existing server authorization. Align privacy to one enforced field. Add web mention controls and prevent review-only businesses or inaccessible private members from autocomplete. |
| Social profiles, DMs, business sharing, and Circles | **Partially implemented; security remediation required first** | Repair conversation membership authorization before exposing DMs broadly. Add explicit DM policy, blocks, structured published-business message attachment, media access policy, profile-section visibility, and private Circle controls. Move the mobile Circle entry to Profile. Build per-Circle opt-in planning preferences, expiry, and neutral fallback when no preference is shared. |
| Profile changes | **Partially implemented** | Remove the mobile `Own a Business?` banner only. Add purpose-specific social profile sections through server-authorized APIs. Do not expose private activity, health, search, employer, exact location, or private Circle data by default. |
| Combined waitlist, Access Ledger, final-edit confirmation, and web-only administration | **Partially implemented** | Keep exactly one `waitlist_signups` data source and show it in web admin. Merge and deploy PR #34 to stop tester grants from writing waitlist records. Extend server-issued, expiring, one-time confirmation tokens to every remaining administrative mutation. Remove or disable the mobile admin surface from production builds after preserving server authorization. |
| Authentication and tester password safety | **Partially implemented; requires live tests** | Merge PR #34 to block startup account mutations. Retain normal email/OIDC/Apple login and password reset. Validate flagged temporary-password user flow end-to-end in non-production: login, forced private password, normal access, forgotten-password reset, and reset clearing the flag. |
| Keyboard readability, iOS/Android parity, Android 15/16 | **Partially implemented; unverified on device** | Fix the Android keyboard provider/insets behavior using a physical-device-tested solution. Test long text, dynamic type, safe areas, split-screen, foldables, tablets, Android 15 edge-to-edge, Android 16 large screens, and iOS. Confirm each native build points to the same reviewed HTTPS production API. |
| Demo-ready, live Kinfolk | **Blocked by hosting configuration** | Configure the API host’s existing provider secrets and reachable base URL, then require deployed `GET /api/kinfolk/health` to return `200 {"ok":true}` immediately before demo. The current public endpoint reports `connection_failure`; a successful `/api/healthz` alone is not sufficient. [1] [2] |

## Required implementation order

The following order is mandatory because it prevents a polished user interface from sitting on unsafe authorization or inaccurate data.

**First, protect the release boundary.** Review and merge [PR #34](https://github.com/Melaninmaps/melanin-maps-api/pull/34). It prevents startup user/test-account mutation and prevents tester grants from creating waitlist entries. It does not alter ordinary login, password reset, public waitlist intake, existing user rows, or existing waitlist rows. It must be deployed before any general startup/schema verification command is executed. [3]

**Second, complete the safety and social authorization foundations.** Check-In profile alerts and direct messages require server-enforced recipient eligibility, blocks, privacy, consent, and ownership controls. These APIs and additive migrations are implemented and tested before any user-interface expansion. No sensitive location, direct-message content, or private profile content is used for recommendations or exposed through autocomplete.

**Third, finish the truthfulness paths.** This includes resource empty/error states, Financial Literacy provider results, Library concise/long summaries, canonical VIBES import/search, source-backed metadata, directory review-to-publication promotion, and Kinfolk recommendation cards. A product can say “not available yet” but must never invent a provider, hours, address, designation, or business recommendation.

**Fourth, complete the Community, profile, DM, and Circle experience.** The implementation uses the server protections created in the second step. All UI changes are delivered together across web, iOS, and Android, including the user-requested Community cleanup and Profile-owned Circles.

**Fifth, complete platform and production validation.** The build is not marked ready until the API, web release, iOS binary, and Android binary all point to the same reviewed release SHA/API origin and pass their acceptance tests. Only an authorized hosting owner can run production migrations, deploy the API, set provider secrets, publish the website, or submit Apple/Google builds.

## No-surprise operating rule

From this point, every requirement is tracked in this matrix with one of four states: **implemented and verified**, **implemented but awaiting live validation**, **in implementation**, or **blocked by authorized hosting/store access**. There is no fifth status called “probably included.” If a new request is added, it is placed in the matrix first with its exact expected web/API/iOS/Android behavior, data/privacy constraints, and acceptance test. It is not marked complete until evidence exists.

The final release handoff to Replit will contain a signed-off version of this matrix. It will list the exact Git SHA, migrations, automated test results, staging results, deployed API health result, web release URL, iOS build identifier, Android build identifier, and verified directory-publication count. Any row without those relevant checks remains incomplete and prevents a statement that the full requested build is live.

## Next implementation action

The first engineering branch after the release-boundary pull request is **Check-In profile-based alerts**, because the current real Check-In still requires email and directly conflicts with the requested experience. The work will be additive, preserve legacy check-ins, use no user/waitlist changes, and include API, web, iOS, and Android acceptance tests. In parallel, the source-backed directory acquisition remains review-only; no candidate will be published until its separate guarded review workflow is ready.

## References

[1]: https://www.mappingwithmelanin.com/api/healthz "Mapping With Melanin public API health endpoint"

[2]: https://www.mappingwithmelanin.com/api/kinfolk/health "Mapping With Melanin KinfolkAI provider health endpoint"

[3]: https://github.com/Melaninmaps/melanin-maps-api/pull/34 "Protected release user and waitlist boundary pull request"
