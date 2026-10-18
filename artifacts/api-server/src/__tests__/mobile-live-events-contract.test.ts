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

  it("does not direct a capped Navigator event host to their current tier", () => {
    const routes = source("../routes/events.ts");
    const navigatorCap = routes.slice(
      routes.indexOf('if (tier === "navigator")'),
      routes.indexOf("// Trailblazer: unlimited, no cap"),
    );

    expect(navigatorCap).toContain('if (tier === "navigator")');
    expect(navigatorCap).toContain("Navigator members can host up to 3 events per month.");
    expect(navigatorCap).toContain("Upgrade to Trailblazer for unlimited events.");
    expect(navigatorCap).not.toContain("Upgrade to Navigator for unlimited events.");
  });
});
