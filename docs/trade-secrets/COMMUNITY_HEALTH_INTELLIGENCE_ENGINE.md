# Community Health Intelligence Engine
## CONFIDENTIAL — INTERNAL ONLY
**NOT FOR PUBLIC DISCLOSURE**
**Trade Secret — Mapping With Melanin™**
**July 26, 2026**

---

This document describes the internal architecture, signal selection, weighting
philosophy, confidence methodology, and recommendation logic for the Community
Health Intelligence Engine. It is not a product specification. It is a
methodology document.

Do not reproduce, excerpt, or summarize any section of this document in:
  Public documentation
  Press releases or media
  Partner agreements (without NDA)
  App Store descriptions
  Marketing copy
  API documentation
  Open-source contributions

---

## What This Engine Does

The Community Health Intelligence Engine answers one question:

> "What should a member understand about this community, and how can they
>  become part of strengthening it?"

It does NOT answer:
  "How safe is this neighborhood?" (reductive, stigmatizing)
  "How should I rank this community?" (extractive, authority-asserted)
  "What score does this place get?" (misleading precision)

---

## Governing Principle

> Kinfolk should measure the health of a community by its capacity to
> support the people within it — not by stereotypes, sensational events,
> or isolated incidents.

A single incident is not a trend. A trend is not a verdict.
Kinfolk surfaces patterns, not judgments.

---

## The Five Health Dimensions (Internal)

### 1 — Community Safety (Reported Experiences)
NOT crime data. Community-contributed, pattern-observed only.
  Discrimination trend signals (from safety surveys)
  Walking comfort by time of day (member-contributed only)
  Community support presence
  Emergency resource availability
  Community engagement as a proxy for active stewardship

### 2 — Community Opportunity
  Business vitality (minority-owned business growth, opening rate)
  Employment signals (job listings, apprenticeship availability)
  Professional specialty availability and gap detection
  Medical, legal, childcare, trades shortages by specialty
  Volunteer opportunity density
  Entrepreneurship activity signals

### 3 — Community Belonging
  Community organization density and activity level
  Active event calendar signals
  Mentorship network availability
  Cultural organization presence
  HBCU alumni and cultural group activity
  Arts and recreation availability

### 4 — Community Accessibility
  Member-reported wheelchair accessibility
  Transit availability signals
  Family friendliness (member-contributed)
  Park and green space presence
  Senior resource availability

### 5 — Community Growth
  New business activity
  Restoration and improvement project signals
  Public investment signals (where available from public sources)
  Community improvement initiative activity

---

## Signal Selection Philosophy — INTERNAL

Signals are selected by these criteria (in order):
  1. Does using this signal help the community understand itself?
  2. Is this signal voluntarily contributed by community members?
  3. Does this signal avoid reinforcing existing stereotypes?
  4. Can this signal be represented with appropriate uncertainty?
  5. Does the source of this signal protect individual privacy?

Signals that FAIL any of these criteria are excluded regardless of
data quality or availability.

---

## Evidence Quality Tiers — INTERNAL

### Tier 1 — Highest Confidence
  Verified member observations (from verified accounts)
  Multiple independent reports across time
  Confirmed business information (from verified business owners)
  Official public information with appropriate sourcing

### Tier 2 — Medium Confidence
  Consistent community trends over time (minimum threshold TBD)
  Community surveys with sufficient participation
  Community organization contributions
  Corroborated member reports

### Tier 3 — Lower Confidence
  Individual opinions or single anecdotal reports
  Emerging observations without corroboration
  Single reports not yet confirmed by pattern

### Uncertainty Communication
Kinfolk must communicate confidence level alongside any signal it surfaces.
It must NEVER present Tier 3 signals with Tier 1 language.

Examples:
  Tier 1: "Members consistently report this area is accessible by transit."
  Tier 2: "Several residents have shared that accessibility is improving."
  Tier 3: "One member recently noted..." (or omit until corroborated)

---

## Weighting Philosophy — INTERNAL

DO NOT hardcode percentage weights.

Build a framework that supports configurable weights so that dimension
importance can be adjusted based on observed member behavior, community
feedback, and product learning over time.

The dimension stack (no fixed percentages at launch):
  Community Belonging
  Accessibility
  Community Engagement
  Reported Experiences
  Verified Community Resources
  Business Vitality
  Community Opportunity
  Community Resilience

### What Must NEVER Dominate
  One discrimination report ≠ entire neighborhood unsafe
  One positive review ≠ entire neighborhood welcoming
  A single incident must never be treated as a trend
  High negative engagement on one topic must never collapse all dimensions

### Pattern Threshold Rule (Internal)
A signal influences Community Health only after it meets a minimum
corroboration threshold (exact value TBD in implementation phase).
Single signals are tracked but do not affect the displayed profile.

---

## Bias Prevention Rules — INTERNAL

1. No demographic inference. Community Health signals may not be derived
   from inferred demographics of area residents.

2. No crime database integration. No third-party crime data may be used
   as a Community Health signal without explicit founder approval.

3. No third-party neighborhood scores. Existing scores from Walkscore,
   NeighborhoodScout, or similar providers may not be used as inputs.

4. No self-reinforcing signals. A community that has historically received
   negative attention must not be penalized by that attention history.

5. Recency weighting. Recent observations carry more weight than older ones.
   Community Health is a present-state signal, not a historical verdict.

---

## Stereotype Avoidance — Implementation Rule

Before any Community Health signal ships, apply this test:
  "If this signal were shown to a member who has never visited this
   community, would it reinforce a stereotype about the type of people
   who live there?"

If yes — the signal must be reframed, excluded, or held until it reaches
Tier 1 corroboration.

---

## Community Progress Messaging — Internal Standard

The engine must never produce ranked outputs like "you moved up 3 points."

Instead, it produces narrative trend signals:
  "Community engagement has increased over the past year."
  "More residents are contributing local recommendations."
  "Three new community organizations joined."
  "Businesses are receiving more positive accessibility feedback."

These signals are based on delta changes, not absolute scores.

---

## Future Capability — Community Opportunity Intelligence

The engine will eventually support gap detection:
  Identifying professional specialty shortages by community
  Identifying trades shortages
  Connecting gap signals to education, training, and organization resources
  Connecting members to community opportunities based on their season

This is Phase 9 architecture. Internal design only — no public disclosure
of methodology.

---

## Document Lineage

This document is derived from founder vision sessions conducted July 26, 2026.
It is classified as a trade secret of Mapping With Melanin™.

Related documents (all CONFIDENTIAL):
  docs/trade-secrets/KINFOLK_COMMUNITY_INTELLIGENCE_MODEL.md
  docs/trade-secrets/IP_FRAMEWORK.md

Public-facing related document (approved for publication):
  Community Health Profile (product name, not methodology)
  Community Insights (Build 97 temporary label)
  Community Intelligence Constitution (principles only, no methodology)
