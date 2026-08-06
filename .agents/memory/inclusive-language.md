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

## ENFORCEMENT (Aug 5, 2026 — Founder escalation — PERMANENT)

This rule regressed on ~50% of builds. Full audit completed Aug 5, 2026. 174 generic instances fixed across 87 files. **0 generic instances remain.**

**Remaining legitimate uses (5 total — DO NOT CHANGE):**
- `identity.tsx` + `BusinessImprovementPlanModal.tsx`: filter option ID/label — user-chosen filter ✅
- `kinfolk.ts` lines 170, 441, 460: Parrish St / Farish St / Black Wall Street historical references ✅
- All `seed-tour-guide*.ts` + `seed-city-profiles.ts`: `culturalCommunity: 'Black-owned'` DB field values — specific verified businesses ✅

**Regression prevention hook:** `.husky/pre-commit-language-check` — fires if non-seed "Black-owned" count exceeds 15. Run it before any commit touching copy, prompts, seeds, or onboarding.

## How to Apply

Before writing any platform copy (prompts, placeholders, seeds, notifications, slides, onboarding): check whether the context involves verified identity or an explicit user preference. If yes, specific language is appropriate. If no, use inclusive generic language.
