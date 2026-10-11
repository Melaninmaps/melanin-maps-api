import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const mobileRoot = path.resolve(__dirname, "..");
const stagingEnvironment = {
  APP_ENV: "staging",
  EXPO_PUBLIC_APP_ENV: "staging",
  EXPO_PUBLIC_DOMAIN: "kinfolk-memory-api-staging-staging.up.railway.app",
  EXPO_PUBLIC_API_ORIGIN:
    "https://kinfolk-memory-api-staging-staging.up.railway.app",
  EXPO_PUBLIC_REVENUECAT_ENABLED: "false",
  APP_RELEASE_CHANNEL: "acceptance-staging",
  EAS_BUILD_PLATFORM: "android",
};

function resolveConfig(overrides: Record<string, string | undefined>) {
  const script = [
    'const config = require("./app.config.js")({ config: { android: {}, ios: {} } });',
    "console.log(JSON.stringify(config));",
  ].join(" ");
  return execFileSync("node", ["-e", script], {
    cwd: mobileRoot,
    env: { ...process.env, ...stagingEnvironment, ...overrides },
    encoding: "utf8",
  });
}

describe("Android map acceptance build configuration", () => {
  it("fails closed when an Android build lacks a native Google Maps key", () => {
    expect(() => resolveConfig({ GOOGLE_MAPS_API_KEY: undefined })).toThrow(
      /GOOGLE_MAPS_API_KEY/,
    );
  });

  it("keeps the supplied Android Maps key in native config without enabling iOS Google Maps", () => {
    const config = JSON.parse(resolveConfig({ GOOGLE_MAPS_API_KEY: "test-maps-key" })) as {
      android?: { config?: { googleMaps?: { apiKey?: string } } };
      ios?: { config?: { googleMapsApiKey?: string } };
    };

    expect(config.android?.config?.googleMaps?.apiKey).toBe("test-maps-key");
    expect(config.ios?.config?.googleMapsApiKey).toBeUndefined();
  });
});
