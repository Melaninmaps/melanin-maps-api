import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routesIndex = readFileSync(new URL("../routes/index.ts", import.meta.url), "utf8");
const communityRoute = readFileSync(new URL("../routes/community-intelligence.ts", import.meta.url), "utf8");
const service = readFileSync(new URL("../services/community-intelligence/service.ts", import.meta.url), "utf8");
const migration = readFileSync(
  new URL("../../migrations/20261014_community_intelligence_source_only.sql", import.meta.url),
  "utf8",
);

describe("Community Intelligence route and migration contract", () => {
  it("mounts only after the member wall with distinct member and founder paths", () => {
    expect(routesIndex).toContain('import communityIntelligenceRouter from "./community-intelligence";');
    expect(routesIndex.indexOf("router.use(requireAuth)")).toBeLessThan(
      routesIndex.indexOf("router.use(communityIntelligenceRouter)"),
    );
    expect(communityRoute).toContain('router.get("/kinfolk/community-intelligence/settings"');
    expect(communityRoute).toContain('router.put("/kinfolk/community-intelligence/settings"');
    expect(communityRoute).toContain('router.post("/kinfolk/community-intelligence/feedback"');
    expect(communityRoute).toContain('router.get("/admin/community-intelligence/gaps"');
  });

  it("restricts the aggregate view to administrators and never exposes raw-event routes", () => {
    expect(communityRoute).toContain("if (!isFounderAdmin(req)) return void res.status(403)");
    expect(communityRoute).not.toContain("/events");
    expect(communityRoute).not.toContain("/members");
    expect(communityRoute).toContain("No member, message, raw event, exact location, or small-cohort count");
  });

  it("never performs runtime DDL and keeps the reviewed migration source-only", () => {
    expect(service).not.toMatch(/CREATE\s+TABLE|ALTER\s+TABLE|CREATE\s+INDEX/i);
    expect(service).toContain("communityIntelligenceSchemaAvailable");
    expect(migration).toContain("SOURCE-ONLY REVIEW MIGRATION");
    expect(migration).toContain("Do not apply without separate written approval");
    expect(migration).toContain("no question text, free-form feedback, message IDs, location");
  });
});
