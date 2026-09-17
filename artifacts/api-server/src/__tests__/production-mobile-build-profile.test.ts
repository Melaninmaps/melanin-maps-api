import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const easConfig = JSON.parse(readFileSync(
  fileURLToPath(new URL("../../../mobile/eas.json", import.meta.url)),
  "utf8",
)) as { build?: Record<string, { distribution?: string; env?: Record<string, string>; android?: { buildType?: string } }> };

describe("production mobile build profile", () => {
  it("uses the production API without changing existing staging profiles", () => {
    const production = easConfig.build?.production;
    expect(production).toMatchObject({
      distribution: "store",
      android: { buildType: "app-bundle" },
      env: {
        EXPO_PUBLIC_DOMAIN: "www.mappingwithmelanin.com",
        EXPO_PUBLIC_API_ORIGIN: "https://api.melaninmaps.com",
        EXPO_PUBLIC_APP_ENV: "production",
        APP_ENV: "production",
        APP_RELEASE_CHANNEL: "production",
      },
    });
    expect(easConfig.build?.["testflight-staging"]?.env?.EXPO_PUBLIC_APP_ENV).toBe("staging");
    expect(easConfig.build?.preview?.env?.EXPO_PUBLIC_API_ORIGIN).toContain("mwm-staging");
  });
});
