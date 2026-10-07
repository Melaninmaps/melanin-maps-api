import { describe, expect, it } from "vitest";
import { shouldLoadKinfolkHomeCatalog } from "../home-catalog-gate";

describe("Kinfolk home catalog request gate", () => {
  it("loads a home catalog only for explicit discovery or travel-planning routes", () => {
    expect(shouldLoadKinfolkHomeCatalog({
      broadCatalogAllowed: true,
      decisionRoute: "business_discovery",
    })).toBe(true);
    expect(shouldLoadKinfolkHomeCatalog({
      broadCatalogAllowed: true,
      decisionRoute: "travel_planning",
    })).toBe(true);
  });

  it("does not read a home catalog for ordinary, current, safety, or regulated chat", () => {
    for (const decisionRoute of [
      "general_knowledge",
      "current_information",
      "safety_emergency",
      "medical_health",
      "legal_regulated",
      "financial_regulated",
      null,
    ]) {
      expect(shouldLoadKinfolkHomeCatalog({
        broadCatalogAllowed: true,
        decisionRoute,
      })).toBe(false);
    }
  });

  it("keeps named-business and other non-broad catalog paths closed", () => {
    expect(shouldLoadKinfolkHomeCatalog({
      broadCatalogAllowed: false,
      decisionRoute: "business_discovery",
    })).toBe(false);
  });
});
