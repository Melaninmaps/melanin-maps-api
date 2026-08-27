#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] ?? process.cwd());
const relative = path.join("artifacts", "mobile", "components", "CommunityPostCard.tsx");
const target = path.join(ROOT, relative);
const mobilePackagePath = path.join(ROOT, "artifacts", "mobile", "package.json");

function fail(message) {
  console.error(`TASK373 VIDEO ERROR: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(target) || !fs.existsSync(mobilePackagePath)) fail("Run from the Replit workspace root");
let source = fs.readFileSync(target, "utf8");
if (source.includes("function NativeCommunityVideoModal")) {
  console.log("TASK373 VIDEO: native community video modal is already present; no source change made.");
  process.exit(0);
}

const original = source;
const backupDir = path.join(ROOT, ".task373-backups", `video-${new Date().toISOString().replace(/[:.]/g, "-")}`);

function replaceOnce(from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one source pattern, found ${count}`);
  source = source.replace(from, to);
}

replaceOnce(
  'import * as Haptics from "expo-haptics";\n',
  'import { useEvent } from "expo";\nimport * as Haptics from "expo-haptics";\n',
  "Expo event import",
);
replaceOnce(
  'import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";',
  'import { Alert, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";',
  "React Native Modal import",
);
replaceOnce(
  'import { useRouter } from "expo-router";\n',
  'import { useRouter } from "expo-router";\nimport { VideoView, useVideoPlayer } from "expo-video";\n',
  "Expo Video import",
);

const component = `\nfunction NativeCommunityVideoModal({ url, onClose }: { url: string; onClose: () => void }) {\n  const colors = useColors();\n  const player = useVideoPlayer({ uri: url, useCaching: true }, (instance) => {\n    instance.play();\n  });\n  const { status } = useEvent(player, "statusChange", { status: player.status });\n\n  const close = () => {\n    player.pause();\n    onClose();\n  };\n\n  return (\n    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={close}>\n      <View style={{ flex: 1, backgroundColor: "#000000", justifyContent: "center" }}>\n        <VideoView\n          player={player}\n          style={{ width: "100%", aspectRatio: 9 / 16, maxHeight: "80%" }}\n          nativeControls\n          contentFit="contain"\n          fullscreenOptions={{ enable: true }}\n          accessibilityLabel="Community post video"\n        />\n        {status === "error" ? (\n          <View style={{ padding: 20, alignItems: "center", gap: 12 }}>\n            <Text style={{ color: "#FFFFFF", textAlign: "center" }}>This video could not be played in the app.</Text>\n            <TouchableOpacity\n              onPress={() => { void openExternalUrl(url, { unavailableMessage: "This video is unavailable." }); }}\n              style={{ borderColor: "#FFFFFF", borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}\n              accessibilityRole="button"\n              accessibilityLabel="Open video externally"\n            >\n              <Text style={{ color: "#FFFFFF" }}>Open externally</Text>\n            </TouchableOpacity>\n          </View>\n        ) : null}\n        <TouchableOpacity\n          onPress={close}\n          style={{ position: "absolute", top: 54, right: 20, backgroundColor: colors.card, borderRadius: 22, padding: 10 }}\n          accessibilityRole="button"\n          accessibilityLabel="Close video"\n        >\n          <Feather name="x" size={24} color={colors.foreground} />\n        </TouchableOpacity>\n      </View>\n    </Modal>\n  );\n}\n`;
replaceOnce("function MediaGrid({ mediaUrls, hasContentWarning, contentWarningType }:", `${component}\nfunction MediaGrid({ mediaUrls, hasContentWarning, contentWarningType }:`, "Native video component insertion");
replaceOnce(
  "  const [revealed, setRevealed] = useState(false);\n  const colors = useColors();",
  '  const [revealed, setRevealed] = useState(false);\n  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);\n  const colors = useColors();',
  "Active video state",
);
replaceOnce(
  "  return (\n    <View style={s.mediaGrid}>",
  "  return (\n    <>\n      {activeVideoUrl ? (\n        <NativeCommunityVideoModal url={activeVideoUrl} onClose={() => setActiveVideoUrl(null)} />\n      ) : null}\n      <View style={s.mediaGrid}>",
  "Video modal render",
);
replaceOnce(
  '            style={[s.mediaThumb, { backgroundColor: "#0008", justifyContent: "center", alignItems: "center" }]}\n            onPress={() => { void openExternalUrl(url, { unavailableMessage: "This video is unavailable." }); }}\n            activeOpacity={0.8}',
  '            style={[s.mediaThumb, { backgroundColor: "#0008", justifyContent: "center", alignItems: "center" }]}\n            onPress={() => setActiveVideoUrl(url)}\n            activeOpacity={0.8}',
  "Video tile action",
);
replaceOnce(
  '>Open Video</Text>\n          </TouchableOpacity>',
  '>Play Video</Text>\n          </TouchableOpacity>',
  "Video tile label",
);
replaceOnce(
  "      })}\n    </View>\n  );\n}\n\nfunction LinkPreviewCard",
  "      })}\n      </View>\n    </>\n  );\n}\n\nfunction LinkPreviewCard",
  "Video modal fragment close",
);

fs.mkdirSync(path.dirname(path.join(backupDir, relative)), { recursive: true });
fs.writeFileSync(path.join(backupDir, relative), original);
fs.writeFileSync(target, source);

const packageJson = JSON.parse(fs.readFileSync(mobilePackagePath, "utf8"));
const hasVideo = Boolean(packageJson.dependencies?.["expo-video"] || packageJson.devDependencies?.["expo-video"]);
console.log(JSON.stringify({ changed: relative, backupDir, expoVideoDeclared: hasVideo }, null, 2));
if (!hasVideo) {
  console.log("NEXT REQUIRED COMMAND: pnpm --filter @workspace/mobile exec expo install expo-video");
}
console.log("Review git diff, install expo-video if requested, then run full typecheck and native-device playback tests.");
