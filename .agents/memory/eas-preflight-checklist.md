---
name: EAS production build pre-flight checklist
description: Steps to verify before triggering any EAS production build, to avoid wasted builds and charges.
---

# EAS Production Build Pre-Flight Checklist

Always complete these checks before running `eas build --profile production`.

## 1. babel.config.js has required plugins
- `react-native-worklets/plugin` must be in the plugins array (Reanimated 4 requirement)
- Without it, the app builds fine but crashes immediately on launch on real devices

## 2. Version code is fresh
- Check Play Console (Android): Testing → Internal/Closed testing → what versionCodes are already uploaded?
- Check App Store Connect (iOS): TestFlight → what build numbers are already uploaded?
- versionCode/buildNumber must be higher than any previously uploaded build, across ALL tracks

## 3. targetSdkVersion meets store requirements
- Google Play requires targetSdkVersion ≥ 35 (as of 2026)
- Set in app.json under `expo.android.targetSdkVersion`

## 4. Env vars baked into production build
- Check eas.json `production.env` section
- EXPO_PUBLIC_DOMAIN and GOOGLE_MAPS_API_KEY must be present
- RevenueCat keys (EXPO_PUBLIC_REVENUECAT_*) are only needed if Android revenuecat.android.tsx is not a no-op

## 5. expo install --check passes
- Run before building to catch incompatible package versions
- Mismatched versions cause NoClassDefFoundError on Android launch

**Why:** Each wasted build costs real money and time. These checks take 2 minutes and prevent hours of debugging.
