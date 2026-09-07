/*
 * Local export-proof guard. It deliberately does not call EAS or export a
 * bundle: CI may pass an already-produced JS bundle path as argv[2].
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const eas = JSON.parse(fs.readFileSync(path.join(root, "eas.json"), "utf8"));
const staging = eas.build?.["testflight-staging"]?.env ?? {};
const productionOrigin = "https://www." + "mappingwithmelanin.com";
const stagingOrigin = `https://${staging.EXPO_PUBLIC_DOMAIN ?? ""}`;

if (!staging.EXPO_PUBLIC_DOMAIN || stagingOrigin === productionOrigin) {
  throw new Error("testflight-staging must declare a non-production EXPO_PUBLIC_DOMAIN");
}
function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.(ts|tsx)$/.test(file) ? [file] : [];
  });
}
const reachableSource = ["app", "components", "hooks", "lib"]
  .flatMap((part) => sourceFiles(path.join(root, part)))
  .filter((file) => file !== path.join(root, "lib", "api.ts"));
for (const file of reachableSource) {
  const source = fs.readFileSync(file, "utf8");
  if (source.includes("EXPO_PUBLIC_API_URL")) {
    throw new Error(`mobile source selects EXPO_PUBLIC_API_URL: ${path.relative(root, file)}`);
  }
  if (source.includes("EXPO_PUBLIC_DOMAIN")) {
    throw new Error(`mobile source has an independent API origin resolver: ${path.relative(root, file)}`);
  }
  if (source.includes(productionOrigin)) {
    throw new Error(`reachable mobile source contains production API origin: ${path.relative(root, file)}`);
  }
}
if (process.argv[2]) {
  const compiledPath = path.resolve(process.argv[2]);
  const compiledFiles = fs.statSync(compiledPath).isDirectory()
    ? (function walk(dir) {
        return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
          const file = path.join(dir, entry.name);
          return entry.isDirectory() ? walk(file) : [file];
        });
      })(compiledPath)
    : [compiledPath];
  const compiled = compiledFiles
    .map((file) => fs.readFileSync(file))
    .map((buffer) => buffer.toString("latin1"))
    .join("");
  if (compiled.includes(productionOrigin)) {
    throw new Error("staging bundle contains the production API origin");
  }
  if (!compiled.includes(staging.EXPO_PUBLIC_DOMAIN)) {
    throw new Error("staging bundle does not contain the configured staging API origin");
  }
}
process.stdout.write(`staging API origin/source verified: ${stagingOrigin}\n`);