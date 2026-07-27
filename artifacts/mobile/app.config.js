const mapsKey = process.env.GOOGLE_MAPS_API_KEY ?? "";

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
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
