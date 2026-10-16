import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  KINFOLK_PERSONA_PROFILES,
  buildKinfolkConversationModeInstruction,
  buildKinfolkConversationModePrompt,
} from "../conversation-mode";
import { buildLeanGeneralChatPrompt } from "../lean-general-chat";
import { resolveKinfolkVoiceDelivery } from "../voice-delivery";

const MODES = [
  "community",
  "professor",
  "business_manager",
  "best_friend",
] as const;

const routeSource = readFileSync(
  fileURLToPath(new URL("../../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);

describe("Kinfolk four-persona differentiation contract", () => {
  it("gives every visible persona a distinct response plan rather than a label-only prompt", () => {
    const instructions = MODES.map((mode) => buildKinfolkConversationModeInstruction(mode));

    expect(new Set(instructions).size).toBe(MODES.length);
    expect(instructions[0]).toContain("real-life implication");
    expect(instructions[1]).toContain("causes or mechanism");
    expect(instructions[2]).toContain("organize concise priorities, trade-offs");
    expect(instructions[3]).toContain("current curiosity or feeling");

    for (const instruction of instructions) {
      expect(instruction).toContain("PERSONA BOUNDARY");
      expect(instruction).toContain("not facts, safety, evidence standards, privacy");
      expect(instruction).toContain("Do not name the persona");
    }
  });

  it("preserves the requested persona identities, structures, and boundaries", () => {
    expect(KINFOLK_PERSONA_PROFILES.community).toMatchObject({
      label: "Big Cousin",
      identity: expect.stringContaining("practical guide"),
      answerShape: expect.stringContaining("response length and format"),
    });
    expect(KINFOLK_PERSONA_PROFILES.professor).toMatchObject({
      label: "Professor",
      identity: expect.stringContaining("educator"),
      answerShape: expect.stringContaining("teaching path"),
    });
    expect(KINFOLK_PERSONA_PROFILES.business_manager).toMatchObject({
      label: "Business Manager",
      identity: expect.stringContaining("strategist"),
      answerShape: expect.stringContaining("action, choice, or plan"),
    });
    expect(KINFOLK_PERSONA_PROFILES.best_friend).toMatchObject({
      label: "Best Friend",
      identity: expect.stringContaining("conversational companion"),
      answerShape: expect.stringContaining("response length and format"),
    });
    expect(KINFOLK_PERSONA_PROFILES.community.avoid).toContain(
      "long checklist",
    );
    expect(KINFOLK_PERSONA_PROFILES.best_friend.avoid).toContain(
      "exhaustive checklist",
    );
    expect(KINFOLK_PERSONA_PROFILES.professor.answerShape).toContain(
      "What, Why or How, and So What",
    );
  });

  it("requires historical answers to retain slavery, resistance, and consequence context across modes", () => {
    for (const mode of MODES) {
      const prompt = buildKinfolkConversationModePrompt(mode);
      expect(prompt).toMatch(/history/i);
      expect(prompt).toMatch(/resistance/i);
      expect(prompt).toMatch(/consequence|human stakes|system/i);
    }
  });

  it("keeps the same persona contract on the lean general-chat path", () => {
    for (const mode of MODES) {
      const profile = KINFOLK_PERSONA_PROFILES[mode];
      const prompt = buildLeanGeneralChatPrompt(mode);
      expect(prompt).toContain(`${profile.label} MODE`);
      expect(prompt).toContain("PERSONA BOUNDARY");
      expect(prompt).toContain(profile.answerShape);
    }
  });

  it("keeps text and spoken delivery labels aligned without changing provider voice identity", () => {
    for (const mode of MODES) {
      const profile = KINFOLK_PERSONA_PROFILES[mode];
      const delivery = resolveKinfolkVoiceDelivery(mode);
      expect(delivery.label).toBe(
        mode === "community" ? `Just ${profile.label}` : profile.label,
      );
      expect(delivery.styleInstruction).toMatch(/never imitate an accent or perform a stereotype/i);
    }
  });

  it("does not let a generic Big Cousin instruction override the selected persona", () => {
    const baseline = routeSource.indexOf("CONVERSATION BASELINE:");
    const selectedPersona = routeSource.indexOf("${voiceInstructions}");

    expect(baseline).toBeGreaterThan(-1);
    expect(selectedPersona).toBeGreaterThan(baseline);
    expect(routeSource).not.toContain("like a well-connected Big Cousin for everyday life");
  });
});
