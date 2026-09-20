# Cross-Client Content Preservation Contract

**Applies to:** Mapping with Melanin web application, iOS application, Android application, API, background workers, and release operations.

## Non-negotiable rule

The website and native applications may have platform-appropriate layouts, navigation, and interaction controls. They must nevertheless provide the same supported product behavior over the **same durable server-side records**. A person’s profile update, Community post, comment, review, saved item, follow, block, circle activity, direct message, business interaction, and approved business listing must remain available through every supported client that exposes that feature, subject only to the record’s privacy, audience, block, moderation, and membership rules.

A client must never create a parallel local-only version of a social or directory record when an authenticated API record exists. A successful write must be persisted to the shared API/database record and the relevant web and native caches must be invalidated or refreshed so that the other client can display it.

## Retention and moderation rule

Member-generated content is **not removed because of a deployment, release, feed-ranking change, cache error, schema compatibility fallback, client refresh, or import operation**. The default response to a loading or ranking failure is a visible retry/recovery state that preserves the existing record; it is never a destructive cleanup.

A post, comment, review, profile media reference, or other member record may be hidden, restricted, archived, or removed only through an existing authorized pathway:

1. a member action permitted by the relevant feature;
2. a community report or automated safety/moderation flag followed by authorized review; or
3. a documented, authorized administrator moderation action with an audit trail.

Privacy selections, accepted block relationships, audience settings, and comment controls remain authoritative. Content that a viewer cannot access because of one of those rules is not considered missing or deleted.

## Cross-client acceptance requirements

Before every web/API/native release, verify all of the following against the same production API origin:

| Record or behavior | Required invariant |
|---|---|
| Profile image and profile details | An update in mobile is visible on web after refresh, and a web update is visible in mobile after refresh. |
| Community posts and media | A post created on either client appears in the eligible Community feed on both clients without an unrelated record being removed. |
| Community comments | Comments created on web or mobile are stored in the same post-comment API collection and render on both clients for eligible viewers. |
| Business reviews | Reviews created on web or mobile are stored through the shared reviews API and appear in the associated profile/activity and business surfaces on both clients where supported. |
| Content failures | A transient API, ranking, or optional-schema failure shows an error/retry state; it does not replace the feed with a destructive empty state or delete records. |
| Moderation | Report/administrative review controls—not deployment code or client cache handling—govern visibility changes. |
| Directory listings | A released listing is returned by the shared API for web search, mobile search, map retrieval when it has a validated physical location, business detail, and authenticated Kinfolk retrieval. Online-only records remain mapless by design. |

## Engineering constraints

- Preserve authentication, email login, password reset, temporary tester-password changes, sessions, approval, accounts, users, and the combined app/web waitlist behavior.
- Preserve Community privacy, moderation, TikTok/social media rendering where public and safe, DMs, circles, saves, follows, blocks, profile editing, and business-owner flows.
- Do not delete data to solve a duplicate or rendering problem. Use a reversible canonical/supersession mapping for duplicate listings and preserve provenance.
- Do not use client-local state as the authoritative record after a successful API write. Refresh or invalidate relevant query/cache keys.
- Add a focused contract/regression test before changing any shared web/mobile/API path, and run the affected web, mobile, and API tests before merge.
- A GitHub merge is not proof that the website, API, native binary, or directory data has been deployed. Verify each separately.

## Release sign-off

A release fails this contract if it removes visible eligible Community content, loses a cross-client write, presents different durable records for the same signed-in account, or makes content disappear without an authorized member/moderation path and audit evidence.
