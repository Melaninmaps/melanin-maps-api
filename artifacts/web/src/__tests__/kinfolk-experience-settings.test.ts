import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const settingsSource = readFileSync(
  new URL(
    "../components/kinfolk/KinfolkExperienceSettings.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileSource = readFileSync(
  new URL("../pages/profile.tsx", import.meta.url),
  "utf8",
);

describe("unified Web Kinfolk settings", () => {
  it("gives Profile Settings one home for conversation mode, speaker, and saved memories", () => {
    expect(profileSource).toContain('title: "Kinfolk Settings"');
    expect(profileSource).toContain("<KinfolkExperienceSettings />");
    expect(settingsSource).toContain("Conversation Mode");
    expect(settingsSource).toContain("Big Cousin");
    expect(settingsSource).toContain("Best Friend");
    expect(settingsSource).toContain("Business Manager");
    expect(settingsSource).toContain("Professor");
    expect(settingsSource).toContain("Standard Kinfolk Voice");
    expect(settingsSource).toContain("Female Voice");
    expect(settingsSource).toContain("Saved Memories");
    expect(settingsSource).toContain("KinfolkMemoryManager");
  });

  it("uses authenticated lifecycle endpoints for explicit preferred-name control", () => {
    expect(settingsSource).toContain("api/kinfolk/preferred-name");
    expect(settingsSource).toContain("api/kinfolk/preferred-name/pause");
    expect(settingsSource).toContain('method: "PUT"');
    expect(settingsSource).toContain('action === "revoke" ? "POST" : "DELETE"');
    expect(settingsSource).toContain("consent: true");
    expect(settingsSource).toContain(
      "Kinfolk never silently saves ordinary chat.",
    );
  });

  it("persists only the approved stored speaker choice and never submits a provider voice in chat", () => {
    expect(settingsSource).toContain(
      'savePreferences({ kinfolkVoice: "onyx" })',
    );
    expect(settingsSource).toContain(
      'savePreferences({ kinfolkVoice: "nova" })',
    );
    expect(settingsSource).toContain("speakerFromStoredVoice");
    expect(settingsSource).not.toContain("voice: requestedVoice");
  });
});
