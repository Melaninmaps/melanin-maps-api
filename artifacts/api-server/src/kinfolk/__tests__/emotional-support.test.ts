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
    ["Rent is due and I am short again; I do not know how to make this work.", "uncertain", "financially stressed"],
    ["Since my aunt died, I cannot get myself together.", "grief_support", "sad or grieving"],
    ["My stomach is in knots before the interview tomorrow.", "uncertain", "anxious or nervous"],
    ["Honestly it feels like nobody checks on me.", "uncertain", "lonely"],
    ["I just got the offer — I am hype!", "celebration", "excited"],
    ["Uh, I dunno what I need, everything be piling up fr.", "uncertain", "overwhelmed"],
    ["I am stressed and can you help me make a plan for this mess?", "problem_solving", "stressed"],
    ["I am anxious — give me a quick breathing exercise.", "tool_or_exercise", "anxious or nervous"],
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

  it("does not turn ordinary assistance or an urgent safety signal into the support prompt", () => {
    expect(
      resolveEmotionalSupportGuidance({
        message: "Explain the difference between a metaphor and a simile.",
      }),
    ).toBeNull();
    expect(
      resolveEmotionalSupportGuidance({
        message: "Help me make a plan for a Saturday picnic.",
      }),
    ).toBeNull();
    expect(
      resolveEmotionalSupportGuidance({
        message: "I want to die and do not feel safe right now.",
        semanticIntent: "emotional_support",
      }),
    ).toBeNull();
    expect(
      resolveEmotionalSupportGuidance({
        message: "Someone is being abused and they are not safe right now.",
        semanticIntent: "emotional_support",
      }),
    ).toBeNull();
    expect(
      resolveEmotionalSupportGuidance({
        message: "I have chest pain and cannot breathe.",
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
    expect(problem).toContain("talk it out, make a plan, or take a quick pause first");
  });

  it("frames grief gently without treating it as a diagnosis or a stored member trait", () => {
    const grief = buildEmotionalSupportResponseContract({
      need: "grief_support",
      likelyEmotion: "sad or grieving",
    });

    expect(grief).toContain("Acknowledge a possible loss gently");
    expect(grief).toContain("Do not rush grief");
    expect(grief).toContain("Do not silently save");
    expect(grief).not.toContain("therapist");
  });
});
