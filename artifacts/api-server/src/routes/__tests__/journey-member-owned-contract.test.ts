import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routesDir = dirname(fileURLToPath(import.meta.url));
const journeyRoute = readFileSync(resolve(routesDir, "../journeys.ts"), "utf8");
const kinfolkRoute = readFileSync(resolve(routesDir, "../kinfolk.ts"), "utf8");

describe("member-owned Journey contracts", () => {
  it("creates available invitations without tier scorecards or automatic phase advancement", () => {
    expect(journeyRoute).toContain("memberOwnedJourneyPhases");
    expect(journeyRoute).toContain('status: "available"');
    expect(journeyRoute).toContain("explored: step.explored ?? completed ?? false");
    expect(journeyRoute).not.toContain("JOURNEY_MONTHLY_LIMITS");
    expect(journeyRoute).not.toContain("getUserTier");
    expect(journeyRoute).not.toContain("allPhasesComplete");
    expect(journeyRoute).not.toContain('router.patch("/journeys/:id/phase-status"');
  });

  it("maps a legacy completion request to a private reflection without changing other phases", () => {
    const stepRoute = journeyRoute.slice(
      journeyRoute.indexOf('router.patch("/journeys/:id/step"'),
      journeyRoute.indexOf('router.delete("/journeys/:id"'),
    );
    expect(stepRoute).toContain("const memberExplored");
    expect(stepRoute).toContain("completed?: boolean");
    expect(stepRoute).toContain("exploredAt: memberExplored");
    expect(stepRoute).toContain('status: "available" as const');
    expect(stepRoute).not.toContain("activePhaseIdx");
  });

  it("instructs Kinfolk to honor pace rather than reporting a score or phase state", () => {
    expect(kinfolkRoute).toContain("MEMBER-OWNED LIFE JOURNEY CONTEXT");
    expect(kinfolkRoute).toContain("honor the member's pace");
    expect(kinfolkRoute).not.toContain("Current phases and their status:");
    expect(kinfolkRoute).not.toContain("steps done");
  });
});
