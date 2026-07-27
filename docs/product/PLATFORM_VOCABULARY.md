# Mapping With Melanin™ — Platform Vocabulary & Experience Guide

**Effective:** July 26, 2026
**Status:** Living document. Updated after every language change or Phase 0 audit finding.
**Authority:** This document supersedes any in-code string, placeholder, or prior copy that conflicts with it.

---

## How to Use This Document

Before introducing any new user-facing copy — a button label, an empty state, a notification, an error message, a form field, a prompt, an AI response — check this document first.

If the term or pattern you need is listed: use exactly what is listed.
If it is not listed: flag it as a new terminology decision before shipping.

---

## Approved Terminology

### Platform Name
- **Mapping With Melanin™** — always include ™ on first use in a screen or document
- **MWM** — acceptable abbreviation in internal documents; not for user-facing copy

### Feature and Experience Names
| Approved Term | Do Not Use |
|---------------|-----------|
| Living Legacy Stories | Living Memorials, Living Memorial, Legacy Stories, Living Stories |
| Cultural Ambassador | Culture Ambassador, Heritage Ambassador, Brand Ambassador |
| Heritage Sites | Historic Sites (too generic), Historical Sites |
| Kinfolk AI / KinfolkAI | AI Assistant, Chatbot, Bot, Virtual Assistant |
| Kinfolk Circles | Circles, Groups (in the context of MWM Circles) |
| Community Member | User, Account Holder |
| Trusted Contributor | Power User, Expert |
| Community Leader | Admin (for member-facing contexts) |
| Neighborhood Safety Survey | Safety Survey, Safety Report |
| Business Profile | Listing, Directory Entry |
| Verified Business | Certified, Approved |
| Save | Bookmark, Favorite (unless device convention requires it) |
| Heritage Explorer | (name for the cultural-heritage.tsx screen — not yet final) |

### Community and Cultural Language
| Context | Approved | Do Not Use as Generic Default |
|---------|----------|-------------------------------|
| Business discovery | "minority-owned business," "community business," "culturally relevant place" | "Black-owned" as the automatic generic default |
| Cultural specificity | "Black-owned" when verified, user-chosen, or the subject is specifically Black history/culture | "Black-owned" applied to all businesses without verification |
| Heritage sites | "culturally significant," "heritage site," "community landmark" | "ethnic landmark," "diversity site" |
| Community | "the community," "culturally connected communities," "the diaspora" | "the Black community" as a universal default |

**See also:** Platform Language Rule in `replit.md` (permanent rule, applies everywhere).

---

## Prohibited Terms

The following must never appear in user-facing copy:

- "Black-owned" as an automatic generic default applied without verification or user intent
- "Living Memorials" or "Living Memorial" (superseded — historical reference only)
- "Chatbot," "Bot," "AI Bot" referring to KinfolkAI
- "Ethnic" as a descriptor for cultural places or communities
- "Diversity" as a marketing descriptor for the platform itself

---

## Placeholder Replacement Standards

**Rule:** No placeholder text may appear in a production build.

| Do Not Use | Replace With |
|-----------|-------------|
| "Business Name" (as visible default) | Remove or require input before display |
| "Your Name" | Remove or require input before display |
| "Enter your bio..." | Empty state per guidelines below |
| "Sample Business" / "Demo Business" | Remove from production; seed only in dev |
| "Lorem ipsum" / any Latin placeholder | Remove entirely |
| "Test Business" / "Test User" | Remove from production |
| Any name containing "Demo," "Sample," "Test," or "Placeholder" | Remove from production |

---

## Tone and Voice

### Brand Voice
Mapping With Melanin™ speaks like a trusted friend who knows the community.

- **Warm** — never clinical or corporate
- **Specific** — celebrate specificity without assuming it
- **Respectful** — never condescending, never preachy
- **Confident** — not apologetic about what the platform stands for
- **Inclusive** — welcoming to everyone while centering the communities it serves

### Voice by Context
| Context | Tone | Example |
|---------|------|---------|
| Onboarding | Welcoming, orienting | "You're in the right place." |
| Discovery | Enthusiastic, specific | "44 heritage sites. Start exploring." |
| Error | Honest, helpful, not alarming | "Something went wrong. Try again." |
| Empty state | Encouraging, directional | "No results yet — try a different search." |
| Safety | Calm, clear, actionable | "This area has community-sourced safety updates." |
| AI (KinfolkAI) | Knowledgeable, conversational, culturally aware | — |

---

## Empty State Messaging Standards

**Rule:** Empty states must never feel like failures. They must always be directional.

Pattern: [What is empty] + [Why it might be empty] + [What to do next]

Examples:
- Business list empty: "No businesses found in this area yet. Try expanding your search or exploring a different category."
- Heritage list empty: "No heritage sites found for this search. Try a different category or location."
- Saved places empty: "You haven't saved any places yet. Tap the bookmark icon on any business to save it."
- Safety surveys empty: "No community safety reports for this area. Be the first to contribute."

---

## Error Message Standards

**Rule:** Error messages must tell the member what happened and what they can do. They must never use technical jargon or imply user fault without cause.

| Situation | Approved Message |
|-----------|-----------------|
| Network failure | "We couldn't connect. Check your connection and try again." |
| Server error | "Something went wrong on our end. Please try again in a moment." |
| Auth failure | "We couldn't sign you in. Check your credentials and try again." |
| Upload failure | "We couldn't upload that file. Try a smaller file or a different format." |
| Submission failure | "Your submission didn't go through. Tap to try again." |

---

## Success Message Standards

**Rule:** Success messages confirm what happened and suggest the next action when relevant.

| Action | Approved Message |
|--------|-----------------|
| Business saved | "Saved to your places." |
| Review submitted | "Your review has been submitted." |
| Safety survey submitted | "Thank you. Your report helps the community." |
| Story submitted | "Your Living Legacy Story has been submitted and is pending review." |
| Account created | "Welcome to Mapping With Melanin™." |

---

## Notification Standards

*(To be filled during Phase 0 audit)*

---

## KinfolkAI Personality and Response Style

*(To be filled during KinfolkAI Experience Audit — Phase 3)*

Key principles until that audit is complete:
- KinfolkAI is knowledgeable, warm, and culturally aware
- It does not default to "Black-owned" without verification or user intent
- It celebrates cultural specificity when earned, not as a generic default
- It adapts its depth based on the member's tier (free/Navigator/Trailblazer)

---

## Business Prompt Standards

*(To be filled during Business Owner Experience Audit)*

---

## Inclusive Language Standards

1. Use specific cultural language only when supported by verified identity, user preference, or the subject matter
2. Use generic community language as the default: "minority-owned," "community business," "culturally relevant"
3. Celebrate specificity without assuming it
4. Avoid centering one community when the product is designed to welcome many
5. Any new copy must pass the Product Intent Rule (see `replit.md`): Does this represent the mission? Does it create the intended emotional experience?

---

## Phase 0 Audit Findings

*(This section is populated by the Platform Language & UX Audit — in progress)*

---

*Last updated: July 26, 2026 — Initial structure created. Content to be filled during Phase 0 audit.*
