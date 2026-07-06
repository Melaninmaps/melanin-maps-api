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
