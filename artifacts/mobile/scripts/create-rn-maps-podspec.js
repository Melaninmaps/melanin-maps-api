/**
 * create-rn-maps-podspec.js
 *
 * DEPRECATED — no longer creates react-native-google-maps.podspec.
 *
 * The podspec copy approach caused a CocoaPods name mismatch:
 *   react-native-maps.podspec has s.name = "react-native-maps"
 *   Copying it to react-native-google-maps.podspec still has s.name = "react-native-maps"
 *   CocoaPods rejects: "name of podspec `react-native-maps` doesn't match expected `react-native-google-maps`"
 *
 * The correct fix is in withRnMapsPodfileFix.js (config plugin):
 *   Replaces pod 'react-native-google-maps' → pod 'react-native-maps/Google' in the Podfile.
 *   This uses the existing /Google subspec in react-native-maps.podspec which correctly
 *   declares GoogleMaps 9.4.0 and Google-Maps-iOS-Utils 6.1.0 as dependencies.
 */
console.log("[create-rn-maps-podspec] No-op: podspec fix is now handled by withRnMapsPodfileFix.js config plugin.");
process.exit(0);
