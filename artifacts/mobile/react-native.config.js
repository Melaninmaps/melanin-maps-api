/**
 * react-native.config.js
 *
 * platforms.ios: null tells RN CLI's autolinking to skip iOS for react-native-maps.
 *
 * WHY: react-native-maps@1.27.2's podspec declares s.name = "react-native-google-maps".
 * Expo's autolinking reads that s.name and adds:  pod 'react-native-google-maps'
 * RN CLI reads the filename (react-native-maps.podspec) and adds: pod 'react-native-maps'
 * Both resolve to the same source directory → 339 duplicate AIR* symbols → linker crash.
 *
 * With platforms.ios: null here, RN CLI skips iOS. Expo still adds 'react-native-google-maps'.
 * The pnpm patch (patches/react-native-maps@1.27.2.patch) ensures react-native-google-maps.podspec
 * exists in the package before pod install runs, so CocoaPods resolves it cleanly.
 * Result: one pod, one set of AIR* symbols, no duplicates.
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
