/**
 * react-native.config.js
 *
 * Keep this minimal. The duplicate-pod problem (react-native-maps +
 * react-native-google-maps) is resolved by two mechanisms:
 *
 *   1. artifacts/mobile/scripts/create-rn-maps-podspec.js (runs in eas-build-post-install)
 *      Creates react-native-google-maps.podspec before pod install so Expo's
 *      pod 'react-native-google-maps' entry resolves cleanly.
 *
 *   2. withRnMapsPodfileFix.js post_install hook
 *      Removes -l"react-native-maps" from CocoaPods-generated xcconfig files
 *      so the linker never pulls in libreact-native-maps.a (no duplicate AIR* symbols).
 *
 * DO NOT add platforms: { ios: null } here — it breaks use_react_native! during
 * pod install.
 */
module.exports = {
  dependencies: {},
};
