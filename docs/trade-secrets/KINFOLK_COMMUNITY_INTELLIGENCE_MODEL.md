# KinfolkAI — Community Intelligence Model
## CONFIDENTIAL — INTERNAL ONLY
**NOT FOR PUBLIC DISCLOSURE**
**Trade Secret — Mapping With Melanin™**
**July 26, 2026**

---

This document defines the internal model that governs how KinfolkAI understands
members, communities, and the ecosystem. It is a methodology document — not a
code specification.

Do not reproduce in public documentation, partner agreements, press releases,
App Store descriptions, or API documentation.

---

## The Mission Sentence (Public)

> KinfolkAI exists to strengthen the relationship between people, businesses,
> professionals, organizations, and culture through trusted community understanding.

Everything in this document serves that sentence.

---

## KinfolkAI's Governing Question (Internal)

Before every response, recommendation, or notification, KinfolkAI answers:

> "How can I strengthen this person's relationship with community?"

Not: How do I maximize engagement?
Not: How do I keep them in the app?
Not: How do I sell them something?

---

## The Eight Internal Engines

### Engine 1 — Community Understanding Engine
How KinfolkAI builds and updates a member's community profile.
  Inputs: stated preferences, observed engagement, search history, saves,
          contributions, season signals (member-driven, not inferred)
  Outputs: personalized community context for all other engines
  Rule: follows member engagement; does not lead or assume

### Engine 2 — Mirror Twin Model (INTERNAL — DO NOT DISCLOSE)
How KinfolkAI finds relevant community patterns without exposing individuals.
  Methodology: aggregate pattern matching across members with similar
               stated preferences and engagement histories
  Privacy rule: no individual is ever referenced; only patterns surface
  Output: "Members with similar interests found..." language

### Engine 3 — Community Reciprocity Engine
Identifies opportunities for members to give back what they received.
  Inputs: member's received value (relocation help, scholarship, discovery, etc.)
  Timing logic: appropriate interval after value was received (TBD per type)
  Output: invitation to contribute (not a demand; dismissible)
  Rule: never rewards posting volume; always rewards meaningful contribution

### Engine 4 — Business Intelligence Engine
How KinfolkAI supports business owners within the community ecosystem.
  Inputs: reviews, safety surveys, community mentions, competitor signals,
          trend data, partnership opportunity signals
  Outputs: Intelligence Briefings, Growth Coach insights, Opportunity Engine
  Rule: grounded in observed patterns; never fabricated projections

### Engine 5 — Ambassador Impact Engine
How KinfolkAI measures and communicates Cultural Ambassador impact.
  Inputs: communities documented, events attended, mentorship provided,
          content created, organizations connected, lives impacted
  Outputs: Impact Reports, Legacy Engine contributions, Communities Served
  Rule: impact ≠ followers; contribution ≠ content volume

### Engine 6 — Life Season Engine
How KinfolkAI understands and responds to a member's current life season.
  Inputs: member's own stated transitions, engagement patterns, saved content
  Seasons: relocation, marriage, homeownership, parenting (by stage),
           career change, retirement, caregiving, starting a business,
           education, health journey
  Rule: Kinfolk follows, does not lead; stops engaging with a season if
        member disengages; no sudden assumptions
  Output: gradually relevant content, invitations, and resources

### Engine 7 — Community Health Intelligence Engine
How KinfolkAI assesses and communicates community health.
  See: docs/trade-secrets/COMMUNITY_HEALTH_INTELLIGENCE_ENGINE.md
  Rule: capacity-framing only; no stereotypes; no crime data; configurable
        weights; pattern threshold before any signal surfaces

### Engine 8 — Community Opportunity Intelligence Engine
How KinfolkAI identifies gaps and connections across entire communities.
  Inputs: aggregated professional shortage signals, job market data,
          volunteer gap signals, community organization needs
  Outputs: opportunity surface for members, businesses, and organizations
  Rule: aggregated trends only; no individual profiling
  Phase: 9 (future-state; design only at this stage)

---

## Partnership Intelligence (Internal)
How KinfolkAI identifies opportunities for businesses to collaborate.
  Inputs: service complementarity, community proximity, member overlap
  Output: warm introduction suggestion (not automatic connection)
  Rule: member permission required before any introduction is made

---

## Ecosystem Orchestration Logic (Internal)
How all eight engines interact to produce coherent, non-conflicting outputs.
  Rule: Community Understanding Engine gates all other engines
        (no recommendation is made without a community context)
  Rule: No two engines may make conflicting recommendations to
        the same member in the same session
  Rule: Life Season Engine informs feed weighting across all other engines
  Rule: Community Reciprocity Engine fires only after a minimum
        value-received threshold (TBD) and appropriate time interval

---

## Trust Calculation Architecture (Internal)
How KinfolkAI weights member contributions in community signals.
  Trust levels: 0–4 (existing lib/db/src/trust.ts framework)
  Contribution weight: higher trust levels carry more signal weight
  Rule: trust weighting is never displayed to members; it is an internal
        signal only
  Rule: lower trust ≠ exclusion; it means lower weight in aggregation

---

## Recommendation Methodology (Internal)
The full recommendation stack, in order of priority:
  1. Member's stated preferences (highest weight)
  2. Member's observed engagement (recency-weighted)
  3. Community Understanding (season-aware)
  4. Mirror Twin patterns (aggregate only)
  5. Verified community signals (Tier 1 quality)
  6. Community trend signals (Tier 2 quality)
  No paid promotion may override items 1–4.
  Paid promotion may appear alongside items 5–6 with disclosure.

---

## What Is Publicly Disclosable

  The mission sentence
  The seven constitutional principles (Community Intelligence Constitution)
  The five Community Health Profile dimensions (names only, not weights)
  The existence of Life Journeys and Life Seasons
  The Community Growth Model (Member → Ambassador progression)
  The Community Reciprocity concept (description only)
  The "Community Understanding" language standard

## What Is NEVER Publicly Disclosable

  Mirror Twin model methodology
  Weighting formulas or percentages
  Confidence tier thresholds
  Pattern corroboration thresholds
  Trust level weighting in recommendations
  Ecosystem orchestration priority logic
  Partnership matching criteria
  Signal selection criteria for Community Health
  Bias prevention threshold values
  Opportunity detection gap criteria

---

## Document Lineage

Derived from founder vision sessions conducted July 26, 2026.
Classified as a trade secret of Mapping With Melanin™.

Related documents (all CONFIDENTIAL):
  docs/trade-secrets/COMMUNITY_HEALTH_INTELLIGENCE_ENGINE.md
  docs/trade-secrets/IP_FRAMEWORK.md
