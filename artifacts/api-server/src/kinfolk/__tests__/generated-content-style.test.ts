import { describe, expect, it } from "vitest";
import {
  buildKinfolkGeneratedContentContract,
  buildKinfolkGenericProjectConcernEmail,
  buildKinfolkGeneratedMessageClarification,
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

  it("requires placeholders instead of invented writing details and avoids linguistic overclaims", () => {
    const contract = buildKinfolkGeneratedContentContract(
      "Write an email to my boss about a project concern.",
    );
    const languageContract = buildKinfolkGeneratedContentContract(
      "Write a message to my cousin in AAVE, but explain your choices to me professionally.",
    );
    expect(contract).toContain("Do not invent a meeting time, date, deadline, address, recipient name");
    expect(contract).toContain("Use a clearly labeled placeholder or neutral conditional language");
    expect(contract).toContain("Ask one concise purpose question only when a placeholder scaffold would not be meaningful");
    expect(contract).toContain("If a generic email or message can be drafted");
    expect(contract).toContain("placeholder scaffold would not be meaningful");
    expect(contract).toContain("Do not turn a short message, email, caption, or note into a long essay");
    expect(contract).toContain("no forced “Draft:” label, title, coaching, persona response");
    expect(contract).toContain("A surface may present an optional label outside the copyable artifact");
    expect(contract).toContain("Do not lead with a request for optional names, dates, or background");
    expect(contract).toContain("For a standalone artifact request, return the artifact itself with no forced label");
    expect(contract).toContain("never assume a check-in, support, meeting, food, relationship history");
    expect(languageContract).toContain("Do not make unsupported claims about linguistic grammar");
  });

  it("uses a placeholder scaffold for an underspecified casual message instead of inventing a circumstance", () => {
    expect(buildKinfolkGeneratedMessageClarification(
      "Write a message to my cousin in AAVE.",
    )).toBe("Hi [Name],\n\n[Start with why you are writing.] [Add your main point, request, or update.]\n\nTake care,\n[Your Name]");
    expect(buildKinfolkGeneratedMessageClarification(
      "Write a message to my cousin saying happy birthday.",
    )).toBeNull();
    expect(buildKinfolkGeneratedMessageClarification(
      "Explain why messages matter.",
    )).toBeNull();
  });

  it("uses a neutral placeholder email for a generic project concern without requesting nonessential details", () => {
    expect(buildKinfolkGenericProjectConcernEmail(
      "Write an email to my boss about a project concern.",
    )).toBe(`Subject: [Project] — [brief concern]\n\nHi [Manager Name],\n\nI want to flag a concern about [Project]. [Briefly describe the concern and its impact.] Could we discuss [the decision, support, or next step you need] when you have a moment?\n\nI’m happy to share the details and help identify a workable path forward.\n\nThanks,\n[Your Name]`);
    expect(buildKinfolkGenericProjectConcernEmail(
      "Write an email to my boss about the missed March 1 launch deadline.",
    )).toBeNull();
  });

  it("does not turn ordinary questions into artifact-writing mode", () => {
    expect(resolveKinfolkGeneratedContentStyle("Why does a professional email matter?")).toMatchObject({
      isGeneratedContentRequest: false,
      kind: null,
    });
  });
});
