/**
 * react-native.config.js
 *
 * CRITICAL: The `podspecPath` override for react-native-maps is required.
 *
 * react-native-maps@1.27.x ships react-native-maps.podspec with:
 *   s.name = "react-native-maps"
 *
 * But React Native autolinking generates:
 *   pod 'react-native-google-maps', :path => '...node_modules/react-native-maps'
 *
 * CocoaPods then fails: "No podspec found for 'react-native-google-maps'".
 *
 * By explicitly setting podspecPath here, autolinking reads react-native-maps.podspec
 * (s.name = "react-native-maps") and generates:
 *   pod 'react-native-maps', :path => '...node_modules/react-native-maps'
 * which CocoaPods CAN find. This is the source-of-truth fix — the Podfile never
 * gets the wrong name in the first place.
 */
module.exports = {
  dependencies: {
    'react-native-maps': {
      platforms: {
        ios: {
          podspecPath: './node_modules/react-native-maps/react-native-maps.podspec',
        },
      },
    },
  },
};
