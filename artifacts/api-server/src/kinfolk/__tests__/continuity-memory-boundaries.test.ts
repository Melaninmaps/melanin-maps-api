import { describe, expect, it } from "vitest";
import {
  extractOrdinaryContinuityMemory,
  isOrdinaryContinuityMemoryRelevant,
} from "../ordinary-continuity-memory";
import { sensitiveMemoryTopic } from "../sensitive-memory";

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

  it("extracts only concrete non-sensitive preferences and plans for automatic continuity", () => {
    expect(extractOrdinaryContinuityMemory("I prefer quiet coffee shops for work meetings.")).toMatchObject({
      purpose: "preference",
    });
    expect(extractOrdinaryContinuityMemory("I'm planning to relocate for my new job.")).toMatchObject({
      purpose: "planning_context",
    });
    expect(extractOrdinaryContinuityMemory("What is the weather in Houston?")).toBeNull();
    expect(extractOrdinaryContinuityMemory("I have children and prefer quiet coffee shops.")).toBeNull();
  });

  it("uses an ordinary memory only when the current request overlaps", () => {
    const memory = { content: "I prefer quiet coffee shops for work meetings.", purpose: "preference" };
    expect(isOrdinaryContinuityMemoryRelevant(memory, "Find quiet coffee shops in Philadelphia.")).toBe(true);
    expect(isOrdinaryContinuityMemoryRelevant(memory, "Explain how the sun stays hot.")).toBe(false);
  });
});
