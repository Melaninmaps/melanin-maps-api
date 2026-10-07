import { describe, expect, it } from "vitest";
import {
  buildEmotionalSupportResponseContract,
  resolveEmotionalSupportGuidance,
} from "../emotional-support";

describe("Kinfolk emotional support policy", () => {
  it.each([
    ["I am overwhelmed and just need to vent for a minute.", "vent", "overwhelmed"],
    ["My nerves are bad about this work situation. Help me figure out one next step.", "problem_solving", "anxious or nervous"],
    ["I am frusrated with my coworker and need a short grounding exercise.", "tool_or_exercise", "angry or frustrated"],
    ["Um, I do not know what I need. Everything has been piling up.", "uncertain", "overwhelmed"],
    ["I got good news today and I am so excited!", "celebration", "excited"],
    ["I am tight after that conversation and do not want advice, just to talk it out.", "vent", "angry or frustrated"],
  ])("recognizes a current-turn %s support need", (message, need, emotion) => {
    expect(resolveEmotionalSupportGuidance({ message })).toEqual({
      need,
      likelyEmotion: emotion,
    });
  });

  it("uses the semantic emotional intent as a bounded fallback without persisting a detail", () => {
    const guidance = resolveEmotionalSupportGuidance({
      message: "Can we slow down for a moment?",
      semanticIntent: "emotional_support",
    });
    expect(guidance).toEqual({ need: "uncertain", likelyEmotion: null });

    const contract = buildEmotionalSupportResponseContract(guidance);
    expect(contract).toContain("one gentle choice question");
    expect(contract).toContain("Do not silently save");
    expect(contract).not.toContain("saved memory is");
    expect(contract).not.toContain("profile");
  });

  it("does not turn ordinary assistance or a crisis signal into the support prompt", () => {
    expect(
      resolveEmotionalSupportGuidance({
        message: "Explain the difference between a metaphor and a simile.",
      }),
    ).toBeNull();
    expect(
      resolveEmotionalSupportGuidance({
        message: "I want to die and do not feel safe right now.",
        semanticIntent: "emotional_support",
      }),
    ).toBeNull();
  });

  it("keeps tools optional, practical support bounded, and emergency behavior primary", () => {
    const tool = buildEmotionalSupportResponseContract({
      need: "tool_or_exercise",
      likelyEmotion: "anxious or nervous",
    });
    const problem = buildEmotionalSupportResponseContract({
      need: "problem_solving",
      likelyEmotion: "overwhelmed",
    });

    expect(tool).toContain("optional, brief, accessible exercise");
    expect(tool).toContain("Existing emergency and self-harm escalation rules always win");
    expect(problem).toContain("no more than two relevant, adjustable next-step choices");
    expect(problem).toContain("Do not diagnose");
  });
});
