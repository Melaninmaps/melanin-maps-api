import { describe, expect, it } from "vitest";
import { normalizeKinfolkMemberReply } from "../response-format";

describe("Kinfolk member response formatting", () => {
  it("preserves meaningful Markdown headings, emphasis, and bullets for safe client rendering", () => {
    expect(normalizeKinfolkMemberReply("**What is happening:**\n\n### Practical heads-up\n* Check transit\n\n**Keep this in mind**"))
      .toBe("**What is happening:**\n\n### Practical heads-up\n- Check transit\n\n**Keep this in mind**");
  });

  it("retains paired inline emphasis for member-visible rendering", () => {
    expect(normalizeKinfolkMemberReply("Your **first stop** should be the front desk."))
      .toBe("Your **first stop** should be the front desk.");
  });

  it("removes a dangling emphasis marker from a model response", () => {
    expect(normalizeKinfolkMemberReply("**What should I do if I have severe side effects?"))
      .toBe("What should I do if I have severe side effects?");
  });

  it("preserves ordered sequences while normalizing their punctuation", () => {
    expect(normalizeKinfolkMemberReply("1. First step\n• 2. Second step\n3) Third step"))
      .toBe("1. First step\n2. Second step\n3. Third step");
  });
});
