/**
 * Expo config plugin — fix for the react-native-maps duplicate pod conflict.
 *
 * ROOT CAUSE:
 *   Two autolinking macros run during `pod install`:
 *     1. use_react_native!  → pod 'react-native-maps'         (via RN CLI autolinking)
 *     2. use_expo_modules!  → pod 'react-native-google-maps'  (via Expo autolinking)
 *
 *   Both pods point to the same source directory → same AIR* .m files compiled twice
 *   → 339 duplicate symbol errors → linker crash.
 *
 * FIX (post_install + EXCLUDED_SOURCE_FILE_NAMES — build 76+):
 *
 *   Part 1 (runs before pod resolution — top of Podfile):
 *     Create react-native-google-maps.podspec so Expo's pod entry resolves.
 *     Do NOT touch react-native-maps.podspec — CocoaPods must validate it normally.
 *
 *   Part 2 (post_install hook — runs after Xcode project is generated):
 *     Set EXCLUDED_SOURCE_FILE_NAMES = '*' on the react-native-maps Xcode target.
 *     This tells the compiler to skip all source files in that target.
 *     Result: libreact-native-maps.a is built but empty (zero object files).
 *             react-native-google-maps compiles all AIR* symbols exactly once.
 *             Linker sees: empty react-native-maps lib + full react-native-google-maps lib
 *             → no duplicates → linker passes.
 *
 * WHAT DIDN'T WORK (build history):
 *   67-70: podspecPath override in react-native.config.js → both pods still added.
 *   71:    dependencies:{} empty override → both pods still added by macro expansion.
 *   72:    platforms:{ios:null} → disabled BOTH autolinkers → pod not found → pod install fail.
 *   73:    JS text removal of pod 'react-native-maps' line → macros generate at runtime, no literal line → no-op. Both pods linked, linker crash.
 *   74:    Ruby shim + s.dependency 'react-native-google-maps' → version conflict with cached Podfile.lock.
 *   75:    Ruby shim without dependency → s.source_files=[] invalid, pod install fail (CocoaPods rejects empty pod).
 *   76+:   post_install + EXCLUDED_SOURCE_FILE_NAMES (this build).
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "[rn-maps-post-v2]";

// Ruby block injected at the TOP of the Podfile.
// Part 1 runs synchronously during Podfile evaluation (before pod resolution).
// Part 2 runs after pod install generates the Xcode project.
const RUBY_FIX = `
# ${MARKER} — react-native-maps duplicate symbol fix

# ── Part 1: Create react-native-google-maps.podspec (before pod resolution) ─
require 'fileutils'
begin
  _pnpm_root = File.expand_path(
    File.join('..', '..', '..', 'node_modules', '.pnpm'),
    File.dirname(File.expand_path(__FILE__))
  )
  puts "[rn-maps-fix] Scanning: #{_pnpm_root}"
  _dirs = Dir.glob(File.join(_pnpm_root, 'react-native-maps@*', 'node_modules', 'react-native-maps'))
  puts "[rn-maps-fix] Found #{_dirs.length} react-native-maps dir(s)"
  _dirs.each do |maps_dir|
    src = File.join(maps_dir, 'react-native-maps.podspec')
    dst = File.join(maps_dir, 'react-native-google-maps.podspec')
    unless File.exist?(src)
      puts "[rn-maps-fix] Podspec not found: #{src}"
      next
    end
    content = File.read(src)
    # Replace s.name preserving all whitespace variants
    google = content
      .gsub('s.name                 = "react-native-maps"', 's.name                 = "react-native-google-maps"')
      .gsub('s.name = "react-native-maps"', 's.name = "react-native-google-maps"')
      .gsub("s.name = 'react-native-maps'", "s.name = 'react-native-google-maps'")
    unless google.include?('react-native-google-maps')
      google = google.sub(/s\\.name\\s*=\\s*["'][^"']*["']/, 's.name = "react-native-google-maps"')
    end
    File.write(dst, google)
    puts "[rn-maps-fix] Wrote react-native-google-maps.podspec at #{maps_dir}"
    # react-native-maps.podspec is LEFT UNTOUCHED — CocoaPods must validate it normally
  end
rescue => e
  puts "[rn-maps-fix] ERROR (Part 1): #{e.class}: #{e.message}"
  puts e.backtrace.first(3).join("\\n")
end

# ── Part 2: post_install — exclude all react-native-maps source from compilation ──
# EXCLUDED_SOURCE_FILE_NAMES='*' tells Xcode to compile zero files from the target.
# libreact-native-maps.a ends up empty; react-native-google-maps compiles AIR* once.
post_install do |installer|
  begin
    fixed = false
    installer.pods_project.targets.each do |target|
      next unless target.name == 'react-native-maps'
      target.build_configurations.each do |config|
        config.build_settings['EXCLUDED_SOURCE_FILE_NAMES'] = '*'
      end
      puts "[rn-maps-fix] react-native-maps target: EXCLUDED_SOURCE_FILE_NAMES=* (zero AIR* symbols compiled)"
      fixed = true
    end
    puts "[rn-maps-fix] Warning: react-native-maps target not found in Pods project" unless fixed
    installer.pods_project.save
  rescue => e
    puts "[rn-maps-fix] ERROR (Part 2 post_install): #{e.class}: #{e.message}"
    puts e.backtrace.first(3).join("\\n")
  end
end

`;

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

      // Strip any previous version of our block by marker prefix.
      const OLD_PREFIXES = ["[rn-maps-fix", "[rn-maps-shim", "[rn-maps-post"];
      for (const prefix of OLD_PREFIXES) {
        if (podfile.includes(prefix) && !podfile.includes(MARKER)) {
          // Remove everything from the comment line through the closing blank line
          // that follows the last `end` of our block.
          const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          podfile = podfile.replace(
            new RegExp(`# \\[${escaped.slice(2)}[^\\]]*\\][\\s\\S]*?\\bend\\n(?=\\n)`, "m"),
            ""
          );
          console.log(`[withRnMapsPodfileFix] Stripped old ${prefix} block.`);
        }
      }

      if (podfile.includes(MARKER)) {
        console.log(
          `[withRnMapsPodfileFix] ${MARKER} already present — skipping injection.`
        );
      } else {
        podfile = RUBY_FIX + podfile;
        console.log(
          `[withRnMapsPodfileFix] Injected ${MARKER} into Podfile.`
        );
      }

      fs.writeFileSync(podfilePath, podfile, "utf8");
      return config;
    },
  ]);
};
