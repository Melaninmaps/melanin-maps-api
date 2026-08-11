# Kinfolk Tour City Readiness & Cumulative Learning Model

## Purpose

Kinfolk should make planned tour cities ready **before** a local tester arrives, while letting aggregate, privacy-safe tester behavior improve the city after launch. The city model must not rely on personal profiling, private search history, or a tester’s identity.

> **City readiness is a product operation, not a side effect of one user’s prompts.**

If Shawn from Los Angeles joins the tester group, the platform already recognizes Los Angeles as a launch/tour market from the product roadmap. Shawn’s participation can validate the experience and contribute only consented, de-identified aggregate demand; it must not cause Kinfolk to narrate or expose Shawn’s activity.

## 1. City Readiness Registry

Each planned market receives a managed readiness record.

```text
city_readiness_profiles
- city_id / canonical_city / region / country
- lifecycle: planned | research | seeded | tester_ready | launch_ready | maintained
- tour_priority: integer
- target_launch_window
- owner/researcher assignment
- evidence_coverage_score
- business_coverage_score
- cultural_coverage_score
- safety_resource_score
- search_alias_score
- community_readiness_score
- kinfolk_acceptance_score
- overall_readiness_score
- readiness_blockers (structured JSON)
- last_audited_at
- last_refreshed_at
```

The registry is the source of truth for tour status. It is not a user profile and should never be populated from a single user’s private search behavior.

## 2. City Readiness Gates

A city becomes **tester-ready** only after it meets the minimum gates below. A city becomes **launch-ready** only after passing the acceptance suite and a founder/product-owner review.

| Gate | Tester-ready minimum | Launch-ready minimum |
|---|---|---|
| Business discovery | Core categories seeded and searchable; zero-result nomination path works. | Breadth across food, beauty, health, faith, culture, professional services, family, and nightlife where applicable. |
| Cultural context | City profile, neighborhoods, aliases, cultural sites, and key local terms exist. | Reviewed local context plus current event/cultural-source refresh policy. |
| Library evidence | Priority destination and safety topics are transparently marked if sources are pending. | Priority topics contain direct, verified sources; parent context is not misrepresented as child-topic evidence. |
| Search quality | Common city, neighborhood, and category aliases work. | Search acceptance battery passes, including ambiguous terms and local terminology. |
| Safety resources | Official emergency and travel/safety source routing is configured. | Age-aware alert eligibility and trusted-resource pathways tested. |
| Kinfolk evaluation | Basic city prompt receives a graceful, sourced answer. | Discovery, culture, current-info, and zero-result prompts pass with provenance labels. |
| Community pathways | Contribution and business-nomination routes exist. | Moderation queue, aggregate demand thresholds, and local outreach workflow are active. |

## 3. The Search-to-Brick Pipeline

Every search earns value only through a governed outcome. Raw user prompts never become published Library facts.

```text
private user question
  ↓
router assigns intent + source policy + privacy boundary
  ↓
answer is delivered with provenance and optional depth
  ↓
post-answer evaluator chooses ONE safe outcome:
  ├─ ephemeral only (default for sensitive / one-off searches)
  ├─ anonymous aggregate demand signal (after threshold)
  ├─ city readiness research task
  ├─ business/category nomination or outreach task
  └─ reviewable Library evidence candidate
  ↓
moderation / source-policy validation / human review when required
  ↓
verified Library, city catalog, or aggregated demand update
  ↓
better future answer for the next member
```

## 4. Signal Classification

| Signal | Example | What may happen | What must never happen |
|---|---|---|---|
| Private, sensitive search | IVF, HIV, divorce, immigration question | Private answer only; optionally private resource save if the member explicitly requests it. | No City task, notification, Circle signal, business inference, or aggregate demand until strict anonymization and policy allow it. |
| General cultural question | “Who is the best rapper from Philadelphia?” | Improve synonym/intent evaluation or cultural-topic coverage if evidence gap is detected. | Do not treat the question as a personal identity or political preference. |
| Local zero-result discovery | “Fruit Pebble waffles near me” | After a configurable multi-user threshold, create a city/category demand task and optional business/creator outreach workflow. | Never tell businesses who searched, expose individual locations, or notify a user merely because another person searched. |
| Business experience | “Great bedside manner” review for a doctor | Moderated, aggregate community experience for discovery; possible reviewable evidence. | Never transform into medical safety proof or professional credential verification. |
| Current information | Visa rules, weather emergency, event time | Current authoritative research task; cite and expire result. | Do not store a temporary policy fact permanently without review/freshness controls. |

## 5. Aggregate Demand Thresholds

Demand signals must be de-identified, rate-limited, and thresholded.

```text
A signal may be eligible only when all conditions are true:
1. Query is non-sensitive under the Router policy.
2. Demand is measured at a coarse geography (city/neighborhood bucket, never precise coordinates).
3. At least k distinct members search the same normalized intent inside a defined window.
4. No single household, Circle, or device contributes more than one qualifying count.
5. The resulting signal cannot identify a person or reveal protected/sensitive intent.
6. The city has an allowed business/creator/outreach pathway.
```

Start conservatively. A recommended initial threshold is a product-configured `k >= 10` unique, non-sensitive users in a city-level bucket. Replit should not hard-code this figure; the founder/admin should control thresholds and rollout by city.

## 6. Tour-City Proactive Research

Planned cities should have a recurring, reviewable research queue—not autonomous publishing.

```text
For each city where lifecycle in (planned, research, seeded):
  1. Run category coverage audit against launch taxonomy.
  2. Run Library source-coverage audit for priority topics.
  3. Generate candidate business/cultural-site research tasks from reputable sources.
  4. Validate records, source mappings, operating status, and entity geography.
  5. Seed only verified/approved records.
  6. Run Kinfolk acceptance prompts.
  7. Publish City Readiness report to internal dashboard.
```

A planned city therefore improves even with zero testers. Testers improve it further through safe, aggregate validation and contribution pathways.

## 7. Tester-Driven Validation, Not Tester Surveillance

A tester may opt in to a lightweight, non-sensitive testing mission such as:

- test a business search;
- confirm a category’s relevance;
- report a bad result or closed business;
- submit a community vibe or accessibility observation;
- identify a missing local business;
- flag an unhelpful Kinfolk answer.

The product should record the **test outcome**, not a hidden behavioral dossier. Personal searches remain private unless the member intentionally submits a contribution or chooses an approved research/save action.

## 8. City-Specific Evaluation Suite

Each city needs a versioned acceptance set, not only generic prompts.

| Prompt class | Example for Los Angeles | Required behavior |
|---|---|---|
| Business discovery | “I need a braider in LA for knotless braids.” | Correctly normalize intent, return MWM listings when available, label provenance, and offer a non-dead-end nomination path if coverage is weak. |
| Culture | “What Black cultural sites should I visit in LA?” | Return verified cultural sites plus clearly labeled contextual sources. |
| Professional/high stakes | “Where can I find an OB-GYN in LA?” | Search health-professional directory safely; never make medical quality claims from community anecdotes. |
| Current information | “What is happening in LA this weekend?” | Use current, dated sources; cite; declare uncertainty if verification fails. |
| Zero-result | “Fruit Pebble waffles in LA.” | Show relevant alternatives, invite nomination, and potentially produce only aggregate, thresholded demand data. |
| Privacy | “Tell me about fertility treatment.” | Private authoritative path only; no local or Circle personalization unless explicitly requested. |

## 9. City Readiness Status API

```http
GET /api/admin/city-readiness?city=Los%20Angeles
```

A response should contain operational coverage and blockers—not private member data:

```json
{
  "city": "Los Angeles",
  "lifecycle": "tester_ready",
  "scores": {
    "businessCoverage": 72,
    "culturalCoverage": 68,
    "evidenceCoverage": 41,
    "searchAliasCoverage": 85,
    "safetyResourceCoverage": 80,
    "kinfolkAcceptance": 67
  },
  "blockers": [
    "Travel Library child topics lack direct verified sources",
    "OB-GYN category has insufficient verified coverage"
  ],
  "nextResearchTasks": [
    "Validate Black cultural sites",
    "Seed reviewed health-professional directory records"
  ],
  "privacy": {
    "memberSearchesIncluded": false,
    "aggregateSignalsOnly": true
  }
}
```

## 10. Non-Negotiable Safeguards

1. **No automatic fact publishing.** A search or model answer is not a Library fact.
2. **No city readiness based on private user behavior alone.** Tour priority comes from the roadmap; aggregate signals can prioritize approved tasks only.
3. **No sensitive demand markets.** Medical, fertility, divorce, immigration, financial distress, and trauma do not trigger business/creator outreach or public city signals.
4. **No unverified safety claims.** Community reports are separated from official/current alerts and must never be presented as confirmed facts.
5. **No blanket notifications.** Proactive notices require consent, audience eligibility, source quality, age policy, geography permission, and frequency control.
6. **No destructive build.** City-readiness work is additive; it must not alter login, existing map rendering, core business flows, or existing safety reporting.

## The Product Principle

> **Every search can be a brick for the next person, but it is never a brick made out of somebody else’s private life.**
