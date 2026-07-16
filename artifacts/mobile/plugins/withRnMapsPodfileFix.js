/**
 * Expo config plugin — fixes the react-native-maps pod name mismatch.
 *
 * react-native-maps@1.27.x ships with s.name = "react-native-maps" in its podspec,
 * but Expo's autolinking generates:
 *   pod 'react-native-google-maps', :path => '...node_modules/react-native-maps'
 *
 * CocoaPods then fails: "No podspec found for 'react-native-google-maps'".
 *
 * This plugin runs during `expo prebuild` (via withDangerousMod) — AFTER the
 * Podfile is generated but BEFORE pod install — and rewrites the pod name in the
 * Podfile to match the actual podspec name.
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
          "[withRnMapsPodfileFix] Podfile already uses 'react-native-maps' — no change needed."
        );
        return config;
      }

      // Replace pod name so it matches the actual podspec s.name
      podfile = podfile.replace(
        /pod 'react-native-google-maps',/g,
        "pod 'react-native-maps',"
      );

      fs.writeFileSync(podfilePath, podfile, "utf8");
      console.log(
        "[withRnMapsPodfileFix] Patched Podfile: 'react-native-google-maps' -> 'react-native-maps'"
      );

      return config;
    },
  ]);
};
