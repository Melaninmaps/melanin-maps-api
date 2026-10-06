import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildExplicitMemoryConsentPlan } from "../explicit-memory-consent";
import { isOrdinaryContinuityMemoryRelevant } from "../ordinary-continuity-memory";
import { sensitiveMemoryTopic } from "../sensitive-memory";

const routeFile = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../routes/kinfolk.ts",
);

describe("Kinfolk continuity memory boundaries", () => {
  it("requires separate confirmation topics for the approved sensitive categories", () => {
    expect(sensitiveMemoryTopic("I have anxiety and need a therapist")).toBe("health");
    expect(sensitiveMemoryTopic("I live at 123 Main Street, Philadelphia")).toBe("exact_location");
    expect(sensitiveMemoryTopic("I am a Black woman")).toBe("race_ethnicity");
    expect(sensitiveMemoryTopic("I am Muslim")).toBe("religion");
    expect(sensitiveMemoryTopic("I am bisexual")).toBe("sexuality");
    expect(sensitiveMemoryTopic("My credit score is low")).toBe("finances");
    expect(sensitiveMemoryTopic("My son needs daycare")).toBe("children");
  });

  it("does not create a plan from ordinary chat without an explicit remember request", () => {
    expect(
      buildExplicitMemoryConsentPlan(
        "I prefer quiet coffee shops for work meetings and I am planning to relocate.",
      ),
    ).toBeNull();
    expect(
      buildExplicitMemoryConsentPlan(
        "Please remember that I prefer quiet coffee shops for work meetings.",
      ),
    ).not.toBeNull();
  });

  it("keeps private-note writes behind an explicit consent-selection route", () => {
    const route = readFileSync(routeFile, "utf8");
    expect(route).toContain('router.post("/kinfolk/memory-consent"');
    expect(route).toContain("body.consent !== true");
    expect(route).toContain("buildExplicitMemoryConsentPlan(body.message)");
    expect(route).not.toContain("persistOrdinaryContinuityMemory");
    expect(route).not.toContain("extractOrdinaryContinuityMemory");
  });

  it("uses an explicitly saved ordinary note only when the current request overlaps", () => {
    const memory = {
      content: "I prefer quiet coffee shops for work meetings.",
      purpose: "preference",
    };
    expect(
      isOrdinaryContinuityMemoryRelevant(
        memory,
        "Find quiet coffee shops in Philadelphia.",
      ),
    ).toBe(true);
    expect(
      isOrdinaryContinuityMemoryRelevant(memory, "Explain how the sun stays hot."),
    ).toBe(false);
  });
});
