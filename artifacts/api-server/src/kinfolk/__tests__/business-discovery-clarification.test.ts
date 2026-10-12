import { describe, expect, it } from "vitest";
import { resolveBusinessLocationClarificationFollowUp } from "../business-discovery-clarification";
import { routeEvidence } from "../evidence-route";
import { resolveTurnGeography } from "../heritage-city-registry";
import { extractExplicitOwnershipDesignationFilterIds } from "@workspace/constants";
import { classifyIntent } from "../intent-router";
import { classifyKinfolkRequest } from "../request-classifier";

describe("governed business discovery location clarifications", () => {
  it("continues the immediately prior lunch search when the member supplies a city", () => {
    const followUp = resolveBusinessLocationClarificationFollowUp([
      { role: "user", content: "Find lunch near my office." },
      {
        role: "assistant",
        content:
          "I can help find places to eat. Which city or neighborhood should I search? You can also share the cuisine, budget, date, or community preferences that matter to you.",
      },
    ]);

    expect(followUp).toMatchObject({
      priorQuestion: "Find lunch near my office.",
      subject: { key: "restaurant", label: "restaurants" },
    });
    const location = resolveTurnGeography(
      "Philadelphia, near University City.",
      null,
    );
    expect(location).toMatchObject({ city: "Philadelphia", state: "PA" });
    expect(
      classifyKinfolkRequest(
        followUp?.priorQuestion ?? "",
        location?.city ?? null,
      ),
    ).toMatchObject({ route: "business_discovery", discoveryKind: "food" });
  });

  it("does not inherit a subject from a generic assistant response", () => {
    expect(
      resolveBusinessLocationClarificationFollowUp([
        { role: "user", content: "Find lunch near my office." },
        { role: "assistant", content: "What would you like to talk about today?" },
      ]),
    ).toBeNull();
  });

  it("does not inherit a subject after an intervening conversation turn", () => {
    expect(
      resolveBusinessLocationClarificationFollowUp([
        { role: "user", content: "Find lunch near my office." },
        {
          role: "assistant",
          content: "I can help find places to eat. Which city or neighborhood should I search?",
        },
        { role: "user", content: "Actually, what is two plus two?" },
        { role: "assistant", content: "Two plus two is four." },
      ]),
    ).toBeNull();
  });

  it("keeps protected health discovery outside the ordinary directory continuation", () => {
    expect(
      resolveBusinessLocationClarificationFollowUp([
        { role: "user", content: "Find an OB/GYN near my office." },
        {
          role: "assistant",
          content: "Which city or neighborhood should I search?",
        },
      ]),
    ).toBeNull();
  });

  it("classifies pediatric dentistry as medical care before the ordinary business fast path", () => {
    const request = "Find me a pediatric dentist in Philadelphia for my child.";
    expect(classifyIntent(request, false)).toBe("medical_health");
    expect(routeEvidence(request).domain).toBe("medical_health");
  });

  it("distinguishes explicit Caribbean ownership from Caribbean cuisine", () => {
    expect(
      extractExplicitOwnershipDesignationFilterIds(
        "Find Caribbean-owned restaurants in Philadelphia",
      ),
    ).toEqual(["caribbean-west-indian"]);
    expect(
      extractExplicitOwnershipDesignationFilterIds(
        "Find Caribbean restaurants in Philadelphia",
      ),
    ).toEqual([]);
  });

  it("does not use a saved location when the clarification reply omits a city", () => {
    expect(resolveTurnGeography("Thanks, that helps.", null)).toBeNull();
  });
});
