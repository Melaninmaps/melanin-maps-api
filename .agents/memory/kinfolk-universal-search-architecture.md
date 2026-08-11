---
name: Kinfolk Universal Search & Evidence Architecture
description: All architecture specs for Kinfolk as a universal domain-aware search companion. All docs saved to docs/architecture/ on 2026-08-11. Priority order confirmed by founder.
---

# Kinfolk Universal Search Architecture — Filed 2026-08-11

## Implementation Priority (founder-confirmed 2026-08-11)

1. **Business Page Recovery** — mirror July 11 2026 2:00 AM build exactly (Task #240)
2. **Library evidence gap** — 125 empty topics, Phuket dedup, source join bug (Task #255)
3. **Kinfolk Universal Router** — intent classification + live web + citations (Task #256)
4. **Privacy firewall** — sensitive queries never surface in Circles/recommendations (Task #257)
5. **City readiness registry** — proactive tour-city prep, search-to-brick pipeline (not yet tasked)
6. **Adaptive tone & delivery** — explicit delivery profiles, age-safe routing (not yet tasked)

## Documents in docs/architecture/ (13 files total)

| File | Phase |
|---|---|
| KINFOLK_UNIVERSAL_SEARCH_ARCHITECTURE.md | All phases — product definition |
| KINFOLK_CONCEPTUAL_GAP_ANALYSIS.md | All phases — gap analysis, confirms priority |
| KINFOLK_SEARCH_ROUTER_CONTRACT.md | Phase 1 — Router HTTP contract |
| KINFOLK_EVIDENCE_SCHEMA.md | Phase 2 — DB schema for evidence system |
| KINFOLK_ADAPTIVE_DELIVERY_RULES.md | Phase 2 — delivery profiles spec |
| KINFOLK_TOUR_CITY_READINESS.md | Phase 3 — city readiness model |
| BUSINESS_PAGE_RECOVERY_BRIEF.md | Priority 1 — business page mirror brief |
| kinfolk-universal-search-router.reference.ts | Phase 1 — reference implementation |
| kinfolk-adaptive-tone-and-audience-filter.reference.ts | Phase 2 — reference implementation |
| kinfolk-universal-search-evidence.migration.sql | Phase 2 — DB migration (needs RLS adaptation) |
| kinfolk-tour-city-readiness-search-to-brick.migration.sql | Phase 3 — DB migration (needs RLS adaptation) |
| library-missing-source-topics-2026-08-11.csv | Phase 0 — 125 unsourced topics |
| library-phuket-source-inspection-sql.md | Phase 0 — Phuket SQL runbook |

## Critical RLS Warning
Both SQL migrations use Supabase `auth.uid()` syntax. Railway runs plain PostgreSQL.
Before running either migration: strip all `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`,
and `auth.uid()` references, or replace with app-layer auth checks.
The tables themselves are safe — only the RLS blocks need adaptation.

## Current system gap (confirmed by architecture review 2026-08-11)
The Library is a TOPIC SYSTEM, not a knowledge engine. Kinfolk's effective pipeline is:
  User → buildSystemPrompt (15 data sources, metadata only) → gpt-4o-mini → answer
The Library sits beside Kinfolk, not inside it. Source content never reaches the model.
The flywheel breaks at the enrichment step: reviews, posts, contributions don't feed Kinfolk.

## Core principle
Every search can be a brick for the next person, but it is never a brick made out of somebody else's private life.

**Why:** The flywheel requires community signals to improve future answers, but personal/sensitive searches must remain private. The search-to-brick pipeline (governed aggregate demand → research task → moderated Library candidate) is the architectural solution.

**How to apply:** Before any Kinfolk feature that stores or reuses a user's query, ask:
1. Is this sensitive/high-consequence? → ephemeral only, no storage
2. Is this a non-sensitive pattern with k≥10 distinct users? → aggregate demand signal only
3. Has it passed source-policy review? → Library candidate, then moderated publish
