import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("native private push-token registration", () => {
  it("uses one authenticated, staging-aware registration path without token caching", () => {
    const hook = source("../hooks/usePushNotifications.ts");
    const layout = source("../app/_layout.tsx");

    expect(hook).toContain('import { getApiBase } from "@/lib/api"');
    expect(hook).toContain('getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })');
    expect(hook).toContain('`${apiBase}/api/notifications/register`');
    expect(hook).toContain("platform: Platform.OS");
    expect(hook).not.toContain("AsyncStorage");
    expect(hook).not.toContain("/api/push-token");
    expect(layout).toContain('import { registerPushToken } from "@/hooks/usePushNotifications"');
    expect(layout).toContain("void registerPushToken();");
  });
});
