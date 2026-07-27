# Build History — Mapping With Melanin™
**Last updated:** July 27, 2026
**Note:** Records prior to Build 96 are incomplete. EAS dashboard and App Store Connect contain authoritative history.

---

## iOS Build History

| Build # | Version | Date | Commit | Profile | Store Status | Failure Reason | Tested by Users | Known Defects |
|---------|---------|------|--------|---------|-------------|----------------|-----------------|---------------|
| ≤95 | Pre-1.1.5 | Prior to 2026 | Not recorded | production | Unknown — not in project docs | Unknown | Unknown | Not documented |
| 96 | 1.0 | Prior to July 27, 2026 | Not recorded in project | production | **REJECTED** by Apple | DB pool exhaustion — all auth routes returned HTTP 500 at 03:01 UTC during Apple review | Not confirmed — TestFlight may have distributed | Pool exhaustion caused by StripeSync per-webhook `new pg.Pool()` |
| **97** | **1.1.5** | **NOT YET BUILT** | `c9dad580fd18a3adbf90a5adbc909336fc4d370e` (HEAD) | production | **NOT SUBMITTED** | — | — | See this package for known risks |

**Notes on Build 96:**
- Apple's review device: iPad Air 11-inch (M3), iPadOS 26.5.2
- Apple's reported issue: "Error message appeared when tapped on Apple login and tried to register a new account"
- Guideline: 2.1(a) — Performance: App Completeness
- Actual root cause: NOT an Apple Sign-In code bug. DB pool exhaustion from StripeSync leaking connections.
- Apple also requested a username and password for a demo account — none was available.

**EAS identifiers:**
- Project ID: `0f873107-7787-46ab-9a04-685c2a6756b1`
- Project slug: `mobile`
- App owner (Expo): `tlindsay428`
- Apple ID: `tlindsay428@yahoo.com`
- ASC App ID: `6783773366`
- Apple Team ID: `Y46Y4A5MMZ`

**Build URLs:** Not recorded in project. Access via EAS dashboard at `expo.dev/accounts/tlindsay428/projects/mobile/builds`.

---

## Android Build History

| versionCode | Version | Date | Profile | Track | Status | Known Defects |
|-------------|---------|------|---------|-------|--------|---------------|
| ≤66 | Pre-1.1.5 | Prior to 2026 | production | internal | Submitted | Prior auth regression — Apple Sign-In and map issues noted in project memory |
| 67 | 1.1.5 | 2026 | production | internal | Submitted (per project memory) | Auth fix, map fix, post-VC66 changes |
| **71** | **1.1.5** | **NOT YET BUILT** | production | internal | **NOT SUBMITTED** | — |

**Notes:**
- versionCode 71 is the value in the current `artifacts/mobile/app.json`
- Project memory references "Android VC67 Build Content" as the last confirmed Android build
- Gap between versionCode 67 and 71 suggests intermediate builds existed; records not in project docs
- Android package ID: `com.melaninmaps.app`
- Google Play internal track (not production/open beta)
- Google Play service account: `google-service-account.json` (gitignored, must be present for `eas submit`)

---

## Submitted Commit Hashes

| Build | Commit | Notes |
|-------|--------|-------|
| Build 96 (iOS) | Not recorded | Not captured before submission |
| Build 97 (proposed) | `c9dad580fd18a3adbf90a5adbc909336fc4d370e` | HEAD at time of this package preparation |

**For Manus:** The absence of commit hashes for prior builds is a documentation gap. The EAS dashboard records the commit hash for each build. The founder should retrieve these from expo.dev.

---

## EAS Build Logs

**EAS Build 96 logs:** Not exported to repository. Access via:
- EAS dashboard: `https://expo.dev/accounts/tlindsay428/projects/mobile/builds`
- Or `eas build:list --platform ios` (requires `EXPO_TOKEN` configured)

**Current Build 97 preparation logs:** No EAS build has been run for Build 97. Build logs do not exist yet.

**Failed EAS builds:** Not recorded in project. Any failed builds appear in the EAS dashboard.

---

## Production Deployment History — Railway API

| Date | Event | Status |
|------|-------|--------|
| Prior to July 27, 2026 | Multiple Railway deployments throughout development | Details in Railway dashboard |
| July 27, 2026 (ongoing) | Pool exhaustion detected, fix implemented in Replit dev | **Fix NOT yet deployed to Railway** |
| July 27, 2026 | Railway service requires manual restart (pool exhausted) | ⚠️ Railway must be restarted by founder |

**Railway project:** Accessible at `railway.app` (project name and URL not exposed in this document for security)
**Railway service:** API Server
**Railway Postgres:** Separate service, same Railway project

---

## OTA Update History

The app uses Expo Updates (`expo-updates`) with `runtimeVersion.policy: "appVersion"`. OTA updates are published via `eas update` to EAS Update channels:

- `production` channel — production builds
- `preview` channel — internal distribution builds
- No `channel` field in the production `eas.json` profile's `env` section (note: this was flagged as a gap in project memory — check EAS dashboard to confirm active channel before any `eas update`)

OTA update history is accessible via the EAS Updates dashboard at `expo.dev`.
