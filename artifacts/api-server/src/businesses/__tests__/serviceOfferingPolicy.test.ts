import { describe, expect, it } from "vitest";
import { validateServiceOffering, validateServiceOfferingSet } from "../serviceOfferingPolicy";

describe("service offering policy", () => {
  const documented = { serviceKey: "silk_press", evidenceState: "official_source_documented", sourceUrl: "https://example.com/services", sourceLabel: "Official menu", observedAt: "2026-10-08", confidence: "high", policy: { shampoo: "included", conditioning: "unknown", detangling: "unknown", drying: "included", arrivalPreparation: "not_required" } };
  it("requires provenance for confirmed service claims", () => {
    expect(validateServiceOffering(documented)).toMatchObject({ serviceLabel: "Silk presses", status: "active" });
    expect(() => validateServiceOffering({ serviceKey: "silk_press", evidenceState: "owner_confirmed" })).toThrow("require a source URL");
  });
  it("rejects directories as official service evidence and duplicate service keys", () => {
    expect(() => validateServiceOffering({ ...documented, sourceUrl: "https://www.yelp.com/biz/example" })).toThrow("directory");
    expect(() => validateServiceOfferingSet([documented, documented])).toThrow("only once");
  });
});
