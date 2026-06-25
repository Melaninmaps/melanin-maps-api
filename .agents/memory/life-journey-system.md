---
name: Life Journey System
description: Life Journey feature — DB tables, API routes, KinfolkAI injection, mobile screen.
---

## DB Tables
- `life_journeys` — userId, journeyType (enum 8 types), title, city, state, status, phases (JSONB JourneyPhase[]), aiContext, kinfolkSessionId
- `entity_connections` — fromId/fromType/toId/toType/connectionType/strength/label; unique on (fromId, toId, connectionType)
- Both exported from lib/db/src/schema/index.ts

## Journey Types
moving, new-baby, career-change, new-to-city, retirement, getting-married, starting-business, college
Each type has a predefined phase template in journeys.ts JOURNEY_TEMPLATES.

## API Routes (all in artifacts/api-server/src/routes/journeys.ts)
- POST /journeys — AI generates phases via GPT-5.1, returns Journey
- GET /journeys — list user's journeys
- GET /journeys/:id — single journey
- PATCH /journeys/:id/step — toggle a step completion, auto-advances phases
- PATCH /journeys/:id/phase-status — manual phase status override
- DELETE /journeys/:id — soft delete
- GET /journeys/types/list — static list of journey types (no auth needed)

Entity connections in artifacts/api-server/src/routes/entity-connections.ts:
- POST /connections/entity — upsert connection
- GET /connections/entity/:id — get connections for an entity (from OR to)
- DELETE /connections/entity/:connectionId

## KinfolkAI Injection
- buildSystemPrompt() in kinfolk.ts now accepts optional `activeJourney` param
- Chat handler fetches most recent active journey for the authenticated user before building prompt
- journeySection injected after savedSection in system prompt — gives KinfolkAI full phase+step awareness
- **Why:** Journey context must survive across separate chat sessions; injecting into every prompt is the right approach since KinfolkAI has no other cross-session state mechanism

## Mobile Screen
- artifacts/mobile/app/life-journey.tsx — 3 views: list, create (journey type picker + city + description), detail (phase/step checklist)
- authHeaders() helper avoids TS union type error with fetch headers
- Optimistic step toggle with server reconciliation
- KinfolkAI deep-link button in detail view navigates to /travel
