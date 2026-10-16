import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelPageSource = readFileSync(
  fileURLToPath(new URL("../pages/travel.tsx", import.meta.url)),
  "utf8",
);

describe("web Kinfolk conversation-first visuals", () => {
  it("keeps the first screen limited to the founder-approved Kinfolk greeting", () => {
    expect(travelPageSource).toContain('data-testid="kinfolk-conversation-welcome"');
    expect(travelPageSource).toContain("Kinfolk here — let's map it out.");
    expect(travelPageSource).not.toContain("Welcome back,");
    expect(travelPageSource).not.toContain("Start a conversation");
    expect(travelPageSource).not.toContain("Start here");
    expect(travelPageSource).not.toContain("More ways Kinfolk can help");
    expect(travelPageSource).not.toContain("See example questions");
    expect(travelPageSource).not.toContain("KINFOLK_LIFE_CHIPS");
    expect(travelPageSource).not.toContain("KINFOLK_EXAMPLE_CHIPS");
    expect(travelPageSource).not.toContain("Conversation companion");
    expect(travelPageSource).toContain('isEmpty ? "flex-none overflow-visible" : "flex-1 overflow-y-auto"');
    expect(travelPageSource).toContain('aria-label="Kinfolk greeting"');
    expect(travelPageSource).not.toContain("rounded-3xl border border-[#3A1F0E]/8 bg-white p-4 shadow");
  });

  it("keeps history and explicit privacy controls available without an inline voice picker", () => {
    expect(travelPageSource).toContain("Past conversations");
    expect(travelPageSource).toContain("setShowHistory(v => !v)");
    expect(travelPageSource).toContain("showComposerControls");
    expect(travelPageSource).toContain('id="kinfolk-composer-controls"');
    expect(travelPageSource).toContain("Memory & privacy");
    const composerControls = travelPageSource.slice(
      travelPageSource.indexOf('id="kinfolk-composer-controls"'),
      travelPageSource.indexOf("{voiceInputStatus ?"),
    );
    expect(composerControls).not.toContain('data-testid={`kinfolk-mode-${id}`}');
    expect(composerControls).not.toContain("Reply style");
    expect(composerControls).not.toContain("Save this as a specific note");
    expect(travelPageSource).toContain('data-testid="kinfolk-community-perspective-opt-in"');
    expect(travelPageSource).toContain("Manage private Kinfolk memory");
  });

  it("keeps research diagnostics out of the member-facing reply presentation", () => {
    const presentationSource = readFileSync(
      fileURLToPath(new URL("../components/kinfolk/KinfolkChatPresentation.tsx", import.meta.url)),
      "utf8",
    );
    expect(presentationSource).toContain("Updated ");
    expect(presentationSource).not.toContain('Research: {[researchStatus.usedInternal');
  });
});
