import { describe, expect, it } from "vitest";
import { buildKinfolkProductIdentityResponse } from "../product-identity-response";

describe("Kinfolk product identity response", () => {
  it("returns the governed practical explanation for direct comparison questions", () => {
    const response = buildKinfolkProductIdentityResponse(
      "What makes you different from other AI chat bots?",
    );

    expect(response).not.toBeNull();
    expect(response?.reply).toContain("right fit, not simply any result");
    expect(response?.reply).toContain("moving to Houston");
    expect(response?.reply).toContain("wheelchair-friendly");
    expect(response?.reply).toContain(
      "source-reported ownership designations, owner claims, community feedback, and verified status distinct",
    );
    expect(response?.reply).toContain("does not claim a local result");
    expect(response?.followUpSuggestions).toEqual([]);
  });

  it("does not intercept ordinary Kinfolk requests", () => {
    expect(buildKinfolkProductIdentityResponse("Find a salon in Philadelphia")).toBeNull();
    expect(buildKinfolkProductIdentityResponse("What is the weather today?")).toBeNull();
    expect(buildKinfolkProductIdentityResponse("How does a chatbot work?")).toBeNull();
  });
});
