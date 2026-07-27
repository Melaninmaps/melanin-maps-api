---
name: Launch Backlog
description: Durable, prioritized backlog of work intentionally postponed to protect VC67 scope. Covers launch-critical blockers, first post-launch update, and growth roadmap.
---

# Mapping With Melanin™ — Launch Backlog

Last updated: July 23, 2026. This is the persistent source of truth for deferred work. Do not mark planned items as implemented.

---

## Launch-Critical — Before Public Release

### LC-001 Android authentication false-failure fix
- **Status:** ✅ Implemented (July 23, 2026 session)
- **Priority:** P0
- **Dependencies:** None
- **Platform impact:** Shared (iOS + Android); most visible on Android
- **Build required:** Yes — included in VC67
- **Source:** P0 audit session July 23, 2026; auth.tsx loginWithEmail + signup.tsx handleSubmit

### LC-002 Android white-map — Google Cloud Console correction
- **Status:** Blocked — awaiting founder action in Google Cloud Console
- **Priority:** P0
- **Dependencies:** Founder must verify/update Maps SDK, billing, and SHA-1 restriction
- **Platform impact:** Android only (iOS uses Apple Maps via PROVIDER_DEFAULT)
- **Build required:** No code change needed. Google Cloud config change only. VC67 picks up the fix automatically if key authorization is corrected before build.
- **Source:** Workstream B audit July 23, 2026

### LC-003 Android regression testing (VC67)
- **Status:** Planned — cannot begin until VC67 is built
- **Priority:** P0
- **Dependencies:** LC-001, LC-002, build authorization
- **Platform impact:** Android
- **Build required:** Yes — VC67 must be installed on physical Android device
- **Testing checklist:** New registration → /profile-setup; email login → /(tabs); logout + re-login; close/reopen session; map tiles visible; businesses load; KinfolkAI responds; account deletion error handling
- **Source:** VC67 release gate

### LC-004 Production monitoring — /api/readyz
- **Status:** Planned — PR #13 (phase1-backend-stability) not yet merged to Railway
- **Priority:** P1
- **Dependencies:** PR #13 merge to Railway
- **Platform impact:** Server only. No mobile rebuild.
- **Build required:** Railway deploy only
- **Source:** July 21 pool exhaustion incident; replit.md Connection Pool/Deployment Rule

### LC-005 App Store and Google Play release readiness
- **Status:** Partially complete — VC66 on internal testing; iOS Build 95 pending Apple review response
- **Priority:** P0
- **Dependencies:** LC-001, LC-002, LC-003
- **Platform impact:** Both platforms
- **Build required:** VC67 (Android); iOS Build 96+ pending
- **Source:** Post-build-95 roadmap

### LC-006 Legal pages and account deletion verification
- **Status:** Partially implemented — privacy policy, terms, support pages live on web; account deletion error handling improved in VC67
- **Priority:** P1
- **Dependencies:** None
- **Platform impact:** Web (live), Mobile (settings.tsx change in VC67)
- **Build required:** Mobile change included in VC67
- **Source:** Apple App Store review requirements; GDPR/CCPA compliance

### LC-007 Phase 1 backend stability (PR #13 merge to Railway)
- **Status:** Code on branch `phase1-backend-stability` — NOT merged
- **Priority:** P1
- **Dependencies:** None (server-side only)
- **Platform impact:** Server only. Adds /api/readyz, graceful shutdown, improved connection pool management
- **Build required:** Railway deployment only
- **Source:** July 21 pool exhaustion post-mortem; replit.md Connection Pool/Deployment Rule

---

## First Post-Launch Update

### PL-001 Contextual inclusive-language cleanup
- **Status:** Audited — language rule documented in memory (inclusive-language.md)
- **Priority:** High
- **Dependencies:** None
- **Platform impact:** Shared — affects copy in placeholders, onboarding, KinfolkAI prompts, seed data
- **Build required:** Mobile build for copy changes; server deploy for API copy
- **Source:** replit.md Platform Language Rule; inclusive-language.md memory; post-build-95-roadmap.md
- **Note:** Rule is contextual, not a blanket removal. "Black-owned" appropriate when verified or user-chosen; generic copy uses "minority-owned" / "community businesses."

### PL-002 HBCU flagship experience
- **Status:** Planned — detailed spec in post-build95-roadmap.md memory
- **Priority:** High (flagship feature)
- **Dependencies:** PL-001 (language audit), design approval
- **Platform impact:** Shared (mobile map + library)
- **Build required:** Mobile build
- **Source:** post-build95-roadmap.md; founder direction
- **Scope:**
  - Compact horizontal card strip on map tab and library
  - Nearby and featured HBCUs (GPS + curated)
  - School colors and imagery on cards
  - Historic significance and founding year
  - "Explore Campus" CTA
  - Save and directions integration
  - Homecoming calendar

### PL-003 Layout and visual consistency improvements
- **Status:** Planned
- **Priority:** Medium
- **Dependencies:** Design approval
- **Platform impact:** Shared
- **Build required:** Mobile build
- **Source:** post-build95-roadmap.md; full design pass intent

### PL-004 Improved loading, empty, and error states
- **Status:** Planned
- **Priority:** Medium
- **Dependencies:** None
- **Platform impact:** Shared
- **Build required:** Mobile build
- **Source:** General UX audit intent

### PL-005 Onboarding refinements (name confirmation, DOB enforcement)
- **Status:** Partially audited — DOB required by server but optional on client; profile-setup flow exists
- **Priority:** Medium
- **Dependencies:** None
- **Platform impact:** Shared
- **Build required:** Mobile build
- **Source:** Workstream B audit finding (client/server DOB mismatch); auth-extension.md memory

### PL-006 Pre-existing TypeScript errors cleanup
- **Status:** 15+ pre-existing errors in mobile typecheck — see android-vc67-build-content.md Section D
- **Priority:** Medium
- **Dependencies:** None
- **Platform impact:** Mobile (TypeScript compilation quality)
- **Build required:** Mobile build (does not block VC67 build — eas build uses Babel, not tsc)
- **Source:** pnpm run typecheck output July 23, 2026

---

## Growth and Community Roadmap

### GR-001 Kinfolk AI refinement
- **Status:** Core built; personalization, multi-turn, lifestyle onboarding complete
- **Priority:** Medium
- **Dependencies:** Post-launch user feedback
- **Platform impact:** Shared
- **Build required:** Primarily server-side. Mobile hook update in VC67.
- **Source:** kinfolk-ai-personalization.md memory; post-build95-roadmap.md

### GR-002 Cultural Ambassador experience
- **Status:** Planned
- **Priority:** Medium
- **Dependencies:** Community Guidance system (built); post-launch feedback
- **Platform impact:** Shared
- **Build required:** Both mobile and server
- **Source:** creative-os-standards.md memory; post-build95-roadmap.md

### GR-003 Community Resources expansion
- **Status:** Partially implemented — Marketplace, Wellness, Financial Hub built server-side and in mobile screens
- **Priority:** Medium
- **Dependencies:** None
- **Platform impact:** Shared — screens exist but feature may need polish
- **Build required:** Potentially mobile build for polish
- **Source:** ecosystem-expansion.md memory

### GR-004 Founding Business onboarding
- **Status:** Business dashboard, verification, promotions built
- **Priority:** Medium
- **Dependencies:** Post-launch business acquisition
- **Platform impact:** Shared
- **Build required:** Likely no additional build
- **Source:** already-built-features.md memory; growth-tools.md memory

### GR-005 Community safety enhancements
- **Status:** Safety surveys, proximity alerts, activity alerts built
- **Priority:** Medium
- **Dependencies:** Post-launch community data
- **Platform impact:** Shared
- **Build required:** Mobile build for enhancements
- **Source:** community-guidance-ratings.md memory; safety-related hooks

### GR-006 Business tools and analytics
- **Status:** Business dashboard built; growth tools (promotions) built
- **Priority:** Medium
- **Dependencies:** Post-launch business base
- **Platform impact:** Shared
- **Build required:** Mobile build for analytics view
- **Source:** already-built-features.md memory; growth-tools.md memory

### GR-007 Nationwide rollout and Welcome Home Tour
- **Status:** Platform-ready (4 city types defined in Tour Activation Protocol); Tour Status independent of Platform Status
- **Priority:** Post-launch strategic
- **Dependencies:** LC-001 through LC-006
- **Platform impact:** All (mobile, web, server)
- **Build required:** TBD per tour activation scope
- **Source:** Tour Activation & Founder Safety Protocol (docs/MWM-Tour-Activation-Safety-Protocol-v1.0.md)

### GR-008 Investor and partnership preparation
- **Status:** Investor deck exists (Foundation Book); Marketplace Fairness Charter written
- **Priority:** Post-launch strategic
- **Dependencies:** Platform stability, user data
- **Platform impact:** Presentation artifacts
- **Build required:** No mobile build
- **Source:** investor-deck-format.md memory; marketplace-fairness-charter.md memory

### GR-009 Trust Engine
- **Status:** Architecture designed; 4-phase test plan written; NOT built
- **Priority:** Post-launch product
- **Dependencies:** Platform stability; demo business content
- **Platform impact:** Server + mobile
- **Build required:** Both
- **Source:** trust-engine-testing-strategy.md memory; invisible-architecture-spec-state.md memory

### GR-010 Phase 2+ backend features (Invisible Architecture specs 03–26)
- **Status:** BIF (02) complete; resume at 03 Context Engine™
- **Priority:** Post-launch
- **Dependencies:** GR-009
- **Platform impact:** Server + mobile
- **Build required:** Both
- **Source:** invisible-architecture-spec-state.md memory
