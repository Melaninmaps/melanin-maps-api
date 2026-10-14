# Kinfolk Approved Visual Implementation — Phase 1

## Objective

Apply the founder-approved Kinfolk visual system to the **actual native conversation** and **business-recommendation** surfaces on a dedicated branch based on native `main` after PR #276. This is a visual refinement only: no new capability, route, API request, persistence, permission, navigation, demo data, or product workflow is introduced.

## Approved reference and baseline

- **Authoritative visual reference:** `/home/ubuntu/handoffs/KINFOLK-APPROVED-VISUAL-REPRODUCTION-HANDOFF.md`
- **Published preview reference commit:** `cf1f6744c3d4cad65a15b3d1e9bdf591741a831e`
- **Native baseline:** `97bdac151ab0fce6e2c001f9c3c1ef07921ece7d` (`main`, including PR #276)
- **Working branch:** `feature/kinfolk-approved-visual-phase1`

## Boundaries

1. Touch only the existing Kinfolk conversation and business-recommendation presentation surfaces:
   - `artifacts/mobile/components/AIChatWidget.tsx`
   - `artifacts/mobile/components/KinfolkBusinessRecommendationSheet.tsx`
   - Existing `BusinessCard` / `BusinessPreviewModal` only if a visual consistency adjustment is strictly necessary.
2. Preserve exact interaction contracts: chat and preference requests, voice recording/transcription/playback, image/document paths, memory consent, task saves, settings navigation, recommendation selection, business profile navigation, app tabs, and business data/image precedence.
3. Preserve all real business image URLs. Existing gold category fallback visuals remain only for businesses without images.
4. Do not modify Discover, business profile, owner dashboard, Safety Hub, Settings behavior, tabs, API routes, data schemas, membership/referral logic, authentication, or integrations.
5. Do not install dependencies, create a mobile build, merge, deploy, or alter any active workstream.

## Design approach

### Visual movement
A **warm, calm conversational utility** surface: Mapping With Melanin’s espresso and cream foundation, gold for decisions, and restrained community green for supportive status—not a new app architecture.

### Core presentation decisions

- Use the actual Mapping With Melanin icon and logo assets already introduced by PR #276; never recreate the mark with letters or typography.
- Keep Inter as the native type system. Use readable sizes, generous 12–16px internal rhythm, 44px-or-greater practical touch targets, and compact upper-label treatment only where it does not duplicate or obscure functional text.
- Give member messages a clear espresso identity, Kinfolk replies a warm paper surface with a subtle espresso shadow, and attachments an explicit member-sent label/frame.
- Keep action, recommendation, task, source, consent, and typing states visually distinct while retaining their existing rendering and event handlers.
- Use the existing native bottom-sheet structure: clear drag handle, close affordance, readable hierarchy, actual business imagery first, and gold category fallback art when imagery is absent.

### Project structure

| Path | Responsibility in Phase 1 |
|---|---|
| `components/AIChatWidget.tsx` | Kinfolk launcher, conversation modal, message hierarchy, typing, attachment and inline-action visual refinement without request/control changes |
| `components/KinfolkBusinessRecommendationSheet.tsx` | Native recommendation sheet visual hierarchy, category fallback presentation, action layout and accessibility treatment without route or link changes |
| `components/BusinessCard.tsx` | Existing business-image precedence and category fallback reference; modify only if required to match the sheet treatment without changing events |
| `components/BusinessPreviewModal.tsx` | Existing native-style destination sheet reference; modify only if required to keep the recommendation sheet visually aligned without changing functionality |
| `components/BusinessCategoryVisual.ts` | Existing Feather fallback category mapping; no semantic/data change |
| `scripts/verify-kinfolk-layout.mjs` | Existing contract guard; expand only if a Phase 1 visual entry point needs a regression token check |

## Diagnostics note

The workspace is an isolated ordinary-Sandbox Git worktree rather than an attached Webdev project. Host-managed `runtime/post-edit` diagnostics are unavailable for this worktree (`No active project for post-edit processing`), so existing project TypeScript and focused static/runtime checks will be used instead. No separate LSP process will be started.
