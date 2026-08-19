---
name: Kinfolk Diaspora-First Research — system instruction + query builder
description: The authoritative spec for how Kinfolk constructs research queries and what must be in the system prompt. Never remove these rules.
---

# Kinfolk Diaspora-First Research — Permanent Rules

**Source document:** "Kinfolk AI — Diaspora-First Research System Instructions and Persistent Memory" (attached by founder Aug 19 2026).

## The Rule (never remove or weaken)

Kinfolk research is diaspora-first by default. Before web search or source retrieval, the server must construct a research query that puts the relevant diaspora/community context before the topic:

| Topic type | Default prefix |
|---|---|
| Health, wellness, maternal, beauty, hair, medical access | "Black women {topic}" |
| STEM, education | "Black women {topic}" |
| Legal, housing, career, family, travel | "Black community {topic}" |
| Local business, culture, nightlife, services | "Black-owned {topic} {place}" or "Black community {topic} {place}" |
| Member names another diaspora/population | Honor their exact wording |
| Member says "general research" | No prefix — preserve as-is |

## Identity and Memory Boundary (never remove)

A search term is NOT identity disclosure. Never infer, assert, or permanently store race, ethnicity, gender, health condition, sexuality, religion, or immigration status from a query, lens selection, or topic. The diaspora-first rule changes retrieval only. It never creates a member profile fact.

## What lives where

- **System prompt block** — "PRIMARY RESEARCH RULE — DIASPORA FIRST — NON-NEGOTIABLE" is injected into `buildSystemPrompt()` in `artifacts/api-server/src/routes/kinfolk.ts` right after the opening identity paragraph.
- **Deterministic query builder** — `buildDiasporaFirstQuery(ResearchContext)` in `artifacts/api-server/src/kinfolk/diasporaFirstResearchPolicy.ts`. This is the enforcement layer; the system prompt reinforces the intent but this function enforces it before every Tavily call.
- **Legacy compat** — `buildDiasporaFirstResearchQuery` (old signature) still exported for `prepareResearchPlan.ts`; new code uses `buildDiasporaFirstQuery`.
- **Version** — `KINFOLK_PERMANENT_RESEARCH_LENS.version` bumped to "2.0.0" when the expanded TopicDomain (stem, education, business, culture, local_services) was added.

## Community Intelligence rule (same file, same standard)

Use "Community Intelligence" and "community-sourced context," never "Community Safety." Never infer or calculate that a place is safe or unsafe because of race, ethnicity, minority presence, or diversity. This lives in the system prompt SAFETY LANGUAGE STANDARD block AND in the PRIMARY RESEARCH RULE block.

## Acceptance checks (run before every Kinfolk release)

1. "heart disease" → research query begins "Black women heart disease"
2. "STEM opportunities in Charlotte" → query begins "Black women STEM opportunities Charlotte"
3. Member selects "general research" → no population prefix
4. Member names another diaspora → their exact language used
5. No race/ethnicity/health stored from the search alone
6. Sensitive topics offer subject clarification + skip option
7. Kinfolk never emits "Community Safety" or demographic-based safety claims
8. Local professional results only appear after explicit member acceptance
9. All research enters the Living Library with topic/facet tags
10. Browser/mobile clients cannot bypass the server query-builder policy

**Why:** The diaspora-first lens is a product philosophy commitment, not a prompt suggestion. A retrieval system that defaults to majority-population research sources systematically under-serves the community Kinfolk exists for.

**How to apply:** Any new Kinfolk feature that touches web search, source retrieval, or knowledge lookup must import `buildDiasporaFirstQuery` and apply it before the provider call.
