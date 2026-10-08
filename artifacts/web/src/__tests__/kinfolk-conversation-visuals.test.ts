import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelPageSource = readFileSync(
  fileURLToPath(new URL("../pages/travel.tsx", import.meta.url)),
  "utf8",
);

describe("web Kinfolk conversation-first visuals", () => {
  it("keeps the first screen focused on a conversation without removing starting paths", () => {
    expect(travelPageSource).toContain('data-testid="kinfolk-conversation-welcome"');
    expect(travelPageSource).toContain("Start a conversation");
    expect(travelPageSource).toContain("Kinfolk here — let's map it out.");
    expect(travelPageSource).not.toContain("KINFOLK_WELCOME_HEADLINES");
    expect(travelPageSource).toContain("Start here");
    expect(travelPageSource).toContain("More ways Kinfolk can help");
    expect(travelPageSource).toContain("See example questions");
    expect(travelPageSource).toContain("KINFOLK_LIFE_CHIPS.slice(0, 4)");
    expect(travelPageSource).toContain("KINFOLK_LIFE_CHIPS.slice(4)");
    expect(travelPageSource).toContain("KINFOLK_EXAMPLE_CHIPS.map");
    expect(travelPageSource).toContain('isEmpty ? "flex-none overflow-visible" : "flex-1 overflow-y-auto"');
    expect(travelPageSource).toContain("inline-flex items-center gap-2 rounded-xl");
    expect(travelPageSource).not.toContain("min-h-[50vh]");
    expect(travelPageSource).not.toContain("min-h-20 flex-col");
    expect(travelPageSource).not.toContain("grid grid-cols-4 gap-2 max-w-lg mb-5 w-full");
    expect(travelPageSource).not.toContain('>Or try asking:</div>');
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

  it("shows a private, explicit handoff only when the session API returns one", () => {
    expect(travelPageSource).toContain('data-testid="kinfolk-conversation-handoff"');
    expect(travelPageSource).toContain("Conversation resumed");
    expect(travelPageSource).toContain("Conversation saved");
    expect(travelPageSource).toContain("setConversationHandoff(data.conversationHandoff ?? null)");
    expect(travelPageSource).toContain("resumePreview?: ConversationHandoffStatus | null");
  });
});
