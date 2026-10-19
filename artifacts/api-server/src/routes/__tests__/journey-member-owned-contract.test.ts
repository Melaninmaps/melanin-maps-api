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

  it("retains controlled needs and templates without sending legacy free text to Journey prompts or fallback context", () => {
    const createRoute = journeyRoute.slice(
      journeyRoute.indexOf('router.post("/journeys"'),
      journeyRoute.indexOf('router.get("/journeys"'),
    );
    expect(journeyRoute).toContain("const JOURNEY_CONTROLLED_NEEDS");
    expect(createRoute).toContain("const controlledNeeds = normalizeControlledJourneyNeeds");
    expect(createRoute).toContain('`Specific needs they flagged: ${controlledNeeds.join(", ")}`');
    expect(createRoute).not.toContain('`Specific needs they flagged: ${selectedNeeds}`');
    expect(createRoute).toContain("buildDefaultPhases(template.phases)");
    expect(createRoute).toContain('let aiContext = ""');
    expect(createRoute).not.toContain('Their context: "${description}"');
    expect(createRoute).not.toContain("let aiContext = description");
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

  it("instructs Kinfolk to honor pace without selecting or injecting legacy Journey aiContext", () => {
    expect(kinfolkRoute).toContain("MEMBER-OWNED LIFE JOURNEY CONTEXT");
    expect(kinfolkRoute).toContain("honor the member's pace");
    expect(kinfolkRoute).not.toContain("Current phases and their status:");
    expect(kinfolkRoute).not.toContain("steps done");

    const promptSection = kinfolkRoute.slice(
      kinfolkRoute.indexOf("const journeySection = activeJourney"),
      kinfolkRoute.indexOf("const crossCitySection"),
    );
    expect(promptSection).not.toContain("activeJourney.aiContext");

    const activeJourneyLookup = kinfolkRoute.slice(
      kinfolkRoute.indexOf("// Fetch active life journey for this user"),
      kinfolkRoute.indexOf("// Cross-city behavioral expansion"),
    );
    expect(activeJourneyLookup).toContain("eq(lifeJourneysTable.userId, req.user.id)");
    expect(activeJourneyLookup).toContain(".select({");
    expect(activeJourneyLookup).not.toContain("aiContext");
  });
});
