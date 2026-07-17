/**
 * react-native.config.js
 *
 * Keep this minimal. iOS maps work via RN CLI autolinking only (react-native-maps.podspec).
 * DO NOT add platforms: { ios: null } — it breaks use_react_native! during pod install.
 *
 * Root cause of the 36-build failure chain (resolved July 2026):
 *   app.config.js was setting ios.config.googleMapsApiKey = GOOGLE_MAPS_API_KEY.
 *   Expo's built-in @expo/config-plugins/build/ios/Maps.js reads config.ios.config.googleMapsApiKey
 *   and when truthy, injects `pod 'react-native-google-maps'` into the Podfile.
 *   The react-native-maps npm package does NOT ship react-native-google-maps.podspec,
 *   so every CocoaPods install failed with "No podspec found" or "name mismatch".
 *   Fix: removed ios.config.googleMapsApiKey from app.config.js. App uses PROVIDER_DEFAULT
 *   (Apple Maps) on iOS — no Google Maps SDK ever needed on iOS.
 */
module.exports = {
  dependencies: {},
};
