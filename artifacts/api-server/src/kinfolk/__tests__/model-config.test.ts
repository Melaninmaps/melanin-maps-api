import { describe, expect, it } from "vitest";
import { assertKinfolkModelEnvironment, kinfolkModel } from "../model-config";

describe("Kinfolk model configuration", () => {
  it("uses reviewed defaults when a role is not configured", () => {
    expect(kinfolkModel("staffDemo", {})).toBe("gpt-5");
    expect(kinfolkModel("fallback", {})).toBe("gpt-4o-mini");
    expect(kinfolkModel("webSearch", {})).toBe("gpt-5");
    expect(kinfolkModel("libraryResearch", {})).toBe("gpt-4o-mini");
    expect(kinfolkModel("transcription", {})).toBe("gpt-4o-mini-transcribe");
  });

  it("accepts only role-compatible reviewed model IDs", () => {
    expect(kinfolkModel("staffDemo", { KINFOLK_STAFF_DEMO_MODEL: " gpt-5-mini " })).toBe("gpt-5-mini");
    expect(kinfolkModel("fallback", { KINFOLK_FALLBACK_MODEL: "gpt-4.1-mini" })).toBe("gpt-4.1-mini");
    expect(kinfolkModel("webSearch", { KINFOLK_WEB_SEARCH_MODEL: "gpt-5" })).toBe("gpt-5");
    expect(kinfolkModel("libraryResearch", { LIBRARY_RESEARCH_MODEL: "gpt-4o" })).toBe("gpt-4o");
    expect(kinfolkModel("transcription", { KINFOLK_TRANSCRIPTION_MODEL: "whisper-1" })).toBe("whisper-1");
  });

  it("fails closed to the role default for arbitrary or cross-purpose IDs", () => {
    expect(kinfolkModel("staffDemo", { KINFOLK_STAFF_DEMO_MODEL: "private-preview-model" })).toBe("gpt-5");
    expect(kinfolkModel("webSearch", { KINFOLK_WEB_SEARCH_MODEL: "gpt-4o-mini-transcribe" })).toBe("gpt-5");
    expect(kinfolkModel("transcription", { KINFOLK_TRANSCRIPTION_MODEL: "gpt-5" })).toBe("gpt-4o-mini-transcribe");
  });

  it("fails startup when a configured role contains an unapproved model", () => {
    expect(() => assertKinfolkModelEnvironment({
      KINFOLK_WEB_SEARCH_MODEL: "typo-model",
    })).toThrow(/KINFOLK_WEB_SEARCH_MODEL.*not approved/i);
    expect(() => assertKinfolkModelEnvironment({
      KINFOLK_STAFF_DEMO_MODEL: "gpt-5",
      KINFOLK_FALLBACK_MODEL: "gpt-4o-mini",
      KINFOLK_WEB_SEARCH_MODEL: "gpt-5",
      LIBRARY_RESEARCH_MODEL: "gpt-4o-mini",
      KINFOLK_TRANSCRIPTION_MODEL: "gpt-4o-mini-transcribe",
    })).not.toThrow();
  });
});
