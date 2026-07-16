/**
 * Expo config plugin — fix for expo-av EXEventEmitter.h missing in SDK 57+
 *
 * ROOT CAUSE:
 *   expo-av@16.0.8 imports <ExpoModulesCore/EXEventEmitter.h> in EXAV.h.
 *   ExpoModulesCore in SDK 57 removed EXEventEmitter.h as a public header.
 *   Xcode fails with "file not found" / "could not build Objective-C module EXAV".
 *
 * WHY POST_INSTALL:
 *   EAS order: expo prebuild → pnpm install → pod install → Xcode compile
 *   The Pods/Headers/ directory is only populated after `pod install`.
 *   A post_install hook runs after pods are installed but before Xcode compiles —
 *   the only safe window to inject the stub header.
 *
 *   Multiple post_install blocks in a Podfile are supported by CocoaPods and run
 *   sequentially, so injecting a new block is safe alongside Expo's existing one.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "[exav-fix-v1]";

const RUBY_POST_INSTALL = `
# ${MARKER} — EXEventEmitter.h stub for expo-av compatibility with ExpoModulesCore SDK 57+
post_install do |installer|
  require 'fileutils'
  _exav_header_dir  = File.join(installer.sandbox.root, 'Headers', 'Public', 'ExpoModulesCore')
  _exav_header_file = File.join(_exav_header_dir, 'EXEventEmitter.h')
  unless File.exist?(_exav_header_file)
    FileUtils.mkdir_p(_exav_header_dir)
    File.write(_exav_header_file, <<~HEADER)
      // EXEventEmitter.h — compatibility stub injected by withExpoAvFix
      // expo-av@16.0.8 imports this header; it was removed from ExpoModulesCore in SDK 57.
      #pragma once
      #import <Foundation/Foundation.h>

      @protocol EXEventEmitter <NSObject>
      @required
      - (NSArray<NSString *> *)supportedEvents;
      @optional
      - (void)startObserving;
      - (void)stopObserving;
      @end
    HEADER
    puts "[exav-fix] Created EXEventEmitter.h stub at #{_exav_header_file}"
  else
    puts "[exav-fix] EXEventEmitter.h already exists — skipping."
  end
end

`;

module.exports = function withExpoAvFix(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      if (!fs.existsSync(podfilePath)) {
        console.warn("[withExpoAvFix] Podfile not found — skipping.");
        return config;
      }

      let podfile = fs.readFileSync(podfilePath, "utf8");

      if (podfile.includes(MARKER)) {
        console.log(`[withExpoAvFix] ${MARKER} already present — skipping.`);
        return config;
      }

      fs.writeFileSync(podfilePath, RUBY_POST_INSTALL + podfile, "utf8");
      console.log(
        `[withExpoAvFix] Injected ${MARKER} post_install hook into Podfile.`
      );

      return config;
    },
  ]);
};
