#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const babelParser = require("@babel/parser");
const babelTraverse = require("@babel/traverse").default;

const STAGING_DOMAIN = "mwm-staging.35.196.78.19.nip.io";
const STAGING_ORIGIN = `https://${STAGING_DOMAIN}`;
const PRODUCTION_BACKEND = "https://www.mappingwithmelanin.com";
const PROJECT_ID = "0f873107-7787-46ab-9a04-685c2a6756b1";
const APP_ID = "com.melaninmaps.app";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function collectFiles(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(absolute, output);
    else output.push(absolute);
  }
  return output;
}

const RUNTIME_URL_ORIGINS = new Set([
  STAGING_ORIGIN,
  "https://988lifeline.org", "https://al-anon.org", "https://app.goingapp.com",
  "https://blackenterprise.com", "https://blackmentalhealth.com", "https://borislhensonfoundation.org",
  "https://calendly.com", "https://careers.example.com", "https://careers.uncf.org",
  "https://facebook.com", "https://findtreatment.gov", "https://habitat.org",
  "https://img.youtube.com", "https://instagram.com", "https://jopwell.com", "https://linkedin.com",
  "https://mappingwithmelanin.com", "https://maps.google.com", "https://maps.googleapis.com",
  "https://maps.apple.com",
  "https://meetingguide.org", "https://melaninandmentalhealth.com", "https://mwm.invalid",
  "https://mybusiness.com", "https://naacp.org", "https://nejm.org", "https://openpathcollective.org",
  "https://pinterest.com", "https://react.dev", "https://ronbrown.org", "https://sba.gov",
  "https://snapchat.com", "https://theirbusiness.com", "https://thelovelandfoundation.org",
  "https://therapyforblackgirls.com", "https://therapyforblackmen.org", "https://tiktok.com",
  "https://tmcf.org", "https://twitch.tv", "https://uncf.org", "https://usajobs.gov",
  "https://www.aa.org", "https://www.airbnb.com", "https://www.allianztravelinsurance.com",
  "https://www.booking.com", "https://www.caregiveraction.org", "https://www.clearme.com",
  "https://www.enterprise.com", "https://www.expedia.com", "https://www.google.com",
  "https://www.inclusivetherapists.com", "https://www.instagram.com", "https://www.intherooms.com",
  "https://www.na.org", "https://www.nsopw.gov", "https://www.operationhope.org",
  "https://www.psychologytoday.com", "https://www.smartrecovery.org", "https://www.thehotline.org",
  "https://www.thetrevorproject.org", "https://www.veteranscrisisline.net", "https://www.viator.com",
  "https://x.com", "https://yourbusiness.com", "https://youtube.com", "https://zillow.com",
]);

const GENERATED_BUNDLE_URL_ORIGINS = new Set([
  ...RUNTIME_URL_ORIGINS,
  "http://fontawesome.io", "http://fontello.com", "http://fontforge.sf.net",
  "http://hostname", "http://iptc.org", "http://localhost:3000", "http://localhost:8081", "http://ns.adobe.com",
  "http://ns.useplus.org", "http://purl.org", "http://www.fontisto.com",
  "http://www.kenangundogan.com", "http://www.w3.org", "http://xmp.gettyimages.com",
  "https://classic-assets.eascdn.net", "https://clients3.google.com", "https://dev.to",
  "https://docs.expo.dev", "https://docs.swmansion.com", "https://e", "https://exp.host", "https://expo.dev",
  "https://expo.fyi", "https://fontawesome.com", "https://fontawesome.comcopyright",
  "https://fontawesome.comfont", "https://fontawesome.comversion", "https://fonts.gstatic.com",
  "https://github.com", "https://opensource.org", "https://react-native-async-storage.github.io",
  "https://reactnavigation.org", "https://www.gettyimages.com",
]);

function collectJsonStrings(value, output) {
  if (typeof value === "string") {
    output.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectJsonStrings(item, output);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectJsonStrings(item, output);
  }
}

function collectSourceStrings(source, label) {
  const strings = [];
  if (label.endsWith(".json")) {
    collectJsonStrings(JSON.parse(source), strings);
    return strings;
  }
  const ast = babelParser.parse(source, {
    sourceType: "unambiguous",
    allowAwaitOutsideFunction: true,
    allowReturnOutsideFunction: true,
    errorRecovery: false,
    plugins: ["typescript", "jsx", "decorators-legacy", "classProperties", "classPrivateProperties", "classPrivateMethods", "dynamicImport", "importMeta", "topLevelAwait"],
  });
  babelTraverse(ast, {
    enter(nodePath) {
      if (nodePath.isStringLiteral()) {
        strings.push(nodePath.node.value);
        return;
      }
      if (nodePath.isTemplateLiteral() && nodePath.node.quasis[0]) {
        strings.push(nodePath.node.quasis[0].value.cooked ?? nodePath.node.quasis[0].value.raw);
      }
      if (!nodePath.isTemplateLiteral()
        && !nodePath.isBinaryExpression({ operator: "+" })
        && !nodePath.isConditionalExpression()
        && !nodePath.isLogicalExpression()) return;
      const evaluated = nodePath.evaluate();
      if (evaluated.confident && typeof evaluated.value === "string") strings.push(evaluated.value);
    },
  });
  return strings;
}

function urlCandidatesFromString(value) {
  const absolute = value.match(/https?:[^\s"'`<>()]+/gi) ?? [];
  const trimmed = value.trim();
  return trimmed.startsWith("//") ? [...absolute, trimmed] : absolute;
}

function assertAllowedBuild107BackendOrigins(source, label, scope = "runtime") {
  const allowedOrigins = scope === "bundle" ? GENERATED_BUNDLE_URL_ORIGINS : RUNTIME_URL_ORIGINS;
  const candidates = collectSourceStrings(source, label).flatMap(urlCandidatesFromString);
  for (const candidate of candidates) {
    let url;
    try {
      url = new URL(candidate.startsWith("//") ? `https:${candidate}` : candidate);
    } catch {
      continue;
    }
    if (!/[A-Za-z0-9]/.test(url.hostname)) continue;
    assert(!url.username && !url.password, `${label} contains URL credentials or user-info: ${url.origin}`);
    assert(allowedOrigins.has(url.origin), `${label} contains an unreviewed URL origin: ${url.origin}`);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      assert(url.origin === STAGING_ORIGIN, `${label} contains a non-staging API origin: ${url.origin}`);
    }
  }
}

function validateBuild107ExpoOutput(publicConfig, introspectConfig, exportDirectory, expectedSha) {
  assert(/^[0-9a-f]{40}$/.test(expectedSha), "expected export SHA must be a full lowercase Git SHA");
  assert(publicConfig.version === "1.1.7", "public Expo version mismatch");
  assert(publicConfig.ios?.buildNumber === "107", "public Expo iOS build mismatch");
  assert(publicConfig.runtimeVersion === "1.1.7-native.1", "public Expo runtime mismatch");
  assert(publicConfig.ios?.bundleIdentifier === APP_ID, "public Expo bundle identifier mismatch");
  assert(publicConfig.extra?.eas?.projectId === PROJECT_ID, "public Expo project identifier mismatch");
  assert(publicConfig.extra?.commitSha === expectedSha, "public Expo source SHA mismatch");
  assert(publicConfig.extra?.environment === "staging", "public Expo APP_ENV mismatch");
  assert(publicConfig.extra?.releaseChannel === "testflight-staging", "public Expo release channel mismatch");
  assert(publicConfig.extra?.apiOrigin === STAGING_ORIGIN, "public Expo API origin mismatch");
  assert(publicConfig.extra?.revenueCatEnabled === false, "public Expo config must disable RevenueCat");
  assert(publicConfig.updates?.enabled === false, "public Expo config must disable OTA updates");
  assert(publicConfig.updates?.checkAutomatically === "NEVER", "public Expo config must never check for OTA updates");
  assert(!(publicConfig.ios?.infoPlist?.UIBackgroundModes ?? []).includes("audio"), "public Expo config enables background audio");

  const infoPlist = introspectConfig?._internal?.modResults?.ios?.infoPlist ?? {};
  assert(introspectConfig.ios?.bundleIdentifier === APP_ID, "introspected bundle identifier mismatch");
  assert(introspectConfig.ios?.buildNumber === "107", "introspected iOS build mismatch");
  assert(!(infoPlist.UIBackgroundModes ?? []).includes("audio"), "introspected Info.plist enables background audio");
  assert(infoPlist.EXUpdatesEnabled === false, "introspected Info.plist must disable Expo Updates");
  assert(typeof infoPlist.NSMicrophoneUsageDescription === "string" && infoPlist.NSMicrophoneUsageDescription.length > 0, "introspected microphone permission is missing");

  const files = collectFiles(exportDirectory);
  const textual = files.filter((file) => /\.(?:js|json|map|txt|html)$/i.test(file));
  assert(textual.length > 0, "Expo export contained no inspectable bundle files");
  let stagingHits = 0;
  const productionHits = [];
  for (const file of textual) {
    const source = fs.readFileSync(file, "utf8");
    assertAllowedBuild107BackendOrigins(source, path.relative(exportDirectory, file), "bundle");
    if (source.includes(STAGING_DOMAIN)) stagingHits += 1;
    if (source.includes(PRODUCTION_BACKEND)) productionHits.push(path.relative(exportDirectory, file));
  }
  assert(stagingHits > 0, "Expo iOS export does not contain the reviewed staging origin");
  assert(productionHits.length === 0, `Expo iOS export contains the production backend in: ${productionHits.join(", ")}`);
  return { inspectedFiles: textual.length, stagingHits };
}

module.exports = { assertAllowedBuild107BackendOrigins, validateBuild107ExpoOutput };

if (require.main === module) {
  try {
    const [publicPath, introspectPath, exportDirectory, expectedSha] = process.argv.slice(2);
    assert(publicPath && introspectPath && exportDirectory && expectedSha, "usage: validate-build-107-expo-output.cjs <public.json> <introspect.json> <export-dir> <sha>");
    const result = validateBuild107ExpoOutput(
      JSON.parse(fs.readFileSync(publicPath, "utf8")),
      JSON.parse(fs.readFileSync(introspectPath, "utf8")),
      exportDirectory,
      expectedSha,
    );
    console.log(`Build 107 Expo staging proof passed (${result.inspectedFiles} files, ${result.stagingHits} staging hits).`);
  } catch (error) {
    console.error(`BUILD_107_BLOCKED: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
