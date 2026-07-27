/**
 * Expo config plugin — fix for expo-audio missing framework declarations.
 *
 * ROOT CAUSE:
 *   expo-audio@57.0.2 uses MTAudioProcessingTapRef (MediaToolbox) in
 *   AudioTapProcessor.m and MediaPlayer in MediaController.swift, but its
 *   podspec only declares ExpoModulesCore as a dependency — both system
 *   frameworks are never explicitly linked. Xcode linker fails:
 *   "linker command failed with exit code 1 (use -v to see invocation)"
 *
 * FIX STRATEGY:
 *   Inject Ruby into the existing post_install block to add MediaToolbox and
 *   MediaPlayer to the ExpoAudio pod target's OTHER_LDFLAGS. CocoaPods only
 *   allows one post_install block; we inject into Expo's generated one.
 */
const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "[audio-frameworks-fix-v1]";

const RUBY_INJECTION = `
  # ${MARKER} — link MediaToolbox + MediaPlayer for expo-audio@57.x
  begin
    _audio_targets = installer.pods_project.targets.select { |t|
      t.name == 'ExpoAudio'
    }
    _audio_targets.each do |t|
      t.build_configurations.each do |c|
        existing = c.build_settings['OTHER_LDFLAGS'] || '$(inherited)'
        existing_arr = existing.is_a?(Array) ? existing : [existing]
        unless existing_arr.any? { |f| f.include?('MediaToolbox') }
          existing_arr << '-framework MediaToolbox'
        end
        unless existing_arr.any? { |f| f.include?('MediaPlayer') }
          existing_arr << '-framework MediaPlayer'
        end
        c.build_settings['OTHER_LDFLAGS'] = existing_arr
      end
    end
    puts "[audio-frameworks-fix] Linked MediaToolbox + MediaPlayer to ExpoAudio (#{_audio_targets.length} target(s))"
  rescue => e
    puts "[audio-frameworks-fix] ERROR: #{e.class}: #{e.message}"
  end
`;

module.exports = function withAudioFrameworks(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      if (!fs.existsSync(podfilePath)) {
        console.warn("[withAudioFrameworks] Podfile not found — skipping.");
        return config;
      }

      let podfile = fs.readFileSync(podfilePath, "utf8");

      if (podfile.includes(MARKER)) {
        console.log(`[withAudioFrameworks] ${MARKER} already present — skipping.`);
        return config;
      }

      const POST_INSTALL_OPEN = "post_install do |installer|";
      const idx = podfile.indexOf(POST_INSTALL_OPEN);

      if (idx === -1) {
        console.warn(
          "[withAudioFrameworks] Could not find 'post_install do |installer|' in Podfile — skipping."
        );
        return config;
      }

      const insertAt = idx + POST_INSTALL_OPEN.length;
      const patched =
        podfile.slice(0, insertAt) +
        "\n" +
        RUBY_INJECTION +
        podfile.slice(insertAt);

      fs.writeFileSync(podfilePath, patched, "utf8");
      console.log(
        `[withAudioFrameworks] Injected ${MARKER} into existing post_install block.`
      );

      return config;
    },
  ]);
};
