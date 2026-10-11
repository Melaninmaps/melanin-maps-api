import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const mobileRoot = path.resolve(__dirname, "..");
const eas = JSON.parse(
  fs.readFileSync(path.join(mobileRoot, "eas.json"), "utf8"),
) as {
  build: Record<string, {
    extends?: string;
    channel?: string;
    environment?: string;
    distribution?: string;
    env?: Record<string, string>;
  }>;
};

describe("isolated staging acceptance build profile", () => {
  it("uses the current Railway staging API for both store artifact platforms", () => {
    const profile = eas.build["acceptance-staging"];

    expect(profile).toMatchObject({
      extends: "production",
      channel: "acceptance-staging",
      environment: "testflight-staging",
      distribution: "store",
      env: {
        EXPO_PUBLIC_DOMAIN: "kinfolk-memory-api-staging-staging.up.railway.app",
        EXPO_PUBLIC_API_ORIGIN:
          "https://kinfolk-memory-api-staging-staging.up.railway.app",
        EXPO_PUBLIC_APP_ENV: "staging",
        APP_ENV: "staging",
        APP_RELEASE_CHANNEL: "acceptance-staging",
        EXPO_PUBLIC_REVENUECAT_ENABLED: "false",
      },
    });
  });

  it("keeps the production store profile on its production API", () => {
    expect(eas.build.production.env?.EXPO_PUBLIC_API_ORIGIN).toBe(
      "https://api.melaninmaps.com",
    );
  });
});
