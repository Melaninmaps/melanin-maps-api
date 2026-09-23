import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(
  new URL("../app/travel.tsx", import.meta.url),
  "utf8",
);

describe("mobile Kinfolk conversation-first visuals", () => {
  it("uses a compact welcome conversation while retaining every start path", () => {
    expect(travelSource).toContain('testID="kinfolk-conversation-welcome"');
    expect(travelSource).toContain("START A CONVERSATION");
    expect(travelSource).toContain("Start here");
    expect(travelSource).toContain("LIFE_CHIPS.map");
    expect(travelSource).toContain("More ways to start");
    expect(travelSource).toContain("Open Trip Journals");
  });

  it("groups header actions without deleting saved, compare, flight, history, or new-chat paths", () => {
    expect(travelSource).toContain("showHeaderActions");
    expect(travelSource).toContain('accessibilityLabel="Open Kinfolk conversation actions"');
    expect(travelSource).toContain('accessibilityLabel="Open saved places"');
    expect(travelSource).toContain('accessibilityLabel="Toggle comparison mode"');
    expect(travelSource).toContain('accessibilityLabel="Open flight tracker"');
    expect(travelSource).toContain('accessibilityLabel="Open conversation history"');
    expect(travelSource).toContain('accessibilityLabel="Start a new Kinfolk conversation"');
  });

  it("retains the compact Voice and privacy controls at the composer", () => {
    expect(travelSource).toContain("Voice &amp; privacy");
    expect(travelSource).toContain("showComposerControls");
    expect(travelSource).toContain("Save this to my private Kinfolk memory");
    expect(travelSource).toContain("Use approved public Community posts");
  });
});
