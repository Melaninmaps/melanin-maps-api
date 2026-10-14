import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(
  new URL("../pages/business-dashboard.tsx", import.meta.url),
  "utf8",
);

describe("Business Dashboard authenticated transport", () => {
  it("uses the shared bearer-and-cookie helper for every Business Dashboard API request", () => {
    expect(dashboard).toContain('import { authenticatedFetch } from "@/lib/authenticatedFetch"');
    expect(dashboard).toContain('authenticatedFetch(`${BASE}api/auth/user`, { credentials: "include", cache: "no-store" })');
    expect(dashboard).toContain('authenticatedFetch(`${BASE}api/businesses/mine/managed`, { credentials: "include" })');
    expect(dashboard).toContain('authenticatedFetch(`${BASE}api/reviews?businessId=${selectedId}`');
    expect(dashboard).toContain('authenticatedFetch(`${BASE}api/businesses/${selectedId}/kinfolk-community-needs`');
    expect(dashboard).toContain('authenticatedFetch(`${BASE}api/businesses/mine/growth-tools`');
    expect(dashboard).toContain('authenticatedFetch(`${BASE}api/global-recommendations/mine`');
    expect(dashboard).toContain('authenticatedFetch(`${BASE}api/global-recommendations`,');
    expect(dashboard).toContain('authenticatedFetch(`${BASE}api/businesses/mine/growth-tools/checkout`,');
    expect(dashboard).not.toMatch(/(?<!authenticated)\bfetch\s*\(`\$\{BASE\}api\//);
  });
});
