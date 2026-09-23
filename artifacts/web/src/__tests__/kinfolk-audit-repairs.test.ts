import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const travel = readFileSync(new URL("../pages/travel.tsx", import.meta.url), "utf8");

describe("Kinfolk audit repairs on web", () => {
  it("hydrates the active conversation mode from the saved personality mode", () => {
    expect(travel).toContain("normalizeSavedKinfolkMode(raw.personalityMode)");
    expect(travel).toContain("setKinfolkMode(normalizeSavedKinfolkMode(hydratedPrefs.personalityMode))");
  });

  it("renders and persists each of the current four delivery modes", () => {
    for (const mode of ["community", "professor", "business_manager", "best_friend"]) {
      expect(travel).toContain(`id: "${mode}"`);
      expect(travel).toContain("data-testid={`kinfolk-mode-${id}`}");
    }
    expect(travel).toContain("selectKinfolkMode(id)");
    expect(travel).toContain("JSON.stringify({ personalityMode: nextMode })");
    expect(travel).toContain("Mode was not saved; your previous mode was restored.");
  });

  it("keeps web microphone and Listen controls wired to real implementations", () => {
    expect(travel).toContain("onClick={handleVoiceTap}");
    expect(travel).toContain("onClick={() => playMessage(msg.id, msg.content)}");
    expect(travel).toContain("Recording… {recordingElapsed}s / 60s");
    expect(travel).toContain("MediaRecorder.isTypeSupported(type)");
  });
});
