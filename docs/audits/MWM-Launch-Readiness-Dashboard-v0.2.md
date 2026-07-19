# Mapping With Melanin™ — Launch Readiness Dashboard

**Version:** 0.3  
**Date:** July 19, 2026  
**Update rule:** Updated after every implemented and verified wave. This is the daily engineering source of truth.  
**Authorization phrase:** "Please implement." — required per wave before any coding begins.  
**Change from v0.2:** EAS Build 1 now includes Wave 1-A (auth hardening shipped alongside Apple nonce fix and Welcome Home for one coherent tester install). Verification status updated to 4-stage flow requiring founder sign-off before any wave is marked complete.

---

## Executive Summary

| Metric | Current | After All Waves |
|---|---|---|
| P0 Launch Blockers Remaining | 74 / 74 | 42 / 74 |
| P1 Production Requirements Remaining | 113 / 113 | 105 / 113 |
| P0s Resolved by These Waves | 0 | 32 |
| **Founding Member Experiences — Verified** | **3 / 20** | **16 / 20** |
| **Founding Member Experiences — Partial** | **14 / 20** | **4 / 20** |
| **Founding Member Experiences — Missing** | **3 / 20** | **0 / 20** |
| Public Launch Readiness (P0 basis, FD-12.5) | 0% | 43% |
| Total Estimated Engineering Time (all 13 waves) | — | ~13.5 days |
| EAS Builds Required | — | 2 |

> **Verified** = feature works end-to-end, human-tested on exact build.  
> **Partial** = feature exists but has a known gap confirmed by crosswalk.  
> **Missing** = not built or not enforced.

---

## Wave Status Dashboard — Founding-Member-First Order

| # | Wave | Name | Status | ETA | EAS? | Blocks Launch | Risk if Delayed | P0s |
|---|---|---|---|---|---|---|---|---|
| 1 | **1-A** | Auth hardening (lockout, revocation, log) | 🟡 Implemented — Awaiting Founder Verification | July 19, 2026 | No | Yes | Members cannot recover from credential attacks; no account lockout | 4 |
| 2 | **1-B** | Apple Sign-In nonce fix | 🟡 Awaiting Founder Verification | 1 day + build | **Yes** | Yes | All iOS 26+ testers silently blocked from Apple Sign-In | 1 |
| 3 | **1-C** | Blocking enforcement (all surfaces) | ⬜ Ready | 1.5 days | No | Yes | Blocked users visible in feed; harassment and privacy violations live | 6 |
| 4 | **2-A** | Safety alert unique confirmation | ⬜ Ready | 0.5 day | No | Yes | Single user can inflate safety confirmation counts without limit | 3 |
| 5 | **4-A** | Welcome Home Experience™ + onboarding | ⬜ Ready | 2 days | **Yes** | No | Founding members' first post-install experience lacks identity or personalization | 0 (P1s) |
| 6 | **2-B** | Quiet hours enforcement | ⬜ Ready | 0.5 day | No | Yes | Members receive promotions and digests overnight (10 PM–8 AM) | 1 |
| 7 | **2-C** | KinfolkAI constitutional safety layer | ⬜ Ready | 1 day | No | Partial | Member in distress receives no Compassion Protocol — AI has no crisis response | 5 |
| 8 | **3-A** | CRON_SECRET fail-closed | 🟡 Implemented — Awaiting Founder Verification | July 19, 2026 | No | Yes | All cron endpoints publicly accessible without any authentication | 1 |
| 9 | **3-B** | CAN-SPAM compliance | 🟡 Implemented — Awaiting Founder Verification | July 19, 2026 | No | Yes | Every outgoing email is a legal compliance violation; unsubscribe legally required | 2 |
| 10 | **3-C** | Stripe webhook idempotency | 🟡 Implemented — Awaiting Founder Verification | July 19, 2026 | No | Yes | Stripe retries create double-credits; failed webhooks leave entitlements wrong | 1 |
| 11 | **3-D** | RevenueCat server-side verification | 🟡 Implemented — Awaiting Founder Verification | July 19, 2026 | No | Yes | Premium features accessible without payment via direct API call | 1 |
| 12 | **3-E** | Decision Ledger + admin MFA + single auth | ⬜ Ready | 2 days | No | Yes | Admin actions leave no institutional record; no MFA on highest-privilege accounts | 5 |
| 13 | **4-B** | Business discovery polish | ⬜ Ready | 1.5 days | **Yes** | Partial | Businesses with failed geocoding may publish at (0,0) in Gulf of Guinea | 2 |

**Status key:** ⬜ Ready (awaiting "Please implement.") · 🔵 In progress · 🟡 Implemented — Awaiting Founder Verification · 🟢 Verified by Founder

---

## Founding Member Experience Tracker — Daily

**Goal: 20/20 Verified before Zoom. Update this count each day.**

| # | Touchpoint | Today | After Wave 1 | After All Waves |
|---|---|---|---|---|
| 1 | Registration | ✅ Verified | ✅ | ✅ |
| 2 | Login | ✅ Verified | ✅ | ✅ |
| 3 | Logout | ✅ Verified | ✅ | ✅ |
| 4 | Password reset | ⚠️ Partial | ✅ 1-A | ✅ |
| 5 | Mobile session / Apple Sign-In | ⚠️ Partial (iOS 26+ broken) | ✅ 1-B | ✅ |
| 6 | Onboarding persistence | ❌ Missing | ❌ | ✅ 4-A |
| 7 | Welcome Home Experience™ | ❌ Missing | ❌ | ✅ 4-A |
| 8 | Profile stability | ⚠️ Partial | ⚠️ | ✅ |
| 9 | Saved places | ⚠️ Partial | ✅ 1-C | ✅ |
| 10 | Business search | ⚠️ Partial | ⚠️ | ✅ 4-B |
| 11 | Maps | ⚠️ Partial | ⚠️ | ⚠️ (offline deferred) |
| 12 | Community feed | ⚠️ Partial (blocked users visible) | ✅ 1-C | ✅ |
| 13 | Reporting & blocking | ❌ Missing (not enforced) | ✅ 1-C | ✅ |
| 14 | Events | ⚠️ Partial | ⚠️ | ⚠️ (cancellation deferred) |
| 15 | KinfolkAI basics | ⚠️ Partial | ⚠️ | ✅ 2-C |
| 16 | Safety Center | ⚠️ Partial (gameable) | ✅ 2-A | ✅ |
| 17 | Notifications | ⚠️ Partial (no quiet hours) | ⚠️ | ✅ 2-B |
| 18 | Membership gates | ⚠️ Partial (RC insecure) | ⚠️ | ✅ 3-D |
| 19 | Reviews | ⚠️ Partial | ⚠️ | ⚠️ (unchanged) |
| 20 | Business submission | ⚠️ Partial | ⚠️ | ⚠️ (partially deferred) |

**Today: 3 Verified / 14 Partial / 3 Missing**

---

## Deployment Dependencies

```
Wave 1-A ──── no dependencies (start immediately)
Wave 1-B ──── no dependencies; EAS build after code change
Wave 1-C ──── no dependencies (parallel with 1-A, 1-B)
Wave 2-A ──── no dependencies
Wave 4-A ──── depends on 1-A stable; EAS build — batch with 1-A + 1-B into single Build 1
Wave 2-B ──── no dependencies
Wave 2-C ──── system prompt changes require human review before deploy
Wave 3-A ──── no dependencies; verify CRON_SECRET set in Railway first
Wave 3-B ──── no dependencies
Wave 3-C ──── test in Stripe test mode before production deploy
Wave 3-D ──── REVENUECAT_API_KEY_V2 already in secrets; no other dependencies
Wave 3-E ──── deploy last in the sequence; admin lockout risk if middleware misconfigured
Wave 4-B ──── batch EAS build with 4-A if 4-B follows closely
```

---

## EAS Build Plan

| Build | Waves Included | When | Release Name |
|---|---|---|---|
| **Build 1** | Waves 1-A + 1-B + 4-A | After all three approved and coded — one coherent tester install | **Community Beta 2** |
| **Build 2** | Wave 4-B | After Waves 1–3 stable and founder-verified | **Community Beta 3** |

Current build: iOS 1.1.5 buildNumber 84 / Android versionCode 60

---

## Daily Progress Tracking

### Day 0 — July 19, 2026
- All waves ⬜ Ready. Awaiting "Please implement." per wave.
- Score: **3 / 20** founding member experiences verified

### Day 1 — July 19, 2026 (continued)
- Wave 1-B: 🟡 Implemented — login.tsx Apple nonce fix applied. EAS build required.
- Score: **3 / 20** (no change until TestFlight build verified by founder)
- Next: Run `eas build --platform ios --profile production` from inside artifacts/mobile/

---

## Definition of Ready (FD-12.5)

Public launch requires ALL of the following:

- [ ] All 74 P0s resolved and verified
- [ ] Decision Ledger operational (Wave 3-E)
- [ ] Basic appeals pathway operational (Wave 3-E)
- [ ] Single admin authorization service (Wave 3-E)
- [ ] Quiet hours enforced (Wave 2-B)
- [ ] CAN-SPAM compliance (Wave 3-B)
- [ ] No constitutional exceptions (FD-12.4 — none permitted)

**Current: 0 of 7 criteria met.**  
**After all 13 waves: 6 of 7 met** (42 P0s remain in deferred workstreams — all must be resolved before public launch).
