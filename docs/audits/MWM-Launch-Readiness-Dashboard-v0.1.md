# Mapping With Melanin™ — Launch Readiness Dashboard

**Version:** 0.1  
**Date:** July 19, 2026  
**Update rule:** Updated after every implemented and verified wave. This is the daily source of truth.  
**Authorization phrase:** "Please implement." — required per wave before any coding begins.

---

## Executive Summary

| Metric | Current | After All Waves |
|---|---|---|
| P0 Launch Blockers Remaining | 74 / 74 | 42 / 74 |
| P1 Production Requirements Remaining | 113 / 113 | 105 / 113 |
| P0s Resolved by These Waves | 0 | 32 |
| Tester Readiness | ~50% | ~75% |
| Public Launch Readiness (FD-12.5) | 0% | 43% |
| Total Estimated Engineering Time (all 13 waves) | — | ~13.5 days |
| EAS Builds Required | — | 2 (Wave 1-B urgent; Waves 4-A + 4-B batched) |

> **Tester readiness** = % of 20 founding-member touchpoints that are fully working and human-verified on the distributed build.  
> **Public launch readiness** = % of P0 blockers formally resolved and verified. Per FD-12.5: all 74 P0s must be resolved before public launch. No exceptions (FD-12.4).

---

## Wave Status Dashboard

| Wave | Name | Status | ETA | EAS Build | Blocks Public Launch | Critical for Founding Beta | P0s Resolved |
|---|---|---|---|---|---|---|---|
| **3-A** | CRON_SECRET fail-closed | ⬜ Ready | 10 min | No | Yes | No | 1 |
| **1-A** | Auth hardening (lockout, revocation, log) | ⬜ Ready | 1 day | No | Yes | Yes | 4 |
| **1-B** | Apple Sign-In nonce fix | ⬜ Ready | 1 day + build | **Yes** | Yes | Yes (iOS 26+) | 1 |
| **1-C** | Blocking enforcement (feed, DMs, circles, events) | ⬜ Ready | 1.5 days | No | Yes | Yes | 6 |
| **2-A** | Safety alert unique confirmation | ⬜ Ready | 0.5 day | No | Yes | Yes | 3 |
| **2-B** | Quiet hours enforcement | ⬜ Ready | 0.5 day | No | Yes (FD-12.5) | Yes | 1 |
| **2-C** | KinfolkAI constitutional safety layer | ⬜ Ready | 1 day | No | Partially | Yes | 5 |
| **3-B** | CAN-SPAM compliance (unsubscribe + address) | ⬜ Ready | 0.5 day | No | Yes | No | 2 |
| **3-C** | Stripe webhook idempotency | ⬜ Ready | 0.5 day | No | Yes | No | 1 |
| **3-D** | RevenueCat server-side verification | ⬜ Ready | 1 day | No | Yes | Yes | 1 |
| **3-E** | Decision Ledger + admin MFA + single auth model | ⬜ Ready | 2 days | No | Yes (FD-12.5) | No | 5 |
| **4-A** | Welcome Home Experience™ + onboarding persistence | ⬜ Ready | 2 days | **Yes** | No | Yes | 0 (P1s) |
| **4-B** | Business discovery polish | ⬜ Ready | 1.5 days | **Yes** | Partially | Yes | 2 |

**Status key:** ⬜ Ready to implement (awaiting "Please implement.") · 🔵 In progress · ✅ Implemented · 🟢 Verified

---

## P0 Blockers — What These Waves Resolve vs. What Remains

### Resolved by these 13 waves (32 of 74 P0s)

| Domain | P0s Resolved |
|---|---|
| Identity & Authentication | 5 of 6 (lockout, revocation, log, Apple nonce, profile validation) |
| Community & Social | 6 of 7 (all blocking enforcement surfaces) |
| Safety Systems | 3 of 5 (unique confirm, emergency validation, false-report tracking) |
| AI / KinfolkAI | 5 of 9 (Compassion Protocol, deletion, professional threshold, Ownership Integrity, AI labeling) |
| Membership & Commerce | 2 of 8 (Stripe idempotency, RevenueCat verification) |
| Communications | 3 of 5 (quiet hours, unsubscribe, physical address) |
| Administration & Governance | 5 of 5 (all admin P0s) |
| Cross-System Integration | 1 of 1 (CRON_SECRET) |
| Business Discovery | 1 of 5 (0,0 coordinate) |
| Maps & Location | 1 of 8 (0,0 coordinate guard) |
| Data Architecture | 0 of 10 (deferred — migration strategy, PII retention) |
| Events & Experiences | 0 of 5 (deferred) |

### Remaining after these waves (42 of 74 P0s — deferred workstreams)

| Domain | P0s Remaining | Why Deferred |
|---|---|---|
| Data Architecture | 10 | Migration rollback strategy requires infrastructure planning beyond code |
| Maps & Location | 7 | Service-area model, home-based business, full permission consent requires product decisions |
| Safety Systems | 2 | Manipulation prevention, safety-score equity for minority businesses require constitutional algorithm review |
| AI / KinfolkAI | 4 | Hallucination prevention, prompt injection defense require deeper AI architecture work |
| Membership & Commerce | 6 | Trial abuse prevention, grace period, family seat boundaries need product + Stripe design decisions |
| Events & Experiences | 5 | Event data model requires product decisions |
| Community & Social | 1 | Reporter protection full implementation |
| Business Discovery | 4 | Claim lifecycle, source integrity require partner/data decisions |

> These 42 remaining P0s are not forgotten. They are scheduled for the sprint immediately following founding-beta stabilization.

---

## Founding Member Experience Readiness

Status of the 20 founding-member touchpoints against the tester build and after all waves:

| # | Touchpoint | Tester Build Now | After All Waves |
|---|---|---|---|
| 1 | Registration | ✅ Working | ✅ Hardened |
| 2 | Login | ✅ Working | ✅ Hardened + lockout |
| 3 | Logout | ✅ Working | ✅ + all-device revocation |
| 4 | Password reset | ⚠️ UI works; inbox cycle unverified | ✅ Fully verified |
| 5 | Mobile session persistence | ⚠️ Works; Apple broken iOS 26+ | ✅ Apple fixed (Wave 1-B) |
| 6 | Onboarding persistence | ❌ Not persisted | ✅ Saved to server (Wave 4-A) |
| 7 | Welcome Home Experience™ | ❌ Not built | ✅ Built (Wave 4-A) |
| 8 | Profile stability | ⚠️ Crash fixed web; mobile unverified | ✅ Stable + verified |
| 9 | Saved places | ⚠️ Works; blocking not enforced | ✅ Blocking enforced (Wave 1-C) |
| 10 | Business search | ⚠️ Works; 0,0 pins possible | ✅ Coordinate guard (Wave 4-B) |
| 11 | Maps | ⚠️ Works; offline fails silently | ⚠️ Partial (offline deferred) |
| 12 | Community feed | ⚠️ Works; blocked users appear | ✅ Blocking enforced (Wave 1-C) |
| 13 | Reporting & blocking | ❌ Block table exists; not enforced | ✅ All surfaces enforced |
| 14 | Events | ⚠️ Works; cancellation not modeled | ⚠️ Partial (cancellation deferred) |
| 15 | KinfolkAI basics | ⚠️ Works; no Compassion Protocol | ✅ Constitutional layer (Wave 2-C) |
| 16 | Safety Center | ⚠️ Works; confirmation gameable | ✅ Unique confirmation (Wave 2-A) |
| 17 | Notifications | ⚠️ Works; sends at 3 AM | ✅ Quiet hours enforced (Wave 2-B) |
| 18 | Membership gates | ⚠️ Gates work; RC insecure | ✅ RC server-verified (Wave 3-D) |
| 19 | Reviews | ⚠️ Works | ⚠️ Unchanged by these waves |
| 20 | Business submission | ⚠️ Works | ⚠️ Partial (claim lifecycle deferred) |

**Current tester readiness: ~50%**  
**After all waves: ~75%**

---

## Deployment Dependencies

```
Wave 3-A ──── no dependencies (deploy anytime, 10 minutes)
Wave 1-A ──── no dependencies (deploy anytime)
Wave 1-B ──── no dependencies; requires EAS build after code change
Wave 1-C ──── no dependencies (parallel with 1-A, 1-B)
Wave 2-A ──── no dependencies
Wave 2-B ──── no dependencies
Wave 2-C ──── 2-C system prompt: human review before deploy
Wave 3-B ──── no dependencies
Wave 3-C ──── test in Stripe test mode before production deploy
Wave 3-D ──── requires REVENUECAT_API_KEY_V2 (already in secrets)
Wave 3-E ──── deploy last in Wave 3; admin lockout risk if misconfigured
Wave 4-A ──── requires Wave 1-A stable; requires EAS build
Wave 4-B ──── requires Wave 3 stable; can batch EAS build with 4-A
```

---

## EAS Build Plan

| Build | Waves included | When | Reason |
|---|---|---|---|
| **Build 1 (urgent)** | Wave 1-B (Apple nonce fix) | Immediately after Wave 1-B code approved | iOS 26+ testers cannot sign in with Apple |
| **Build 2 (batch)** | Waves 4-A + 4-B | After Waves 1–3 stable and verified | Welcome Home Experience™ + business polish |

Current build: iOS 1.1.5 buildNumber 84 / Android versionCode 60  
Next build name: **Community Beta 2** (iOS Build 85 / Android Version 1.1.6 Build 61)

---

## Daily Progress Tracking

Update this section each day during implementation:

### Day 0 — July 19, 2026 (Today)
- [ ] Wave 3-A authorized and implemented
- [ ] Wave 1-A authorized
- [ ] Wave 1-B authorized
- [ ] Wave 1-C authorized
- Dashboard status: All waves ⬜ Ready — awaiting "Please implement."

---

## Definition of Ready (FD-12.5)

Public launch may proceed only when ALL of the following are met:

- [ ] All 74 P0s resolved and verified
- [ ] Decision Ledger operational (Wave 3-E)
- [ ] Basic appeals pathway operational (Wave 3-E)
- [ ] Single admin authorization service operational (Wave 3-E)
- [ ] Quiet hours enforced (Wave 2-B)
- [ ] CAN-SPAM compliance operational (Wave 3-B)
- [ ] No constitutional exceptions (FD-12.4)

**Current: 0 of 7 Definition of Ready criteria met.**  
**After all 13 waves: 6 of 7 criteria met** (all P0s not yet fully resolved — 42 remain in deferred workstreams).
