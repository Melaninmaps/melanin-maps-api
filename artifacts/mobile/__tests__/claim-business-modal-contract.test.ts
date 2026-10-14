import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../components/ClaimBusinessModal.tsx", import.meta.url)),
  "utf8",
);

describe("native owner claim review message", () => {
  it("keeps the completed claim private and review-only without an unsupported timing promise", () => {
    expect(source).toContain("Your claim is private while our team reviews it.");
    expect(source).toContain("Approval may grant listing-management access");
    expect(source).toContain("does not verify the business or its ownership designations");
    expect(source).not.toContain("within 2-3 business days");
  });
});
