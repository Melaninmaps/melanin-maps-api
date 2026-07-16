/**
 * Expo config plugin — fix for the react-native-maps duplicate pod conflict.
 *
 * ROOT CAUSE:
 *   Two autolinking systems run during Expo prebuild:
 *     1. React Native CLI  (`use_react_native!`) — reads the package's podspec,
 *        sees s.name = "react-native-maps" → adds pod 'react-native-maps'
 *     2. Expo autolinking  (`use_expo_modules!`) — reads the package's ios config
 *        → adds pod 'react-native-google-maps', :path => '.../react-native-maps'
 *
 *   Both pods compile from the same source → 339 duplicate AIR* symbols → linker crash.
 *
 * FIX — two steps, both in this plugin:
 *
 *   STEP 1 (JavaScript, runs at prebuild time):
 *     Remove the `pod 'react-native-maps'` line from the generated Podfile text
 *     so only the Expo-generated `pod 'react-native-google-maps'` entry remains.
 *     This targets the exact pattern CocoaPods emits: pod 'react-native-maps', :path
 *     but NOT pod 'react-native-google-maps' (which we want to keep).
 *
 *   STEP 2 (Ruby, injected into Podfile, runs at pod-install time):
 *     Create react-native-google-maps.podspec in the pnpm store so CocoaPods
 *     can resolve the `pod 'react-native-google-maps'` entry.
 *
 * BUILD HISTORY:
 *   Builds 67-70: linker crash — original podspecPath override caused both pods.
 *   Build 71:     podspecPath removed, but both pods still appeared (RN CLI still
 *                 linked react-native-maps via package's own config). Linker crash.
 *   Build 72:     platforms:{ios:null} disabled BOTH autolinkers → pod install fail.
 *   Build 73+:    This plugin handles both steps — should resolve cleanly.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "[rn-maps-fix-v7]";

// ── Step 2: Ruby block injected at top of Podfile ────────────────────────────
// Runs during `pod install`. Scans the pnpm store and creates
// react-native-google-maps.podspec alongside react-native-maps.podspec.
const RUBY_FIX = `
# ${MARKER} — react-native-google-maps podspec fix (runs during pod install)
require 'fileutils'
begin
  _rn_maps_pnpm = File.expand_path(
    File.join('..', '..', '..', 'node_modules', '.pnpm'),
    File.dirname(File.expand_path(__FILE__))
  )
  puts "[rn-maps-fix] Scanning pnpm store: #{_rn_maps_pnpm}"
  _dirs = Dir.glob(File.join(_rn_maps_pnpm, 'react-native-maps@*', 'node_modules', 'react-native-maps'))
  puts "[rn-maps-fix] Found #{_dirs.length} react-native-maps dir(s)"
  _dirs.each do |maps_dir|
    src = File.join(maps_dir, 'react-native-maps.podspec')
    dst = File.join(maps_dir, 'react-native-google-maps.podspec')
    unless File.exist?(src)
      puts "[rn-maps-fix] Source not found: #{src}"
      next
    end
    content = File.read(src)
    src_sname_line = content.lines.find { |l| l =~ /\\bs\\.name\\b/ }
    puts "[rn-maps-fix] Source s.name: #{src_sname_line.to_s.strip}"
    content_copy = content
      .gsub('s.name                 = "react-native-maps"', 's.name                 = "react-native-google-maps"')
      .gsub('s.name = "react-native-maps"',                  's.name = "react-native-google-maps"')
      .gsub("s.name = 'react-native-maps'",                  "s.name = 'react-native-google-maps'")
    unless content_copy.match?(/s\\.name\\s*=\\s*["']react-native-google-maps["']/)
      content_copy = content_copy.gsub(/s\\.name\\s*=\\s*["'][^"']*["']/, 's.name = "react-native-google-maps"')
      puts "[rn-maps-fix] Used regex fallback for s.name replacement"
    end
    File.write(dst, content_copy)
    dst_sname_line = content_copy.lines.find { |l| l =~ /\\bs\\.name\\b/ }
    puts "[rn-maps-fix] Wrote #{dst}"
    puts "[rn-maps-fix] Copy s.name: #{dst_sname_line.to_s.strip}"
  end
rescue => e
  puts "[rn-maps-fix] ERROR: #{e.class}: #{e.message}"
  puts e.backtrace.first(3).join("\\n")
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

      // ── STEP 1: Remove the RN CLI-generated `pod 'react-native-maps'` line ──
      // Match lines like:
      //   pod 'react-native-maps', :path => '../node_modules/react-native-maps'
      // but NOT:
      //   pod 'react-native-google-maps', ...  (Expo's entry — keep this)
      //
      // The regex is anchored to the start of the line (after optional whitespace),
      // matches `pod 'react-native-maps'` (without 'google') followed by anything
      // until end of line, including optional trailing comma continuations.
      const beforeRemoval = podfile;
      podfile = podfile.replace(
        /^[^\S\r\n]*pod\s+['"]react-native-maps['"]\s*,.*$/gm,
        ""
      );
      if (podfile !== beforeRemoval) {
        console.log(
          "[withRnMapsPodfileFix] Removed duplicate pod 'react-native-maps' line from Podfile."
        );
      } else {
        console.log(
          "[withRnMapsPodfileFix] No pod 'react-native-maps' line found to remove (may already be clean)."
        );
      }

      // ── STEP 2: Inject Ruby podspec-fix block at top of Podfile ─────────────
      // Strip any older version of our fix block first.
      if (podfile.includes("[rn-maps-fix") && !podfile.includes(MARKER)) {
        podfile = podfile.replace(
          /# \[rn-maps-fix[^\]]*\][^\n]*\n[\s\S]*?^end\n\n/m,
          ""
        );
        console.log("[withRnMapsPodfileFix] Stripped old rn-maps-fix block.");
      }

      if (podfile.includes(MARKER)) {
        console.log(
          `[withRnMapsPodfileFix] ${MARKER} already present — skipping Ruby injection.`
        );
      } else {
        podfile = RUBY_FIX + podfile;
        console.log(
          `[withRnMapsPodfileFix] Injected ${MARKER} Ruby block into Podfile.`
        );
      }

      fs.writeFileSync(podfilePath, podfile, "utf8");
      return config;
    },
  ]);
};
