import { describe, expect, it } from "vitest";
import { readLocationFirstResponse } from "../features/explore/locationFirstResponse";

const success = {
  query: {},
  requiresLocation: false,
  records: [{ id: "site-1", recordType: "cultural_site", name: "Example site" }],
  coverageGap: null,
  suggestedActions: [],
  nearestAvailableLocation: null,
};

describe("Location-First Explore response boundary", () => {
  it("accepts only a complete successful discovery response", () => {
    expect(readLocationFirstResponse({ ok: true, status: 200 }, success)).toBe(success);
  });

  it("does not allow an authentication error envelope to enter the records state", () => {
    expect(() => readLocationFirstResponse(
      { ok: false, status: 401 },
      { error: "Authentication required" },
    )).toThrow("Explore session needs to reconnect");
  });

  it("fails visibly when a nominal success response is missing the records contract", () => {
    expect(() => readLocationFirstResponse(
      { ok: true, status: 200 },
      { query: {}, coverageGap: null },
    )).toThrow("incomplete response");
  });
});
