import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("web waitlist and password recovery contract", () => {
  it("identifies website waitlist joins and reports submission failures", () => {
    const waitlist = source("../pages/waitlist.tsx");
    const home = source("../pages/home.tsx");
    const admin = source("../pages/admin.tsx");
    expect(waitlist).toContain('signupSource: "web"');
    expect(waitlist).toContain("setSubmitError");
    expect(home).toContain('data-testid="waitlist-business-link"');
    expect(home).toContain("websiteUrl: isBusinessOwner ? businessWebsite.trim() : undefined");
    expect(home).toContain("if (!res.ok)");
    expect(home).toContain("setSubmitError");
    expect(admin).toContain("People on the Waitlist");
    expect(admin).toContain("Synthetic Audit Signups");
    expect(admin).toContain("Remove safe synthetic entries");
  });

  it("tells a recognized tester to sign in rather than await approval", () => {
    const waitlist = source("../pages/waitlist.tsx");
    const home = source("../pages/home.tsx");
    for (const page of [waitlist, home]) {
      expect(page).toContain("testerAccessActive");
      expect(page).toContain("Tester access is active");
      expect(page).toContain("No wait for approval is required");
    }
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
