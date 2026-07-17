/**
 * Expo config plugin — fix for the react-native-maps duplicate pod conflict.
 *
 * ROOT CAUSE:
 *   use_react_native!  → pod 'react-native-maps'         (RN CLI autolinking)
 *   use_expo_modules!  → pod 'react-native-google-maps'  (Expo autolinking)
 *   Both compile the same AIR* .m files → 339 duplicate symbols → linker crash.
 *
 * FIX (xcconfig OTHER_LDFLAGS surgery — build 78+):
 *
 *   Part 1 — top of Podfile, before pod resolution:
 *     Creates react-native-google-maps.podspec so Expo autolinking resolves.
 *     react-native-maps.podspec is left UNTOUCHED.
 *
 *   Part 2 — injected into Expo's post_install block:
 *     Finds all CocoaPods-generated *.xcconfig files (the files that actually
 *     set OTHER_LDFLAGS for the linked targets) and removes the
 *     `-lreact-native-maps` token from them.
 *
 *     WHY XCCONFIG NOT XCODE PROJECT:
 *       The `-lreact-native-maps` linker flag lives in:
 *         Pods/Target Support Files/Pods-MappingWithMelanin/Pods-MappingWithMelanin.{debug,release}.xcconfig
 *       Modifying the Xcode project's build settings (EXCLUDED_SOURCE_FILE_NAMES,
 *       etc.) does NOT remove the flag from the xcconfig — the xcconfig wins.
 *       We must edit the xcconfig text directly.
 *
 *     RESULT:
 *       - react-native-maps pod is still installed (CocoaPods happy)
 *       - `-lreact-native-maps` removed from OTHER_LDFLAGS in xcconfig
 *       - Linker never includes libreact-native-maps.a → zero AIR* symbols from it
 *       - react-native-google-maps still linked → compiles all AIR* symbols once
 *       - No duplicates → linker passes
 *
 * BUILD HISTORY:
 *   67-70: podspecPath override → both pods. 71: empty dependencies → both.
 *   72: platforms:{ios:null} → both autolinkers killed → pod not found.
 *   73: JS text removal no-op (macros) → both linked → crash.
 *   74: Ruby shim + s.dependency → Podfile.lock version conflict.
 *   75: Ruby shim no dependency → empty pod rejected by CocoaPods.
 *   76: Separate post_install block → CocoaPods rejects duplicate.
 *   77: EXCLUDED_SOURCE_FILE_NAMES → flag is in xcconfig, not project → no-op.
 *   78+: xcconfig OTHER_LDFLAGS surgery (this build).
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// ── Part 1: top-of-Podfile Ruby block ────────────────────────────────────────
const TOP_MARKER = "# [rn-maps-top-v1]";
const TOP_RUBY = `${TOP_MARKER}
require 'fileutils'
begin
  _pnpm = File.expand_path(
    File.join('..', '..', '..', 'node_modules', '.pnpm'),
    File.dirname(File.expand_path(__FILE__))
  )
  puts "[rn-maps] scanning: #{_pnpm}"
  _dirs = Dir.glob(File.join(_pnpm, 'react-native-maps@*', 'node_modules', 'react-native-maps'))
  puts "[rn-maps] found #{_dirs.length} location(s)"
  _dirs.each do |d|
    src = File.join(d, 'react-native-maps.podspec')
    dst = File.join(d, 'react-native-google-maps.podspec')
    next unless File.exist?(src)
    c = File.read(src)
    c = c.gsub(/s\\.name\\s*=\\s*["']react-native-maps["']/, 's.name = "react-native-google-maps"')
    File.write(dst, c)
    puts "[rn-maps] wrote react-native-google-maps.podspec at #{d}"
  end
rescue => e
  puts "[rn-maps] Part1 error: #{e.class}: #{e.message}"
end
`;

// ── Part 2: injected into Expo's post_install block ───────────────────────────
// Removes -lreact-native-maps from ALL xcconfig OTHER_LDFLAGS lines.
// The xcconfig files are the authoritative source of OTHER_LDFLAGS — editing
// the Xcode project's build settings alone has no effect because xcconfig wins.
const POST_MARKER = "# [rn-maps-post-v3]";
const POST_CODE = `  ${POST_MARKER}
  begin
    xcconfig_glob = File.join(installer.sandbox.root.to_s, 'Target Support Files', '**', '*.xcconfig')
    xcconfigs_fixed = 0
    Dir.glob(xcconfig_glob).each do |f|
      c = File.read(f)
      next unless c.include?('-lreact-native-maps')
      # Remove the token anywhere it appears in OTHER_LDFLAGS (with or without surrounding spaces)
      updated = c.gsub(/\\s*-lreact-native-maps\\b/, '')
      File.write(f, updated)
      xcconfigs_fixed += 1
      puts "[rn-maps] removed -lreact-native-maps from #{File.basename(f)}"
    end
    puts "[rn-maps] xcconfig surgery complete: #{xcconfigs_fixed} file(s) patched"
  rescue => e
    puts "[rn-maps] Part2 error: \#{e.class}: \#{e.message}"
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

      // ── Part 1: inject top block ─────────────────────────────────────────
      if (podfile.includes(TOP_MARKER)) {
        console.log("[withRnMapsPodfileFix] Part1 already present.");
      } else {
        podfile = TOP_RUBY + "\n" + podfile;
        console.log("[withRnMapsPodfileFix] Injected Part1 top block.");
      }

      // ── Part 2: inject into Expo's existing post_install block ────────────
      if (podfile.includes(POST_MARKER)) {
        console.log("[withRnMapsPodfileFix] Part2 already present.");
      } else {
        const POST_INSTALL_LINE = "post_install do |installer|";
        if (podfile.includes(POST_INSTALL_LINE)) {
          podfile = podfile.replace(
            POST_INSTALL_LINE,
            POST_INSTALL_LINE + "\n" + POST_CODE
          );
          console.log("[withRnMapsPodfileFix] Injected Part2 xcconfig surgery into post_install.");
        } else {
          console.warn("[withRnMapsPodfileFix] WARNING: post_install block not found — Part2 skipped!");
        }
      }

      fs.writeFileSync(podfilePath, podfile, "utf8");
      return config;
    },
  ]);
};
