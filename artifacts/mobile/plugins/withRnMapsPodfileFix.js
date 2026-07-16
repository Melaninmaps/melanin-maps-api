/**
 * This plugin is now a no-op.
 *
 * The react-native-maps podspec fix is handled by:
 *   scripts/patch-rnmaps-podspec.js
 * ...which runs in the eas-build-post-install hook (after pnpm install,
 * before pod install). That is the only timing-safe place to patch files
 * in node_modules — any patch applied here (during expo prebuild) gets
 * reset by the pnpm install that follows.
 */
const { withDangerousMod } = require("@expo/config-plugins");

module.exports = function withRnMapsPodfileFix(config) {
  return config;
};
