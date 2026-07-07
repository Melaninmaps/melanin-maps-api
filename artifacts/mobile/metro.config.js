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

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = context.originModulePath || "";

  // Fix for pnpm virtual store: expo/AppEntry.js imports '../../App' which
  // can't resolve in pnpm's deeply-nested store paths.
  // Redirect it to expo-router's qualified entry App component.
  if (
    moduleName === "../../App" &&
    origin.includes("/expo/AppEntry")
  ) {
    return {
      type: "sourceFile",
      filePath: require.resolve("expo-router/build/qualified-entry"),
    };
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
