import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type PluginEntry = string | [string, Record<string, unknown>];
type AppJson = {
  expo: {
    version: string;
    runtimeVersion: string;
    ios: {
      buildNumber: string;
      infoPlist?: {
        UIBackgroundModes?: string[];
        NSMicrophoneUsageDescription?: string;
      };
    };
    android: { version: string; versionCode: number; runtimeVersion: string };
    plugins: PluginEntry[];
  };
};

const projectRoot = path.resolve(__dirname, "..");
const appJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "app.json"), "utf8")) as AppJson;
const buildRecord = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ".build-record.json"), "utf8"),
) as {
  lastIosSubmitted: number;
  lastIosReserved?: number;
  lastAndroidSubmitted: number;
  lastAndroidReserved?: number;
};
const eas = JSON.parse(fs.readFileSync(path.join(projectRoot, "eas.json"), "utf8")) as {
  build: { production: { env: { EXPO_PUBLIC_API_ORIGIN: string } } };
  submit: { production: { ios: { ascAppId: string } } };
};

describe("iOS App Review background-audio configuration", () => {
  it("uses identifiers above every recorded submitted or reserved artifact", () => {
    // The build record is historical evidence, not the EAS source of truth.
    // It deliberately remains conservative when a newer identifier was reserved
    // by EAS after the record was written. The release gate enforces this
    // reviewed source's exact 125/95 identifiers before a build is allowed.
    expect(Number(appJson.expo.ios.buildNumber)).toBeGreaterThan(
      Math.max(buildRecord.lastIosSubmitted, buildRecord.lastIosReserved ?? 0),
    );
    expect(appJson.expo.android.versionCode).toBeGreaterThan(
      Math.max(buildRecord.lastAndroidSubmitted, buildRecord.lastAndroidReserved ?? 0),
    );
    expect(appJson.expo.ios.buildNumber).toBe("125");
    expect(appJson.expo.android.versionCode).toBe(95);
    expect(appJson.expo.version).toBe("1.1.9");
    expect(appJson.expo.android.version).toBe("1.1.7");
    expect(appJson.expo.runtimeVersion).toBe("1.1.9-native.1");
    expect(appJson.expo.android.runtimeVersion).toBe("1.1.7-native.1");
  });

  it("keeps the foreground microphone permission but disables persistent audio modes", () => {
    const audioPlugin = appJson.expo.plugins.find(
      (entry): entry is [string, Record<string, unknown>] =>
        Array.isArray(entry) && entry[0] === "expo-audio",
    );

    expect(audioPlugin).toBeDefined();
    expect(audioPlugin?.[1].microphonePermission).toEqual(expect.any(String));
    expect(audioPlugin?.[1].recordAudioAndroid).toBe(true);
    expect(appJson.expo.ios.infoPlist?.NSMicrophoneUsageDescription).toEqual(expect.any(String));
    expect(audioPlugin?.[1].enableBackgroundPlayback).toBe(false);
    expect(audioPlugin?.[1].enableBackgroundRecording).toBe(false);
    expect(appJson.expo.ios.infoPlist?.UIBackgroundModes ?? []).not.toContain("audio");
  });

  it("uses the production API and App Store Connect profile for TestFlight", () => {
    expect(eas.build.production.env.EXPO_PUBLIC_API_ORIGIN).toBe("https://api.melaninmaps.com");
    expect(eas.submit.production.ios.ascAppId).toBe("6783773366");
  });
});
