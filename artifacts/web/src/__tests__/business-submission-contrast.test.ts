import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const submissionSource = readFileSync(
  fileURLToPath(new URL("../pages/submit-business.tsx", import.meta.url)),
  "utf8",
);

const profileSource = readFileSync(
  fileURLToPath(new URL("../pages/profile.tsx", import.meta.url)),
  "utf8",
);

describe("Share a Business dark-surface contrast", () => {
  it("keeps instructions and form labels legible on the brown business submission surface", () => {
    expect(submissionSource).toContain('text-[#FFF8EB]');
    expect(submissionSource).toContain('text-[#F2C465]');
    expect(submissionSource).toContain('text-[#F5EBD8]/90');
    expect(submissionSource).toContain('font-bold text-[#F2C465]');
    expect(submissionSource).not.toContain('<label className="text-sm font-semibold text-[#3A1F0E]">');
  });

  it("retains the existing white data-entry field surface", () => {
    expect(submissionSource).toContain('bg-white text-sm');
    expect(submissionSource).toContain('text-[#3A1F0E] placeholder:text-[#3A1F0E]/30');
  });

  it("keeps profile-owned creation separate from a community recommendation", () => {
    expect(profileSource).toContain('/submit-business?intent=owner&source=profile');
    expect(profileSource).toContain('Add my business');
    expect(profileSource).toContain('Share another business');
    expect(profileSource).toContain('Recommend a business without claiming it');
    expect(submissionSource).toContain('submissionIntent: isOwnerIntent ? "owner" : "community"');
    expect(submissionSource).toContain('ownerAttestation: form.ownerAttestation');
    expect(submissionSource).toContain('This community submission is never linked to you as an owner.');
    expect(submissionSource).toContain('Approval grants page-management access; it never creates a verification badge');
  });
});
