#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const easPath = path.join(root, "artifacts", "mobile", "eas.json");
const eas = JSON.parse(fs.readFileSync(easPath, "utf8"));
const requiredImage = "ubuntu-26.04-jdk-17-ndk-r27b-sdk-57";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const production = eas?.build?.production;
const android = production?.android;
const productionAndroid = eas?.build?.["production-android"];

assert(production?.distribution === "store", "production EAS profile must remain store-distributed");
assert(android?.buildType === "app-bundle", "production Android build must remain an app bundle");
assert(
  android?.image === requiredImage,
  `production Android must use ${requiredImage} so Gradle runs on Java 17`,
);
assert(
  productionAndroid?.extends === "production",
  "production-android must inherit the Java 17 production Android image",
);
assert(
  productionAndroid?.env?.EAS_BUILD_PLATFORM === "android",
  "production-android must retain its Android-specific Expo config selector",
);
assert(
  !Object.hasOwn(productionAndroid ?? {}, "distribution"),
  "production-android must not override production store distribution",
);

console.log(`ANDROID_EAS_JDK17_CONFIGURATION_PASS: ${requiredImage}`);
