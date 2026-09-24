import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("live event calendar contract", () => {
  it("mounts read-only event routes before the global member wall", () => {
    const routes = source("../routes/index.ts");
    const publicMount = routes.indexOf("router.use(eventsRouter);");
    const memberWall = routes.indexOf("router.use(requireAuth);");

    expect(publicMount).toBeGreaterThan(-1);
    expect(memberWall).toBeGreaterThan(-1);
    expect(publicMount).toBeLessThan(memberWall);
  });

  it("never replaces a failed or empty live response with fixture events", () => {
    const hook = source("../../../mobile/hooks/useEvents.ts");
    const fixtures = source("../../../mobile/constants/data.ts");

    expect(hook).not.toContain("from \"@/constants/data\"");
    expect(hook).not.toContain("setEvents(EVENTS)");
    expect(hook).toContain("setEvents(mapped);");
    expect(hook).toContain("setEvents([]);");
    expect(fixtures).not.toContain("export const EVENTS");
  });
});
