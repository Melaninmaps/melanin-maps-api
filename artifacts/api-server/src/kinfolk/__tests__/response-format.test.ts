import { describe, expect, it } from "vitest";
import { normalizeKinfolkMemberReply } from "../response-format";

describe("Kinfolk member response formatting", () => {
  it("converts accidental Markdown headings and emphasis into readable bullets", () => {
    expect(normalizeKinfolkMemberReply("**What is happening:**\n\n### Practical heads-up\n* Check transit\n\n**Keep this in mind**"))
      .toBe("• What is happening\n\n• Practical heads-up\n• Check transit\n\n• Keep this in mind");
  });

  it("retains regular content while removing decorative emphasis", () => {
    expect(normalizeKinfolkMemberReply("Your **first stop** should be the front desk."))
      .toBe("Your first stop should be the front desk.");
  });

  it("removes a dangling emphasis marker from a model response", () => {
    expect(normalizeKinfolkMemberReply("**What should I do if I have severe side effects?"))
      .toBe("What should I do if I have severe side effects?");
  });
});
