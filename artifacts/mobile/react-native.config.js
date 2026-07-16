/**
 * react-native.config.js
 *
 * WHY THIS EXISTS:
 *   Two separate autolinking systems run during Expo prebuild:
 *     1. React Native CLI  — via `use_react_native!` in the Podfile
 *     2. Expo autolinking  — via `use_expo_modules!` in the Podfile
 *
 *   For react-native-maps, both fire:
 *     - RN CLI reads the package's own config → adds pod 'react-native-maps'
 *     - Expo autolinking reads the package config → adds pod 'react-native-google-maps'
 *
 *   Both pods compile from the same source files → 339 duplicate AIR* symbols
 *   → linker crash ("linker command failed with exit code 1").
 *
 * FIX:
 *   Disable RN CLI's iOS autolinking for react-native-maps here so only
 *   Expo's autolinking runs. Expo generates 'react-native-google-maps', and
 *   withRnMapsPodfileFix.js ensures the matching podspec exists at pod install time.
 *
 *   platforms.ios: null  → RN CLI skips iOS for this package only.
 *   Android is unaffected (no entry = default autolinking behavior).
 */
module.exports = {
  dependencies: {
    'react-native-maps': {
      platforms: {
        ios: null,
      },
    },
  },
};
