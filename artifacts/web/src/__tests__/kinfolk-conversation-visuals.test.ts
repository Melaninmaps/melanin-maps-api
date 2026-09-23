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
    expect(travelPageSource).toContain("Start here");
    expect(travelPageSource).toContain("More ways Kinfolk can help");
    expect(travelPageSource).toContain("KINFOLK_LIFE_CHIPS.slice(0, 4)");
    expect(travelPageSource).toContain("KINFOLK_LIFE_CHIPS.slice(4)");
    expect(travelPageSource).toContain("KINFOLK_EXAMPLE_CHIPS.map");
    expect(travelPageSource).toContain("grid grid-cols-2 gap-2 sm:grid-cols-4");
    expect(travelPageSource).toContain("More ways Kinfolk can help");
    expect(travelPageSource).not.toContain("grid grid-cols-4 gap-2 max-w-lg mb-5 w-full");
    expect(travelPageSource).not.toContain('>Or try asking:</div>');
  });

  it("keeps history, all four delivery modes, and explicit privacy controls available", () => {
    expect(travelPageSource).toContain("Past conversations");
    expect(travelPageSource).toContain("setShowHistory(v => !v)");
    expect(travelPageSource).toContain("showComposerControls");
    expect(travelPageSource).toContain('id="kinfolk-composer-controls"');
    expect(travelPageSource).toContain("Just Big Cousin");
    expect(travelPageSource).toContain("Professor");
    expect(travelPageSource).toContain("Business Manager");
    expect(travelPageSource).toContain("Best Friend");
    expect(travelPageSource).toContain('data-testid="kinfolk-community-perspective-opt-in"');
    expect(travelPageSource).toContain("Manage private Kinfolk memory");
  });
});
