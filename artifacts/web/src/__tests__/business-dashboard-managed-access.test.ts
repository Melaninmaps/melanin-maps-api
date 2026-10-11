import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(
  new URL("../pages/business-dashboard.tsx", import.meta.url),
  "utf8",
);

describe("Business Dashboard multi-business access", () => {
  it("uses the explicit managed-business list rather than the legacy ambiguous endpoint", () => {
    expect(dashboard).toContain('fetch(`${BASE}api/businesses/mine/managed`, { credentials: "include" })');
    expect(dashboard).toContain("Array.isArray(d.businesses) ? d.businesses : []");
    expect(dashboard).toContain("The dashboard is explicitly multi-business.");
    expect(dashboard).not.toContain('fetch(`${BASE}api/businesses/mine`, { credentials: "include" })');
  });
});
