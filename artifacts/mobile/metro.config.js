const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

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
