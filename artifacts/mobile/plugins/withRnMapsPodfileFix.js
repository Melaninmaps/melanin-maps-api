/**
 * withRnMapsPodfileFix.js
 *
 * Fixes the duplicate-pod linker crash caused by both pods resolving to the
 * same source directory and compiling the same AIR* Objective-C symbols twice.
 *
 * ROOT CAUSE:
 *   use_react_native!  → pod 'react-native-maps'         (RN CLI, from filename)
 *   use_expo_modules!  → pod 'react-native-google-maps'  (Expo, from s.name in podspec)
 *   react-native-maps@1.27.2's podspec has s.name = "react-native-google-maps", so BOTH
 *   pods resolve to the same path → same source files compiled twice → 339 duplicate
 *   AIR* symbols → linker crash.
 *
 * FIX (xcconfig OTHER_LDFLAGS surgery):
 *
 *   CocoaPods writes the linker flag as  -l"react-native-maps"  (quoted form) inside
 *   the generated xcconfig files at:
 *     Pods/Target Support Files/Pods-MappingWithMelanin/Pods-MappingWithMelanin.*.xcconfig
 *
 *   In post_install, after CocoaPods writes all xcconfigs to disk, we remove the exact
 *   token  -l"react-native-maps"  from every xcconfig that contains it.
 *
 *   Result:
 *     - react-native-maps pod is still installed (CocoaPods is happy)
 *     - Linker flag for libreact-native-maps.a is gone from the xcconfig
 *     - Xcode never links libreact-native-maps.a → zero AIR* symbols from it
 *     - react-native-google-maps is still linked → all AIR* symbols compiled once
 *     - No duplicates → linker passes
 *
 * COMPANION:
 *   artifacts/mobile/scripts/create-rn-maps-podspec.js (runs in eas-build-post-install)
 *   creates react-native-google-maps.podspec so the Expo pod entry resolves cleanly.
 *
 * BUILD HISTORY:
 *   73: JS text removal → use_react_native! generates pod lines at runtime, not in text
 *   74-76: Ruby podspec shim experiments → CocoaPods version conflicts / rejection
 *   77: EXCLUDED_SOURCE_FILE_NAMES → flag is in xcconfig, not Xcode project → no-op
 *   78: xcconfig surgery with wrong regex (unquoted -lreact-native-maps) → no match
 *   79: platforms:{ios:null} → broke use_react_native! during pod install
 *   80: xcconfig surgery with correct quoted form -l"react-native-maps" (this build)
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const POST_MARKER = "# [rn-maps-xcconfig-v4]";

// Injected at the TOP of Expo's existing post_install block.
// CocoaPods writes -l"react-native-maps" (quoted form) in xcconfig OTHER_LDFLAGS.
// We remove the exact token after all xcconfigs have been written to disk.
const POST_CODE = `  ${POST_MARKER}
  begin
    _xcconfig_dir = File.join(installer.sandbox.root.to_s, 'Target Support Files')
    _patched = 0
    Dir.glob(File.join(_xcconfig_dir, '**', '*.xcconfig')).each do |f|
      _c = File.read(f)
      # CocoaPods uses the quoted form: -l"react-native-maps"
      next unless _c.include?('-l"react-native-maps"')
      _updated = _c.gsub('-l"react-native-maps"', '')
      File.write(f, _updated)
      _patched += 1
      puts "[rn-maps] removed -l\\"react-native-maps\\" from #{File.basename(f)}"
    end
    puts "[rn-maps] xcconfig surgery done: #{_patched} file(s) patched"
    if _patched == 0
      Dir.glob(File.join(_xcconfig_dir, '**', '*.xcconfig')).each do |f|
        _lines = File.readlines(f).select { |l| l.include?('react-native-maps') || l.include?('OTHER_LDFLAGS') }
        next if _lines.empty?
        puts "[rn-maps] DEBUG #{File.basename(f)}:"
        _lines.each { |l| puts "  #{l.chomp}" }
      end
    end
  rescue => e
    puts "[rn-maps] xcconfig error: #{e.class}: #{e.message}"
  end`;

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

      if (podfile.includes(POST_MARKER)) {
        console.log("[withRnMapsPodfileFix] xcconfig surgery already injected.");
        return config;
      }

      const POST_INSTALL_LINE = "post_install do |installer|";
      if (!podfile.includes(POST_INSTALL_LINE)) {
        console.warn("[withRnMapsPodfileFix] post_install block not found — cannot inject.");
        return config;
      }

      podfile = podfile.replace(
        POST_INSTALL_LINE,
        POST_INSTALL_LINE + "\n" + POST_CODE
      );
      console.log("[withRnMapsPodfileFix] Injected xcconfig surgery into post_install.");

      fs.writeFileSync(podfilePath, podfile, "utf8");
      return config;
    },
  ]);
};
