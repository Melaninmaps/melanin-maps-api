const mapsKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
const commitSha =
  process.env.EAS_BUILD_GIT_COMMIT_HASH ??
  process.env.GITHUB_SHA ??
  process.env.REPLIT_GIT_COMMIT_SHA ??
  "unknown";
const releaseChannel = process.env.APP_RELEASE_CHANNEL ?? "production";
const environment = process.env.APP_ENV ?? "production";

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    commitSha,
    releaseChannel,
    environment,
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
