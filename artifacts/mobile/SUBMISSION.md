# App Store Submission Guide — Mapping With Melanin™

This document covers everything needed to build and submit Mapping With Melanin to the Apple App Store and Google Play using EAS (Expo Application Services).

---

## Prerequisites

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```
   > Use the `tlindsay428` Expo account. Create one at https://expo.dev if needed.

3. All submission credentials are already configured in `eas.json`:
   - **iOS:** `appleId`, `ascAppId` (`6783773366`), `appleTeamId` (`Y46Y4A5MMZ`)
   - **Android:** `./google-service-account.json` (in place), `track: "internal"`

   No changes to `eas.json` are needed — run from `artifacts/mobile/`.

---

## Environment Variables

The production build requires the following environment variable set in your EAS project secrets (https://expo.dev → your project → Secrets):

| Secret name | Description |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Google Maps API key for iOS and Android map rendering |

Set it via CLI:

```bash
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value YOUR_KEY_HERE
```

---

## Internal Testing Setup

This section covers getting real builds in front of your internal team before going to the public stores.

### Step 1 — Build for internal testing

All commands must be run from the `artifacts/mobile/` directory.

```bash
cd artifacts/mobile

# Build for both platforms (internal distribution)
eas build --profile preview --platform all
```

- **iOS:** Produces a signed `.ipa` distributed via the Expo install link (no TestFlight needed for the `preview` profile).
- **Android:** Produces an `.apk` for direct sideloading.

Share the install links from the EAS dashboard or via:
```bash
eas build:list
```

### Step 2 — Upload to TestFlight (iOS)

To get the build into TestFlight so Apple testers can install it from the TestFlight app, use the **production** profile and then submit:

```bash
cd artifacts/mobile

# Build a production .ipa
eas build --profile production --platform ios

# Submit the latest build to App Store Connect / TestFlight
eas submit --platform ios --latest
```

EAS will use the credentials already in `eas.json` (`appleId`, `ascAppId`, `appleTeamId`).

**After submission, add internal testers in App Store Connect:**
1. Go to https://appstoreconnect.apple.com
2. Select **Mapping With Melanin** → **TestFlight**
3. Click the build under **iOS Builds**
4. Under **Internal Testing**, click **+** to add tester groups or individual emails
5. Internal testers receive a TestFlight invite email and can install immediately (no Apple review needed)

> Internal testing in TestFlight supports up to **100 testers**. They must be added to App Store Connect as users first (Users & Access → People).

### Step 3 — Upload to Google Play Internal Testing (Android)

```bash
cd artifacts/mobile

# Build a production .aab
eas build --profile production --platform android

# Submit to the internal testing track on Google Play
eas submit --platform android --latest
```

EAS uses `./google-service-account.json` and targets `track: "internal"` as set in `eas.json`.

**After submission, add internal testers in Google Play Console:**
1. Go to https://play.google.com/console
2. Select **Mapping With Melanin** → **Testing** → **Internal testing**
3. Click **Testers** tab → **Create email list** (or use an existing list)
4. Add tester email addresses and click **Save**
5. Click **Release** on the uploaded build to make it available to the list
6. Testers receive an opt-in link and can install via the Play Store

> Internal testing on Google Play supports up to **100 testers** and goes live immediately (no Google review).

### Step 4 — Verify tester access

**iOS:** Testers open the TestFlight app, accept the invite, and install. They should see version **1.1.2** (build 26+).

**Android:** Testers visit the opt-in URL from the Play Console, then install from the Play Store. They should see version **1.1.2** (versionCode 46+).

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

### Preview build (internal distribution — no store upload)
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
- **iOS:** Produces an `.ipa` signed with your App Store distribution certificate.
- **Android:** Produces an `.aab` (Android App Bundle).
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
- `version` — semantic version shown to users (e.g. `"1.1.2"`)
- `ios.buildNumber` — increment for each iOS submission (currently `"26"`)
- `android.versionCode` — increment integer for each Android submission (currently `46`)

With `autoIncrement: true` in the production build profile, EAS auto-increments these on each build.

**Release Process:**
1. Increment `version` in `app.json` (e.g. `1.1.2` → `1.2.0`)
2. Update `store-assets/whats-new.txt` with release notes
3. Run `eas build --platform all --profile production`
4. Run `eas submit --platform all --profile production`

---

## Review Notes for App Store

When submitting for the first time, include this message in the "Notes for Reviewer" field:

> Mapping With Melanin™ is a community discovery platform for finding minority-owned businesses and neighborhood safety intelligence. The app requires location access to show nearby businesses (used only when in use). The app is currently in early access via an invitation/waitlist system. Test account: use the demo mode on the login screen — no account required to browse businesses and the map. For full access, register at mappingwithmelanin.com/waitlist.

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

# List and manage EAS secrets
eas secret:list
eas secret:create --scope project --name KEY_NAME --value VALUE
```

**Useful Links:**
- EAS Build docs: https://docs.expo.dev/build/introduction/
- EAS Submit docs: https://docs.expo.dev/submit/introduction/
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- Expo dashboard: https://expo.dev
- Privacy policy: https://mappingwithmelanin.com/privacy
