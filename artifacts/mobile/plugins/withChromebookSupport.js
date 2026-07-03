const { withAndroidManifest } = require("@expo/config-plugins");

const OPTIONAL_FEATURES = [
  "android.hardware.touchscreen",
  "android.hardware.touchscreen.multitouch",
  "android.hardware.camera",
  "android.hardware.camera.autofocus",
  "android.hardware.camera.flash",
  "android.hardware.camera.front",
  "android.hardware.telephony",
  "android.hardware.microphone",
  "android.hardware.screen.portrait",
  "android.hardware.location",
  "android.hardware.location.gps",
  "android.hardware.location.network",
  "android.hardware.wifi",
];

module.exports = function withChromebookSupport(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest["uses-feature"]) {
      manifest["uses-feature"] = [];
    }

    for (const feature of OPTIONAL_FEATURES) {
      const alreadySet = manifest["uses-feature"].some(
        (f) => f.$?.["android:name"] === feature
      );
      if (!alreadySet) {
        manifest["uses-feature"].push({
          $: {
            "android:name": feature,
            "android:required": "false",
          },
        });
      }
    }

    return config;
  });
};
