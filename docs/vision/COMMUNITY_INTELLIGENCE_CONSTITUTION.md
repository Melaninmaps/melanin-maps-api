# Mapping With Melanin™ — Community Intelligence Constitution
**VISION DOCUMENT — BRAINSTORMING ONLY**
**July 26, 2026 | No implementation authorized**
**Authorization phrase: "Please implement."**

This document is the cross-cutting intelligence layer standard.
It sits alongside the Platform Constitution (MWM-Constitution-v1.0.md)
and defines the rules that every intelligent feature must follow —
Maps, KinfolkAI, Business tools, Cultural Ambassador experiences,
the Living Community Feed, and every phase of the roadmap.

---

## Why This Document Exists

Every phase of the roadmap builds features. This document tells those
features how to behave. Without it, individual phases may be technically
correct but philosophically inconsistent. With it, every engineer and
product decision has a shared test to apply.

---

## The Six Principles

### 1 — Community Before Engagement

Recommendations should strengthen community, not maximize attention.

  What to optimize for: meaningful connection, contribution, belonging
  What never to optimize for: time-in-app, impression count, viral reach

Every ranking, feed order, notification trigger, and recommendation
must pass this test first.

---

### 2 — Transparency

Members should understand why they're seeing a suggestion.

"Why am I seeing this?" must always produce a human answer —
not a system explanation, not a silence, and never a reference
to "an algorithm."

The explanation uses:
  - Information the member has chosen to share
  - Observed patterns from their own actions and choices
  - Community patterns stated in aggregate (never individual)

The explanation never uses:
  - Engagement scores
  - Internal ranking weights
  - Other members' identity or behavior (only aggregate signals)

---

### 3 — Gradual Adaptation

The platform evolves with a member's engagement and choices rather
than making sudden assumptions.

  Kinfolk follows. It does not lead.
  If engagement stops, the platform adjusts.
  Life seasons unfold over months — Kinfolk responds at that pace.

Nothing in the platform should feel like surveillance. Everything
should feel like a community that notices and remembers what the
member has shared willingly.

---

### 4 — Evidence-Based Guidance

Recommendations and coaching must be grounded in observed patterns
or verified information — never exaggerated promises or speculation.

The coach says:
  "I noticed families are searching more for X in your neighborhood."
  "Your reviews consistently mention Y."

The coach does NOT say:
  "You should do X." (without evidence)
  "This will help you grow by Y%." (invented claim)
  "Members similar to you do Z." (without verified pattern)

If KinfolkAI cannot substantiate a suggestion with observable
evidence or the member's own stated preferences, it should not
make the suggestion.

---

### 5 — Respect for Privacy

Only use information the member has chosen to share.
Always provide meaningful controls over personalization.

  Use: preferences the member stated, actions the member took,
       searches the member ran, saves the member made

  Never use: inferred demographics, third-party data, social
             graph inference without explicit connections, or
             content visible to the member but not explicitly
             shared

Every personalization has an off switch. Privacy mode must
always be available. Opting out of personalization does not
mean losing access to community features.

---

### 6 — Contribution Over Popularity

Recognize members for helping others — not for generating views,
accumulating followers, or posting volume.

  The Community Growth Model (Member → Contributor → Trusted
  Contributor → Community Guide → Mentor → Cultural Ambassador)
  reflects this principle structurally.

  Ambassadors are measured by Communities Served — not followers.
  Business owners are recognized for community impact — not impressions.
  Community Members are invited to mentor based on lived experience —
  not on social standing.

The platform never confuses influence with expertise, and never
rewards popularity when contribution is what matters.

---

### 7 — Community Health by Capacity, Not Stereotype

> Kinfolk should measure the health of a community by its capacity to support
> the people within it — not by stereotypes, sensational events, or isolated
> incidents.

A healthy community is one where people increasingly have access to opportunity,
support, belonging, resources, and trusted information.

This principle:
  Prevents reducing a place to a crime statistic or crime trend
  Prevents single-narrative framing of any neighborhood
  Governs all Community Health Profile dimensions and messaging
  Requires asset-framed language (capacity, growth, belonging)
  Forbids the platform from implying that minority communities are unsafe
  because they are minority communities — that is the opposite of the mission

---

### 8 — Proportional Interpretation

> Kinfolk must interpret community information in proportion to the relevant
> population, time period, context, and strength of evidence. Raw totals alone
> must never be treated as community meaning.

100 searches among 500 relevant members and 100 searches among 50,000 relevant
members are not the same signal. Every insight must be evaluated across five
dimensions: Prevalence, Volume, Momentum, Relevance, and Confidence. KinfolkAI
acts proactively only when the combined signal across all five is meaningful.

This principle governs:
  Business Intelligence Briefings (rate not raw count)
  Community needs identification (sustained pattern not isolated surge)
  Safety and discrimination signal interpretation (unique reporters, denominator,
    corroboration — not raw totals)
  Community Health Profile dimensions
  Living Community Feed ranking

Full standard: docs/product/COMMUNITY_SIGNAL_STRENGTH_STANDARD.md

---

### 9 — Purposeful Collection

> Kinfolk collects information only when there is a defined, privacy-respecting
> purpose that can produce a meaningful benefit for members, businesses,
> organizations, or communities.

Before any new data point is collected, four questions must be answered:
  What member or community benefit does this create?
  What decision could responsibly change because of it?
  Can the same result be achieved with less personal information?
  When should the information expire or stop affecting results?

If the team cannot answer these four questions, do not collect the information.

This principle governs:
  Every new DB column, survey field, and tracking event
  Every KinfolkAI memory update
  Every Community Health signal added
  Every safety or discrimination report field
  Every business analytics dimension

Full standard: docs/product/COMMUNITY_SIGNAL_STRENGTH_STANDARD.md

---

## The Test — Applied to Every Feature

Before any feature ships, apply this test:

  1. Does it strengthen community before maximizing engagement?
  2. Can a member understand why they're seeing it in human terms?
  3. Does it adapt gradually based on member choices — not assumptions?
  4. Is every recommendation grounded in evidence, not speculation?
  5. Does it only use information the member chose to share?
  6. Does it recognize contribution, not popularity?
  7. If it references a community or neighborhood — does it frame that
     community by its capacity to support people, not by stereotypes,
     incidents, or sensational framing?
  8. Are all signals interpreted proportionally — prevalence against a
     defined relevant population, not as raw totals?
  9. Was every data point collected for a defined, beneficial purpose
     with an identified expiration?

If any answer is uncertain, stop and clarify — do not ship.

---

## Application Across the Roadmap

This constitution applies to:
  Maps — discovery order, pin weighting, neighborhood signals
  KinfolkAI — every prompt, suggestion, Life Journey, Briefing
  Business tools — Intelligence Briefings, Growth Coach, Opportunity Engine
  Cultural Ambassador — Impact Reports, Legacy Engine, Communities Served
  Living Community Feed — all four layers
  Notifications — what triggers, what is suppressed
  Verification — what the badge means, how it is communicated
  Personalization — onboarding, memory, privacy mode
  Community Health Profile — all five dimensions and progress messaging
  Safety surveys — anonymity, contributor recognition
  Reviews — weighting, trust level influence, response handling
  Moderation — what is surfaced, what is suppressed, why

---

## The Founding Sentence

> **KinfolkAI exists to strengthen the relationship between people,
> businesses, professionals, organizations, and culture through trusted
> community understanding.**

Everything this platform does should be traceable back to that sentence.
If a feature cannot be — it does not belong.

---

## Cross-References

  Platform Constitution: docs/MWM-Constitution-v1.0.md
  Community Understanding vision: docs/vision/COMMUNITY_UNDERSTANDING_AND_LIVING_FEED.md
  Community Intelligence Platform vision: docs/vision/COMMUNITY_INTELLIGENCE_PLATFORM.md
  Business KinfolkAI vision: attached_assets (6-engine model)
  Cultural Ambassador vision: attached_assets (7-engine model)
  Foundation Build strategy: docs/vision/FOUNDATION_BUILD_STRATEGY.md
  Technical roadmap: docs/product/BUILD_97_SCOPE_AND_ROADMAP.md
