# Build 97 Proposed Scope
## Mapping With Melanin™
**Date:** July 27, 2026
**Status:** Proposed — subject to Manus GO/CONDITIONAL GO/NO-GO assessment

---

## Founder's Intent

The founder has stated clearly: **this is not a login-only build.** Build 97 must demonstrate meaningful platform value to testers and to Apple's reviewer. The founder expects a rich, functional experience that shows why this platform exists.

---

## iOS Build 97 and Next Android Build — Required Features

### Authentication and Onboarding
| Feature | Status | Risk |
|---------|--------|------|
| Email registration | ✅ Implemented | Low — after DB fix |
| Email login | ✅ Implemented | Low — after DB fix |
| Apple Sign-In (iOS) | ✅ Implemented, nonce fix applied | Medium — requires physical device test against production |
| 4-step profile setup (`/profile-setup`) | ✅ Implemented | Low |
| Password reset (6-digit code) | ✅ Implemented | Low |
| Session restoration | ✅ Implemented | Low |
| Account deletion | ✅ Implemented | Low |

### Business Discovery
| Feature | Status | Risk |
|---------|--------|------|
| Business list / search | ✅ Implemented | Low |
| Business categories and filters | ✅ Implemented | Low |
| Business detail screen | ✅ Implemented | Low |
| Business map view (Google Maps) | ✅ Implemented | Medium — map tab had prior bugs; regression test required |
| Inclusive diaspora-based ownership language | ✅ Implemented | Low — `ownershipDesignations` field, not universal "Black-owned" |
| Business reviews and ratings | ✅ Implemented | Low |
| Business owner response | ✅ Implemented | Low |
| Saved places | ✅ Implemented | Low |

### Maps
| Feature | Status | Risk |
|---------|--------|------|
| Google Maps base layer | ✅ Implemented | Medium — API key in EAS env; `withRnMapsPodfileFix` plugin required for iOS |
| Business pins on map | ✅ Implemented | Low |
| Heritage place pins (cultural sites) | ✅ Implemented | Low |
| Map clustering | ✅ Implemented | Low |
| Viewport-based loading | ✅ Implemented | Low |

### Heritage Places
| Feature | Status | Risk |
|---------|--------|------|
| Cultural sites table and API (`GET /api/cultural-sites`) | ✅ Implemented | Low |
| Heritage overlay on map | ✅ Implemented | Low |
| Heritage detail screen | ✅ Implemented | Low |
| Source attribution | ✅ Implemented | Low |

### Historical Sundown Towns
| Feature | Status | Risk |
|---------|--------|------|
| `sundown` category in reports/businesses/directions schema | ✅ In schema | — |
| Data imported to production DB | ❌ **NOT CONFIRMED** | **High** |
| Dedicated Sundown Towns screen | ❌ **NOT CONFIRMED** | High |
| Historical disclaimers | ❓ Unknown — depends on implementation state | High |
| State browsing / search | ❓ Unknown | High |
| Map markers for sundown towns | ❓ Unknown | High |

**⚠️ MANUS ASSESSMENT REQUIRED:** Historical Sundown Towns is the highest-risk feature in Build 97. It appears in the founder's stated scope but its implementation state is unclear. Manus must determine whether it should ship, be hidden, or be deferred. See `docs/reviews/features/MAPS_HERITAGE_SUNDOWN_REVIEW.md`.

### Community
| Feature | Status | Risk |
|---------|--------|------|
| Community feed (posts, comments, likes) | ✅ Implemented | Low |
| Post creation and visibility controls | ✅ Implemented | Low |
| Tester posts (test content removable) | ✅ Implemented | Low |
| Events (browse, RSVP) | ✅ Implemented | Low |
| Safety reporting | ✅ Implemented | Low |
| Content moderation / reporting | ✅ Implemented | Low |
| Community guidance ratings (audience labels) | ✅ Implemented | Low |

### KinfolkAI
| Feature | Status | Risk |
|---------|--------|------|
| Multi-turn chatbot | ✅ Implemented | Medium — see KinfolkAI review |
| Live weather (Open-Meteo, no key) | ✅ Implemented | Low |
| User preferences integration | ✅ Implemented | Low |
| Tone/voice settings (AAVE, formal, etc.) | ✅ Implemented | Low |
| City voices | ✅ Implemented | Low |
| Tier-based query limits | ✅ Implemented | Low |
| Error handling / timeout handling | ✅ Implemented | Low |
| Voice/TTS (Listen button) | ✅ Implemented | Medium — requires audio permission |

### Profile and Settings
| Feature | Status | Risk |
|---------|--------|------|
| User profile | ✅ Implemented | Low |
| Profile photo (camera + library) | ✅ Implemented | Low |
| Privacy settings | ✅ Implemented | Low |
| Theme (light/dark) | ✅ Implemented | Low |
| Tone/voice preferences | ✅ Implemented | Low |
| Notification settings | ✅ Implemented | Low |

### Membership and Subscriptions
| Feature | Status | Risk |
|---------|--------|------|
| Membership screen | ✅ Implemented | Medium — RevenueCat sandbox availability TBD |
| Upgrade flow (iOS: RevenueCat IAP) | ✅ Implemented | Medium — product IDs must be active in App Store Connect |
| Restore Purchases | ✅ Implemented | Medium |
| Web billing (Stripe) | ✅ Implemented | Low |
| Android billing (redirects to web) | ✅ Implemented (by design) | Low |

### Policies and Compliance
| Feature | Status | Risk |
|---------|--------|------|
| Privacy Policy | ✅ Available at URL | Low |
| Terms of Service | ✅ Available at URL | Low |
| Account deletion (GDPR-compliant path) | ✅ Implemented | Low |
| Encryption declaration (no exempt encryption) | ✅ `ITSAppUsesNonExemptEncryption: false` | Low |

---

## Minimum Requirements for Historical Sundown Towns (if shipped)

Per founder's specification, if Historical Sundown Towns ships, it must include at minimum:

1. Historical data source clearly identified
2. State browsing UI
3. Place search
4. Historical-status label (past, not present)
5. Map marker distinct from business and heritage pins
6. Brief sourced description with attribution
7. Clear disclaimer distinguishing historical status from current present-day risk
8. **No "safety score" or danger rating for current conditions**
9. No invented or unsourced content

---

## KinfolkAI Minimum Requirements

1. General knowledge questions (geography, culture, history, travel)
2. Follow-up context across multi-turn conversation
3. Travel and local planning questions
4. Basic heritage and business discovery assistance
5. Use of user's saved preferences (home city, travel style, dietary preferences)
6. Use of user's current tone/voice setting
7. Controlled error handling (no raw API errors shown to user)
8. Live weather via Open-Meteo (working, no API key required)
9. **Explicitly states** when it cannot provide current information it doesn't have (e.g., current business hours, today's events, real-time safety incidents)
10. Does not invent businesses, locations, or safety claims

---

## Business Language Requirements

- No universal "Black-owned" label applied to all minority businesses
- Diaspora countries (`diasporaCountries` field) shown where available
- `ownershipDesignations` array used for specific verified designations
- "Black-owned" only shown when `blackOwned: true` AND user has verified or chosen this filter
- Community vibes and cultural meaning separated from ownership identity
- No fabricated ownership designations

---

## Questions for Manus

1. Is this scope too broad for one Apple approval build?
2. Which items would you mark as conditional or deferred?
3. Which visible features introduce rejection risk if left in an incomplete state?
4. Should iOS and Android scope remain identical?
5. Should Historical Sundown Towns be deferred entirely until the data is confirmed imported and the UI is fully verified?
6. Are Maps and KinfolkAI introducing unacceptable release risk in their current state?
7. What is the minimum viable scope that would (a) pass Apple review and (b) provide meaningful value to testers?
