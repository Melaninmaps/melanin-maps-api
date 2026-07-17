/**
 * withRnMapsPodfileFix.js
 *
 * Creates a shim podspec `react-native-google-maps.podspec` so that CocoaPods
 * can satisfy the pod 'react-native-google-maps' declaration that Expo's
 * react-native-maps app.plugin.js injects into the Podfile during prebuild.
 *
 * ROOT CAUSE (fully traced):
 *   react-native-maps ships app.plugin.js → withMapsIOS → addMapsCocoapods
 *   This adds to the Podfile (via withPodfile, AFTER withDangerousMod reads disk):
 *     # @generated begin react-native-maps
 *     pod 'react-native-google-maps', path: File.dirname(require.resolve(...))
 *     # @generated end react-native-maps
 *
 *   CocoaPods looks for react-native-google-maps.podspec at that :path.
 *   The npm package does NOT ship this file → "No podspec found" (build 80).
 *   We created a copy with wrong s.name → "name mismatch" (builds 81-82).
 *   We tried to remove the line via withDangerousMod but ran BEFORE withPodfile
 *   wrote the @generated block to disk → "nothing to remove" (builds 83-84).
 *
 * FIX:
 *   Write a shim react-native-google-maps.podspec into the react-native-maps
 *   package directory that:
 *     • s.name = "react-native-google-maps"  ← matches CocoaPods pod declaration
 *     • No source_files                       ← nothing compiled → zero AIR* symbols
 *   CocoaPods resolves the pod, installs an empty target, produces no static lib.
 *   RN CLI autolinking's pod 'react-native-maps' compiles all AIR* sources once.
 *   No duplicate symbols. No linker errors.
 *
 *   The shim file is written during expo prebuild (withDangerousMod, "ios" phase),
 *   which runs BEFORE pod install, so the file exists when CocoaPods resolves pods.
 *
 * BUILD HISTORY:
 *   73: JS Podfile text removal → @generated block written after withDangerousMod
 *   74-76: Ruby podspec shim → CocoaPods version conflicts
 *   77: EXCLUDED_SOURCE_FILE_NAMES → no-op at xcconfig level
 *   78: xcconfig surgery, unquoted regex → 0 patched
 *   79: platforms:{ios:null} → broke pod install
 *   80: copy with wrong s.name in eas-build-post-install → wrong location
 *   81: copy with wrong s.name in plugin → "name mismatch"
 *   82: replace with react-native-maps/Google → GoogleMaps 9.4.0 dep unresolvable
 *   83: remove the pod line via withDangerousMod → ran before @generated block existed
 *   84: shim podspec with correct s.name + no source_files (this build)
 */
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// The shim podspec. s.name MUST match the pod name CocoaPods is looking for.
// No source_files → no static library compiled → no duplicate AIR* symbols.
// No linker flag added for this pod → react-native-maps (from RN CLI) is the only maps lib.
const SHIM_PODSPEC = `# react-native-google-maps.podspec
# Shim created by withRnMapsPodfileFix.js during expo prebuild.
# Expo's react-native-maps app.plugin.js adds:
#   pod 'react-native-google-maps', path: ...react-native-maps...
# CocoaPods requires a podspec named react-native-google-maps with s.name = "react-native-google-maps".
# This shim satisfies the declaration with no source files (no duplicate AIR* symbols).
# All native maps code is compiled via pod 'react-native-maps' from RN CLI autolinking.

Pod::Spec.new do |s|
  s.name             = "react-native-google-maps"
  s.version          = "1.27.2"
  s.summary          = "Expo autolinking compatibility shim for react-native-maps"
  s.homepage         = "https://github.com/react-native-maps/react-native-maps"
  s.license          = { :type => "MIT" }
  s.author           = { "react-native-maps" => "" }
  s.platform         = :ios, "16.4"
  s.source           = { :path => "." }
  # No source_files — intentional. All AIR* code is compiled by pod 'react-native-maps'.
  # An empty pod produces no static library, adding no -l flag to xcconfig.
end
`;

module.exports = function withRnMapsPodfileFix(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const iosRoot = config.modRequest.platformProjectRoot; // .../artifacts/mobile/ios
      const mobileRoot = path.dirname(iosRoot);             // .../artifacts/mobile
      const workspaceRoot = path.resolve(mobileRoot, "../..");

      // Resolve the exact path that CocoaPods will use from the Podfile's :path =>
      // pod 'react-native-google-maps', path: File.dirname(require.resolve('react-native-maps/package.json'))
      let rnMapsDir;
      try {
        const pkgJson = require.resolve("react-native-maps/package.json", {
          paths: [workspaceRoot, mobileRoot],
        });
        rnMapsDir = path.dirname(pkgJson);
      } catch {
        // Fallback to direct node_modules lookup
        rnMapsDir = path.join(workspaceRoot, "node_modules", "react-native-maps");
      }

      const shimPath = path.join(rnMapsDir, "react-native-google-maps.podspec");
      const existingPath = path.join(rnMapsDir, "react-native-maps.podspec");

      if (!fs.existsSync(existingPath)) {
        console.warn(
          `[withRnMapsPodfileFix] react-native-maps not found at ${rnMapsDir} — cannot create shim.`
        );
        return config;
      }

      // Check if an existing shim is already correct (has the right s.name)
      if (fs.existsSync(shimPath)) {
        const existing = fs.readFileSync(shimPath, "utf8");
        if (existing.includes('s.name             = "react-native-google-maps"')) {
          console.log(
            `[withRnMapsPodfileFix] Correct shim already present at ${shimPath}`
          );
          return config;
        }
        // Overwrite stale/incorrect shim (e.g. from old create-rn-maps-podspec.js)
        console.log(
          `[withRnMapsPodfileFix] Replacing stale shim at ${shimPath}`
        );
      }

      fs.writeFileSync(shimPath, SHIM_PODSPEC, "utf8");
      console.log(
        `[withRnMapsPodfileFix] Created shim: ${shimPath}`
      );
      console.log(
        `[withRnMapsPodfileFix] Shim has s.name="react-native-google-maps", no source_files.`
      );
      console.log(
        `[withRnMapsPodfileFix] CocoaPods will install an empty target — no duplicate AIR* symbols.`
      );

      return config;
    },
  ]);
};
