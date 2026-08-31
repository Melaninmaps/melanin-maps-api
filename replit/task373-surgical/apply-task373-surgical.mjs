#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(process.argv[2] ?? process.cwd());
const MOBILE = path.join(ROOT, "artifacts", "mobile");
const REQUIRED = [
  "app.json",
  "app.config.js",
  "package.json",
  path.join("app", "(tabs)", "community.tsx"),
  path.join("lib", "crashLogger.ts"),
];

const now = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(ROOT, ".task373-backups", now);
const changed = [];
const skipped = [];

function fail(message) {
  throw new Error(message);
}

function restorePartialChanges() {
  for (const change of [...changed].reverse()) {
    const source = path.join(backupRoot, change.file);
    const destination = path.join(ROOT, change.file);
    if (fs.existsSync(source)) fs.copyFileSync(source, destination);
  }
}

function assertWorkspace() {
  if (!fs.existsSync(path.join(ROOT, "pnpm-workspace.yaml")) && !fs.existsSync(path.join(ROOT, "package.json"))) {
    fail(`No workspace manifest found at ${ROOT}`);
  }
  for (const relative of REQUIRED) {
    const target = path.join(MOBILE, relative);
    if (!fs.existsSync(target)) fail(`Required file is missing: ${path.relative(ROOT, target)}`);
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function backup(relative, original) {
  const destination = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, original);
}

function writeIfChanged(relative, original, next, reason) {
  if (next === original) {
    skipped.push({ file: relative, reason: `${reason}: already satisfied` });
    return;
  }
  backup(relative, original);
  fs.writeFileSync(path.join(ROOT, relative), next);
  changed.push({
    file: relative,
    reason,
    beforeSha256: sha256(original),
    afterSha256: sha256(next),
  });
}

function replaceExactly(text, from, to, label, { optionalIf = null } = {}) {
  if (text.includes(to)) return text;
  const count = text.split(from).length - 1;
  if (count === 1) return text.replace(from, to);
  if (count === 0 && optionalIf && optionalIf(text)) return text;
  fail(`${label}: expected exactly one source pattern, found ${count}. No partial write was made for this file.`);
}

function patchAppJson() {
  const relative = path.join("artifacts", "mobile", "app.json");
  const target = path.join(ROOT, relative);
  const original = fs.readFileSync(target, "utf8");
  const data = JSON.parse(original);
  const expo = data.expo;
  if (!expo || expo.ios?.bundleIdentifier !== "com.melaninmaps.app" || expo.android?.package !== "com.melaninmaps.app") {
    fail("app.json identifiers do not match Mapping With Melanin; refusing to patch another app");
  }

  expo.ios ??= {};
  expo.ios.infoPlist ??= {};
  Object.assign(expo.ios.infoPlist, {
    NSCameraUsageDescription:
      "Mapping With Melanin uses your camera when you choose to take a profile or community photo or video.",
    NSPhotoLibraryUsageDescription:
      "Mapping With Melanin accesses only the photos and videos you select for your profile or community posts.",
    NSPhotoLibraryAddUsageDescription:
      "Mapping With Melanin saves media to your library only when you choose to save it.",
  });

  expo.android ??= {};
  const permissions = new Set(expo.android.permissions ?? []);
  permissions.delete("android.permission.READ_EXTERNAL_STORAGE");
  permissions.delete("android.permission.WRITE_EXTERNAL_STORAGE");
  permissions.delete("android.permission.WRITE_CONTACTS");
  permissions.add("android.permission.READ_MEDIA_IMAGES");
  permissions.add("android.permission.READ_MEDIA_VIDEO");
  expo.android.permissions = [...permissions];

  const blocked = new Set(expo.android.blockedPermissions ?? []);
  blocked.add("android.permission.READ_EXTERNAL_STORAGE");
  blocked.add("android.permission.WRITE_EXTERNAL_STORAGE");
  blocked.add("android.permission.WRITE_CONTACTS");
  expo.android.blockedPermissions = [...blocked];

  if (Array.isArray(expo.plugins)) {
    for (const plugin of expo.plugins) {
      if (Array.isArray(plugin) && plugin[0] === "expo-image-picker") {
        plugin[1] ??= {};
        plugin[1].photosPermission =
          "Mapping With Melanin accesses only the photos and videos you select for your profile or community posts.";
        plugin[1].cameraPermission =
          "Mapping With Melanin uses your camera when you choose to take a profile or community photo or video.";
      }
    }
  }

  const next = `${JSON.stringify(data, null, 2)}\n`;
  writeIfChanged(relative, original, next, "Align media permission descriptions and remove obsolete storage/write-contacts permissions");
}

function patchAppConfig() {
  const relative = path.join("artifacts", "mobile", "app.config.js");
  const target = path.join(ROOT, relative);
  const original = fs.readFileSync(target, "utf8");
  let next = original;

  const metadataBlock = `const commitSha =\n  process.env.EAS_BUILD_GIT_COMMIT_HASH ??\n  process.env.GITHUB_SHA ??\n  process.env.REPLIT_GIT_COMMIT_SHA ??\n  "unknown";\nconst releaseChannel = process.env.APP_RELEASE_CHANNEL ?? "production";\nconst environment = process.env.APP_ENV ?? "production";\n`;

  if (!next.includes("const commitSha =")) {
    next = replaceExactly(
      next,
      'const mapsKey = process.env.GOOGLE_MAPS_API_KEY ?? "";\n',
      `const mapsKey = process.env.GOOGLE_MAPS_API_KEY ?? "";\n${metadataBlock}`,
      "app.config.js release metadata declarations",
    );
  }

  const extraBlock = `  extra: {\n    ...(config.extra ?? {}),\n    commitSha,\n    releaseChannel,\n    environment,\n  },\n`;
  if (!next.includes("releaseChannel,")) {
    next = replaceExactly(
      next,
      "  plugins: [\n",
      `${extraBlock}  plugins: [\n`,
      "app.config.js release metadata output",
    );
  }

  writeIfChanged(relative, original, next, "Inject commit, release-channel, and environment metadata into resolved Expo config");
}

function patchPackageJson() {
  const relative = path.join("artifacts", "mobile", "package.json");
  const target = path.join(ROOT, relative);
  const original = fs.readFileSync(target, "utf8");
  const data = JSON.parse(original);
  if (data.name !== "@workspace/mobile") fail(`Unexpected mobile package name: ${data.name}`);
  data.scripts ??= {};
  data.scripts["build:ios"] = "eas build --platform ios --profile production";
  data.scripts["build:candidate:ios"] = "eas build --platform ios --profile production --non-interactive";
  data.scripts["build:candidate:android"] = "eas build --platform android --profile production --non-interactive";
  const next = `${JSON.stringify(data, null, 2)}\n`;
  writeIfChanged(relative, original, next, "Remove automatic iOS submission and add explicit candidate-only build commands");
}

function patchCommunityComposer() {
  const relative = path.join("artifacts", "mobile", "app", "(tabs)", "community.tsx");
  const target = path.join(ROOT, relative);
  const original = fs.readFileSync(target, "utf8");
  let next = original;

  const guardSource = `  const submitPost = async () => {\n    if (!newPostText.trim()) return;\n    setSubmittingPost(true);`;
  const guardTarget = `  const submitPost = async () => {\n    if (!newPostText.trim()) return;\n    if (uploadingMedia) {\n      Alert.alert("Upload in progress", "Wait for your attachments to finish uploading before posting.");\n      return;\n    }\n\n    const completedMediaUrls = mediaAttachments\n      .map((attachment) => attachment.uploaded)\n      .filter((url): url is string => typeof url === "string" && url.trim().length > 0);\n\n    if (completedMediaUrls.length !== mediaAttachments.length) {\n      Alert.alert("Attachment not ready", "Remove the failed attachment or retry its upload before posting.");\n      return;\n    }\n\n    setSubmittingPost(true);`;

  if (!next.includes('Alert.alert("Upload in progress"')) {
    next = replaceExactly(next, guardSource, guardTarget, "community submit upload guard");
  }

  next = replaceExactly(
    next,
    "          mediaUrls: mediaAttachments.filter((m) => m.uploaded).map((m) => m.uploaded!),",
    "          mediaUrls: completedMediaUrls,",
    "community completed-media payload",
    { optionalIf: (value) => value.includes("mediaUrls: completedMediaUrls,") },
  );

  const buttonSource = `<TouchableOpacity activeOpacity={0.85} onPress={() => void submitPost()} disabled={!newPostText.trim() || submittingPost}>\n                <Text style={[styles.composePostText, { color: newPostText.trim() ? colors.primary : colors.muted }]}>\n                  {submittingPost ? "Posting…" : "Post"}\n                </Text>`;
  const buttonTarget = `<TouchableOpacity\n                activeOpacity={0.85}\n                onPress={() => void submitPost()}\n                disabled={!newPostText.trim() || submittingPost || uploadingMedia}\n                accessibilityState={{ disabled: !newPostText.trim() || submittingPost || uploadingMedia, busy: submittingPost || uploadingMedia }}\n              >\n                <Text style={[styles.composePostText, { color: newPostText.trim() && !uploadingMedia ? colors.primary : colors.muted }]}>\n                  {uploadingMedia ? "Uploading…" : submittingPost ? "Posting…" : "Post"}\n                </Text>`;

  if (!next.includes("busy: submittingPost || uploadingMedia")) {
    next = replaceExactly(next, buttonSource, buttonTarget, "community Post disabled/busy state");
  }

  writeIfChanged(relative, original, next, "Prevent posting while uploads are active or attachments are incomplete");
}

function patchCrashLogger() {
  const relative = path.join("artifacts", "mobile", "lib", "crashLogger.ts");
  const target = path.join(ROOT, relative);
  const original = fs.readFileSync(target, "utf8");
  let next = original;

  const sanitizerBlock = `\nfunction redactSensitiveText(value: string): string {\n  return value\n    .replace(/Bearer\\s+[A-Za-z0-9._~+\\/-]+=*/gi, "Bearer [REDACTED]")\n    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")\n    .replace(/([?&](?:token|access_token|refresh_token|code|email|key|signature)=)[^&#\\s]+/gi, "$1[REDACTED]")\n    .slice(0, 4000);\n}\n\nfunction sanitizeRoute(route: string): string {\n  return route\n    .split(/[?#]/, 1)[0]\n    .split("/")\n    .map((segment) =>\n      /^[0-9]+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment)\n        ? ":id"\n        : segment,\n    )\n    .join("/");\n}\n\nfunction sanitizeBreadcrumbUrl(rawUrl: string): string {\n  try {\n    const parsed = new URL(rawUrl, "https://mwm.invalid");\n    const pathname = sanitizeRoute(parsed.pathname);\n    return rawUrl.startsWith("/") ? pathname : parsed.origin + pathname;\n  } catch {\n    return sanitizeRoute(rawUrl);\n  }\n}\n\nfunction sanitizeMapState(state: Partial<MapState>): Partial<MapState> {\n  return {\n    permissionStatus: typeof state.permissionStatus === "string" ? state.permissionStatus : undefined,\n    loading: typeof state.loading === "boolean" ? state.loading : undefined,\n    lastLat: typeof state.lastLat === "number" ? Number(state.lastLat.toFixed(2)) : undefined,\n    lastLng: typeof state.lastLng === "number" ? Number(state.lastLng.toFixed(2)) : undefined,\n    error: typeof state.error === "string" ? redactSensitiveText(state.error) : undefined,\n  };\n}\n`;

  if (!next.includes("function sanitizeBreadcrumbUrl")) {
    next = replaceExactly(
      next,
      "// ─── In-memory state ──────────────────────────────────────────────────────────\n",
      `${sanitizerBlock}\n// ─── In-memory state ──────────────────────────────────────────────────────────\n`,
      "crash logger sanitizer insertion",
    );
  }

  next = replaceExactly(
    next,
    `      commitSha: Constants.expoConfig?.extra?.commitSha ?? "unknown",\n    };\n  } catch {\n    return { version: "unknown", buildNumber: "unknown", commitSha: "unknown" };`,
    `      commitSha: Constants.expoConfig?.extra?.commitSha ?? "unknown",\n      releaseChannel: Constants.expoConfig?.extra?.releaseChannel ?? "unknown",\n      environment: Constants.expoConfig?.extra?.environment ?? "unknown",\n    };\n  } catch {\n    return { version: "unknown", buildNumber: "unknown", commitSha: "unknown", releaseChannel: "unknown", environment: "unknown" };`,
    "crash logger build metadata",
    { optionalIf: (value) => value.includes("releaseChannel: Constants.expoConfig?.extra?.releaseChannel") },
  );

  next = replaceExactly(
    next,
    "export function addNavBreadcrumb(route: string): void {\n  _currentScreen = route;\n  pushBreadcrumb({ type: \"navigation\", message: `→ ${route}`, ts: new Date().toISOString() });\n}",
    "export function addNavBreadcrumb(route: string): void {\n  const sanitizedRoute = sanitizeRoute(route);\n  _currentScreen = sanitizedRoute;\n  pushBreadcrumb({ type: \"navigation\", message: `→ ${sanitizedRoute}`, ts: new Date().toISOString() });\n}",
    "crash logger route redaction",
    { optionalIf: (value) => value.includes("const sanitizedRoute = sanitizeRoute(route)") },
  );

  next = replaceExactly(
    next,
    'export function setMapState(state: Partial<MapState>): void {\n  _mapState = { ..._mapState, ...state };\n  pushBreadcrumb({\n    type: "map",\n    message: `map: ${JSON.stringify(state)}`,\n    ts: new Date().toISOString(),\n  });\n}',
    `export function setMapState(state: Partial<MapState>): void {\n  const sanitizedState = sanitizeMapState(state);\n  _mapState = { ..._mapState, ...sanitizedState };\n  pushBreadcrumb({\n    type: "map",\n    message: "map state updated",\n    data: sanitizedState,\n    ts: new Date().toISOString(),\n  });\n}`,
    "crash logger coordinate redaction",
    { optionalIf: (value) => value.includes('message: "map state updated"') },
  );

  next = replaceExactly(
    next,
    "    const rec: ApiRecord = { url, method, ts: new Date().toISOString() };",
    "    const rec: ApiRecord = { url: sanitizeBreadcrumbUrl(url), method, ts: new Date().toISOString() };",
    "crash logger URL redaction",
    { optionalIf: (value) => value.includes("url: sanitizeBreadcrumbUrl(url)") },
  );

  next = replaceExactly(
    next,
    "      rec.error = err instanceof Error ? err.message : String(err);",
    '      rec.error = err instanceof Error ? err.name : "NetworkError";',
    "crash logger request-error minimization",
    { optionalIf: (value) => value.includes('rec.error = err instanceof Error ? err.name : "NetworkError";') },
  );

  next = replaceExactly(
    next,
    "      message: err.message ?? String(err),\n      stack: err.stack ?? \"(no stack)\",",
    "      message: redactSensitiveText(err.message ?? String(err)),\n      stack: redactSensitiveText(err.stack ?? \"(no stack)\"),",
    "crash logger exception redaction",
    { optionalIf: (value) => value.includes("message: redactSensitiveText(err.message") },
  );

  next = replaceExactly(
    next,
    "      commitSha: meta.commitSha,\n    },",
    "      commitSha: meta.commitSha,\n      releaseChannel: meta.releaseChannel,\n      environment: meta.environment,\n    },",
    "crash logger report release metadata",
    { optionalIf: (value) => value.includes("releaseChannel: meta.releaseChannel") },
  );

  next = replaceExactly(
    next,
    "    commitSha: string;\n  };",
    "    commitSha: string;\n    releaseChannel: string;\n    environment: string;\n  };",
    "crash logger report type metadata",
    { optionalIf: (value) => value.includes("releaseChannel: string;") },
  );

  writeIfChanged(relative, original, next, "Redact sensitive crash context and include release identity");
}

function main() {
  assertWorkspace();
  fs.mkdirSync(backupRoot, { recursive: true });
  patchAppJson();
  patchAppConfig();
  patchPackageJson();
  patchCommunityComposer();
  patchCrashLogger();

  const manifest = {
    createdAt: new Date().toISOString(),
    workspace: ROOT,
    backupRoot,
    changed,
    skipped,
  };
  fs.writeFileSync(path.join(backupRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(JSON.stringify(manifest, null, 2));
  console.log("\nTASK373 surgical source repairs applied. Review `git diff` before installing dependencies or building.");
}

try {
  main();
} catch (error) {
  restorePartialChanges();
  console.error(`TASK373 ERROR: ${error instanceof Error ? error.message : String(error)}`);
  if (changed.length > 0) console.error(`TASK373: restored ${changed.length} earlier file edit(s) after the conflict.`);
  process.exit(1);
}
