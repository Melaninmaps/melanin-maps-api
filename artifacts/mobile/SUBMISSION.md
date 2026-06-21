# App Store Submission Guide — Mapping With Melanin™

## Prerequisites

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

3. Configure your Apple Developer and Google Play credentials in `eas.json`:
   - Update `appleId`, `ascAppId`, and `appleTeamId` under `submit.production.ios`
   - Place your Google service account JSON at `./google-service-account.json`

4. Set your `EXPO_PUBLIC_DOMAIN` in each build profile's `env` block (already set to `mappingwithmelanin.com`)

---

## Building

### Development build (for testing on a real device)
```bash
# iOS simulator
eas build --profile development --platform ios

# Android APK for sideloading
eas build --profile development --platform android
```

### Preview build (internal distribution / TestFlight)
```bash
eas build --profile preview --platform all
```

### Production build (for store submission)
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

---

## Submitting to the App Store

### Apple App Store
After a successful production build:
```bash
eas submit --platform ios --latest
```

Or submit a specific build by URL:
```bash
eas submit --platform ios --url <BUILD_URL>
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
- [ ] Content rating: Everyone
- [ ] Privacy policy URL: `https://mappingwithmelanin.com/privacy`
- [ ] Upload screenshots (min 2, see `store-assets/screenshot-guide.md`)
- [ ] Upload feature graphic (1024×500 PNG)

---

## Version Management

Version and build numbers are managed in `app.json`:
- `version` — semantic version shown to users (e.g. `"1.0.0"`)
- `ios.buildNumber` — increment for each iOS submission
- `android.versionCode` — increment integer for each Android submission

With `autoIncrement: true` in the production build profile, EAS auto-increments these on each build.

---

## Review Notes for App Store

When submitting for the first time, include this message in the "Notes for Reviewer" field:

> Mapping With Melanin™ is a community discovery platform for finding Black-owned businesses and neighborhood safety intelligence. The app requires location access to show nearby businesses (used only when in use). The app is currently in early access via an invitation/waitlist system. Test account: use the demo mode on the login screen — no account required to browse businesses and the map. For full access, register at mappingwithmelanin.com/waitlist.

---

## Useful Commands

```bash
# Check build status
eas build:list

# View specific build logs
eas build:view <BUILD_ID>

# Update OTA (without a full store submission) — for JS-only changes
eas update --branch production --message "Hot fix: description"
```
