/**
 * withRnMapsPodfileFix.js
 *
 * Removes the invalid `pod 'react-native-google-maps'` entry that Expo's built-in
 * maps config plugin injects when googleMapsApiKey is set in app.json.
 *
 * ROOT CAUSE:
 *   Expo's maps plugin (triggered by ios.config.googleMapsApiKey) adds to the Podfile:
 *     pod 'react-native-google-maps', :path => '../../../node_modules/react-native-maps'
 *   But react-native-maps 1.27.2's podspec declares s.name = "react-native-maps" (not
 *   "react-native-google-maps"), so CocoaPods rejects it:
 *     [!] The name of the given podspec `react-native-maps` doesn't match
 *         the expected one `react-native-google-maps`
 *
 *   Simultaneously, RN CLI autolinking ALSO adds:
 *     pod 'react-native-maps', :path => '...'
 *   which is the correct entry.
 *
 * FIX:
 *   Remove the `pod 'react-native-google-maps'` line entirely.
 *   The RN CLI's `pod 'react-native-maps'` stays and is sufficient.
 *   The app uses PROVIDER_DEFAULT (Apple Maps) on iOS — no Google Maps SDK needed.
 *
 * BUILD HISTORY:
 *   73: JS Podfile text removal → can't remove use_react_native! runtime lines
 *   74-76: Ruby podspec shim → CocoaPods version conflicts / rejection
 *   77: EXCLUDED_SOURCE_FILE_NAMES → flag in xcconfig, not Xcode project, no-op
 *   78: xcconfig surgery, unquoted regex → 0 patched
 *   79: platforms:{ios:null} → broke use_react_native! during pod install
 *   80: podspec copy in eas-build-post-install → wrong location
 *   81: podspec copy in plugin → s.name mismatch (copy still said "react-native-maps")
 *   82: replaced with react-native-maps/Google → GoogleMaps 9.4.0 dep unresolvable in EAS
 *   83: remove the invalid pod line entirely (this build)
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
          "[withRnMapsPodfileFix] No 'react-native-google-maps' in Podfile — nothing to remove."
        );
        return config;
      }

      // Log every matching line for diagnosis before removing
      const lines = podfile.split("\n");
      lines.forEach((line, i) => {
        if (line.includes("react-native-google-maps")) {
          console.log(`[withRnMapsPodfileFix] Removing line ${i + 1}: ${line.trim()}`);
        }
      });

      // Remove any line that references react-native-google-maps
      // (handles both single and double quotes, any :path variant)
      const cleaned = lines
        .filter((line) => !line.includes("react-native-google-maps"))
        .join("\n");

      fs.writeFileSync(podfilePath, cleaned, "utf8");

      const removed = lines.length - cleaned.split("\n").length;
      console.log(
        `[withRnMapsPodfileFix] Removed ${removed} line(s) containing 'react-native-google-maps'. Pod install will use RN CLI's 'react-native-maps' entry only.`
      );

      return config;
    },
  ]);
};
