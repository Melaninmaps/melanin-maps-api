---
name: Post-Build-95 Founder Priorities & Roadmap
description: Founder's stated priorities after iOS Build 95 submitted to Apple review — phase order, HBCU vision, language rule precision, design pass intent.
---

## Context

iOS Build 95 was saved for Apple review (July 2026). Release lock is active: no merges, deploys, OTA updates, or replacement iOS builds until Apple approval. This file captures the founder's explicit priority ordering and product vision for the next phase.

## Release Lock Rule

**While Apple reviews Build 95:** do not merge, deploy, issue an OTA update, or create a replacement iOS build. Any work prepared during review must wait in a branch until approval.

## Phase Order (Founder-Stated)

### Immediately (during Apple review)
1. Android regression testing — versionCode 66 against the checklist; no new Android build yet
2. UI/UX audit of every screen
3. Prepare language changes (branch only, do not merge)
4. Design HBCU map improvements (design/planning only)

### After Apple approval
1. Merge language cleanup
2. Restore and improve HBCU experience (compact horizontal strip + enhancements — see below)
3. Build Android versionCode 67
4. Submit Android to Play Console

### Then (larger vision)
- KinfolkAI refinement
- Community resources
- Cultural Ambassador program
- Nationwide rollout
- Business onboarding
- Investor deck polish
- Welcome Home Tour

## HBCU Map — Flagship Feature Vision

The founder explicitly elevated this above most other post-review work. The goal is to make the HBCU map experience **memorable, not just functional**.

**What was removed:** The searchable/collapsible results panel was deliberately removed during Apple debugging (commit 05e63933, July 22). The card/tile implementation still exists in cultural-heritage.tsx and library.tsx.

**What to restore/build (NOT the old large search panel):**
- Compact horizontal strip **above** the bottom card area, visible when Heritage Sites layer is on
- Pattern from library.tsx heritageSiteCard is the right starting point

**Enhanced HBCU card vision (founder-specified):**
- Featured HBCUs
- Nearby HBCUs (GPS-sorted)
- "Learn More" cards
- Historic significance text
- School colors or imagery
- Alumni stories
- Upcoming homecoming events (future/phase 2)
- "Explore Campus" button

This should feel like a dedicated feature, not a map annotation.

## Language Rule — Precision Upgrade

The inclusive-language rule has been clarified beyond the original "never say Black-owned" framing. The correct rule is **contextual**, not a blanket replacement:

| Context | Use |
|---|---|
| Business verified as Black-owned | "Black-owned" |
| User explicitly filtered for Black-owned | "Black-owned" |
| Generic platform copy, discovery prompts, defaults | "minority-owned", "community businesses", or context-appropriate inclusive language |
| Slide decks and marketing (audience copy) | "minorities", "melanated diaspora" |

Do NOT remove "Black-owned" from the platform. Specificity is celebrated when it is earned or chosen.

**Gap identified (July 2026 audit):** ~14 mobile screens and ~8 API routes still use "Black-owned" as a generic default. These are the targets for the language cleanup phase. See the post-submission audit for the full file list.

## Full Design Pass — Founder Intent

After Apple approval, a full design pass is planned across the entire app. This is not a "redesign" — it is a cohesion audit. Every screen should feel unmistakably like Mapping With Melanin™.

Scope the founder described:
- Spacing and visual hierarchy
- Typography consistency
- Imagery and iconography
- Animations and transitions
- Onboarding flow
- Map interactions
- Empty states and loading states
- Wording and tone
- Icons (no emoji in production UI)

**Why:** The hardest engineering work is now behind the platform. The next leap is experiential — creating something people remember and recommend.

## How to Apply

- When the founder asks to start any work: confirm Apple has approved Build 95 first. If not, scope the work into the branch-only / prepare-but-don't-merge phase.
- When building HBCU map: start from the horizontal strip pattern in library.tsx, not the removed full search panel. Build toward the enhanced card vision above.
- When writing any platform copy (prompts, placeholders, seeds, notifications): apply the contextual language table above, not a blanket rule.
- When given the green light after Apple approval: language merge → HBCU → Android 67 → submit. In that order.
