import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(
  fileURLToPath(new URL("../app/travel.tsx", import.meta.url)),
  "utf8",
);
const settingsSource = readFileSync(
  fileURLToPath(new URL("../app/kinfolk-settings.tsx", import.meta.url)),
  "utf8",
);
const preferencesSource = readFileSync(
  fileURLToPath(new URL("../hooks/useUserPreferences.ts", import.meta.url)),
  "utf8",
);
const kinfolkHookSource = readFileSync(
  fileURLToPath(new URL("../hooks/useKinfolk.ts", import.meta.url)),
  "utf8",
);
const chatWidgetSource = readFileSync(
  fileURLToPath(new URL("../components/AIChatWidget.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk mobile conversation modes", () => {
  it("uses the same four saved modes on settings and chat", () => {
    for (const mode of ["community", "professor", "business_manager", "best_friend"]) {
      expect(settingsSource).toContain(`value: "${mode}"`);
      expect(travelSource).toContain(`id: "${mode}"`);
    }
    expect(preferencesSource).toContain('personalityMode: "community"');
  });

  it("restores the saved mode without exposing an inline selector in the composer", () => {
    expect(travelSource).toContain("const savedVoiceMode = preferences?.personalityMode");
    expect(travelSource).toContain("setVoiceMode(savedVoiceMode as typeof voiceMode)");
    const composerControls = travelSource.slice(
      travelSource.indexOf("{showComposerControls && <>"),
      travelSource.indexOf("{voiceInputStatus ?"),
    );
    expect(travelSource).toContain("Memory & privacy");
    expect(composerControls).not.toContain("Kinfolk Voices™");
    expect(composerControls).not.toContain("updatePreferences({ personalityMode: v.id })");
  });

  it("uses server-supported preference values rather than silently rejected aliases", () => {
    expect(settingsSource).toContain('value: "conversational", label: "Casual"');
    expect(settingsSource).toContain('value: "concise", label: "Direct"');
    expect(settingsSource).toContain('value: "lots", label: "Many"');
    expect(settingsSource).toContain('value: "playful", label: "Witty"');
  });

  it("does not force an unsupplied chat turn back to Big Cousin", () => {
    expect(kinfolkHookSource).toContain(
      "...(opts?.voiceMode ? { voiceMode: opts.voiceMode } : {}),",
    );
    expect(kinfolkHookSource).not.toContain('voiceMode: opts?.voiceMode ?? "community"');
  });

  it("shares saved AAVE and regional language controls across native settings and chat", () => {
    expect(settingsSource).toContain('aaveLevel: 0');
    expect(settingsSource).toContain('regionalFlavor: "off"');
    expect(settingsSource).toContain('value: "philadelphia", label: "Philadelphia"');
    expect(settingsSource).toContain('value: "new_york", label: "New York City"');
    expect(settingsSource).toContain("Tell me in AAVE");
    expect(settingsSource).toContain("not an inference from your location");
    expect(chatWidgetSource).toContain("getVoicePreferences");
    expect(chatWidgetSource).toContain("/api/kinfolk/aave-level");
    expect(chatWidgetSource).not.toContain("Complete AAVE including profanity");
  });
});
