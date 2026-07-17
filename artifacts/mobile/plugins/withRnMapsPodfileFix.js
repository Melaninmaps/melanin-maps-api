/**
 * withRnMapsPodfileFix.js
 *
 * Fixes the duplicate-pod linker crash caused by both pod 'react-native-maps'
 * and pod 'react-native-google-maps' resolving to the same source files, which
 * compiles all AIR* Objective-C symbols twice → 339 duplicate symbols → crash.
 *
 * ROOT CAUSE:
 *   react-native-maps@1.27.2 declares s.name = "react-native-google-maps" in its
 *   podspec. Expo autolinking reads s.name → emits pod 'react-native-google-maps'.
 *   RN CLI autolinking reads the filename → emits pod 'react-native-maps'.
 *   Both resolve to the same :path, same sources → duplicate AIR* symbols.
 *
 * TWO-PART FIX (both run during expo prebuild, just before pod install):
 *
 *   PART 1 — Create react-native-google-maps.podspec
 *     Expo's pod entry is:  pod 'react-native-google-maps', :path => '../node_modules/react-native-maps'
 *     CocoaPods looks for a file named react-native-google-maps.podspec in that :path directory.
 *     react-native-maps ships only react-native-maps.podspec → "No podspec found" error.
 *     Fix: copy react-native-maps.podspec → react-native-google-maps.podspec in-place.
 *     Done here (config plugin) so it runs at prebuild time, right before pod install.
 *
 *   PART 2 — xcconfig OTHER_LDFLAGS surgery
 *     After CocoaPods resolves both pods successfully, it writes xcconfig files with:
 *       OTHER_LDFLAGS = ... -l"react-native-google-maps" -l"react-native-maps" ...
 *     The -l"react-native-maps" flag causes libreact-native-maps.a to be linked,
 *     duplicating the AIR* symbols already provided by libreact-native-google-maps.a.
 *     Fix: post_install hook removes the exact token -l"react-native-maps" from
 *     every CocoaPods-generated xcconfig.
 *
 * BUILD HISTORY:
 *   73: JS Podfile text removal → use_react_native! generates pod lines at runtime
 *   74-76: Ruby podspec shim → CocoaPods version conflicts / rejection
 *   77: EXCLUDED_SOURCE_FILE_NAMES → flag is in xcconfig, not Xcode project
 *   78: xcconfig surgery with wrong (unquoted) regex → no match, 0 patched
 *   79: platforms:{ios:null} in react-native.config.js → broke pod install itself
 *   80: xcconfig surgery correct + podspec copy in eas-build-post-install
 *       → podspec copy only patched pnpm store, not the :path CocoaPods reads
 *   81: podspec copy moved INTO config plugin (this file) + correct xcconfig regex
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const POST_MARKER = "[rn-maps-v5]";

// Injected at the TOP of the existing post_install block.
// CocoaPods writes OTHER_LDFLAGS as -l"react-native-maps" (quoted form).
// We remove that exact token so libreact-native-maps.a is never linked.
const POST_CODE = `
  # ${POST_MARKER} — remove duplicate linker flag
  begin
    _xcconfig_dir = File.join(installer.sandbox.root.to_s, 'Target Support Files')
    _patched = 0
    Dir.glob(File.join(_xcconfig_dir, '**', '*.xcconfig')).each do |f|
      _c = File.read(f)
      next unless _c.include?('-l"react-native-maps"')
      File.write(f, _c.gsub('-l"react-native-maps"', ''))
      _patched += 1
      puts "[rn-maps] patched xcconfig: #{File.basename(f)}"
    end
    puts "[rn-maps] xcconfig surgery: #{_patched} file(s) patched"
    if _patched == 0
      # Debug: print OTHER_LDFLAGS lines from all xcconfigs so we can see the exact format
      Dir.glob(File.join(_xcconfig_dir, '**', '*.xcconfig')).each do |f|
        _lines = File.readlines(f).select { |l| l.include?('react-native-maps') || l.include?('OTHER_LDFLAGS') }
        next if _lines.empty?
        puts "[rn-maps] DEBUG #{File.basename(f)}:"
        _lines.each { |l| puts "  #{l.chomp}" }
      end
    end
  rescue => e
    puts "[rn-maps] xcconfig error: #{e.class}: #{e.message}"
  end
`;

module.exports = function withRnMapsPodfileFix(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const iosRoot = config.modRequest.platformProjectRoot; // .../artifacts/mobile/ios
      const mobileRoot = path.dirname(iosRoot);             // .../artifacts/mobile
      const workspaceRoot = path.resolve(mobileRoot, "../..");// monorepo root

      // ── PART 1: Create react-native-google-maps.podspec ──────────────────────
      // CocoaPods resolves pod 'react-native-google-maps', :path => '../node_modules/react-native-maps'
      // relative to the ios/ directory. The canonical node_modules location is at
      // workspaceRoot/node_modules/react-native-maps (pnpm hoists it there).
      // We also check mobileRoot/node_modules in case of a local install.
      const candidateRnMapsDirs = [
        path.join(workspaceRoot, "node_modules", "react-native-maps"),
        path.join(mobileRoot, "node_modules", "react-native-maps"),
      ];

      let podspecCopied = false;
      for (const rnMapsDir of candidateRnMapsDirs) {
        const src = path.join(rnMapsDir, "react-native-maps.podspec");
        const dst = path.join(rnMapsDir, "react-native-google-maps.podspec");

        if (!fs.existsSync(src)) {
          console.log(`[withRnMapsPodfileFix] not found: ${src}`);
          continue;
        }

        if (fs.existsSync(dst)) {
          console.log(`[withRnMapsPodfileFix] podspec already present: ${dst}`);
          podspecCopied = true;
          continue;
        }

        // Copy the podspec. In pnpm, node_modules/react-native-maps is a symlink;
        // copyFileSync writes through the symlink into the physical store location,
        // which is where CocoaPods will look when it resolves the :path.
        fs.copyFileSync(src, dst);
        console.log(`[withRnMapsPodfileFix] created: ${dst}`);
        podspecCopied = true;
      }

      if (!podspecCopied) {
        console.warn(
          "[withRnMapsPodfileFix] WARNING: could not create react-native-google-maps.podspec — pod install will likely fail with 'No podspec found'."
        );
        console.warn("[withRnMapsPodfileFix] Searched:", candidateRnMapsDirs.join(", "));
      }

      // ── PART 2: Inject xcconfig surgery into post_install ────────────────────
      const podfilePath = path.join(iosRoot, "Podfile");

      if (!fs.existsSync(podfilePath)) {
        console.warn("[withRnMapsPodfileFix] Podfile not found — skipping xcconfig injection.");
        return config;
      }

      let podfile = fs.readFileSync(podfilePath, "utf8");

      if (podfile.includes(POST_MARKER)) {
        console.log("[withRnMapsPodfileFix] xcconfig surgery already injected.");
        return config;
      }

      const POST_INSTALL_LINE = "post_install do |installer|";
      if (!podfile.includes(POST_INSTALL_LINE)) {
        console.warn("[withRnMapsPodfileFix] post_install block not found.");
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
