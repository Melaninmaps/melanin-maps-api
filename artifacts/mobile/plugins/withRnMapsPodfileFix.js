/**
 * Expo config plugin — fix for the react-native-maps pod name mismatch.
 *
 * ROOT CAUSE:
 *   react-native-maps@1.27.x ships `react-native-maps.podspec` but inside
 *   that file: s.name = "react-native-google-maps"
 *
 *   `link_native_modules!` reads the podspec and generates:
 *     pod 'react-native-google-maps', :path => '...react-native-maps'
 *
 *   CocoaPods then looks for `react-native-google-maps.podspec` in the directory —
 *   finds only `react-native-maps.podspec` — FAILS.
 *
 * FIX:
 *   Patch the podspec's s.name from "react-native-google-maps" to "react-native-maps"
 *   BEFORE pod install runs. This makes link_native_modules! generate:
 *     pod 'react-native-maps', :path => '...react-native-maps'
 *   and CocoaPods finds react-native-maps.podspec by filename — SUCCESS.
 *
 * TIMING: withDangerousMod for "ios" runs during `expo prebuild`, after
 * pnpm install but before `pod install` — exactly what we need.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withRnMapsPodfileFix(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const podspecPath = path.join(
        projectRoot,
        "node_modules",
        "react-native-maps",
        "react-native-maps.podspec"
      );

      if (!fs.existsSync(podspecPath)) {
        console.warn("[withRnMapsPodfileFix] react-native-maps.podspec not found — skipping.");
        return config;
      }

      let podspec = fs.readFileSync(podspecPath, "utf8");

      const wrongNameDouble = 's.name = "react-native-google-maps"';
      const wrongNameSingle = "s.name = 'react-native-google-maps'";

      if (podspec.includes(wrongNameDouble)) {
        podspec = podspec.replace(wrongNameDouble, 's.name = "react-native-maps"');
        fs.writeFileSync(podspecPath, podspec, "utf8");
        console.log("[withRnMapsPodfileFix] Patched react-native-maps.podspec: s.name 'react-native-google-maps' → 'react-native-maps'");
      } else if (podspec.includes(wrongNameSingle)) {
        podspec = podspec.replace(wrongNameSingle, "s.name = 'react-native-maps'");
        fs.writeFileSync(podspecPath, podspec, "utf8");
        console.log("[withRnMapsPodfileFix] Patched react-native-maps.podspec: s.name 'react-native-google-maps' → 'react-native-maps'");
      } else {
        console.log("[withRnMapsPodfileFix] react-native-maps.podspec s.name already correct — no change needed.");
      }

      return config;
    },
  ]);
};
