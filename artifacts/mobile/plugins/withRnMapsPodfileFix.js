/**
 * withRnMapsPodfileFix.js
 *
 * Fixes the CocoaPods pod-name mismatch that crashes iOS builds when
 * googleMapsApiKey is set in app.json.
 *
 * ROOT CAUSE (as of react-native-maps 1.27.2):
 *   react-native-maps.podspec declares s.name = "react-native-maps" (NOT "react-native-google-maps").
 *   Expo's built-in maps config plugin (triggered by ios.config.googleMapsApiKey in app.json)
 *   still uses the OLD pod name and injects into the Podfile:
 *
 *     pod 'react-native-google-maps', :path => '../../../node_modules/react-native-maps'
 *
 *   CocoaPods finds the podspec, sees s.name = "react-native-maps", and rejects it:
 *     [!] The name of the given podspec `react-native-maps` doesn't match
 *         the expected one `react-native-google-maps`
 *
 * FIX:
 *   During expo prebuild (after Expo has written the Podfile), find every occurrence of
 *     pod 'react-native-google-maps'
 *   and replace with
 *     pod 'react-native-maps/Google'
 *
 *   The `/Google` subspec is defined in react-native-maps.podspec and includes:
 *     - ios/AirGoogleMaps/** source files
 *     - dependency 'GoogleMaps', '9.4.0'
 *     - dependency 'Google-Maps-iOS-Utils', '6.1.0'
 *
 *   CocoaPods then merges:
 *     pod 'react-native-maps'         (from RN CLI autolinking — Maps subspec)
 *     pod 'react-native-maps/Google'  (from this fix — Google subspec)
 *   → single `react-native-maps` target, both subspecs, one set of AIR* symbols.
 *   No duplicate symbols. No name mismatch. Build passes.
 *
 * BUILD HISTORY:
 *   73: JS Podfile text removal → use_react_native! generates pod lines at runtime
 *   74-76: Ruby podspec shim → CocoaPods version conflicts / rejection
 *   77: EXCLUDED_SOURCE_FILE_NAMES → flag is in xcconfig, not Xcode project
 *   78: xcconfig surgery with wrong (unquoted) regex → 0 patched
 *   79: platforms:{ios:null} in react-native.config.js → broke pod install itself
 *   80: podspec copy in eas-build-post-install → copied to wrong location
 *   81: podspec copy moved into plugin → copy has s.name="react-native-maps" mismatch
 *   82: replace 'react-native-google-maps' → 'react-native-maps/Google' in Podfile text (this)
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withRnMapsPodfileFix(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      if (!fs.existsSync(podfilePath)) {
        console.warn("[withRnMapsPodfileFix] Podfile not found — skipping.");
        return config;
      }

      let podfile = fs.readFileSync(podfilePath, "utf8");

      if (!podfile.includes("react-native-google-maps")) {
        console.log(
          "[withRnMapsPodfileFix] No 'react-native-google-maps' reference found in Podfile — nothing to fix."
        );
        return config;
      }

      // Replace the old pod name with the correct subspec name.
      // Handles both single and double quote variants.
      const before = podfile;
      podfile = podfile
        .replace(/pod 'react-native-google-maps'/g, "pod 'react-native-maps/Google'")
        .replace(/pod "react-native-google-maps"/g, 'pod "react-native-maps/Google"');

      if (podfile === before) {
        console.warn(
          "[withRnMapsPodfileFix] 'react-native-google-maps' found but replacement had no effect — check Podfile format."
        );
        // Log context lines for debugging
        const lines = before.split("\n");
        lines.forEach((line, i) => {
          if (line.includes("react-native-google-maps")) {
            console.log(`[withRnMapsPodfileFix] Line ${i + 1}: ${line}`);
          }
        });
        return config;
      }

      fs.writeFileSync(podfilePath, podfile, "utf8");

      const count = (before.match(/react-native-google-maps/g) || []).length;
      console.log(
        `[withRnMapsPodfileFix] Replaced ${count} occurrence(s) of 'react-native-google-maps' → 'react-native-maps/Google' in Podfile.`
      );

      return config;
    },
  ]);
};
