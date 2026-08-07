---
name: Cross-Platform Parity Principle
description: LOCKED DECISION — every feature on mobile must exist on web in the same or immediately following build. ONE ACCOUNT. ONE EXPERIENCE. EVERY PLATFORM.
---

# Cross-Platform Parity — LOCKED PERMANENT REQUIREMENT

**Status:** LOCKED DECISION. Cannot be deferred or deprioritized.

## The Rule
Every feature that ships on mobile must ship on web in the same build or the immediately following build. Web is never more than one build behind mobile. The website IS the full product — not a marketing page, not a lesser version.

**Why:** When someone scans the QR code on tour (Aug 15, Charlotte etc.), they land on the WEBSITE first, not the App Store. That page IS the first impression.

## Source Document
`docs/MWM-Cross-Platform-Parity-Principle.pdf`

## Phase 1 Status (Before Tour — Build 103)
| Requirement | Status |
|---|---|
| API search returns results on web | ✅ DONE (this session) |
| Interactive map with pins on web | ✅ DONE (this session) |
| Business card full description | ✅ Done (business-detail.tsx) |
| Business card — star-rated review system | ✅ Done (business-detail.tsx) |
| Business card — Save button | ✅ Done |
| Business card — Share button | ✅ Done |
| Business card — "What stands out?" tags | ❌ MISSING on web |
| Business card — Endorse flow | ❌ MISSING on web |
| Business card — Vibe Check | ❌ MISSING on web |
| Business card — Hidden Gem nomination | ❌ MISSING on web |
| Business card — Community insights | ⚠️ Partial (safety stats only) |
| Profile — real name/photo/saved places | ✅ Done |
| Profile — badges | ⚠️ Partial (some states hardcoded false) |
| Profile — review count | ⚠️ Shows "—" not real count |
| KinfolkAI full chat (not just widget) | ✅ Done (/travel page, 675 lines) |
| Safety Hub | ✅ Exists (informational; interactive survey partially missing) |
| Living Legacy / city stories | ⚠️ city-spotlight.tsx is closest; no dedicated Living Legacy page |
| Same API endpoints web + mobile | ✅ One backend serves both |

## Phase 2 (Build 104-105)
- "What stands out?" tags on web — ❌
- Endorse ("Put your people on") — ❌  
- Living Legacy dedicated pages — ❌
- Full Safety Hub interactive features — ⚠️

## Cross-Platform Sync (Always Required)
- Review on web → appears on mobile immediately (same DB)
- Save on mobile → appears in Saved Places on web (same DB)
- Badge earned on mobile → shows on web profile
- Profile updated on web → reflects on mobile
- Endorse on mobile → count updates on web
- Privacy settings on web → apply on mobile

## Verification Test (Founder runs after each build)
1. Leave review on WEBSITE → open MOBILE → verify review appears
2. Save business on MOBILE → open WEBSITE → verify in Saved Places

**How to apply:** Before marking any build complete, check this table. If a mobile feature exists and the web equivalent is ❌, it must be added to scope before shipping.
