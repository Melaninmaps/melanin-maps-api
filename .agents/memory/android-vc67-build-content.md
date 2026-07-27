---
name: Android VC67 Build Content
description: Authoritative inventory of every change between Android Version Code 66 and the planned Version Code 67. Build gate checklist. Do not mark planned items as implemented.
---

# Android Version Code 67 — Build Content Report

Last updated: July 23, 2026 (session). Source baseline: bb0ed0f (VC66 build commit).

---

## A. Changes Confirmed for Inclusion in VC67

### A-1. Authentication false-failure fix (WORKSTREAM A)

**File:** `artifacts/mobile/app/signup.tsx`
**Session:** July 23, 2026
**Change:** `await refreshUser()` and `router.replace("/profile-setup")` moved outside the try/catch block. `return` added to catch so genuine network errors stop execution before navigation. `refreshUser()` is now fire-and-forget (void).
**User-facing effect:** Successful signup no longer shows "Could not connect. Please check your internet connection." when the server was reachable. Navigation to `/profile-setup` proceeds as soon as the token is written.
**Platform:** Shared (iOS and Android). Bug manifests as throw only on Android; iOS silently dropped the duplicate navigation. Both platforms benefit.
**Testing required:** New-account registration → navigates to /profile-setup, no error banner. Offline/network-disabled → shows error correctly and stays on form.
**Launch risk:** Low. Fix narrows the catch scope. All real error paths preserved and tested.

---

**File:** `artifacts/mobile/lib/auth.tsx` (`loginWithEmail` function)
**Session:** July 23, 2026
**Change:** Removed blocking `await fetchUser()` from Step 3. `fetchUser()` now fires in the background (`void fetchUser()`). Returns `{ authenticated: true }` immediately after token is written and verified (Steps 1+1v+2). `setIsLoading(true)` removed from Step 3.
**User-facing effect:** Successful login always navigates to `/(tabs)`. The "Signed in but could not reach the server" connecting banner no longer appears after a successful credential check. Profile loads asynchronously. A session-expired 401 later still correctly signs the user out.
**Platform:** Shared (iOS and Android).
**Testing required:** Email login → navigates to /(tabs). Logout → login → navigates again. Wrong password → error shown, no navigation. Close/reopen → session restored.
**Launch risk:** Low. Token is still written and verified before returning authenticated=true. All real failure paths (wrong password, network down, locked account, 401 invalidation) unchanged.

---

### A-2. Apple Sign-In improvements

**File:** `artifacts/mobile/app/login.tsx`
**Commits:** 39716ba3, 550f1ba5, 6ec7623c (post-VC66)
**Change:** `authorizationCode` is now passed from the Apple credential to the server. `apple_user_id` is written to SecureStore after Apple login.
**User-facing effect:** Apple Sign-In revocation on account deletion now has the authorization code needed to complete token revocation with Apple's API. Saves Apple user ID for credential state monitoring.
**Platform:** iOS primary. Android not affected by Apple Sign-In.
**Testing required:** Apple Sign-In on iOS → account deletion revokes Apple session correctly.
**Launch risk:** Low. Additive change to existing Apple auth path.

---

### A-3. Account deletion — proper error handling

**File:** `artifacts/mobile/app/settings.tsx`
**Commits:** 57f2e641, f59f10c1 (post-VC66)
**Change:** Account deletion now reads and handles the server response body. Shows specific error alerts on non-200 response instead of silently proceeding. If Apple token revocation failed server-side, a follow-up alert instructs the user to disconnect the app manually from iOS Settings.
**User-facing effect:** Users who encounter a deletion error see an accurate message and are NOT logged out until deletion succeeds. Apple ID disconnect instructions appear when manual revocation is needed.
**Platform:** Shared (behavior change on both). Apple alert is iOS-only.
**Testing required:** Account deletion success path. Account deletion with server error → error shown, not logged out. Apple Sign-In deletion → revocation attempt logged.
**Launch risk:** Low–Medium. More defensive than VC66. Legal/privacy implication: ensures account deletion is correctly surfaced to the user.

---

### A-4. Map — cultural sites, navigation, and PROVIDER_DEFAULT

**File:** `artifacts/mobile/components/FullMapView.tsx`
**Commits:** 04563905, 789bdbb6, 04999500 (post-VC66)
**Change:** Major refactor. Key additions:
- `PROVIDER_DEFAULT` explicitly set on MapView (previously not set — was implicit default)
- Cultural sites now have loading/error states (`culturalSitesLoading`, `culturalSitesError`)
- `useFocusEffect` added: cultural sites re-fetch on tab focus
- `useCallback` for stable function references
- `Linking` added for "Directions" deep link on cultural site cards
- `useAuth` imported for gated features
- `KinfolkAI clearance` constant (KINFOLK_CLEAR = 90) for bottom overlay spacing
- `EXPO_PUBLIC_API_URL` check in internal `getApiBase()`
**User-facing effect:** Map tab cultural sites reload when user returns to the tab (no stale data). Directions button opens native maps app. Map tiles should render consistently (explicit provider). Bottom content clears the KinfolkAI restore widget.
**Platform:** Shared (iOS and Android). PROVIDER_DEFAULT = Apple Maps on iOS, Google Maps on Android.
**Testing required:** Map tab shows tiles. Cultural sites appear and reload on tab focus. Directions button opens native maps.
**Launch risk:** Medium for Android specifically — PROVIDER_DEFAULT on Android requires valid Google Maps API key authorization. This is the root cause of the white map on VC66. See Section D (build gate) and map configuration checklist.

---

### A-5. API base URL — EXPO_PUBLIC_API_URL priority

**Files:** `artifacts/mobile/lib/api.ts`, `artifacts/mobile/lib/auth.tsx`, `artifacts/mobile/components/FullMapView.tsx`
**Commits:** 2d05bb9e and post-VC66
**Change:** All API base URL functions now check `EXPO_PUBLIC_API_URL` first (higher priority), then fall back to `https://${EXPO_PUBLIC_DOMAIN}`.
**User-facing effect:** If the EAS Dashboard `EXPO_PUBLIC_API_URL` env var is set, it overrides the domain-based URL for all API calls. This was added after the July 21 outage to allow rapid API URL switching without a rebuild.
**Platform:** Shared.
**Testing required:** Confirm `EXPO_PUBLIC_API_URL` resolves correctly on production build. GET /api/businesses returns data.
**Launch risk:** Low. The EAS Dashboard production secret `EXPO_PUBLIC_API_URL = https://www.mappingwithmelanin.com` is already set.

---

### A-6. EAS build configuration updates

**File:** `artifacts/mobile/eas.json`
**Commits:** post-VC66
**Change:**
- Production profile: `"channel": "production"` and `"environment": "production"` added. The `environment` field causes EAS Build to use the EAS Dashboard "production" environment secrets (which have highest priority over eas.json `env` block values).
- Preview profile: `"channel": "preview"` added, `resourceClass: "m-medium"` added for iOS, RevenueCat and PNPM_VERSION keys added to env block.
**User-facing effect:** None directly. Affects which env vars are available at build time.
**Platform:** Build config only.
**Testing required:** Confirm production build receives correct `GOOGLE_MAPS_API_KEY` (see Section D).
**Launch risk:** Medium — the `environment: "production"` addition means the EAS Dashboard SECRET for `GOOGLE_MAPS_API_KEY` now takes priority over the eas.json plaintext value. The Dashboard SECRET value determines what key is baked into VC67. Must verify before build.

---

### A-7. Activity alerts and safety proximity improvements

**Files:** `artifacts/mobile/hooks/useActivityAlerts.ts`, `artifacts/mobile/hooks/useSafetyProximity.ts`
**Commits:** post-VC66
**Change:** useActivityAlerts expanded (+40 lines). useSafetyProximity updated (+23/-23 lines).
**User-facing effect:** Safety proximity alerts and activity alert behavior improved. Exact changes require deeper audit if risk assessment needed.
**Platform:** Shared.
**Testing required:** Safety hub tab loads. Activity alerts appear in map context.
**Launch risk:** Low–Medium (safety-adjacent feature).

---

### A-8. Kinfolk AI hook updates

**File:** `artifacts/mobile/hooks/useKinfolk.ts`
**Commits:** post-VC66
**Change:** 12 lines changed.
**User-facing effect:** Kinfolk AI behavior update. Exact scope requires deeper audit.
**Platform:** Shared.
**Testing required:** KinfolkAI responds on map tab and chat screen.
**Launch risk:** Low.

---

### A-9. Pre-build validation script (internal tooling)

**File:** `artifacts/mobile/scripts/pre-build-check.js` (new file, +212 lines)
**Commits:** post-VC66
**Change:** New script that validates build prerequisites before `eas build` is run.
**User-facing effect:** None. Developer tooling only.
**Platform:** Build tooling.
**Launch risk:** None.

---

### A-10. Map diagnostic screen (internal tooling)

**File:** `artifacts/mobile/app/map-diagnostic.tsx` (new file, +88 lines)
**Commits:** post-VC66
**Change:** Internal diagnostic screen for map troubleshooting.
**User-facing effect:** Accessible at `/map-diagnostic` route. Not linked from main navigation. Developer/QA use only.
**Platform:** Shared.
**Launch risk:** Low. Should be confirmed not reachable from production UI.

---

### A-11. Legal pages, policy, and support pages

**File:** `artifacts/web` and API routes (server-side, already live)
**Commits:** 48ded0e8 (post-VC66)
**Change:** Privacy policy, terms of service, and support pages added to web artifact.
**User-facing effect:** Legal pages accessible at mappingwithmelanin.com.
**Platform:** Web/server only. No mobile rebuild required.
**Launch risk:** Low. Already live.

---

### A-12. Version number — REQUIRES ACTION BEFORE BUILD

**File:** `artifacts/mobile/app.json`
**Current state:** version = "1.1.5", buildNumber = "95" (iOS), versionCode = **66** (Android)
**Required change for VC67:** versionCode must be changed from 66 to **67** before build.
**Note:** Do NOT change buildNumber or iOS buildNumber here — iOS Build 95 is the iOS baseline. Only Android versionCode changes.
**Status:** ⛔ NOT YET DONE. Requires explicit build authorization before making this change.

---

## B. Discussed but Not Included in VC67

The following items have been discussed, audited, or saved in memory but are **NOT** authorized for VC67:

| Item | Status | Reason excluded |
|------|---------|-----------------|
| HBCU map card/tile redesign (horizontal strip, school colors, nearby/featured) | Audited, planned | Requires full design pass + approval. Post-launch. |
| Contextual inclusive-language cleanup | Audited | Language rule is permanent and contextual; audit pending on specific screens |
| Broader layout/visual consistency redesign | Planned | Post-launch full design pass |
| UX story audit changes | Planned | Not yet scoped for VC67 |
| Kinfolk AI refinements (depth, context, personalization) | Partially implemented in prior sessions | Server-side only; no VC67 mobile changes authorized beyond hook update (A-8) |
| Community Resources expansion (Marketplace, Wellness, Financial Hub) | Built server-side | No new mobile changes authorized for VC67 |
| Cultural Ambassador experience | Planned | Not yet scoped |
| Phase 1 backend stability (PR #13) | Branch: `phase1-backend-stability`, NOT merged | Server-side only; does not affect mobile build. Must be merged to Railway separately. |
| Trust Engine | Designed but not built | Post-launch |
| Family plan / family mode UI refinements | Built | No new changes authorized for VC67 |
| Onboarding name-confirmation refinements | Planned | Post-launch |
| Welcome Home Tour / city activation | Planned | Post-launch |
| iOS Build 96+ | Out of scope | VC67 is Android only |

---

## C. Platform Impact

### Shared changes (appear in next iOS build as well as VC67)
- Authentication false-failure fix (signup.tsx + lib/auth.tsx)
- Account deletion error handling (settings.tsx)
- EXPO_PUBLIC_API_URL priority in API base URL resolution (lib/api.ts, lib/auth.tsx, FullMapView.tsx)
- FullMapView.tsx map improvements (cultural sites reload, Linking, PROVIDER_DEFAULT)
- Activity alerts and safety proximity hook improvements
- Kinfolk AI hook update
- Apple Sign-In authorizationCode + apple_user_id storage (iOS only functionality, but shared file)

### Android-only native/configuration changes
- versionCode bump: 66 → 67 (app.json) — PENDING
- Google Maps API key authorization fix (Google Cloud Console) — PENDING FOUNDER ACTION
- GOOGLE_MAPS_API_KEY value resolved at build time from EAS Dashboard SECRET (production environment)

### Server-side changes (already live, no mobile rebuild required)
- Apple Sign-In token revocation endpoint (`/api/users/me` DELETE enhanced)
- Legal pages (privacy policy, terms of service, support)
- Auth diagnostic logging improvements
- Phase 1 backend stability improvements (PR #13 — NOT YET MERGED to Railway)

### iOS-only changes not relevant to VC67
- Apple Sign-In nonce enforcement (iOS 26+)
- iOS Build 95 was compiled from commit 39716ba3 — VC67 will compile from a later commit

---

## D. Final Build Gate

Version Code 67 may NOT be built until every item below is confirmed:

| Gate | Status | Owner |
|------|--------|-------|
| Authentication fix included (signup.tsx + lib/auth.tsx) | ✅ DONE | Replit |
| Map authorization corrected (Google Cloud Console) | ⛔ BLOCKED | Founder — see map walkthrough |
| versionCode set to 67 in app.json | ⛔ NOT YET DONE | Replit (on build authorization) |
| API base URL correct (EXPO_PUBLIC_API_URL = https://www.mappingwithmelanin.com) | ✅ EAS Dashboard confirmed | — |
| Production signing credentials correct (credentialsSource: local) | ✅ eas.json confirmed | — |
| No accidental HBCU/layout/language/unrelated feature work | ✅ Confirmed excluded | — |
| Mobile typecheck: no new errors from auth fix | ✅ Confirmed | Replit |
| Pre-existing typecheck errors documented (see below) | ✅ Listed | — |
| Build profile confirmed: production, distribution: app-bundle | ✅ eas.json confirmed | — |
| Distribution track: internal (Google Play Internal Testing) | ✅ eas.json submit.production.android.track = "internal" | — |
| EAS Dashboard GOOGLE_MAPS_API_KEY SECRET value verified | ⛔ BLOCKED — requires founder to check Google Cloud Console | Founder |
| Duplicate plaintext GOOGLE_MAPS_API_KEY in eas.json: decision made | ⛔ PENDING — see recommendation in map walkthrough | Founder |

### Pre-existing mobile typecheck errors (existed before this session, not introduced by auth fix)

All of the following existed before VC66 or between VC66 and current HEAD. None are new:

- `app/(tabs)/_layout.tsx`: Icon, Label not exported from expo-router/unstable-native-tabs.js
- `app/(tabs)/profile.tsx`: refreshUser type mismatch (Promise\<boolean\> vs Promise\<void\>), map-diagnostic route not in typed routes
- `app/_layout.tsx`: `global` not found (RN global polyfill pattern)
- `app/business/[id].tsx`, `app/spaces.tsx`, `app/travel-videos.tsx`, `app/wishlist.tsx`: absoluteFillObject removed in RN 0.86
- `components/AIChatWidget.tsx`: cacheDirectory not in expo-file-system v57, Platform.OS web comparison
- `components/BusinessMapView.tsx`: absoluteFillObject (×2)
- `components/BusinessPreviewModal.tsx`, `components/ReportContentModal.tsx`, `components/ShareModal.tsx`, `components/SkipFeedbackModal.tsx`, `components/VideoDetailModal.tsx`, `components/WriteReviewModal.tsx`, `components/FeaturedVideoCard.tsx`: absoluteFillObject
- `components/FullMapView.tsx`: `/cultural-heritage` route not in typed routes
- `constants/stripePricing.ts`: `"test"` vs `"live"` comparison

These do not affect runtime behavior of the auth fix or map fix. They are tracked separately for cleanup.
