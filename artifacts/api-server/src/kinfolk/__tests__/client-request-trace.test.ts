import { describe, expect, it } from "vitest";
import { parseKinfolkClientTrace } from "../client-request-trace";

describe("Kinfolk client request trace privacy", () => {
  it("accepts only an opaque mobile-generated correlation code", () => {
    expect(parseKinfolkClientTrace("mkm-mk89z4a-4f8d2q7x")).toBe("mkm-mk89z4a-4f8d2q7x");
    expect(parseKinfolkClientTrace("  MKM-MK89Z4A-4F8D2Q7X  ")).toBe("mkm-mk89z4a-4f8d2q7x");
  });

  it("rejects identifiers, tokens, and free-form content", () => {
    for (const unsafe of [
      "member@example.test",
      "Bearer private-token",
      "What is the best fish for fish and grits?",
      "mkm-abc-123",
      null,
    ]) {
      expect(parseKinfolkClientTrace(unsafe)).toBeNull();
    }
  });
});
