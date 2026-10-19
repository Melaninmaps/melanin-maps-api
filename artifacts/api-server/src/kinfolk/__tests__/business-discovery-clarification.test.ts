import { describe, expect, it } from "vitest";
import { resolveBusinessLocationClarificationFollowUp } from "../business-discovery-clarification";
import { routeEvidence } from "../evidence-route";
import {
  destinationForEnabledSession,
  resolveTurnGeography,
} from "../heritage-city-registry";
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

  it.each([
    "Find a Black-owned barbershop near Temple University.",
    "Encuentra una barbería cerca de la Universidad Temple.",
    "Find a barbershop near Temple main campus.",
    "Find a barbershop near Temple main-campus.",
    "Encuentra una barbería cerca del campus principal de Temple.",
  ])("resolves the exact current-turn Temple landmark to Philadelphia: %s", (message) => {
    expect(resolveTurnGeography(message, "Atlanta")).toMatchObject({
      city: "Philadelphia",
      state: "PA",
      source: "alias",
      currentTurn: true,
    });
  });

  it("keeps bare Temple and generic universities outside the Philadelphia landmark rule", () => {
    const bareTemple = resolveTurnGeography(
      "I need a barber near Temple.",
      "Philadelphia",
    );
    expect(bareTemple).toMatchObject({
      city: "Temple",
      state: null,
      source: "explicit",
      currentTurn: true,
    });
    expect(
      destinationForEnabledSession({
        turn: bareTemple,
        existingDestination: "Philadelphia",
        modelDestination: "Atlanta",
      }),
    ).toBe("Temple");
    expect(
      resolveTurnGeography("I need a barber near Howard University.", null),
    ).not.toMatchObject({ city: "Philadelphia", state: "PA" });
  });

  it.each([
    "Necesito un afeitado con toalla caliente en Filadelfia.",
    "Encuentra una barbería con corte para niños en Filadelfia.",
    "Necesito un corte de pelo en Filadelfia.",
    "Encuentra una barbería para un delineado en Filadelfia.",
  ])("routes each narrow Spanish discovery action only after Filadelfia resolves canonically: %s", (message) => {
    const turn = resolveTurnGeography(message, null);
    expect(turn).toMatchObject({
      city: "Philadelphia",
      state: "PA",
      source: "alias",
      currentTurn: true,
    });
    expect(classifyKinfolkRequest(message, turn?.city ?? null)).toMatchObject({
      route: "business_discovery",
      location: "Philadelphia",
    });
  });

  it("does not route a narrow Spanish action without a canonical resolved city", () => {
    expect(
      classifyKinfolkRequest("Necesito un afeitado con toalla caliente.", null),
    ).not.toMatchObject({ route: "business_discovery" });
  });

  it("does not use a session-held city for a narrow Spanish discovery action", () => {
    const sessionOnly = resolveTurnGeography(
      "Necesito un corte de pelo.",
      "Philadelphia",
    );
    expect(sessionOnly).toMatchObject({
      city: "Philadelphia",
      state: "PA",
      source: "session",
      currentTurn: false,
    });
    expect(
      classifyKinfolkRequest(
        "Necesito un corte de pelo.",
        sessionOnly?.city ?? null,
      ),
    ).not.toMatchObject({ route: "business_discovery" });
  });

  it("does not expand Spanish discovery actions beyond Necesito and Encuentra", () => {
    expect(
      classifyKinfolkRequest(
        "Busca una barbería con toalla caliente en Filadelfia.",
        "Philadelphia",
      ),
    ).not.toMatchObject({ route: "business_discovery" });
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
