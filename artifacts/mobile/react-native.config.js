/**
 * react-native.config.js
 *
 * Keep this minimal. Do NOT add a podspecPath override for react-native-maps.
 *
 * The duplicate-pod problem (react-native-maps + react-native-google-maps) is
 * handled entirely inside withRnMapsPodfileFix.js, which:
 *   1. Creates react-native-google-maps.podspec so Expo's pod entry resolves.
 *   2. Removes the `pod 'react-native-maps'` line from the Podfile text so the
 *      RN CLI duplicate is gone before CocoaPods ever reads it.
 */
module.exports = {
  dependencies: {},
};
