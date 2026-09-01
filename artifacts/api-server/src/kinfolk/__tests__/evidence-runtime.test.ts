import { describe, expect, it } from "vitest";
import { routeEvidence } from "../evidence-route";
import { permittedIdentityContext } from "../permitted-identity-context";
import {
  TRUTHFUL_EVIDENCE_UNAVAILABLE_REPLY,
  TRUTHFUL_MEDICAL_EVIDENCE_UNAVAILABLE_REPLY,
  evidenceFailureReply,
  evidenceRoutePromptBlock,
  hasRetrievedMedicalEvidence,
} from "../evidence-runtime";

describe("Kinfolk evidence runtime", () => {
  it("keeps generic blood pressure neutral and fails closed without authoritative medical retrieval", () => {
    const route = routeEvidence("What should I know about blood pressure?");
    const identity = permittedIdentityContext("What should I know about blood pressure?");
    const prompt = evidenceRoutePromptBlock(route, identity);

    expect(prompt).toContain("No identity or demographic qualifier is permitted for this turn");
    expect(prompt).not.toMatch(/Black women|Black community/i);
    expect(evidenceFailureReply({
      route,
      medicalContextBlock: "AUTHORITATIVE RETRIEVAL INCOMPLETE",
      hasLiveWebEvidence: false,
    })).toBe(TRUTHFUL_MEDICAL_EVIDENCE_UNAVAILABLE_REPLY);
  });

  it("uses explicit current-turn Black woman context only as group-level, non-diagnostic wording", () => {
    const message = "I'm a Black woman. What should I know about blood pressure?";
    const route = routeEvidence(message);
    const identity = permittedIdentityContext(message);
    const prompt = evidenceRoutePromptBlock(route, identity);

    expect(prompt).toContain("Current-turn-only population wording: Black woman");
    expect(prompt).toMatch(/group-level, non-diagnostic context/i);
    expect(prompt).toContain("do not persist it");
  });

  it("recognizes successful MedlinePlus retrieval and allows medical generation", () => {
    const contextBlock = "RETRIEVED FROM NIH MEDLINEPLUS\nBlood pressure overview";
    expect(hasRetrievedMedicalEvidence(contextBlock)).toBe(true);
    expect(evidenceFailureReply({
      route: routeEvidence("What should I know about blood pressure?"),
      medicalContextBlock: contextBlock,
      hasLiveWebEvidence: false,
    })).toBeNull();
  });

  it("fails a current Sinners request closed when live web evidence is unavailable", () => {
    const route = routeEvidence("What is the latest news about Sinners?");
    expect(route).toMatchObject({
      domain: "culture_entertainment",
      retrievalRequirement: "web_required",
      failClosed: true,
    });
    expect(evidenceFailureReply({
      route,
      medicalContextBlock: "",
      hasLiveWebEvidence: false,
    })).toBe(TRUTHFUL_EVIDENCE_UNAVAILABLE_REPLY);
    expect(evidenceFailureReply({
      route,
      medicalContextBlock: "",
      hasLiveWebEvidence: true,
    })).toBeNull();
  });

  it("governs evaluative cultural prompts by criteria without an inline cultural label", () => {
    const route = routeEvidence("Who is the best rapper-turned-actor?");
    const prompt = evidenceRoutePromptBlock(
      route,
      permittedIdentityContext("Who is the best rapper-turned-actor?"),
    );

    expect(route.claimMode).toBe("evaluative");
    expect(route.visibleBoilerplate).toBeNull();
    expect(prompt).toMatch(/criteria behind the judgment/i);
    expect(prompt).toMatch(/multiple defensible views/i);
    expect(prompt).not.toContain("From cultural knowledge");
  });
});
