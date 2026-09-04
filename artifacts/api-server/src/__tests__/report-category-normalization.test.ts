import { describe, expect, it } from "vitest";
import { normalizeReportCategory } from "../routes/reports";

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
});