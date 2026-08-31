# Mapping With Melanin Combined Community Release Contract

**Base:** `release/task-373-rc` at `3f56c1a27487c6060cfb3a1275baba5e70bd87b6`

**Implementation branch:** `feature/community-comments-happening-kinfolk-v1`

**Purpose:** Restore member comments, expose and personalize What’s Happening, and repair Kinfolk conversational research across website and native apps.

## Release boundary

This is a **new candidate**, not a hidden modification to iOS build 103 or Android versionCode 78. The current Task #373 branch remains intact. The combined branch may become a release candidate only after additive migrations, API tests, web/mobile tests, model evaluations, fresh build identifiers, and signed-device validation pass.

The full cross-member Kinfolk learning engine remains disabled. This release may store explicit private memory only when the member consents. It may not use private searches to notify or profile other members.

## Comment permission contract

Every community post has an explicit `commentPolicy`:

| Policy | Who may read the post’s comments | Who may create comments |
|---|---|---|
| `everyone` | Anyone already authorized to view the post | Any authenticated, unblocked member authorized to view the post |
| `followers` | Anyone authorized to view the post | Author, accepted followers, or accepted connections only |
| `off` | Anyone authorized to view the post | Nobody; existing comments remain readable unless moderated/deleted |

A `followers_only` post may never be viewed or commented on by an unrelated member, regardless of `commentPolicy`. A private author’s public post follows existing feed visibility rules. Blocking overrides following, connection, visibility, and comment policy in both directions.

The API returns `canView`, `canComment`, `commentPolicy`, and a user-safe `commentRestrictionReason`. It never discloses whether a hidden post exists. Comment creation validates the post first, applies content and family/minor filters, rate limits repeated comments, and updates the count in one transaction. Authors can delete their own comments; post authors and moderators can hide/delete comments. Members can report comments. Only active comments are returned or counted.

The post composer exposes **Who can comment?** with Everyone, Followers and connections, or Comments off. Default is Everyone for public posts and Followers/connections for followers-only posts. The website and native post detail show a clear disabled state rather than a dead button.

## What’s Happening contract

What’s Happening is a Community section on website and mobile. Existing Library links continue to work for backward compatibility.

Members can share an article or community-impact update with:

- title and plain-language summary;
- canonical source URL;
- category and topic tags;
- geographic scope (`local`, `state`, `national`, `global`);
- city/state/country when applicable;
- optional event/publication date.

Categories include `politics`, `health`, `safety`, `housing`, `education`, `economy`, `environment`, `transportation`, `culture`, `community`, and `other`.

Submissions are pending until approved. Ordinary members can see approved stories plus their own pending submissions. Moderators can see the pending queue. The public API never exposes other members’ pending/rejected content or admin notes.

Approved stories are ordered by a deterministic score:

1. explicit followed topics and favorite categories;
2. exact city/saved-city match, then state, national, global;
3. verified source and current publication time;
4. freshness with category-specific expiry;
5. member confirmations and comments;
6. diversity guard so one category or source cannot dominate the page.

Personalization is transparent and controllable. Users can choose For You or Latest, set local/national/global scope, follow or mute topics, and see **Why am I seeing this?**. Sensitive health and safety topics are never inferred from one private search. General politics interest may be explicit or derived only from non-sensitive public interaction if the member allows personalized suggestions.

Each approved story is linked to a commentable community post so article discussion uses the same permissions, moderation, reporting and notification controls. External links are normalized and open safely.

## Kinfolk conversational research v1

Kinfolk v1 must answer broad ordinary questions naturally. The Living Library is an optional archive and follow-up destination, never the gate that decides whether Kinfolk can answer.

| Question class | Behavior |
|---|---|
| Stable general knowledge | Answer conversationally from the model; search only when confidence or specificity requires it. |
| Current, local, changing, or explicitly researched | Search first; cite sources and dates. |
| Health, legal, finance, safety, elections and other high-stakes topics | Search authoritative sources; provide educational context and next steps without diagnosis or guarantees. |
| Image question | Accept a validated uploaded image reference and use a vision-capable model. For health images, describe observable features, ask red-flag questions and avoid diagnosis. |
| Unanswerable philosophical question | Explain major evidence-based, religious, philosophical or scientific perspectives; distinguish belief from established evidence. |
| Search/provider outage | Give a useful stable answer when safe, label what could not be verified, and offer retry. Never fabricate a current fact or citation. |

Kinfolk modes include Big Cousin, Professor, Business Manager and Best Friend. Modes change tone and structure, not facts or safety standards. Regional vocabulary and communication style require explicit preference controls; ethnicity is never inferred from an image, name or neighborhood.

Private memory writes require an explicit member instruction such as “remember this.” The API confirms what is remembered, purpose, scope, expiry, and how to forget it. This release does not activate anonymous community trend generation, cross-member recommendation triggers, or sensitive-topic aggregation.

## Feature flags

| Flag | Initial state |
|---|---:|
| `community_comments_v2` | ON in test/staging; OFF in production until migration/API/UI evidence passes |
| `community_happening_v1` | ON in test/staging; OFF in production until moderation and ranking evidence passes |
| `kinfolk_conversation_v1` | ON in test/staging; OFF in production until model evaluation and fallback evidence passes |
| `kinfolk_image_questions_v1` | ON in test/staging; OFF in production until upload/privacy/vision evidence passes |
| `kinfolk_private_memory_v1` | ON in test/staging; OFF in production until consent/forget tests pass |
| `kinfolk_community_learning_v1` | OFF everywhere |

## Required evidence

The release must prove post visibility and comment-policy matrices, blocks, deleted/reported comments, pending-story privacy, local-to-global ranking, source URL safety, article comment linkage, image and video community-post persistence, Kinfolk eclipse/black-hole/fashion/current-politics/health-image cases, search outage fallback, memory consent/forget, zero private-search leakage, full typecheck/lint/tests/builds, clean migrations, and installed iOS/Android behavior.
