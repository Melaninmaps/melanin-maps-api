---
name: KinfolkAI Privacy Intelligence
description: Sensitive topic classifier, non-leakage rule, Divorce Rule, Circle data boundary — all live in kinfolk.ts as of Aug 11 2026.
---

## The Spec (Manus AI — Aug 11 2026)

"Kinfolk is a trusted friend, not a surveillance system. A trusted friend remembers what you share with them, uses it to help you when it matters, and knows when to keep their mouth shut."

## What Was Built

### classifySensitiveTopic() — kinfolk.ts ~line 32
7 RegExp patterns covering:
- HIV/STI/sexual health
- Mental health crisis / psychiatric
- Substance use / recovery / rehab
- Divorce / domestic violence / custody
- Immigration status / deportation
- Pregnancy loss / fertility / abortion
- Bankruptcy / foreclosure / debt relief

Returns `true` on first match → triggers single-search suppression.

### Single-Search Suppression — chat route
`sensitiveTopicDetected = classifySensitiveTopic(message)` fires before any context fetch.
- Library interests query (`user_library_interests`) is **skipped** when true
- `privacySuppressed: true` passed to `buildSystemPrompt`

### privacySuppressed in buildSystemPrompt
- `effectiveLibraryInterests = []` when suppressed → libraryInterestsSection empty
- `effectiveCircleContext = null` when suppressed → circleSection empty
- Circle data boundary enforced: member health/legal context never leaks to group

### Privacy Intelligence Block — always in system prompt
Injected as `privacyIntelligenceBlock` before every other context section. 5 non-negotiable rules:
1. Single-Search Suppression
2. Non-Leakage Rule (7 siloed categories — listed verbatim)
3. Contextual Judgment (proactivity threshold — not in every conversation)
4. Circle Data Boundary
5. The Trusted Friend Principle (verbatim from spec)

### Library Cross-Pollination Tightened
Rule updated: "Surface only when genuinely relevant — DO NOT inject when unrelated (e.g. heart health when planning Cancun trip)."

### DB Migration: kinfolk_privacy_settings_v1
3 new columns on `user_preferences` (ALTER TABLE ADD COLUMN IF NOT EXISTS):
- `kinfolk_proactivity` VARCHAR(20) DEFAULT 'medium' (high | medium | reactive)
- `kinfolk_learning_categories` JSONB DEFAULT 5 categories
- `kinfolk_privacy_settings` JSONB DEFAULT 8-key control object (learnHealth, learnTravel, etc.)

**Why:** Migration runs every boot (no tracking table) — all are IF NOT EXISTS so idempotent.

## What Is NOT Yet Built (pending)
- Privacy settings panel UI (web + mobile) — columns exist in DB, no UI yet
- Opt-in flow for expanding beyond defaults
- The spec's "proactivity control" — column exists but `kinfolk.ts` doesn't yet read it to adjust behavior
