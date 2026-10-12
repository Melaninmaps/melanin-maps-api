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
    const voiceSource = readFileSync(
      fileURLToPath(new URL("../hooks/useKinfolkVoiceSource.ts", import.meta.url)),
      "utf8",
    );
    expect(widget).toContain("useKinfolkVoiceSource({ isAuthenticated })");
    expect(voiceSource).toContain("if (!options.isAuthenticated)");
    expect(voiceSource).toContain("requestRecordingPermissionsAsync");
  });

  it("does not turn an absent or expired floating-widget session into a provider failure", () => {
    const hook = readFileSync(
      fileURLToPath(new URL("../hooks/useKinfolk.ts", import.meta.url)),
      "utf8",
    );
    expect(widget).toContain("if (!isAuthenticated) {");
    expect(widget).toContain('"Sign in to ask Kinfolk"');
    expect(widget).toContain("if (!token) {");
    expect(widget).toContain("void refreshUser()");
    expect(widget).toContain("status === 401");
    expect(widget).toContain("setInput(text)");
    expect(widget).toContain("const errorText =");
    expect(widget).toContain("Kinfolk couldn't reach the service. Your question is back in the composer");
    expect(widget).toContain("} else if (!status || status === 503) {");
    expect(widget.indexOf("if (!token) {")).toBeLessThan(widget.indexOf("const userMsg: Message"));
    expect(hook).toContain('content: "Your Kinfolk session needs to be refreshed. Please sign in again before sending your question."');
    expect(hook).toContain("} else if (res.status === 401) {");
    expect(hook).toContain('content: "Your Kinfolk session expired. Please sign in again, then resend your question."');
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

  it("keeps native voice controls off web and uses one visible cancel-safe 60-second source lifecycle", () => {
    const voiceSource = readFileSync(
      fileURLToPath(new URL("../hooks/useKinfolkVoiceSource.ts", import.meta.url)),
      "utf8",
    );
    const voiceControls = readFileSync(
      fileURLToPath(new URL("../components/KinfolkVoiceSourceControls.tsx", import.meta.url)),
      "utf8",
    );
    expect(widget).toContain('Platform.OS !== "web" ? (');
    expect(travel).toContain('Platform.OS !== "web" ? (');
    expect(widget).toContain("KinfolkVoiceSourceControls");
    expect(widget).toContain("addWidgetVoiceTranscriptToDraft");
    expect(travel).toContain("addPrimaryVoiceTranscriptToDraft");
    expect(voiceSource).toContain("KINFOLK_VOICE_MAX_DURATION_MS");
    expect(voiceControls).toContain("Cancel transcription");
    expect(voiceControls).toContain("onUseTranscript");
  });

  it("does not silently persist a mobile reminder proposal and preserves its due date on explicit save", () => {
    expect(widget).toContain("taskAction: taskAction ?? null");
    expect(widget).not.toContain("if (taskAction && token)");
    expect(widget).toContain("const saveProposedTaskAction = async");
    expect(widget).toContain("handleTaskAction(action, token)");
    expect(widget).toContain('accessibilityLabel="Save this Kinfolk reminder"');
    expect(widget).toContain("dueAt: t.dueAt");
  });

  it("requires separate sensitive-memory confirmation in the floating widget", () => {
    expect(widget).toContain("sensitiveMemoryConfirmation");
    expect(widget).toContain("sensitiveMemoryDraft");
    expect(widget).toContain("KinfolkSensitiveMemoryConfirmation");
    expect(widget).toContain("purpose: data.sensitiveMemoryConfirmation.purpose");
  });
});
