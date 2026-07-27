---
name: Inclusive platform language
description: Contextual language rules for the platform — when to use "Black-owned" vs "minority-owned" vs other inclusive terms. Applies to slides, marketing, app copy, seeds, prompts, and notifications.
---

# Inclusive Language Rule — Contextual, Not a Blanket Replacement

**Why:** The platform serves minorities and the melanated diaspora broadly — not exclusively Black people. The rule is NOT to remove "Black-owned" from the platform. The rule is to use it only where it is earned or chosen, and to use inclusive alternatives everywhere else.

## Contextual Decision Table

| Context | Use |
|---|---|
| Business **verified** as Black-owned | "Black-owned" ✅ |
| User **explicitly filtered** for Black-owned | "Black-owned" ✅ |
| Discussing specifically Black history or culture | "Black" ✅ |
| Generic discovery prompts, platform defaults, search copy | "minority-owned", "community businesses", "culturally relevant" |
| Generic platform audience descriptors | "minorities", "the melanated diaspora", "minority communities" |
| Slide decks and marketing (audience-level copy) | "minorities", "melanated diaspora" — NOT "Black Americans/communities" |
| Seeded content, challenges, notifications (no verified identity) | Apply generic inclusive language, not "Black-owned" as default |

## Preferred Substitutions (Generic Context)

- "Black Americans" → "minorities" or "the melanated diaspora"
- "Black communities" → "minority communities" or "melanated communities"
- "Black-owned businesses" (generic) → "minority-owned businesses"
- "Black culture" (generic) → "melanated culture" or "minority culture"
- "traveling while Black" → context-appropriate inclusive phrasing

## Known Gap (July 2026 Audit)

~14 mobile screens and ~8 API routes still use "Black-owned" as a generic default — not tied to verified identity or user preference. These are the targets for the post-review language cleanup phase. Files include: travel-planner.tsx, kinfolk-settings.tsx, melanin-passport.tsx, affiliate.tsx, challenges.tsx, create-list.tsx, cultural-preference.tsx, interests.tsx, itinerary-feedback.tsx, my-trips.tsx, neighborhood-survey.tsx, community-lists.tsx; and API: email.ts, recommend.ts, community-challenges-new.ts, web-ssr.ts, smart-search.ts, post-nudge.ts, topic-briefs.ts, knowledge-hubs.ts.

**Why:** The decision to not remove "Black-owned" was explicit — specificity is celebrated when it is earned or chosen. The cleanup is replacing generic defaults only, not stripping cultural identity from the platform.

## How to Apply

Before writing any platform copy (prompts, placeholders, seeds, notifications, slides, onboarding): check whether the context involves verified identity or an explicit user preference. If yes, specific language is appropriate. If no, use inclusive generic language.
