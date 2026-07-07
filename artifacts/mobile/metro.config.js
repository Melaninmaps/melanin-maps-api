const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.extraNodeModules = {
  assert: path.resolve(__dirname, "mocks/assert.js"),
};

// Resolve expo-router's qualified entry once at startup, before Metro begins.
// Using require.resolve with explicit paths works reliably in EAS build env.
let expoRouterQualifiedEntry;
try {
  expoRouterQualifiedEntry = require.resolve("expo-router/build/qualified-entry", {
    paths: [projectRoot, workspaceRoot],
  });
} catch (_e) {
  // Fallback: construct path directly from workspace node_modules
  expoRouterQualifiedEntry = path.resolve(
    workspaceRoot,
    "node_modules/expo-router/build/qualified-entry.js"
  );
}

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = context.originModulePath || "";

  // Fix for pnpm virtual store: expo/AppEntry.js imports '../../App' which
  // cannot resolve in pnpm's deeply-nested virtual store paths.
  // Drop the origin check — in EAS builds context.originModulePath may be
  // empty/undefined, causing the condition to silently miss. The '../../App'
  // import is exclusive to expo/AppEntry.js so intercepting unconditionally is safe.
  if (moduleName === "../../App") {
    return { type: "sourceFile", filePath: expoRouterQualifiedEntry };
  }

  const isContactAccessButton =
    (origin.includes("expo-contacts") && moduleName.includes("ContactAccessButton")) ||
    (typeof moduleName === "string" && moduleName.match(/expo-contacts.*ContactAccessButton/));

  if (isContactAccessButton) {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "mocks/ContactAccessButton.js"),
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
