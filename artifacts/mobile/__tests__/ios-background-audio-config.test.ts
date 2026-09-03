import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type PluginEntry = string | [string, Record<string, unknown>];

type AppJson = {
  expo: {
    ios: {
      buildNumber: string;
      infoPlist?: {
        UIBackgroundModes?: string[];
      };
    };
    plugins: PluginEntry[];
  };
};

const projectRoot = path.resolve(__dirname, "..");
const appJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "app.json"), "utf8"),
) as AppJson;

describe("iOS App Review background-audio configuration", () => {
  it("uses build 105 for the Guideline 2.5.4 correction", () => {
    expect(appJson.expo.ios.buildNumber).toBe("105");
  });

  it("keeps the foreground microphone permission but disables persistent audio modes", () => {
    const audioPlugin = appJson.expo.plugins.find(
      (entry): entry is [string, Record<string, unknown>] =>
        Array.isArray(entry) && entry[0] === "expo-audio",
    );

    expect(audioPlugin).toBeDefined();
    expect(audioPlugin?.[1].microphonePermission).toEqual(expect.any(String));
    expect(audioPlugin?.[1].enableBackgroundPlayback).toBe(false);
    expect(audioPlugin?.[1].enableBackgroundRecording).toBe(false);
    expect(appJson.expo.ios.infoPlist?.UIBackgroundModes ?? []).not.toContain("audio");
  });
});
