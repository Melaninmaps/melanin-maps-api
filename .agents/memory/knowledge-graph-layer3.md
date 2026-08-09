---
name: Knowledge Graph Layer 3 — Kinfolk wiring
description: Layer 3 implementation complete: getKnowledgeGraphContext() retrieves structured graph context for Kinfolk; wired into buildSystemPrompt. Proof tests passed.
---

## What was built

`artifacts/api-server/src/lib/knowledge-graph-context.ts` — new file.

- `getKnowledgeGraphContext(userMessage, geographyRef)` — keyword intent detection → graph node resolution → parallel fetch of sources + entities + relationships → returns `KnowledgeGraphContext` (structured, never raw text).
- `renderKnowledgeGraphContext(ctx)` — formats the structured context into a clearly-delimited system prompt section with tier labels, entity blocks, Big Cousin opportunity, and explicit "EMPTY TIERS — DO NOT INVENT" warnings.
- Wired into `kinfolk.ts`: called in the chat handler before `buildSystemPrompt`; result passed as `knowledgeGraphContext` parameter; rendered as `${knowledgeGraphSection}` at the TOP of the assembled system prompt (before city context, profile, etc.).

## Data corrections completed (same session)

- `cultural_sites.description` for Mother Bethel AME: now correctly distinguishes congregation founding (1794) from denomination organization (1816) from current building (1890).
- `library_entity_connections.entity_label` for all 3 Mother Bethel connections updated to be consistent with the corrected description.
- `knowledge_sources` table: added `evidence_section TEXT`, `confidence TEXT CHECK (IN ('verified','high','medium','low','unverified'))`, `retrieved_at TIMESTAMPTZ`.
- Both existing source rows updated with claim-to-source alignment metadata (Smithsonian: confidence=high; Du Bois: confidence=verified).
- Startup migration `knowledge_sources_claim_columns_v1` added (migration #75 on Railway).

## Permanent rules established this session

- **Conflicting dates rule**: distinguish every milestone by its specific meaning — congregation founding ≠ denomination founding ≠ building construction date.
- **Claim-to-source alignment rule**: a reputable source URL is not sufficient. The cited page must support the specific claim. Use `confidence` to be honest about the gap.
- **Community/Ambassador tiers**: NEVER seeded as structural fixtures. Only populated from real member or Ambassador content. `renderKnowledgeGraphContext` emits explicit `[EMPTY TIERS — DO NOT INVENT]` warnings.
- **Layer 3 non-blocking**: `getKnowledgeGraphContext` errors are caught silently; Kinfolk always responds even if graph context is unavailable.

## Proof test results (all passed)

- Turn 1 "Tell me about Philadelphia" → geography node resolved with description.
- Turn 2 "What was important in Black history here?" → Philadelphia Black History topic, 2 sources (authoritative+professional), Mother Bethel as connected entity.
- Turn 3 "Where should I go tonight?" → Philadelphia Nightlife topic found (published, 0 sources — honest empty).
- Turn 4 "What is the housing market like?" → Philadelphia Real Estate topic found.
- Big Cousin test: Philadelphia Black History → Philadelphia Faith cross-link (weight 0.9); Mother Bethel bridges both topics with correct entity labels across all 3 topic connections.

## Intent detection keywords (Phase 1 — grows as graph grows)

6 topic patterns defined in `TOPIC_INTENT_PATTERNS`. Layer 4 replaces with semantic resolution. Cap: 2 topics per message to keep system prompt tight.

## Railway deploy status

NOT pushed — held pending Layer 3 proof acceptance (as agreed). Push when authorized.

**Why:**
Prevents Railway from serving stale bundle while source and startup migrations are mid-session. Standard two-commit push protocol applies when authorized.
