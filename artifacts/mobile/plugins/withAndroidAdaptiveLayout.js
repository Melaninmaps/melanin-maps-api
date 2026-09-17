const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Android 16 treats portrait/resizability locks as advisory on large screens.
 * Keep the app's iOS portrait policy intact, but remove Android-only manifest
 * restrictions so tablet, foldable, Chromebook, and split-screen layouts use
 * the existing responsive React Native layout instead of being letterboxed.
 */
function removeMainActivityRestrictions(config) {
  const application = config.modResults.manifest.application?.[0];
  const activities = application?.activity ?? [];

  for (const activity of activities) {
    const name = activity.$?.["android:name"];
    if (name === ".MainActivity" || name === "com.melaninmaps.app.MainActivity") {
      delete activity.$["android:screenOrientation"];
      delete activity.$["android:resizeableActivity"];
      delete activity.$["android:maxAspectRatio"];
      delete activity.$["android:minAspectRatio"];
    }
  }

  return config;
}

function withAndroidAdaptiveLayout(config) {
  return withAndroidManifest(config, removeMainActivityRestrictions);
}

module.exports = withAndroidAdaptiveLayout;
module.exports.removeMainActivityRestrictions = removeMainActivityRestrictions;
