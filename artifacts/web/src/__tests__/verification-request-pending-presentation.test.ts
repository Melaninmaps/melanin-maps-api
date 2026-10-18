import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const verifyBusiness = readFileSync(
  new URL("../pages/verify-business.tsx", import.meta.url),
  "utf8",
);

const levelBadge = verifyBusiness.slice(
  verifyBusiness.indexOf("function LevelBadge"),
  verifyBusiness.indexOf("export default function VerifyBusiness"),
);

describe("Verify Business pending-request presentation", () => {
  it("labels every submitted verification level as requested rather than approved", () => {
    expect(levelBadge).toContain('basic: { label: "Verification requested"');
    expect(levelBadge).toContain('ownership: { label: "Ownership verification requested"');
    expect(levelBadge).toContain('certified: { label: "Third-party certification requested"');
    expect(levelBadge).not.toContain('label: "Verified"');
    expect(levelBadge).not.toContain('label: "Verified Black-Owned"');
    expect(levelBadge).not.toContain('label: "Third-Party Certified"');
  });

  it("retains the application-received view and explains approval happens after review", () => {
    expect(verifyBusiness).toContain("Application Received");
    expect(verifyBusiness).toContain("Thank you for submitting your verification request");
    expect(verifyBusiness).toContain("3–5 business days");
    expect(verifyBusiness).toContain("Approved businesses receive their badge");
  });
});
