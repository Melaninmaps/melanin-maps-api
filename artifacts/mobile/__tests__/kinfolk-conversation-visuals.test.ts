import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { kinfolkWorkingElapsedSeconds, kinfolkWorkingElapsedLabel } from "../lib/kinfolkWorkingIndicator";

const travelSource = readFileSync(
  new URL("../app/travel.tsx", import.meta.url),
  "utf8",
);

describe("mobile Kinfolk conversation-first visuals", () => {
  it("uses a compact welcome conversation while retaining every start path", () => {
    expect(travelSource).toContain('testID="kinfolk-conversation-welcome"');
    expect(travelSource).toContain("START A CONVERSATION");
    expect(travelSource).toContain("Kinfolk here — let's map it out.");
    expect(travelSource).not.toContain("WELCOME_HEADLINES");
    expect(travelSource).toContain("Start here");
    expect(travelSource).toContain("visiblePaths.map");
    expect(travelSource).toContain("More ways Kinfolk can help");
    expect(travelSource).not.toContain("lifeChipsRail");
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

  it("retains compact memory and privacy controls at the composer", () => {
    expect(travelSource).toContain("Memory & privacy");
    expect(travelSource).toContain("showComposerControls");
    expect(travelSource).not.toContain("Save this as a specific note");
    expect(travelSource).toContain("Manage private Kinfolk memory");
    expect(travelSource).toContain("Use approved public Community posts");
  });

  it("shows a request elapsed indicator without inventing research or recommendation phases", () => {
    expect(kinfolkWorkingElapsedSeconds(1_000, 4_900)).toBe(3);
    expect(kinfolkWorkingElapsedSeconds(4_900, 1_000)).toBe(0);
    expect(kinfolkWorkingElapsedLabel(0)).toBe("Kinfolk is working… 0s");
    expect(kinfolkWorkingElapsedLabel(5.8)).toBe("Kinfolk is working… 5s");
    expect(travelSource).toContain('testID="kinfolk-working-indicator"');
    expect(travelSource).toContain("kinfolkRequestStartedAt");
    expect(travelSource).toContain("kinfolkWorkingElapsedSeconds(kinfolkRequestStartedAt)");
    expect(travelSource).toContain("isLoading && kinfolkRequestStartedAt !== null");
  });

  it("keeps an imperfect voice transcript member-controlled before the shared Kinfolk send path", () => {
    expect(travelSource).toContain("const originalText = payload.meaningReview?.originalText?.trim() || payload.text.trim()");
    expect(travelSource).toContain("setInputText(originalText)");
    expect(travelSource).toContain("Review your transcription, then tap Send when you’re ready.");
    expect(travelSource).toContain("await sendMessage(msg, {");
  });

  it("sends a consent-first travel category chip only when the member taps it", () => {
    expect(travelSource).toContain("msg.followUpSuggestions.map((s, i) => (");
    expect(travelSource).toContain("onPress={() => onQuickReply(s)}");
  });

  it("renders a member-controlled session handoff banner", () => {
    expect(travelSource).toContain('testID="kinfolk-conversation-handoff"');
    expect(travelSource).toContain("Conversation resumed");
    expect(travelSource).toContain("Conversation saved");
    expect(travelSource).toContain("conversationHandoff");
  });
});
