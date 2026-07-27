# Android Native Configuration — Build 97
## Mapping With Melanin™
**Date:** July 27, 2026
**Source:** `artifacts/mobile/app.json` (authoritative for EAS build)

---

## Package / Application ID

`com.melaninmaps.app`

## Version

| Field | Value |
|-------|-------|
| version (versionName) | 1.1.5 |
| versionCode | **71** |

## SDK Versions

| Parameter | Value |
|-----------|-------|
| minSdkVersion | 26 (Android 8.0) |
| targetSdkVersion | 36 |
| compileSdkVersion | 36 |

Set via `expo-build-properties` plugin.

**minSdkVersion 26 covers:** Android 8.0+ — approximately 99%+ of active Android devices as of 2025.

## Phone and Tablet Support

| Device | Support |
|--------|---------|
| Android phone | ✅ Primary |
| Android tablet | ✅ via `withChromebookSupport` plugin |
| ChromeOS (Chromebook) | ✅ via `withChromebookSupport` plugin |
| Android TV | Not declared |

**`withChromebookSupport` plugin:** Listed in `app.json` plugins array. Adds large-screen and ChromeOS compatibility declarations to the AndroidManifest.

## Adaptive Icon

```json
"adaptiveIcon": {
  "foregroundImage": "./assets/images/adaptive-icon.png",
  "monochromeImage": "./assets/images/adaptive-icon.png",
  "backgroundColor": "#C4622D"
}
```

## Permissions

All permissions declared in `app.json` (16 total, deduplicated in Build 97):

| Permission | Purpose | Required |
|-----------|---------|----------|
| `android.permission.ACCESS_FINE_LOCATION` | Nearby business discovery | Optional |
| `android.permission.ACCESS_COARSE_LOCATION` | Nearby business discovery (coarse) | Optional |
| `android.permission.CAMERA` | Profile photo capture | Optional |
| `android.permission.READ_MEDIA_IMAGES` | Photo picker (Android 13+) | Optional |
| `android.permission.READ_EXTERNAL_STORAGE` | Photo access (Android 12 and below) | Optional |
| `android.permission.WRITE_EXTERNAL_STORAGE` | Save photos (Android 12 and below) | Optional |
| `android.permission.INTERNET` | Network access | Required |
| `android.permission.POST_NOTIFICATIONS` | Push notifications (Android 13+) | Optional |
| `android.permission.RECEIVE_BOOT_COMPLETED` | Push notification restart after reboot | Optional |
| `android.permission.VIBRATE` | Haptic feedback | Optional |
| `android.permission.READ_CONTACTS` | Find friends on platform | Optional |
| `android.permission.WRITE_CONTACTS` | — | Optional — may not be needed; verify |
| `android.permission.RECORD_AUDIO` | KinfolkAI voice input | Optional |
| `android.permission.MODIFY_AUDIO_SETTINGS` | Audio playback | Optional |
| `android.permission.FOREGROUND_SERVICE` | Audio background | Optional |
| `android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK` | Audio background (Android 14+) | Optional |

**Note:** `READ_CONTACTS` + `WRITE_CONTACTS` — these are declared. Verify `WRITE_CONTACTS` is actually used. If only reading contacts to find friends, `WRITE_CONTACTS` should be removed.

## Intent Filters (Deep Links)

```json
"intentFilters": [{
  "action": "VIEW",
  "autoVerify": true,
  "data": [{
    "scheme": "https",
    "host": "mappingwithmelanin.com"
  }],
  "category": ["BROWSABLE", "DEFAULT"]
}]
```

`autoVerify: true` — App Links verification. Requires `/.well-known/assetlinks.json` to be served at `https://mappingwithmelanin.com/.well-known/assetlinks.json`.

**Gap:** Whether `assetlinks.json` is configured and served is not confirmed in project documentation.

## Google Maps Configuration

Google Maps API key is passed via EAS env var `GOOGLE_MAPS_API_KEY` (in eas.json preview and production env blocks). The `withRnMapsPodfileFix` plugin handles iOS; Android uses the standard `react-native-maps` initialization.

**Note:** Unlike iOS, Android can receive the Google Maps API key via a Gradle variable. This is handled by the `react-native-maps` library's standard Android integration.

## Notification Configuration

```json
"expo-notifications": {
  "icon": "./assets/images/icon.png",
  "color": "#CA922B",
  "sounds": []
}
```

Expo-managed push notifications via Expo Push Service (FCM under the hood for Android).

## Network Security Configuration

`app.json` does not explicitly declare a `network_security_config`. Default Android network security applies: HTTPS required. No cleartext traffic exceptions declared.

## Orientation Behavior

`"orientation": "portrait"` in `app.json` — portrait-only for phone. Tablet/ChromeOS with `withChromebookSupport` may support additional orientations.

## Large-Screen / Tablet Support

- `withChromebookSupport` plugin adds `android:resizeableActivity="true"` and ChromeOS window management
- No explicit `ActivityInfo.SCREEN_ORIENTATION_SENSOR` for tablets — may be portrait-locked on large screens
- Google Play large-screen guidelines require testing on `sw600dp` (600dp shortest width) breakpoint

**Gap:** No Android tablet-specific layout optimization is confirmed in project documentation. This should be tested before submission.

## Build Type

```json
"android": {
  "buildType": "app-bundle"
}
```

Production: AAB (Android App Bundle) — required for Play Store. Internal distribution: APK.

## Google Play Testing Track

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./google-service-account.json",
      "track": "internal"
    }
  }
}
```

Submitting to **internal** testing track (closed, invitation-only). `google-service-account.json` is gitignored — must be present in Replit environment for `eas submit --platform android`.

## Android Version Code History

| versionCode | Notes |
|-------------|-------|
| ≤66 | Prior builds (VC66 referenced in project memory) |
| 67 | Last confirmed Android build (VC67 in project memory) |
| 68–70 | Not documented |
| **71** | **Proposed Build 97 Android build** |

**Gap:** versionCodes 68–70 are not documented. If any builds were submitted to Play Console with those codes, they must be lower than 71 for the new build to be accepted.

## Android Vitals

Available in Google Play Console for the internal track. No data exported to this package.

---

## Issues for Manus to Review

1. **`WRITE_CONTACTS` permission** — may not be needed if only reading contacts to find friends. Unnecessary permissions can trigger Play Store review or user concern.
2. **`assetlinks.json`** — required for `autoVerify: true` on intent filter to work. Must be served at `mappingwithmelanin.com/.well-known/assetlinks.json`.
3. **Tablet layout** — `withChromebookSupport` declared but no tablet-specific UI testing confirmed.
4. **versionCode 71** — if versionCodes 68–70 were ever submitted, verify the gap is acceptable.
5. **Google Maps key on Android** — verify the key is restricted to the correct package name in Google Cloud Console.
6. **AAB vs APK** — production submits AAB; internal testing can use APK. Verify the correct build profile is used for each submission type.
