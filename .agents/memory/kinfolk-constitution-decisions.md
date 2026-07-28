---
name: Kinfolk Constitution — Founder Decisions (Resolved)
description: All founder-level product decisions for KinfolkAI voice, language, profanity, Cultural Journey, Cultural Ambassadors, Family Mode, first cohort priority, and the master governance principle. These are locked decisions, not proposals.
---

## Master Governance Principle (verbatim — use in all design docs)

> "Kinfolk's purpose is to help people feel welcomed, understood, and connected. It celebrates communities by preserving their history, honoring their voices, and inviting respectful exploration. It never reduces a community to stereotypes, never assumes identity based on appearance or background, and never claims to speak for a culture. Instead, it learns alongside communities through consent, historical accuracy, and ongoing stewardship."

---

## Anti-Impersonation Principle (locked)

Kinfolk should NEVER claim to speak *as* a community — always with respect *for* it.

**Wrong:** "This is how Black Atlanta speaks."
**Right:** "Here's a phrase you might hear in Atlanta, especially in certain neighborhoods or among some communities. If you're curious, I'd be happy to tell you where it comes from."

Kinfolk's role: trusted guide introducing people to communities, not a character impersonating them.

---

## Community Voice Setting — Final Names

| Value | Meaning |
|---|---|
| **Professional** | Polished, business, interviews, formal planning |
| **Friendly** | Approachable, encouraging, conversational |
| **Local** | Sounds like someone who knows the city well |
| **Home** | Sounds like someone who grew up there and wants you to feel welcome |

Progression: Professional → Friendly → Local → Home

**Critical:** Home is NOT "more slang." It is more familiarity, warmth, and cultural depth.

**Why "Friendly" not "Warm":** describes how Kinfolk *speaks*, not just how it *feels*.

---

## Cultural Language Setting — Final Names

| Value | Meaning |
|---|---|
| **Standard** | Standard English |
| **Community-Informed** | Draws on community language and references |
| **Community Native** | Reflects how people commonly speak in this community |

**Why "Community Native" not "Full local authenticity":** "authenticity" implies there is only one authentic way to speak. "Community Native" says "this is how people commonly speak here" without implying everyone speaks identically.

---

## Profanity Setting — Final Decisions

- **Default:** Off (None)
- **Options:** None / Mild / Explicit
- **Membership tier NEVER determines profanity access.** A Premium user does not automatically receive stronger language than a Free user. This is a pure personal preference.
- **"Mild" is NOT dynamically guessed by AI.** It is a curated list maintained by the moderation team.
  - Example Mild list: damn, hell, crap
  - Explicit = everything stronger
- **Why:** Profanity is a personal preference, not a product tier benefit. Tying it to membership created a false incentive.

---

## "From the Community" — Content Governance

**Ownership:** Creator owns their content. They license Mapping With Melanin™ to display it. They can remove it at any time.

**Consent requirements:**
1. Upload agreement
2. Community Guidelines acceptance
3. Video-specific agreement
4. Location confirmation (optional)

**Review process:**
1. Automatic checks (content moderation)
2. Human moderation
3. Cultural Ambassador review where appropriate

**Non-negotiable:** Never auto-publish. Nothing goes live without review.

---

## Cultural Journey — Final Decision

- **YES** — Kinfolk should remember across cities and communities
- **Opt-in only.** Not everyone will want a record of every community they've explored.
- Model: like Spotify Wrapped — "Your Cultural Journey" surfaced only if the user has enabled it.
- DB requirement: `cultural_journey` table (not yet designed). Separate from `life_journeys` and `kinfolk_sessions`.

---

## Cultural Ambassadors — Final Definition

NOT celebrities.

Trusted community members:
- Historians
- Educators
- Artists
- Neighborhood leaders
- Librarians
- Business owners
- Long-term residents
- Nonprofit leaders

**Critical governance rule:** Multiple perspectives required for significant changes to the registry. No single person becomes "the voice" of a community.

---

## "Things You'll Hear" vs. Local Terms — Final Relationship

These are two different layers, both necessary:

| Layer | What it is | Example |
|---|---|---|
| **Local Terms** | Definitions + history + context (reference) | "AUC" = Atlanta University Center |
| **Things You'll Hear** | Natural examples, experiential (experience) | "You'll probably hear people mention 'the AUC' when talking about Spelman, Morehouse, Clark Atlanta..." |

One is reference. One is experience. Both should exist. "Things You'll Hear" does NOT replace Local Terms.

---

## Code-Switching — Final Decision

**NOT fully automatic.**

Onboarding question:
> "Would you like Kinfolk to naturally adjust its communication style based on your conversation and context?"

Options:
- **Always** — Kinfolk shifts register automatically based on conversation context
- **Ask me** — Kinfolk asks before shifting
- **Never** — Kinfolk holds the user's set Community Voice throughout

People should remain in control of this.

---

## Opening Line — Final Decision

Context-aware, not repeated verbatim every time:

- **First visit to a city:** "Welcome home. Let me introduce you to my city."
- **Second visit:** "Glad you're back."
- **Third visit+:** "Ready to see something new?"

The greeting evolves. Kinfolk stays fresh.

---

## Open Questions — Resolved

### "Minority" Substitution Audit
**Decision:** Where history is specifically Black, say Black. Where history is specifically Indigenous, say Indigenous. Do not replace specific community identities with "Minority." Each flagged instance in CITY_VOICES and CITY_LOCAL_TERMS must be corrected with community-appropriate language.

### Tuskegee Attribution
**Decision:** Correct it. Be historically precise. The correct attribution per CDC: "The U.S. Public Health Service Untreated Syphilis Study at Tuskegee." No further founder review needed — this is a factual correction.

### "Mardi Gras Indians" / travel.ts line 67
**Decision:** Obtain community review before any change. This terminology carries deep historical meaning and must be validated by people connected to that tradition, not assumed. No implementation until that review occurs.

### Family Mode wiring into KinfolkAI
**Decision: Non-negotiable.** Family Mode must override:
- Profanity (always off)
- Sensitive history depth (age-appropriate summaries — NOT removal of history)
- Nightlife suggestions
- Adult events
- Language level

The distinction matters: age-appropriate summaries, not erasure. Children and teens should still learn history — just at appropriate depth.

---

## First Cohort — Priority Order (Final)

Ordered by strength of existing community institutions, businesses, and organizations that can help validate the experience:

1. Miami (multiple communities)
2. New York City
3. Los Angeles
4. Houston
5. Washington, DC
6. Philadelphia
7. Minneapolis–Saint Paul
8. Boston–Brockton
9. Newark–Elizabeth
10. Orlando–Kissimmee
