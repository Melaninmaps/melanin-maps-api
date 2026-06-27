# App Store Submission Guide — Mapping With Melanin™

This document covers everything needed to build and submit Mapping With Melanin to the Apple App Store and Google Play using EAS (Expo Application Services).

## Prerequisites

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```
   > Create a free Expo account at https://expo.dev if you don't have one.

3. Link the project to EAS:
   Run this once from the `artifacts/mobile/` directory:
   ```bash
   eas init
   ```
   Accept the prompts and confirm the bundle identifier (`com.melaninmaps.app`).

4. Configure your Apple Developer and Google Play credentials in `eas.json`:
   - Update `appleId`, `ascAppId`, and `appleTeamId` under `submit.production.ios`
   - Place your Google service account JSON at `./google-service-account.json` (from Google Play Console → Setup → API access)

5. Set your `EXPO_PUBLIC_DOMAIN` in each build profile's `env` block (already set to `mappingwithmelanin.com`)

---

## Environment Variables

The production build requires the following environment variable to be set in your EAS project secrets (https://expo.dev → your project → Secrets):

| Secret name | Description |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Google Maps API key for iOS and Android map rendering |

Set it via CLI:

```bash
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value YOUR_KEY_HERE
```

---

## Building

All commands must be run from the `artifacts/mobile/` directory.

### Development build (for testing on a real device / simulator)
```bash
# iOS simulator
eas build --profile development --platform ios

# Android APK for sideloading
eas build --profile development --platform android
```

### Preview build (internal distribution / share with testers)
```bash
eas build --profile preview --platform all
```
Share the install link from the EAS dashboard or via `eas build:list`.

### Production build (for store submission)
```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android

# Both platforms simultaneously
eas build --profile production --platform all
```
- **iOS:** This produces an `.ipa` file signed with your App Store distribution certificate.
- **Android:** This produces an `.aab` (Android App Bundle).
- **Important:** EAS stores your keystore securely. Download a backup from the EAS dashboard after the first build — losing the keystore means you cannot update the app on Google Play.

---

## Submitting to the Stores

### Apple App Store
After a successful production build:
```bash
eas submit --platform ios --latest
```

**App Store Connect checklist before submitting:**
- [ ] App name: `Mapping With Melanin`
- [ ] Subtitle: `Community Discovery & Travel`
- [ ] Category: Travel (primary), Lifestyle (secondary)
- [ ] Privacy policy URL: `https://mappingwithmelanin.com/privacy`
- [ ] Support URL: `https://mappingwithmelanin.com`
- [ ] Marketing URL: `https://mappingwithmelanin.com`
- [ ] Age rating: 4+ (no restricted content)
- [ ] Upload screenshots for all required device sizes (see `store-assets/screenshot-guide.md`)
- [ ] Paste description from `store-assets/app-store-description.txt`
- [ ] Paste keywords from `store-assets/keywords.txt` (100 chars max)
- [ ] Paste release notes from `store-assets/whats-new.txt`

### Google Play Store
After a successful production build:
```bash
eas submit --platform android --latest
```

**Google Play Console checklist before submitting:**
- [ ] App name: `Mapping With Melanin`
- [ ] Short description (from `store-assets/short-description.txt`)
- [ ] Full description (from `store-assets/play-store-description.txt`)
- [ ] Category: Travel & Local
- [ ] Target audience: 17+ (or Everyone based on final rating)
- [ ] Privacy policy URL: `https://mappingwithmelanin.com/privacy`
- [ ] Upload screenshots (min 2, see `store-assets/screenshot-guide.md`)
- [ ] Upload feature graphic (1024×500 PNG)

---

## Version Management & Bump Process

Version and build numbers are managed in `app.json`:
- `version` — semantic version shown to users (e.g. `"1.0.0"`)
- `ios.buildNumber` — increment for each iOS submission
- `android.versionCode` — increment integer for each Android submission

With `autoIncrement: true` in the production build profile, EAS auto-increments these on each build.

**Release Process:**
1. Increment `version` in `app.json` (e.g. `1.0.0` → `1.1.0`)
2. Update `store-assets/whats-new.txt` with release notes
3. Run `eas build --platform all --profile production`
4. Run `eas submit --platform all --profile production`

---

## Review Notes for App Store

When submitting for the first time, include this message in the "Notes for Reviewer" field:

> Mapping With Melanin™ is a community discovery platform for finding Black-owned businesses and neighborhood safety intelligence. The app requires location access to show nearby businesses (used only when in use). The app is currently in early access via an invitation/waitlist system. Test account: use the demo mode on the login screen — no account required to browse businesses and the map. For full access, register at mappingwithmelanin.com/waitlist.

---

## Useful Commands & Links

**CLI Commands:**
```bash
# Check build status
eas build:list

# View specific build logs
eas build:view <BUILD_ID>

# Update OTA (without a full store submission) — for JS-only changes
eas update --branch production --message "Hot fix: description"
```

**Useful Links:**
- EAS Build docs: https://docs.expo.dev/build/introduction/
- EAS Submit docs: https://docs.expo.dev/submit/introduction/
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- Expo dashboard: https://expo.dev
- Privacy policy: https://www.melaninmaps.com/privacy

