import { describe, expect, it } from "vitest";
import {
  applyEntertainmentConsentPlan,
  buildEntertainmentConsentPlan,
  extractStreamingServices,
} from "../entertainment-personalization";

describe("entertainment personalization", () => {
  it("does not write a subscription from ordinary text and returns an explicit add plan", () => {
    expect(buildEntertainmentConsentPlan("I have Netflix and HBO Max")).toMatchObject({
      operation: "add",
      add: ["Netflix", "Max"],
    });
  });

  it("recognizes cancellation and replacement without removing unrelated services", () => {
    const cancellation = buildEntertainmentConsentPlan("I cancelled Peacock");
    const replacement = buildEntertainmentConsentPlan("I switched from Hulu to Max");
    expect(cancellation).toMatchObject({ operation: "remove", remove: ["Peacock"] });
    expect(replacement).toMatchObject({ operation: "replace", remove: ["Hulu"], add: ["Max"] });
    expect(applyEntertainmentConsentPlan({ streamingServices: ["Netflix", "Hulu"], entertainmentCountry: "US", entertainmentCostPolicy: "any" }, cancellation!)).toMatchObject({ streamingServices: ["Netflix", "Hulu"] });
    expect(applyEntertainmentConsentPlan({ streamingServices: ["Netflix", "Hulu"], entertainmentCountry: "US", entertainmentCostPolicy: "any" }, replacement!)).toMatchObject({ streamingServices: ["Netflix", "Max"] });
  });

  it("requires an explicit plan for the no-extra-cost rule", () => {
    expect(buildEntertainmentConsentPlan("Only recommend movies I can watch without paying extra")).toMatchObject({
      operation: "set_cost_policy",
      costPolicy: "included_only",
    });
  });

  it("does not mistake arbitrary words for a provider", () => {
    expect(extractStreamingServices("I have a maxed out budget but no service listed")).toEqual([]);
  });
});
