---
name: Community feed and social features
description: Link previews, reposts, status composer, visitor profiles, and public saved-place sharing with health double-confirm.
---

# Community Feed & Social Features

## DB schema additions
- `community_posts`: new columns `link_url`, `link_title`, `link_description`, `link_domain`, `link_favicon`, `repost_id`, `repost_author_name`, `repost_author_initials`, `repost_content`
- `saved_places`: new column `is_public` (boolean, default false)

## API additions
- `community.ts` GET mapper now maps all link/repost columns; POST now accepts and saves them
- `saved-places.ts` adds:
  - `POST /saved-places/:businessId/toggle-public` — toggles isPublic, returns `{ isPublic, requiresHealthConfirm, businessName }`
  - `GET /saved-places/public-state` — returns `{ publicState: Record<string, boolean> }` for current user
- Health detection: `HEALTH_KEYWORDS` array in saved-places.ts; category string match triggers `requiresHealthConfirm: true`

## Mobile components
- `CommunityPostCard.tsx`: renders `LinkPreviewCard` (domain/favicon/title/desc) when `post.linkUrl` set; renders `RepostBlock` (quoted original) when `post.repostId` set; "repost" banner on card; `onRepost` prop added
- `StatusComposer.tsx`: expandable composer with 🌐/👥/🔒 visibility toggle; posts to `/api/community/posts`; added to profile.tsx before Pinned Topics section (auth-gated)
- `SavedSpotsShare.tsx`: lists saved businesses with eye/eye-off toggle; calls toggle-public API; health saves require two Alert.alert confirms; shows Public badge; added to profile.tsx after Pinned Topics section (only when savedBusinesses.length > 0)

## Visitor profile screen
- `app/user/[id].tsx`: full screen at `/user/:id`; fetches `GET /api/users/:id/profile` (existing); shows name, member badge, bio, stats, follow/unfollow button, message button; lists posts filtered by `canSeeContent`; followers-only teaser when private+not-following
- Navigation: `community.tsx` `onAuthorPress` now calls `router.push('/user/[id]')` instead of `setSelectedAuthorId` modal

## Health confirm flow
1. User taps share icon on a saved business
2. First Alert: "Share This Save? — Make [name] visible…" → Cancel / Share
3. API returns `requiresHealthConfirm: true` if business category matches any of: health, medical, clinic, hospital, pharmacy, wellness, mental, therapy, doctor, dental, urgent care, rehabilitation, counseling, psychiatr, addiction
4. Second Alert: "Health Information — Confirm Again" → "Make Private Again" (reverts) / "Yes, Share It" (keeps)

**Why:** Community members may not want health-adjacent business saves (e.g. therapy, pharmacy) shared publicly by accident; the two-step gate gives them a deliberate choice.
