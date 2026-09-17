import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("web-only administrator surface", () => {
  const adminScreen = source("../../../mobile/app/admin.tsx");
  const profile = source("../../../mobile/app/(tabs)/profile.tsx");
  const webAdmin = source("../../../web/src/pages/admin.tsx");
  const accessLedger = source("../../../web/src/components/AdminAccessLedger.tsx");

  it("does not expose native administrator tools or an admin profile shortcut", () => {
    expect(adminScreen).toContain("Administrator tools are on the website");
    expect(adminScreen).toContain("use the secure web administrator dashboard");
    expect(adminScreen).toContain('router.replace("/(tabs)/profile" as never)');
    expect(profile).not.toContain('router.push("/admin")');
    expect(profile).not.toContain("const ADMIN_EMAILS");
  });

  it("retains the web administrator dashboard and its access-ledger surface", () => {
    expect(webAdmin).toContain("AdminAccessLedger");
    expect(accessLedger).toContain("Access ledger");
  });
});
