import { describe, expect, it } from "vitest";
import {
  buildKinfolkGeneratedContentContract,
  resolveKinfolkGeneratedContentStyle,
} from "../generated-content-style";

describe("Kinfolk generated-content style boundary", () => {
  it.each([
    ["Best Friend", "Draft a professional email to my boss about credit for my work.", "professional_email", "professional"],
    ["Business Manager", "Write a sweet, emotional birthday message to my daughter.", "personal_message", "warm_personal"],
    ["Professor", "Write a casual text message to my friend about meeting for lunch.", "casual_text", "casual"],
    ["Big Cousin", "Draft a formal complaint letter about the repair delay.", "formal_complaint", "formal"],
    ["Best Friend", "Write my professional resume for a customer-service role.", "resume", "professional"],
    ["Professor", "Write a formal essay about Nat Turner.", "academic_essay", "formal"],
    ["Big Cousin", "Create a playful TikTok caption for my birthday photos.", "social_caption", "playful"],
  ] as const)("uses audience and purpose—not %s persona—for %s", (_persona, message, kind, style) => {
    expect(resolveKinfolkGeneratedContentStyle(message)).toMatchObject({
      isGeneratedContentRequest: true,
      kind,
      style,
    });
  });

  it("keeps regional and AAVE settings out of a professional artifact unless the artifact request is explicit", () => {
    const professional = buildKinfolkGeneratedContentContract(
      "Draft a professional email to my boss about project credit.",
    );
    const explicitAave = buildKinfolkGeneratedContentContract(
      "Rewrite this text message in AAVE for my cousin.",
    );

    expect(professional).toContain("Do not automatically carry Kinfolk's persona, AAVE setting, regional language setting");
    expect(professional).toContain("professional, workplace-appropriate language");
    expect(explicitAave).toContain("explicitly requested a language or dialect for the artifact");
    expect(
      resolveKinfolkGeneratedContentStyle(
        "Who was Nat Turner? Tell me in AAVE, then write a formal essay about him.",
      ).explicitlyRequestsArtifactLanguage,
    ).toBe(false);
  });

  it("keeps revisions temporary and conversation personality outside the artifact", () => {
    const contract = buildKinfolkGeneratedContentContract(
      "Make the email firmer and less confrontational.",
    );
    expect(resolveKinfolkGeneratedContentStyle("Make the email firmer and less confrontational.")).toMatchObject({
      isGeneratedContentRequest: true,
      kind: "professional_email",
      style: "firm_diplomatic",
    });
    expect(contract).toContain("changes the artifact only");
    expect(contract).toContain("active conversation contains the earlier draft, revise it directly");
    expect(contract).toContain("Do not save a one-time writing instruction as memory");
  });

  it("requires both an explanation and artifact when the member asks for both", () => {
    expect(
      buildKinfolkGeneratedContentContract(
        "Who was Nat Turner? Tell me in AAVE, then write a formal essay about him.",
      ),
    ).toContain("complete both in the same reply");
  });

  it("keeps an explicitly requested AAVE artifact separate from a professional direct explanation", () => {
    const message = "Write the actual message in AAVE to my cousin, but explain your choices to me professionally.";
    expect(resolveKinfolkGeneratedContentStyle(message)).toMatchObject({
      explicitlyRequestsArtifactLanguage: true,
      directExplanationStyle: "professional",
    });
    expect(buildKinfolkGeneratedContentContract(message)).toContain(
      "professional direct explanation",
    );
  });

  it("does not turn ordinary questions into artifact-writing mode", () => {
    expect(resolveKinfolkGeneratedContentStyle("Why does a professional email matter?")).toMatchObject({
      isGeneratedContentRequest: false,
      kind: null,
    });
  });
});
