const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withChromebookSupport(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest["uses-feature"]) {
      manifest["uses-feature"] = [];
    }

    const alreadySet = manifest["uses-feature"].some(
      (f) => f.$?.["android:name"] === "android.hardware.touchscreen"
    );

    if (!alreadySet) {
      manifest["uses-feature"].push({
        $: {
          "android:name": "android.hardware.touchscreen",
          "android:required": "false",
        },
      });
    }

    return config;
  });
};
