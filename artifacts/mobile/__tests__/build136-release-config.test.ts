import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readJson(relativePath: string): Record<string, any> {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8"),
  );
}

describe("Build 136 native release configuration", () => {
  const app = readJson("../app.json").expo;
  const eas = readJson("../eas.json");
  const googleServices = readJson("../google-services.json");

  it("reserves the approved iOS and Android counters without changing app identity", () => {
    expect(app.version).toBe("1.1.10");
    expect(app.ios.bundleIdentifier).toBe("com.melaninmaps.app");
    expect(app.ios.buildNumber).toBe("136");
    expect(app.android.package).toBe("com.melaninmaps.app");
    expect(app.android.versionCode).toBe(102);
    expect(app.extra.eas.projectId).toBe(
      "0f873107-7787-46ab-9a04-685c2a6756b1",
    );
  });

  it("keeps the Android Firebase identity aligned with the Android package", () => {
    expect(googleServices.client).toHaveLength(1);
    expect(
      googleServices.client[0].client_info.android_client_info.package_name,
    ).toBe(app.android.package);
  });

  it("keeps remote iOS signing and distinct staging, internal, and store profiles", () => {
    expect(eas.cli.appVersionSource).toBe("local");
    expect(eas.build["testflight-staging"].distribution).toBe("store");
    expect(eas.build["testflight-staging"].ios.credentialsSource).toBe(
      "remote",
    );
    expect(eas.build["build136-device-acceptance"]).toMatchObject({
      extends: "production",
      distribution: "internal",
      environment: "production",
      autoIncrement: false,
      ios: { credentialsSource: "remote", image: "sdk-57" },
      android: {
        buildType: "apk",
        image: "ubuntu-26.04-jdk-17-ndk-r27b-sdk-57",
      },
    });
    expect(eas.build.production.distribution).toBe("store");
    expect(eas.build.production.android.buildType).toBe("app-bundle");
    expect(eas.submit.production.ios).toMatchObject({
      ascAppId: "6783773366",
      appleTeamId: "Y46Y4A5MMZ",
    });
  });
});
