import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const mobileRoot = path.resolve(__dirname, "..");
const read = (relativePath: string) =>
  fs.readFileSync(path.join(mobileRoot, relativePath), "utf8");

const selectorSource = read("lib/deviceFarmSelectors.ts");
const renderedSources = [
  "app/_layout.tsx",
  "app/login.tsx",
  "app/(tabs)/_layout.tsx",
  "app/(tabs)/index.tsx",
  "app/(tabs)/map.tsx",
  "app/(tabs)/safety-hub.tsx",
  "app/business/[id].tsx",
  "components/AIChatWidget.tsx",
  "components/BusinessCard.tsx",
  "components/DeviceFarmStagingMarker.tsx",
].map(read).join("\n");

describe("Device Farm selector contract", () => {
  it("declares stable controls for the P0 real-device flow", () => {
    for (const selector of [
      "mwm-staging-build-marker",
      "mwm-login-email",
      "mwm-login-password",
      "mwm-login-submit",
      "mwm-screen-discover",
      "mwm-tab-map",
      "mwm-screen-map",
      "mwm-business-profile-title",
      "mwm-business-profile-back",
      "mwm-tab-safety",
      "mwm-screen-safety",
      "mwm-kinfolk-launcher",
      "mwm-kinfolk-close",
      "mwm-kinfolk-input",
      "mwm-kinfolk-send",
      "mwm-kinfolk-answer",
    ]) {
      expect(selectorSource).toContain(selector);
    }
  });

  it("mounts every P0 selector on its intended native screen or control", () => {
    for (const selector of [
      "stagingBuildMarker",
      "loginEmail",
      "loginPassword",
      "loginSubmit",
      "discoverScreen",
      "mapTab",
      "mapScreen",
      "businessProfileTitle",
      "businessProfileBack",
      "safetyTab",
      "safetyScreen",
      "kinfolkLauncher",
      "kinfolkClose",
      "kinfolkInput",
      "kinfolkSend",
      "kinfolkAnswer",
    ]) {
      expect(renderedSources).toContain(`DEVICE_FARM_TEST_IDS.${selector}`);
    }
    expect(renderedSources).toContain("deviceFarmBusinessCardTestID");
  });

  it("keeps the visible Device Farm marker restricted to staging builds", () => {
    expect(read("components/DeviceFarmStagingMarker.tsx")).toContain(
      'if (environment !== "staging") return null;',
    );
  });
});
