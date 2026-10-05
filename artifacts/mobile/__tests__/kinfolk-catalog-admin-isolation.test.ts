import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("mobile Kinfolk Catalog admin isolation", () => {
  it("does not expose the browser-only administrator catalog or raw profile receipt endpoints to the mobile client", () => {
    const mobileApi = source("../lib/api.ts");
    const businessHooks = source("../hooks/useBusinesses.ts");
    expect(mobileApi).not.toContain("/api/admin/kinfolk-catalog");
    expect(mobileApi).not.toContain("business_admin_ownership_source_receipts");
    expect(businessHooks).not.toContain("/api/admin/businesses/");
  });
});
