const plugin = require("../plugins/withAndroidAdaptiveLayout");

const manifest = {
  modResults: {
    manifest: {
      application: [
        {
          activity: [
            {
              $: {
                "android:name": ".MainActivity",
                "android:screenOrientation": "portrait",
                "android:resizeableActivity": "false",
                "android:maxAspectRatio": "2.1",
                "android:minAspectRatio": "1.2",
              },
            },
            { $: { "android:name": ".OtherActivity", "android:screenOrientation": "portrait" } },
          ],
        },
      ],
    },
  },
};

plugin.removeMainActivityRestrictions(manifest);
const activity = manifest.modResults.manifest.application[0].activity[0];

const remaining = Object.keys(activity.$);
if (remaining.length !== 1 || remaining[0] !== "android:name") {
  throw new Error(`MainActivity Android restriction removal failed: ${JSON.stringify(activity.$)}`);
}
if (manifest.modResults.manifest.application[0].activity[1].$["android:screenOrientation"] !== "portrait") {
  throw new Error("Plugin test incorrectly changed another activity");
}
if (typeof plugin !== "function") throw new Error("Adaptive layout plugin did not export a function");
console.log("Android adaptive-layout plugin verification passed");
