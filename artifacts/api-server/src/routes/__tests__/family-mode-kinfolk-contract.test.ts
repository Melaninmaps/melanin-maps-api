import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  new URL("../kinfolk.ts", import.meta.url),
  "utf8",
);
const memberContextSource = readFileSync(
  new URL("../../kinfolk/member-context.ts", import.meta.url),
  "utf8",
);

describe("Family Mode Kinfolk request integration", () => {
  it("loads the explicit setting without interpreting it as an age assertion", () => {
    expect(memberContextSource).toContain("familyModeEnabled: boolean");
    expect(memberContextSource).toContain(
      "family_mode_enabled FROM family_settings",
    );
    expect(memberContextSource).toContain("never an age assertion");
  });

  it("applies the safety override before research and generation", () => {
    const memberContextIndex = routeSource.indexOf("const memberCtx =");
    const deterministicDiscoveryIndex = routeSource.indexOf(
      "async function tryAnswerDeterministicBusinessDiscovery",
    );
    const chatRestrictedResponseIndex = routeSource.indexOf(
      "familyModeRestrictedResponse()",
      memberContextIndex,
    );
    const systemPromptIndex = routeSource.indexOf("const baseSystemPrompt =");
    expect(memberContextIndex).toBeGreaterThan(-1);
    expect(chatRestrictedResponseIndex).toBeGreaterThan(memberContextIndex);
    expect(chatRestrictedResponseIndex).toBeLessThan(systemPromptIndex);
    expect(deterministicDiscoveryIndex).toBeGreaterThan(-1);
    expect(
      routeSource.indexOf(
        "Family Mode prevented an adult-oriented recommendation for this request.",
        deterministicDiscoveryIndex,
      ),
    ).toBeGreaterThan(deterministicDiscoveryIndex);
    expect(routeSource).toContain("isFamilyModeRestrictedRequest(message)");
  });

  it("forces a family-safe delivery profile for both full and lean chat prompts", () => {
    expect(routeSource).toContain(
      "familyModeAudienceBand(memberCtx.audienceBand)",
    );
    expect(routeSource).toContain('? "business_manager"');
    expect(routeSource).toContain("aaveLevel: familyModeEnabled ? 0");
    expect(routeSource).toContain("familyModeEnabled,");
    expect(routeSource).toContain(
      "buildLeanGeneralChatPrompt(effectiveConversationVoiceMode)",
    );
    expect(routeSource).toContain("buildFamilyModeSystemInstruction()");
  });
});
