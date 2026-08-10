---
name: MWM Platform Icons vs User Emojis — Design System Rule
description: PERMANENT rule distinguishing MWM-authored iconography from user-authored emoji in all platform UI
---

## THE RULE

Mapping with Melanin™ has TWO distinct visual languages:

1. **MWM-authored / system-generated content** → polished MWM icon system (gold, refined, cohesive, premium)
2. **User-authored expressive content** → native emoji allowed (Apple/Android/browser)

## MWM-AUTHORED CONTENT — DO NOT USE EMOJI

Whenever MWM displays: icons, designations, badges, categories, status, feature names, recommendations, navigation elements, insights, achievements, or structured community signals:

**DO NOT use standard Unicode emoji as the final production visual.**

Use the approved polished MWM icon system: refined, cohesive, gold/MWM palette, consistent stroke/fill, accessible, recognizable at small sizes, consistent across web and mobile.

This includes:
- Map category chips
- Business profile badges
- Library navigation
- KinfolkAI buttons, chips, suggestion cards, categories
- Vibes chips
- THE REAL chips
- Community Confidence signals
- Know Before You Go indicators
- Milestone badges
- Search filters
- All navigation elements
- Admin/dashboard indicators

## USER-AUTHORED CONTENT — EMOJI ARE FINE

Users may use normal emoji in: comments, reviews, captions, community posts, messages, user-written recommendations, user-written business feedback.

**DO NOT convert or replace user-written emoji with MWM icons.**

## COMMUNITY DATA DISPLAYED BY MWM

If MWM summarizes or structures community data into a platform element → the DISPLAY belongs to the MWM visual system.

Example: Users call a place "great for date night" → MWM badge "Date Night Favorite" must use MWM icon, not ❤️.

## THIS IS NOT AUTHORIZATION TO DISRUPT CURRENT TESTING

Apply during the next relevant UI implementation, when touching an affected component, during design-system cleanup, or before final public launch. Do NOT jeopardize auth, Library, Map, business pages, Kinfolk, reviews, media contribution, Apple review, or tester stability merely for icon cleanup.

## CENTRAL ICON SYSTEM

Maintain ONE centralized reusable MWM icon library. Use semantic identifiers:
`home | realtor | restaurant | faith | health | safety | travel | education | community | verified | favorite | milestone`

Components call the semantic MWM icon rather than hard-coding emoji. This allows artwork to evolve without rewriting every page.

## ACCESSIBILITY

Decorative icons: no noisy screen-reader output. Meaningful icons: appropriate labels/accessible text. Never rely on icon/color alone to communicate important status.

**Why:** The platform can feel human without looking amateur. Members retain their own expressive voice. Anything MWM officially says, awards, summarizes, categorizes, or certifies has a recognizable premium visual identity.
