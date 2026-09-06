import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type PluginEntry = string | [string, Record<string, unknown>];
type AppJson = {
  expo: {
    version: string;
    runtimeVersion: string;
    ios: { buildNumber: string; infoPlist?: { UIBackgroundModes?: string[] } };
    android: { versionCode: number };
    plugins: PluginEntry[];
  };
};

const projectRoot = path.resolve(__dirname, "..");
const appJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "app.json"), "utf8")) as AppJson;
const buildRecord = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ".build-record.json"), "utf8"),
) as { lastIosSubmitted: number };

describe("iOS App Review background-audio configuration", () => {
  it("uses the next build after the last submitted TestFlight binary", () => {
    expect(Number(appJson.expo.ios.buildNumber)).toBe(buildRecord.lastIosSubmitted + 1);
    expect(appJson.expo.ios.buildNumber).toBe("106");
    expect(appJson.expo.android.versionCode).toBe(80);
    expect(appJson.expo.version).toBe("1.1.6");
    expect(appJson.expo.runtimeVersion).toBe("1.1.6-native.1");
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
