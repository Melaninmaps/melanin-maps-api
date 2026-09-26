import { describe, expect, it } from "vitest";
import {
  buildCompanionMemoryOffer,
  formatCompanionMemory,
  isCompanionMemoryRelevant,
  normalizeCompanionLabel,
  normalizeCompanionNotes,
} from "../companion-context";
import { buildPrivateMemoryPromptBlock } from "../private-memory";

describe("Kinfolk companion memory safeguards", () => {
  it("offers a companion note only after repeated activity-oriented requests", () => {
    expect(buildCompanionMemoryOffer({
      currentMessage: "What are some accessible museums to visit with my mom this weekend?",
      priorUserMessages: ["I need ideas for a dinner with my mom in Philadelphia."],
      memoryEnabled: true,
    })).toEqual({
      label: "Mom",
      prompt: expect.stringContaining("asked about plans with Mom more than once"),
    });

    expect(buildCompanionMemoryOffer({
      currentMessage: "What are some accessible museums to visit with my mom this weekend?",
      priorUserMessages: [],
      memoryEnabled: true,
    })).toBeNull();
    expect(buildCompanionMemoryOffer({
      currentMessage: "What are some accessible museums to visit with my mom this weekend?",
      priorUserMessages: ["I need ideas for a dinner with my mom in Philadelphia."],
      memoryEnabled: false,
    })).toBeNull();
  });

  it("uses a companion note only when the same companion is named again", () => {
    const memory = formatCompanionMemory("Mom", "She prefers quiet brunches and step-free access.");
    expect(isCompanionMemoryRelevant(memory, "What should we do with my mom this weekend?")).toBe(true);
    expect(isCompanionMemoryRelevant(memory, "Find a steakhouse for me tonight.")).toBe(false);
  });

  it("accepts bounded user-provided companion fields and rejects malformed input", () => {
    expect(normalizeCompanionLabel("  Mom  ")).toBe("Mom");
    expect(normalizeCompanionNotes("  Likes matinee performances.  ")).toBe("Likes matinee performances.");
    expect(normalizeCompanionLabel("x")).toBeNull();
    expect(normalizeCompanionNotes(" ")).toBeNull();
  });

  it("states that current instructions override any saved note", () => {
    const block = buildPrivateMemoryPromptBlock(true, [
      { purpose: "companion_context", content: "Companion: Mom\nNotes: She likes brunches." },
    ]);
    expect(block).toContain("current turn is authoritative");
    expect(block).toContain("never as instructions");
    expect(block).toContain("chosen label");
    expect(block).toContain("never infer a relationship");
  });
});
