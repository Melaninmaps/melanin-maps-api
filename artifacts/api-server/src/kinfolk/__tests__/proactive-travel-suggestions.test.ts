import { describe, expect, it } from "vitest";
import { classifyKinfolkRequest } from "../request-classifier";
import { inspectProactiveTravelSuggestion } from "../proactive-travel-suggestions";
import { requiresCurrentResearch } from "../current-research";

describe("proactive Kinfolk travel suggestions", () => {
  it.each([
    "I’m heading to Houston.",
    "I’ll be in Houston next weekend.",
    "What should I do in Houston?",
  ])("offers explicit category choices without a catalog result for: %s", (message) => {
    expect(requiresCurrentResearch(message)).toBe(false);
    const decision = inspectProactiveTravelSuggestion({
      message,
      destination: "Houston",
      requiresCurrentEvidence: false,
    });

    expect(decision).toMatchObject({ kind: "offer", city: "Houston" });
    if (decision.kind !== "offer") throw new Error("expected travel offer");
    expect(decision.reply).toMatch(/without assuming what you want to do/i);
    expect(decision.reply).toMatch(/food, bookstores, entertainment/i);
    expect(decision.followUpSuggestions).toEqual([
      "Suggest food in Houston",
      "Suggest bookstores in Houston",
      "Suggest entertainment in Houston",
      "Check current events in Houston",
      "No suggestions for now",
    ]);
    expect(decision.reply).not.toMatch(/restaurant|business card|itinerary/i);
  });

  it("turns each explicit category chip into a current-turn governed request", () => {
    expect(classifyKinfolkRequest("Suggest food in Houston", "Houston")).toMatchObject({
      route: "business_discovery",
      location: "Houston",
    });
    expect(classifyKinfolkRequest("Suggest bookstores in Houston", "Houston")).toMatchObject({
      route: "business_discovery",
      location: "Houston",
    });
    expect(classifyKinfolkRequest("Suggest entertainment in Houston", "Houston")).toMatchObject({
      route: "business_discovery",
      location: "Houston",
    });
  });

  it("does not bypass the current-evidence path for a current event request", () => {
    expect(inspectProactiveTravelSuggestion({
      message: "What events are happening in Houston this weekend?",
      destination: "Houston",
      requiresCurrentEvidence: true,
    })).toEqual({ kind: "none" });
  });

  it("does not replace an explicit itinerary or category request with the offer", () => {
    expect(inspectProactiveTravelSuggestion({
      message: "Plan a three-day trip to Houston",
      destination: "Houston",
      requiresCurrentEvidence: false,
    })).toEqual({ kind: "none" });
    expect(inspectProactiveTravelSuggestion({
      message: "Find a bookstore in Houston",
      destination: "Houston",
      requiresCurrentEvidence: false,
    })).toEqual({ kind: "none" });
  });

  it("honors the explicit no-suggestions choice without continuing recommendation behavior", () => {
    expect(inspectProactiveTravelSuggestion({
      message: "No suggestions for now",
      destination: null,
      requiresCurrentEvidence: false,
    })).toEqual({
      kind: "decline",
      reply: "No problem — I’ll keep it general. Tell me what you’d like help with whenever you’re ready.",
      followUpSuggestions: [],
    });
  });
});
