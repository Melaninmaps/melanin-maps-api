/**
 * Expo config plugin — fix for the react-native-maps pod name mismatch.
 *
 * ROOT CAUSE:
 *   react-native-maps@1.27.x ships react-native-maps.podspec with:
 *     s.name = "react-native-google-maps"
 *
 *   link_native_modules! reads the podspec, gets s.name = "react-native-google-maps",
 *   and generates:
 *     pod 'react-native-google-maps', :path => '.../react-native-maps'
 *
 *   CocoaPods then looks for react-native-google-maps.podspec by filename in the
 *   directory — only react-native-maps.podspec exists — FAILS.
 *
 * THE FIX:
 *   Inject Ruby code into the Podfile. The Podfile is NOT modified by pnpm install,
 *   so this survives the pnpm install --no-frozen-lockfile that runs after expo prebuild.
 *   The Ruby code fires during CocoaPods Podfile evaluation (before pod resolution),
 *   creates react-native-google-maps.podspec with s.name = "react-native-google-maps"
 *   in every react-native-maps pnpm store entry.
 *
 * WHY NOT PATCH THE PODSPEC IN NODE:
 *   Any node-level patch to node_modules gets reset by pnpm install in the PREBUILD
 *   phase (which runs AFTER expo prebuild finishes). The node-level s.name patch was
 *   also creating a COPY with the WRONG s.name, causing a new mismatch error.
 *   Only the Podfile injection approach is timing-safe.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Ruby code injected at the top of the Podfile.
// Runs during `pod install` Podfile evaluation — after all pnpm installs are done.
// Creates react-native-google-maps.podspec alongside react-native-maps.podspec in
// every react-native-maps pnpm store entry. Forces s.name = "react-native-google-maps"
// in the copy so it matches CocoaPods' expectation regardless of the source state.
const RUBY_FIX = `
require 'fileutils'

# [rn-maps-fix] Create react-native-google-maps.podspec so CocoaPods finds it by filename.
# react-native-maps.podspec has s.name = "react-native-google-maps", so autolinking
# generates pod 'react-native-google-maps', :path => '...' — CocoaPods then needs a
# file named react-native-google-maps.podspec in that directory.
begin
  _rn_maps_pnpm = File.expand_path(
    File.join('..', '..', '..', 'node_modules', '.pnpm'),
    File.dirname(File.expand_path(__FILE__))
  )
  Dir.glob(File.join(_rn_maps_pnpm, 'react-native-maps@*', 'node_modules', 'react-native-maps')).each do |maps_dir|
    src = File.join(maps_dir, 'react-native-maps.podspec')
    dst = File.join(maps_dir, 'react-native-google-maps.podspec')
    next unless File.exist?(src)
    content = File.read(src)
    # Force s.name = "react-native-google-maps" in the copy regardless of source state.
    # (The source may have been patched by a previous build's node plugin.)
    content_for_copy = content.gsub(
      /s\.name\s*=\s*["'][^"']*["']/,
      's.name = "react-native-google-maps"'
    )
    if File.exist?(dst) && File.read(dst).include?('react-native-google-maps')
      puts "[rn-maps-fix] Already present and correct: #{dst}"
    else
      File.write(dst, content_for_copy)
      puts "[rn-maps-fix] Created #{dst}"
    end
    # Also ensure the SOURCE file has s.name = "react-native-google-maps" so
    # link_native_modules! generates pod 'react-native-google-maps', :path => '...'
    unless content.include?('s.name = "react-native-google-maps"')
      content_restored = content.gsub(
        /s\.name\s*=\s*["'][^"']*["']/,
        's.name = "react-native-google-maps"'
      )
      File.write(src, content_restored)
      puts "[rn-maps-fix] Restored s.name in #{src}"
    end
  end
rescue => e
  puts "[rn-maps-fix] Error: #{e.message}"
  puts e.backtrace.first(5).join("\\n")
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
        console.warn(
          "[withRnMapsPodfileFix] Podfile not found — skipping."
        );
        return config;
      }

      const podfile = fs.readFileSync(podfilePath, "utf8");

      if (podfile.includes("[rn-maps-fix]")) {
        console.log(
          "[withRnMapsPodfileFix] Podfile already contains rn-maps-fix — skipping."
        );
        return config;
      }

      fs.writeFileSync(podfilePath, RUBY_FIX + podfile, "utf8");
      console.log(
        "[withRnMapsPodfileFix] Injected rn-maps-fix Ruby block into Podfile."
      );

      return config;
    },
  ]);
};
