# Mapping With Melanin™ — KinfolkAI Privacy Intelligence & Contextual Discretion
**Prepared by:** Manus AI
**Date:** August 11, 2026
**For:** Replit Engineering Team
**Status:** Approved for Implementation — This brief corrects a critical misunderstanding and must be read alongside all previous KinfolkAI briefs.

---

## The Correction

The previous briefs described how Kinfolk learns from users and connects that learning across the platform. That is correct. What must be corrected is the assumption that Kinfolk applies this learning broadly and automatically across all conversations and surfaces.

**Kinfolk does not interject Library topics, health connections, or personal context into every conversation.** It does so only when it makes sense, only when the user has selected that preference, and only in the specific context the user has chosen. The user controls how much Kinfolk knows, how much Kinfolk uses, and where Kinfolk uses it.

---

## 1. User-Controlled Learning Preferences

Every user has a privacy and personalization settings panel. Kinfolk operates strictly within whatever the user has selected. The settings must include at minimum:

- **What Kinfolk can learn:** The user selects which categories of their behavior Kinfolk is allowed to learn from. Options include: health interests, travel preferences, food and dining, business activity, community engagement, social connections, and others. Each category can be toggled independently.
- **What Kinfolk can surface:** Separately from what it learns, the user controls where Kinfolk is allowed to surface that learning. A user may allow Kinfolk to learn their health interests but choose not to have those interests surfaced in their Circle conversations or on their public community profile.
- **How proactive Kinfolk is:** Users can set Kinfolk to be highly proactive (it suggests things without being asked), moderately proactive (it suggests things when the context is clearly relevant), or reactive only (it only responds when directly asked, never volunteers information).

---

## 2. Sensitive Topic Handling — The Non-Leakage Rule

Certain categories of information are **permanently protected** regardless of the user's other settings. Kinfolk must never surface, reference, imply, or connect these topics to other parts of the platform without explicit, deliberate user action:

- HIV status or any STI-related searches
- Mental health diagnoses or crisis-related searches
- Substance use or recovery-related searches
- Immigration status or legal vulnerability searches
- Divorce, separation, or domestic situation searches
- Pregnancy loss, fertility struggles, or reproductive health searches
- Financial distress or debt-related searches
- Any search that could reveal a protected characteristic the user has not chosen to share

**These topics must be siloed.** A user who searches for HIV support resources must never have that search influence their public recommendations, their Circle activity, their business-facing profile, or any notification sent to other users. The only exception is if the user has explicitly joined a support group for that topic — in which case, the group context is the only place that information is relevant, and it remains contained there.

---

## 3. Contextual Discretion — The Divorce Rule

This is the most nuanced and most important privacy principle in the entire platform. Kinfolk must be built with **contextual discretion** — the ability to recognize when acting on a search would be inappropriate, premature, or potentially harmful, even if the action would technically be "helpful."

**The Divorce Example:**
A user searches for divorce lawyers. Kinfolk must not:
- Begin recommending singles events
- Surface "starting over" content in their feed
- Change the tone of its responses to reflect an assumption that the relationship is over
- Send any signal to the user's Circle members that anything has changed

Why? Because the user may be researching for a friend. They may be upset and venting. They may be a lawyer themselves. They may have searched it once and moved on. A single search is not consent to a life change assumption. And critically — if the user shares a Circle or a connected account with a partner, that partner must never see a behavioral change in the platform that reveals what the user searched.

**The Rule Kinfolk Must Follow:**
A single search on a sensitive or life-change topic triggers no behavioral change in the platform. Kinfolk notes the search privately. Only if the user engages repeatedly with that topic over time, AND has enabled the relevant learning preference, AND the context clearly calls for it — only then does Kinfolk gently and privately offer relevant resources. It does so in the user's private Kinfolk conversation only, never in public-facing surfaces.

---

## 4. The Opt-In Connection Model

The positive version of this principle — how Kinfolk DOES connect Library topics to the rest of the platform — must also be opt-in and context-sensitive.

**The Heart Health Example:**
A user selects "Heart Health" as a topic they want recommendations around. They have explicitly opted in. Kinfolk may now, when it makes sense, surface:
- A run club in their neighborhood
- A doctor's page where a cardiologist shares expert advice
- A Library chapter on hypertension management
- An influencer who posts healthy recipes
- A restaurant with heart-healthy menu options

But even here, Kinfolk applies judgment. It does not interject heart health into every conversation. It does not mention it when the user is planning a trip to Cancun. It surfaces these connections when the context is relevant — when the user asks about food, when they are searching for doctors, when they are exploring their neighborhood. The connection is helpful, not intrusive.

---

## 5. Circle Privacy — What Kinfolk Never Shares

Circles are shared spaces, but a user's private Kinfolk context is never shared with their Circle members unless the user explicitly chooses to share it.

**What Kinfolk keeps private even within a Circle:**
- Any health topic the user has not publicly shared
- Any sensitive search history (divorce, HIV, mental health, financial distress)
- Any Library topics the user follows privately
- Any individual preferences that the user has not chosen to make visible to the group

**The only exception:** If a user joins a support group Circle that is explicitly organized around a sensitive topic (e.g., a sickle cell support group, a fertility journey group), Kinfolk understands that the topic is the shared context of that group and may engage with it within that Circle. It still does not carry that context outside the Circle.

---

## 6. Implementation Requirements for Replit

Replit must implement the following to enforce these privacy principles:

1. **Privacy Settings Panel:** Build a dedicated settings page where users control what Kinfolk learns and where it surfaces that learning. This must be accessible from the user profile and must be easy to understand — not buried in a terms of service.

2. **Sensitive Topic Silo:** Implement a classification layer in the Kinfolk backend that identifies sensitive topic searches and flags them as non-propagating. These searches must never be written to the demand signal engine, the Library write-back pipeline, or any Circle context.

3. **Contextual Discretion Logic:** Implement a "single-search suppression" rule. One search on a sensitive topic does not trigger any behavioral change. Only sustained, repeated engagement with a topic, combined with an active opt-in preference, allows Kinfolk to surface connections.

4. **Circle Data Boundary:** Implement a hard data boundary between a user's private Kinfolk context and their Circle-facing profile. These must be stored and queried separately. A Circle query must never have access to a user's private health, legal, or sensitive search history.

5. **No Cross-Account Leakage:** For dual accounts (community member + business owner), sensitive personal searches on the community member profile must never influence the business owner profile's public-facing outputs or notifications.

---

## The Principle in One Sentence

Kinfolk is a trusted friend, not a surveillance system. A trusted friend remembers what you share with them, uses it to help you when it matters, and knows when to keep their mouth shut.

---

## Strict No-Touch Guardrails (Unchanged)

**DO NOT touch:**
- The authentication system (`/login`, session cookies, password reset flows)
- The Business Directory (`/businesses`) or Map (`/map`) rendering logic
- The Safety Hub (`/safety`) or Marketplace (`/marketplace`)
- The existing curated "Books" UI panel in the Library
