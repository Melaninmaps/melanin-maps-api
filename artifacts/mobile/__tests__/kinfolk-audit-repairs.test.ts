import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const widget = readFileSync(
  fileURLToPath(new URL("../components/AIChatWidget.tsx", import.meta.url)),
  "utf8",
);
const travel = readFileSync(
  fileURLToPath(new URL("../app/travel.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk audit repairs on mobile", () => {
  it("suppresses the floating widget on the primary travel conversation", () => {
    expect(widget).toContain('pathname === "/travel" || pathname.startsWith("/travel/")');
    expect(widget).toContain("if (suppressed) return null");
  });

  it("authenticates before requesting microphone permission in the widget", () => {
    const start = widget.indexOf("const startVoice = async () => {");
    const end = widget.indexOf("const stopVoice", start);
    const block = widget.slice(start, end);
    expect(block.indexOf("if (!isAuthenticated || !token)")).toBeGreaterThan(-1);
    expect(block.indexOf("requestRecordingPermissionsAsync()")).toBeGreaterThan(block.indexOf("if (!isAuthenticated || !token)"));
  });

  it("shows, persists, and uses the four widget delivery modes", () => {
    for (const mode of ["community", "professor", "business_manager", "best_friend"]) {
      expect(widget).toContain(`id: "${mode}"`);
    }
    expect(widget).toContain("accessibilityRole=\"radio\"");
    expect(widget).toContain("void saveVoiceMode(v.id)");
    expect(widget).toContain("JSON.stringify({ personalityMode: nextMode })");
    expect(widget).toContain("sendToKinfolk(text, token, voiceMode");
  });

  it("keeps native voice controls off web and enforces a visible cancel-safe 60-second limit", () => {
    expect(widget).toContain('Platform.OS !== "web" ? (');
    expect(travel).toContain('Platform.OS !== "web" ? (');
    expect(widget).toContain("NATIVE_VOICE_MAX_DURATION_MS = 60_000");
    expect(travel).toContain("NATIVE_VOICE_MAX_DURATION_MS = 60_000");
    expect(widget).toContain("recordingElapsedSeconds}s / 60s");
    expect(travel).toContain("voiceRecordingElapsedSeconds}s / 60s");
    expect(widget).toContain("setInput(draft)");
    expect(travel).toContain("setInputText(primaryRecordingDraftRef.current)");
    expect(travel).toContain("cancelPrimaryVoiceRecording()");
  });
});
