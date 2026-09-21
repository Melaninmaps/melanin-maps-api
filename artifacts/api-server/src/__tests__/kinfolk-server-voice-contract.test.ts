import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  fileURLToPath(new URL("../routes/kinfolk.ts", import.meta.url)),
  "utf8",
);
const mobileSource = readFileSync(
  fileURLToPath(new URL("../../../mobile/components/AIChatWidget.tsx", import.meta.url)),
  "utf8",
);
const webSource = readFileSync(
  fileURLToPath(new URL("../../../web/src/pages/travel.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk server-owned voice cross-client contract", () => {
  it("does not honor a client-selected provider voice", () => {
    expect(routeSource).toContain('router.post("/kinfolk/speak"');
    expect(routeSource).toContain("resolveKinfolkSpeechConfiguration()");
    expect(routeSource).toContain("textToSpeechWithStyle({");
    expect(routeSource).toContain("voice: speechConfig.baseVoice");
    expect(routeSource).not.toContain("const { text, voice: requestedVoice }");
  });

  it("provides a separate authenticated fixed-script preview route", () => {
    expect(routeSource).toContain('router.post("/kinfolk/voice-preview"');
    expect(routeSource).toContain("KINFOLK_VOICE_PREVIEW_TEXT");
  });

  it("sends delivery mode instead of a client-selected voice from web and mobile", () => {
    expect(mobileSource).toContain("/api/kinfolk/voice-preview");
    expect(mobileSource).toContain("mode: await getVoiceMode(token)");
    expect(mobileSource).not.toContain("VOICE_PREF_KEY");
    expect(mobileSource).not.toContain("VOICE_OPTIONS");
    expect(webSource).toContain("mode: kinfolkMode");
    expect(webSource).not.toContain("KINFOLK_VOICE_OPTIONS");
    expect(webSource).toContain("Just Big Cousin");
  });

  it("keeps a visible mobile cancellation path that discards a recording before transcription", () => {
    expect(mobileSource).toContain("discardVoiceRecording");
    expect(mobileSource).toContain("file.delete()");
    expect(mobileSource).toContain("Cancel and discard Kinfolk Voice recording");
  });
});
