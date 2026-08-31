import { describe, expect, it } from "vitest";
import {
  deliveryToResponseStyle,
  responseStyleToDelivery,
} from "../delivery-profile";
import { classifyIntent, getEvidencePolicy } from "../intent-router";

describe("current Kinfolk chat intent and evidence contracts", () => {
  it("classifies a Thailand visa query as regulated legal content", () => {
    const intent = classifyIntent(
      "What are Thailand visa requirements for a U.S. citizen?",
      true,
    );
    expect(intent).toBe("legal_regulated");

    const policy = getEvidencePolicy(intent);
    expect(policy.consequence).toBe("high");
    expect(policy.citationMode).toBe("required");
    expect(policy.blockCommunityAsProof).toBe(true);
    expect(policy.provenanceLabel).toMatch(/official|authoritative|legal/i);
  });

  it("keeps cultural music requests conversational", () => {
    const intent = classifyIntent("Who is the best rapper from Philadelphia?", false);
    expect(intent).toBe("culture_entertainment");
    expect(getEvidencePolicy(intent).consequence).toBe("low");
  });
});

describe("current Kinfolk response-style persistence mappings", () => {
  it("maps every UI response style to stored delivery dimensions", () => {
    expect(responseStyleToDelivery("concise")).toEqual({
      detailLevel: "quick",
      tonePreference: "default",
    });
    expect(responseStyleToDelivery("detailed")).toEqual({
      detailLevel: "deep",
      tonePreference: "default",
    });
    expect(responseStyleToDelivery("professional")).toEqual({
      detailLevel: "standard",
      tonePreference: "professional",
    });
  });

  it("restores a persisted delivery profile to the selected UI style", () => {
    expect(deliveryToResponseStyle("deep", "default")).toBe("detailed");
    expect(deliveryToResponseStyle("standard", "professional")).toBe("professional");
    expect(deliveryToResponseStyle("quick", "default")).toBe("concise");
  });
});