# iOS Native Configuration — Build 97
## Mapping With Melanin™
**Date:** July 27, 2026
**Source:** `artifacts/mobile/app.json` (authoritative for EAS build) + `artifacts/mobile/ios/MappingWithMelanin/Info.plist` (static file — may differ from EAS-generated plist)

---

## IMPORTANT: Two Sources of Truth

EAS `eas build` generates the native Info.plist from `app.json`/`app.config.js`. The static `Info.plist` in the repo is from a prior manual or EAS build (CFBundleVersion: 83 — out of date). **The `app.json` values are authoritative for Build 97.**

---

## Bundle Identifier

`com.melaninmaps.app`

## Version

| Field | Value |
|-------|-------|
| CFBundleShortVersionString | 1.1.5 |
| CFBundleVersion (buildNumber) | **97** (updated for Build 97) |

## Supported Device Families

| Device | Support |
|--------|---------|
| iPhone | ✅ Primary |
| iPad | ✅ `supportsTablet: true` |
| Mac Catalyst | Not declared |

## Deployment Target

iOS 16.4 (set via `expo-build-properties` plugin: `ios.deploymentTarget: "16.4"`)

## Orientations

| Device | Orientations |
|--------|-------------|
| iPhone | Portrait, Portrait Upside-Down |
| iPad | Portrait, Portrait Upside-Down, Landscape Left, Landscape Right (all four) |

`UIRequiresFullScreen: false` — split-screen/multitasking permitted.

## Sign in with Apple Entitlement

```json
"entitlements": {
  "com.apple.developer.applesignin": ["Default"]
}
```
✅ Declared. Apple Sign-In capability is active.

## Associated Domains

```json
"associatedDomains": ["applinks:mappingwithmelanin.com"]
```
✅ Deep links to `mappingwithmelanin.com` work via Universal Links.

## URL Schemes (Custom Deep Links)

```
mappingwithmelanin://
com.melaninmaps.app://
```
Used for: mobile auth callback (`mappingwithmelanin://auth-complete?token=SID`), Expo Router deep links.

## Permission Declarations (Build 97)

| Key | Purpose String | Required |
|-----|---------------|----------|
| `NSLocationWhenInUseUsageDescription` | "Mapping With Melanin uses your location to show nearby minority-owned businesses and community safety information." | Optional |
| `NSCameraUsageDescription` | "Mapping With Melanin uses your camera so you can update your profile photo." | Optional |
| `NSPhotoLibraryUsageDescription` | "Mapping With Melanin accesses your photo library so you can choose a profile picture." | Optional |
| `NSPhotoLibraryAddUsageDescription` | "Mapping With Melanin saves photos to your library." | Optional |
| `NSUserNotificationsUsageDescription` | "Mapping With Melanin sends notifications about nearby businesses, community safety alerts, and activity in your circles." | Optional |
| `NSMicrophoneUsageDescription` | "Mapping With Melanin uses your microphone so you can send voice messages to Kinfolk AI." | Optional |
| `NSContactsUsageDescription` | "Mapping With Melanin would like to find friends who are already on the platform." | Optional |

**Removed in Build 97 (were in static Info.plist, removed):**
- `NSFaceIDUsageDescription` — was using unresolved `$(PRODUCT_NAME)` template variable
- `NSMotionUsageDescription` — not used by app
- `NSLocationAlwaysUsageDescription` — app only requests When In Use
- `NSLocationAlwaysAndWhenInUseUsageDescription` — not needed

## Encryption Declaration

`ITSAppUsesNonExemptEncryption: false`

✅ Declared. No export compliance questionnaire required.

## Background Modes

```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>
```
Audio background mode — for KinfolkAI TTS playback.

## Push Notifications

- `expo-notifications` plugin configured
- Push token registration: `POST /api/push-token`
- Push entitlement: managed by EAS credentials
- Icon: `./assets/images/icon.png`
- Color: `#CA922B`

## In-App Purchase Capability

Managed via RevenueCat + Apple IAP. EAS credentials source: `local` (credentials stored in Apple Developer Portal, managed by EAS credentials).

## Privacy Accessed API Declarations

```json
"NSPrivacyAccessedAPICategoryUserDefaults": [{
  "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
  "NSPrivacyAccessedAPITypeReasons": ["CA92.1"]
}]
```
Required for apps using `NSUserDefaults` (AsyncStorage, expo-secure-store).

## Tracking Declarations

No `NSUserTrackingUsageDescription` declared. App does not request ATT permission. No cross-app tracking implemented.

## App Transport Security

```xml
<key>NSAllowsArbitraryLoads</key>
<false/>
<key>NSAllowsLocalNetworking</key>
<true/>
```
HTTPS enforced. Local networking allowed for development.

## EAS Credentials Configuration

```json
"ios": {
  "credentialsSource": "local"
}
```
Credentials (distribution certificate, provisioning profile) stored in Apple Developer Portal. EAS manages via `eas credentials`.

## Apple Key/Client Identifiers

| Item | Value | Notes |
|------|-------|-------|
| Apple Team ID | `Y46Y4A5MMZ` | Required for signing |
| Apple ID | `tlindsay428@yahoo.com` | ASC account |
| ASC App ID | `6783773366` | For `eas submit` |
| Bundle ID | `com.melaninmaps.app` | — |
| EAS Project ID | `0f873107-7787-46ab-9a04-685c2a6756b1` | — |

Apple private key (`.p8`): stored as `APPLE_PRIVATE_KEY` environment secret. **Not included in this package.**
Apple Key ID: `APPLE_KEY_ID` environment secret. **Not included.**
Apple Team ID: `APPLE_TEAM_ID` environment secret. **Not included.**

---

## Issues for Manus to Review

1. **`CFBundleVersion: 83` in static Info.plist vs `buildNumber: 97` in `app.json`** — The static file is stale. EAS will use `app.json`'s value (97) when generating the native plist during build. This is expected behavior but confirms the static plist should not be used as the source of truth.
2. **iPad orientation support** — All four orientations declared for iPad. Manus should verify the app handles landscape rotation correctly on all screens (map, community feed, KinfolkAI, business list).
3. **`UIRequiresFullScreen: false`** — Allows multitasking. All screens should handle being in a split-screen window.
4. **Contacts permission** — `NSContactsUsageDescription` declared. Manus should verify this permission is actually requested and used (for "find friends" feature). If the feature is not in Build 97, this permission should be removed to avoid Apple's review of an unrequested permission.
