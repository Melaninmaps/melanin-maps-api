import { describe, expect, it } from "vitest";
import { buildBusinessesRequestUrl } from "../hooks/support-lens-request";

describe("mobile Support Lens request state transitions", () => {
  it("sends a second explicit all-businesses request after Show All", () => {
    const strict = buildBusinessesRequestUrl("https://api.test", {
      designations: ["black-african-american", "woman"],
      supportScope: "strict_documented_designations",
    });
    const all = buildBusinessesRequestUrl("https://api.test", {
      designations: [],
      supportScope: "all_businesses",
    });
    expect(strict).toContain("supportScope=strict_documented_designations");
    expect(strict).toContain("designations=black-african-american%2Cwoman");
    expect(all).toBe("https://api.test/api/businesses?supportScope=all_businesses");
    expect(all).not.toContain("designations=");
  });
});