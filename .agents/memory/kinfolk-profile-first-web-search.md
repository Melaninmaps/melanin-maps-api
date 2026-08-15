---
name: Kinfolk profile-first web search
description: Architecture, module locations, and integration rules for the Manus-authored lens-planner + Tavily web search layer inside KinfolkAI.
---

# Kinfolk profile-first web search

## What it is
A community-first web search layer that builds a query plan from the member's voluntary `diasporaCountries` lens BEFORE calling Tavily or the LLM. Adapted from a Manus-authored starter package.

## Module locations
- `artifacts/api-server/src/kinfolk/lens-planner.ts` — `buildMemberProfile()`, `buildSearchPlan()`, `activeLensDisclosure()`, `urgentHealthMessage()`
- `artifacts/api-server/src/kinfolk/web-search.ts` — Tavily adapter; returns `[]` gracefully when `TAVILY_API_KEY` absent
- `artifacts/api-server/src/kinfolk/web-ranker.ts` — credibility 50% + community relevance 40% + personalization 10%
- `artifacts/api-server/src/kinfolk/resource-library.ts` — `REVIEWED_LIBRARY` (6 cards), `ENTITY_INDEX` (Michelle Williams, Beyoncé, Diana Ross), `findReviewedResources()`, `findEntityCandidates()`
- `artifacts/api-server/src/__tests__/kinfolk-lens-planner.test.ts` — 25 vitest tests

## Integration point in kinfolk.ts
Runs after health retrieval (line ~2658), before system prompt build. Block label: `// ── Profile-first web search (Kinfolk lens layer)`.

## Response fields added
- `lensDisclosure` — "Searched with your Kinfolk lens first: …" — show to member, editable
- `resourceCards[]` — reviewed external resources (eczema gallery, CDC, etc.) — show below answer
- `entityCandidates[]` — culture-first disambiguation options — show as a picker before answering
- `urgentSafetyMessage` — pregnancy/danger immediate-care notice — show ABOVE answer, high-contrast

## Key rules
- **Never auto-publish** a resource from click data — `feedback.ts` proposal system requires human editorial review before a URL enters the library
- `ENTITY_INDEX` candidates must NEVER be merged — always present as separate options
- Live Tavily search only runs when `process.env.TAVILY_API_KEY` is set — the rest (planner, ranker, library, entity) runs without it
- `diasporaCountries` is the ONLY input to lens construction — never infer race, ethnicity, or medical condition

**Why:** Community-primary queries before any LLM call means the cultural lens shapes what the model sees, not just how it frames an answer after the fact.

**How to apply:** Any health/image/entity query through `POST /kinfolk/chat` is eligible. The `LENS_ELIGIBLE_INTENTS` set and regex gate in kinfolk.ts controls when the block fires.
