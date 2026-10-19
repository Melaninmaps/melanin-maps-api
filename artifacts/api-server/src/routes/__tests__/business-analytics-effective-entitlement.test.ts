import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  new URL("../businesses-analytics.ts", import.meta.url),
  "utf8",
);

describe("BIZ-003 business analytics effective-entitlement depth", () => {
  it("uses the established effective-tier policy and rank mapping instead of raw memberType", () => {
    expect(routeSource).toContain(
      'import { getUserTier, requireMembership, TIER_RANK } from "../middleware/requireMembership";',
    );
    expect(routeSource).toContain("const effectiveTier = await getUserTier(userId);");
    expect(routeSource).toContain("TIER_RANK[effectiveTier] >= TIER_RANK.trailblazer");
    expect(routeSource).toContain('? "trailblazer"');
    expect(routeSource).toContain(': "navigator";');
    expect(routeSource).not.toContain("memberType");
  });

  it("retains the Navigator access gate and the existing two-depth response union", () => {
    expect(routeSource).toContain('requireMembership("navigator")');
    expect(routeSource).toContain('tier: "navigator" | "trailblazer";');
    expect(routeSource).toContain('const tier: "navigator" | "trailblazer" =');
    expect(routeSource).toContain("res.json(response);");
  });

  it("preserves the singular owner-business, metrics, and error boundaries", () => {
    expect(routeSource).toContain("eq(businessesTable.submittedById, userId)");
    expect(routeSource).toContain(".limit(1);");
    expect(routeSource).toContain('res.status(404).json({ error: "No business found for your account." });');
    expect(routeSource).toContain("const metrics = {");
    expect(routeSource).toContain("const benchmarks = {");
    expect(routeSource).toContain('if (tier === "trailblazer")');
    expect(routeSource).toContain('logger.info({ businessId: business.id, tier, engagementScore }, "[analytics] served");');
    expect(routeSource).toContain('res.status(500).json({ error: "Failed to load analytics." });');
  });
});
