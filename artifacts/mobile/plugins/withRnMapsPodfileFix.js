/**
 * Expo config plugin — belt-and-suspenders fix for the react-native-maps pod name mismatch.
 *
 * The DEFINITIVE fix is react-native.config.js (podspecPath override) which prevents
 * autolinking from ever generating the wrong pod name. This plugin is a secondary
 * safeguard that runs during `expo prebuild` and corrects the Podfile if needed.
 *
 * react-native-maps@1.27.x ships with s.name = "react-native-maps" in its podspec,
 * but Expo's autolinking may generate either:
 *   pod 'react-native-google-maps', :path => '...'   ← single quotes
 *   pod "react-native-google-maps", :path => '...'   ← double quotes
 *
 * CocoaPods fails: "No podspec found for 'react-native-google-maps'".
 * This plugin rewrites both variants to the correct pod name.
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

      // Check for both single-quoted and double-quoted variants
      const hasSingleQuote = podfile.includes("pod 'react-native-google-maps'");
      const hasDoubleQuote = podfile.includes('pod "react-native-google-maps"');

      if (!hasSingleQuote && !hasDoubleQuote) {
        console.log(
          "[withRnMapsPodfileFix] Podfile already uses 'react-native-maps' — no change needed."
        );
        return config;
      }

      // Replace both single-quoted and double-quoted variants
      podfile = podfile.replace(
        /pod ['"]react-native-google-maps['"]/g,
        "pod 'react-native-maps'"
      );

      fs.writeFileSync(podfilePath, podfile, "utf8");
      console.log(
        "[withRnMapsPodfileFix] Patched Podfile: 'react-native-google-maps' -> 'react-native-maps'"
      );

      return config;
    },
  ]);
};
