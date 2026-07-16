/**
 * react-native.config.js
 *
 * IMPORTANT — do NOT add a podspecPath override for react-native-maps here.
 *
 * A podspecPath override causes two separate pod entries in the Podfile:
 *   pod 'react-native-maps'        ← from this override (npm package name)
 *   pod 'react-native-google-maps' ← from Expo autolinking (reads s.name)
 * Both compile from the same source → 339 duplicate symbols → linker crash.
 *
 * Instead, Expo autolinking discovers react-native-maps automatically and
 * generates ONE entry ('react-native-google-maps') based on s.name.
 * The withRnMapsPodfileFix.js plugin ensures react-native-google-maps.podspec
 * exists so CocoaPods can resolve that single entry correctly.
 */
module.exports = {
  dependencies: {},
};
