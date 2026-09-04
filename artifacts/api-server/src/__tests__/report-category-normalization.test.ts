import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { normalizeReportCategory, normalizeReportEncounterType } from "../routes/reports";

describe("safety report category normalization", () => {
  it("preserves canonical categories sent by web and mobile", () => {
    expect(normalizeReportCategory("safety")).toBe("safety");
    expect(normalizeReportCategory("police")).toBe("police");
    expect(normalizeReportCategory("positive")).toBe("positive");
  });

  it("normalizes legacy display labels without storing new categories", () => {
    expect(normalizeReportCategory("Safety Concern")).toBe("safety");
    expect(normalizeReportCategory("ICE Activity")).toBe("police");
    expect(normalizeReportCategory("Excessive Force/Misconduct")).toBe("police");
  });

  it("rejects unsupported categories", () => {
    expect(normalizeReportCategory("police_stop")).toBeNull();
    expect(normalizeReportCategory(undefined)).toBeNull();
  });

  it("keeps the Police or ICE subtype separate from the broad police category", () => {
    expect(normalizeReportEncounterType("police_stop")).toBe("police_stop");
    expect(normalizeReportEncounterType("ICE Activity")).toBe("ice_activity");
    expect(normalizeReportEncounterType("Excessive Force/Misconduct")).toBe("excessive_force");
    expect(normalizeReportEncounterType("unsupported value")).toBeNull();

    const schema = readFileSync(
      fileURLToPath(new URL("../../../../lib/db/src/schema/surveys.ts", import.meta.url)),
      "utf8",
    );
    const migrations = readFileSync(
      fileURLToPath(new URL("../lib/startup-migrations.ts", import.meta.url)),
      "utf8",
    );
    expect(schema).toContain('encounterType: varchar("encounter_type"');
    expect(migrations).toContain("ADD COLUMN IF NOT EXISTS encounter_type VARCHAR(50)");
  });
});
