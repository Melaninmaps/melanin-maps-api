import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appConfig = JSON.parse(
  readFileSync(new URL("../app.json", import.meta.url), "utf8"),
) as {
  expo: {
    ios: { supportsTablet?: boolean; infoPlist?: Record<string, unknown> };
    plugins?: unknown[];
  };
};

describe("adaptive platform configuration", () => {
  it("keeps iPad support and permits Split View / Stage Manager", () => {
    expect(appConfig.expo.ios.supportsTablet).toBe(true);
    expect(appConfig.expo.ios.infoPlist?.UIRequiresFullScreen).toBe(false);
  });

  it("keeps Chromebook and Android adaptive-layout plugins enabled", () => {
    expect(appConfig.expo.plugins).toContain("./plugins/withChromebookSupport");
    expect(appConfig.expo.plugins).toContain("./plugins/withAndroidAdaptiveLayout");
  });
});
