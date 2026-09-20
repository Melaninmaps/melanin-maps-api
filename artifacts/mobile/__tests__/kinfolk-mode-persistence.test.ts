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

describe("Kinfolk mobile conversation modes", () => {
  it("uses the same four saved modes on settings and chat", () => {
    for (const mode of ["community", "professor", "business_manager", "best_friend"]) {
      expect(settingsSource).toContain(`value: "${mode}"`);
      expect(travelSource).toContain(`id: "${mode}"`);
    }
    expect(preferencesSource).toContain('personalityMode: "community"');
  });

  it("saves a chat-mode change and restores the saved default", () => {
    expect(travelSource).toContain("updatePreferences({ personalityMode: v.id })");
    expect(travelSource).toContain("const savedVoiceMode = preferences?.personalityMode");
    expect(travelSource).toContain("setVoiceMode(savedVoiceMode as typeof voiceMode)");
  });

  it("uses server-supported preference values rather than silently rejected aliases", () => {
    expect(settingsSource).toContain('value: "conversational", label: "Casual"');
    expect(settingsSource).toContain('value: "concise", label: "Direct"');
    expect(settingsSource).toContain('value: "lots", label: "Many"');
    expect(settingsSource).toContain('value: "playful", label: "Witty"');
  });
});
