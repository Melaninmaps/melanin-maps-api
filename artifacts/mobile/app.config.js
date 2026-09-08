const mapsKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
const commitSha =
  process.env.EAS_BUILD_GIT_COMMIT_HASH ??
  process.env.GITHUB_SHA ??
  process.env.MWM_BUILD_COMMIT_SHA ??
  process.env.REPLIT_GIT_COMMIT_SHA ??
  "unknown";
const releaseChannel = process.env.APP_RELEASE_CHANNEL ?? "production";
const environment = process.env.APP_ENV ?? "production";
const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
const apiOrigin = process.env.EXPO_PUBLIC_API_ORIGIN ?? (domain ? `https://${domain}` : "");
const revenueCatEnabled = process.env.EXPO_PUBLIC_REVENUECAT_ENABLED === "true";

if (environment === "staging") {
  if (domain !== "mwm-staging.35.196.78.19.nip.io") {
    throw new Error("Staging Expo config requires the reviewed staging API domain");
  }
  if (apiOrigin !== "https://mwm-staging.35.196.78.19.nip.io") {
    throw new Error("Staging Expo config requires the reviewed staging API origin");
  }
  if (revenueCatEnabled) {
    throw new Error("RevenueCat must remain disabled for Build 107 staging");
  }
}
if (releaseChannel === "testflight-staging" && environment !== "staging") {
  throw new Error("The testflight-staging channel requires APP_ENV=staging");
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  updates: environment === "staging"
    ? { ...(config.updates ?? {}), enabled: false, checkAutomatically: "NEVER" }
    : config.updates,
  ios: {
    ...config.ios,
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      ...(environment === "staging" ? { EXUpdatesEnabled: false } : {}),
    },
  },
  extra: {
    ...(config.extra ?? {}),
    commitSha,
    releaseChannel,
    environment,
    apiOrigin,
    revenueCatEnabled,
  },
  plugins: [
    ...(config.plugins ?? []),
    "expo-asset",
    "expo-secure-store",
    "expo-sharing",
    "expo-video",
    // NOTE: @sentry/react-native was removed from this plugin list.
    // The native Sentry SDK (KSCrash) auto-initialises before JS runs and
    // caused a native crash on launch for all testers on Build 100.
    // JS-level crash reporting (AsyncStorage + Railway POST) remains active
    // via lib/crashLogger.ts without needing any native module.
    // Re-add with a confirmed SENTRY_DSN once the native integration is
    // properly configured and tested on a dev/preview build first.
  ],
  // NOTE: ios.config.googleMapsApiKey is intentionally NOT set here.
  // The app uses PROVIDER_DEFAULT (Apple Maps) on iOS — no Google Maps SDK needed on iOS.
  // Setting ios.config.googleMapsApiKey causes Expo's built-in Maps.js plugin to inject
  // `pod 'react-native-google-maps'` into the Podfile, but that podspec doesn't exist
  // in the react-native-maps npm package, causing all iOS CocoaPods builds to fail.
  // Google Maps API key is only needed on Android (handled below via android.config.googleMaps).
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: mapsKey,
      },
    },
  },
});
