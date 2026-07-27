# Cross-Platform Test Evidence
## Mapping With Melanin™ — Build 97
**Date:** July 27, 2026

---

## ⚠️ Critical Disclosure

**Build 97 has not been compiled yet.** No EAS build has been run. The evidence in this document reflects:
- Testing done against the Replit development environment (not Railway production)
- Prior physical device testing from Build 96 era (not Build 97)
- Load testing run against Replit/local Postgres (explicitly labeled)

**Physical device testing against Build 97 production has NOT been completed.**

---

## Load Test Results — 30 Concurrent Users

**Environment:** Replit development server (local Postgres, NOT Railway production)
**Date:** July 27, 2026
**Build context:** Post-StripeSync fix, post-pool increase (max:8)

| Metric | Value |
|--------|-------|
| Concurrent users | 30 |
| Total requests | 180 |
| Success rate | **100%** |
| p50 response time | ~200ms |
| p95 response time | **489ms** |
| p99 response time | Not recorded |
| Error count | 0 |
| Pool peak `waitingCount` | Not exceeding max |
| Abuse load test (141 req/sec) | Peak `waitingCount: 12` — triggered pool increase to 8 |

**⚠️ LABEL:** This load test was run against Replit/local Postgres, not Railway production. Railway Postgres has different connection characteristics, network latency, and connection limits. **Production load testing is still required before submission.**

---

## Platform Test Status

### Web
| Item | Device/Browser | OS | Build | Flows Tested | Pass/Fail | Notes |
|------|---------------|-----|-------|-------------|-----------|-------|
| Registration | Chrome (Replit preview) | — | Dev | Email registration → profile setup | ✅ Pass | Against dev server |
| Login | Chrome (Replit preview) | — | Dev | Email login | ✅ Pass | Against dev server |
| Business list | Chrome (Replit preview) | — | Dev | Browse businesses, map view | ✅ Pass | Dev |
| Map | Chrome (Replit preview) | — | Dev | Map loads, pins visible | ✅ Pass | Dev |
| KinfolkAI | Chrome (Replit preview) | — | Dev | Chat, weather query | ✅ Pass | Dev |
| Membership | Chrome (Replit preview) | — | Dev | Stripe checkout flow | ✅ Pass | Dev / Stripe test mode |
| Admin | Chrome (Replit preview) | — | Dev | Admin console | ✅ Pass | Dev |

**Known defects (web):** None currently confirmed. Web is less risky than mobile for this release.

---

### iPhone
| Item | Device | OS | Build | Flows Tested | Pass/Fail | Notes |
|------|--------|----|-------|-------------|-----------|-------|
| Build 96 | Physical iPhone | Unknown | Build 96 (pre-fix) | Auth, map, community | ✅ Pass (functional) | Before pool exhaustion was triggered |
| Build 97 | Not yet tested | N/A | Not yet built | — | ❌ Not tested | Build has not been compiled |

**Known defects (iPhone, Build 96 era):**
- Map tab was black after `StyleSheet.absoluteFillObject` removal in RN 0.86 — **fixed**
- Apple Sign-In nonce enforcement on iOS 26+ — **fixed**
- Auth failure during Apple review (pool exhaustion) — **fixed (not yet deployed)**

**Untested items (iPhone, Build 97):**
- Fresh Apple Sign-In on physical device against Railway production
- All feature flows against production (not dev)
- Performance on older iPhone models (iPhone XS and earlier — iOS 16.4 minimum)

---

### iPad
| Item | Device | OS | Build | Flows Tested | Pass/Fail | Notes |
|------|--------|----|-------|-------------|-----------|-------|
| Apple review | iPad Air 11-inch (M3) | iPadOS 26.5.2 | Build 96 | Apple Sign-In (attempted) | ❌ FAIL | DB pool exhaustion caused auth failure |
| Build 97 | Not yet tested | N/A | Not yet built | — | ❌ Not tested | Build has not been compiled |

**Known defects (iPad):**
- All auth failed during Build 96 review due to DB pool exhaustion
- iPad landscape orientation declared but not confirmed tested in app UI

**Untested items (iPad, Build 97):**
- ALL flows — no iPad testing has been completed for Build 97
- Landscape orientation UI on map, feed, KinfolkAI
- Split-screen multitasking behavior (`UIRequiresFullScreen: false`)

**⚠️ CRITICAL:** The Apple review device was an iPad. iPad testing is a required submission gate.

---

### Android Phone
| Item | Device | OS | Build | Flows Tested | Pass/Fail | Notes |
|------|--------|----|-------|-------------|-----------|-------|
| Build 67 (VC67) | Physical Android phone | Unknown | VC67 | Auth, map, community | ✅ Pass | Per project memory |
| Build 71 (proposed) | Not yet tested | N/A | Not yet built | — | ❌ Not tested | Build has not been compiled |

**Known defects (Android, resolved):**
- Map black screen (`StyleSheet.absoluteFillObject`) — fixed in VC67+
- Auth regression — fixed in VC67+

**Untested items (Android phone, Build 71):**
- All flows against production
- Google Sign-In (if implemented)
- RevenueCat Android billing flow
- Android 8.0 (minSdk 26) device compatibility

---

### Android Tablet
| Item | Device | OS | Build | Flows Tested | Pass/Fail | Notes |
|------|--------|----|-------|-------------|-----------|-------|
| Build 71 (proposed) | Not yet tested | N/A | Not yet built | — | ❌ Not tested | Build has not been compiled |

**Known defects (Android tablet):**
- No tablet-specific layout optimization confirmed
- Large-screen behavior dependent on `withChromebookSupport` plugin

**Untested items (Android tablet):**
- All flows
- Large-screen layout on tablet viewport
- Landscape orientation

---

## Untested Items Summary

| Item | Platform | Risk Level |
|------|----------|-----------|
| Build 97 on any device | All mobile | **HIGH** — build has not been compiled |
| Apple Sign-In on physical iOS 26+ device | iPhone, iPad | **HIGH** — required submission gate |
| iPad layout (all screens) | iPad | **HIGH** — Apple review was on iPad |
| Railway production stability (12-hour window) | All | **HIGH** — fix not deployed |
| RevenueCat IAP sandbox | iOS, Android | **HIGH** — products not confirmed active |
| Android tablet layout | Android tablet | **MEDIUM** |
| Authentication on Android (all methods) | Android | **MEDIUM** |
| KinfolkAI on physical device | iOS, Android | **MEDIUM** |
| Community posting on physical device | iOS, Android | **MEDIUM** |
| Push notifications delivery | iOS, Android | **MEDIUM** |
| Deep link handling | iOS, Android | **LOW** |

---

## Questions for Manus

1. Is the load test evidence (run against Replit/local Postgres, not Railway production) sufficient to proceed with Build 97 submission, or is a Railway production load test required first?
2. Given that no physical device testing has been done for Build 97 (the build hasn't been compiled yet), what is the minimum physical device test checklist that must be completed after `eas build` and before `eas submit`?
3. The Apple review device was iPad Air 11-inch (M3). Should an iPad of the same model be used for pre-submission testing, or is any iPad sufficient?
4. Is the absence of Android tablet testing a blocker for the Android submission?
