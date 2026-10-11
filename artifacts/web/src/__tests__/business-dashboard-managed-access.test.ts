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

  it("does not mistake a revalidated auth response for a signed-out owner", () => {
    expect(dashboard).toContain('cache: "no-store"');
    expect(dashboard).toContain("const [authLoading, setAuthLoading] = useState(true);");
    expect(dashboard).toContain("if (authLoading) {");
    expect(dashboard).toContain(".then((r) => (r.ok ? r.json() : null))");
  });
});
