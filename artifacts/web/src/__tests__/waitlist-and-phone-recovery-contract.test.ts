import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("web waitlist and password recovery contract", () => {
  it("identifies website waitlist joins and reports submission failures", () => {
    const waitlist = source("../pages/waitlist.tsx");
    const admin = source("../pages/admin.tsx");
    expect(waitlist).toContain('signupSource: "web"');
    expect(waitlist).toContain("setSubmitError");
    expect(admin).toContain("People on the Waitlist");
    expect(admin).toContain("Synthetic Audit Signups");
    expect(admin).toContain("Remove safe synthetic entries");
  });

  it("offers both email and verified-phone password recovery", () => {
    const forgot = source("../pages/forgot-password.tsx");
    const reset = source("../pages/reset-password.tsx");
    expect(forgot).toContain("Verified phone");
    expect(forgot).toContain('"/api/auth/phone/forgot-password/send"');
    expect(reset).toContain('"/api/auth/phone/reset-password"');
    expect(reset).toContain("Verified phone number");
  });
});
