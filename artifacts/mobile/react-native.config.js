/**
 * react-native.config.js
 *
 * Points autolinking to the correct podspec file for react-native-maps.
 *
 * react-native-maps@1.27.x ships react-native-maps.podspec with:
 *   s.name = "react-native-google-maps"   ← set by upstream, we patch this in
 *                                            plugins/withRnMapsPodfileFix.js
 *
 * withRnMapsPodfileFix.js patches s.name → "react-native-maps" at prebuild time,
 * so link_native_modules! generates:
 *   pod 'react-native-maps', :path => '...node_modules/react-native-maps'
 * and CocoaPods finds react-native-maps.podspec by filename — SUCCESS.
 *
 * This podspecPath override ensures the codegen step also reads the right file.
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
