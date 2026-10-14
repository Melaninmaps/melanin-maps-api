import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routesDir = dirname(fileURLToPath(import.meta.url));
const route = readFileSync(resolve(routesDir, "../cultural-journeys.ts"), "utf8");
const index = readFileSync(resolve(routesDir, "../index.ts"), "utf8");

describe("cultural Journey route contract", () => {
  it("requires the member wall and mounts the owner-scoped route", () => {
    expect(index).toContain('import culturalJourneysRouter from "./cultural-journeys"');
    expect(index).toContain("router.use(culturalJourneysRouter)");
    expect(route).toContain('if (!req.user?.id) { res.status(401)');
  });

  it("saves only an explicitly confirmed published cultural site", () => {
    expect(route).toContain('router.post("/cultural-journeys/cultural-sites/:siteId"');
    expect(route).toContain("req.body?.memberConfirmed !== true");
    expect(route).toContain("FROM cultural_sites");
    expect(route).toContain("COALESCE(is_published, TRUE) = TRUE");
    expect(route).toContain("eq(culturalJourneyEntriesTable.userId, req.user.id)");
  });

  it("scopes reflection and deletion to the authenticated owner", () => {
    expect(route).toContain('router.patch("/cultural-journeys/entries/:entryId/reflection"');
    expect(route).toContain("validateCulturalJourneyReflection");
    expect(route).toContain('router.delete("/cultural-journeys/entries/:entryId"');
    expect(route).toContain("isNull(culturalJourneyEntriesTable.removedAt)");
    expect(route).toContain("removedAt: new Date()");
    expect(route).not.toContain("points");
    expect(route).not.toContain("streak");
  });
});
