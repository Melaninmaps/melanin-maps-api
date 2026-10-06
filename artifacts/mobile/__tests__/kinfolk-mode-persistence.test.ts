import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const travelSource = readFileSync(
  fileURLToPath(new URL("../app/travel.tsx", import.meta.url)),
  "utf8",
);
const settingsSource = readFileSync(
  fileURLToPath(new URL("../components/KinfolkSettingsControlCenter.tsx", import.meta.url)),
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

  it("restores, exposes, and persists the saved mode inside the chat", () => {
    expect(travelSource).toContain("const savedVoiceMode = preferences?.personalityMode");
    expect(travelSource).toContain("setVoiceMode(savedVoiceMode as typeof voiceMode)");
    expect(travelSource).toContain("Conversation Mode");
    expect(travelSource).toContain("Style only");
    expect(travelSource).toContain("accessibilityRole=\"radio\"");
    expect(travelSource).toContain("updatePreferences({ personalityMode: mode.id })");
    expect(travelSource).toContain("Your saved memories and voice were left unchanged.");
  });

  it("uses server-supported preference values rather than silently rejected aliases", () => {
    expect(settingsSource).toContain('value: "conversational", label: "Casual"');
    expect(settingsSource).toContain('value: "concise", label: "Direct"');
    expect(settingsSource).toContain('value: "lots", label: "Many"');
    expect(settingsSource).toContain('value: "playful", label: "Witty"');
  });

  it("keeps voice delivery separate from conversation mode and links to saved-memory management", () => {
    expect(settingsSource).toContain("CONVERSATION MODE");
    expect(settingsSource).toContain("Standard Kinfolk Voice");
    expect(settingsSource).toContain("Female Voice");
    expect(settingsSource).toContain('voice: "nova"');
    expect(settingsSource).toContain("Saved memories");
    expect(settingsSource).toContain('router.push("/kinfolk-memory" as never)');
    expect(settingsSource).toContain("Nothing here is created from ordinary chat");
  });
});
