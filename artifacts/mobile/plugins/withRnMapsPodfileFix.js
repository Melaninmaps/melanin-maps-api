/**
 * Expo config plugin — fix for the react-native-maps pod name mismatch.
 *
 * ROOT CAUSE:
 *   react-native-maps@1.27.x ships react-native-maps.podspec with:
 *     s.name = "react-native-google-maps"
 *
 *   link_native_modules! reads the podspec and generates:
 *     pod 'react-native-google-maps', :path => '.../react-native-maps'
 *
 *   CocoaPods then looks for react-native-google-maps.podspec in the directory
 *   but only react-native-maps.podspec exists — FAILS.
 *
 * WHY PREVIOUS APPROACHES FAILED:
 *   Patching files in node_modules (via withDangerousMod or postinstall) doesn't
 *   survive because the EAS PREBUILD phase runs pnpm install AFTER expo prebuild
 *   finishes — which restores the original podspec from the pnpm content store.
 *
 * THIS FIX:
 *   Inject Ruby code into the Podfile itself. The Podfile is a static file that
 *   pnpm never touches. The injected code runs during CocoaPods Podfile evaluation
 *   (i.e., during pod install) — which happens AFTER all pnpm installs are done.
 *   It creates react-native-google-maps.podspec alongside react-native-maps.podspec,
 *   so CocoaPods finds it by filename when resolving the pod.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const RUBY_FIX = `
require 'fileutils'

# [rn-maps-fix] Inject react-native-google-maps.podspec so CocoaPods can find it
# by filename. react-native-maps.podspec has s.name = "react-native-google-maps",
# so link_native_modules! generates pod 'react-native-google-maps', :path => '...'
# and CocoaPods then looks for react-native-google-maps.podspec by filename.
begin
  _rn_maps_pnpm = File.expand_path(
    File.join('..', '..', '..', 'node_modules', '.pnpm'),
    File.dirname(File.expand_path(__FILE__))
  )
  Dir.glob(File.join(_rn_maps_pnpm, 'react-native-maps@*', 'node_modules', 'react-native-maps')).each do |maps_dir|
    src = File.join(maps_dir, 'react-native-maps.podspec')
    dst = File.join(maps_dir, 'react-native-google-maps.podspec')
    next unless File.exist?(src)
    if File.exist?(dst)
      puts "[rn-maps-fix] Already present: #{dst}"
    else
      FileUtils.cp(src, dst)
      puts "[rn-maps-fix] Created: #{dst}"
    end
  end
rescue => e
  puts "[rn-maps-fix] Error: #{e.message}"
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
