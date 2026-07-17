/**
 * withRnMapsPodfileFix.js — safety-net only (build 79+)
 *
 * The duplicate-pod problem is now solved at two levels:
 *
 *   1. pnpm patch (patches/react-native-maps@1.27.2.patch)
 *      Adds react-native-google-maps.podspec to the package so
 *      Expo's `pod 'react-native-google-maps'` resolves correctly.
 *
 *   2. react-native.config.js  platforms.ios: null
 *      Tells RN CLI to skip iOS autolinking for react-native-maps,
 *      preventing `pod 'react-native-maps'` from being added at all.
 *
 * This plugin is kept as a safety net: it verifies the patch is in place
 * during prebuild and logs a warning if it's missing.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withRnMapsPodfileFix(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      // Verify the pnpm patch was applied: react-native-google-maps.podspec should exist.
      const rnMapsDir = path.join(
        config.modRequest.projectRoot,
        "node_modules",
        "react-native-maps"
      );
      const patchedPodspec = path.join(rnMapsDir, "react-native-google-maps.podspec");

      if (fs.existsSync(patchedPodspec)) {
        console.log("[withRnMapsPodfileFix] react-native-google-maps.podspec confirmed present.");
      } else {
        console.warn(
          "[withRnMapsPodfileFix] WARNING: react-native-google-maps.podspec NOT found at " +
          patchedPodspec +
          ". The pnpm patch may not have been applied. Run `pnpm install` and rebuild."
        );
      }

      return config;
    },
  ]);
};
