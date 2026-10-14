import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const signup = source("../pages/signup.tsx");
const app = source("../App.tsx");

describe("approved-member web signup contract", () => {
  it("keeps /signup reachable as a registration page rather than a waitlist redirect", () => {
    expect(app).toContain('<Route path="/signup" component={Signup} />');
    expect(signup).not.toContain('window.location.replace("/waitlist")');
    expect(signup).toContain("Create your account");
  });

  it("submits the existing registration contract with mandatory DOB and terms", () => {
    expect(signup).toContain('fetch("/api/auth/register"');
    expect(signup).toContain('credentials: "include"');
    expect(signup).toContain("validateDateOfBirth(dateOfBirth)");
    expect(signup).toContain("Date of birth is required to create an account.");
    expect(signup).toContain("You must be at least 13 years old to use this platform.");
    expect(signup).toContain("agreeToTerms,");
    expect(signup).toContain("dateOfBirth,");
  });

  it("retains the server-created web session and relies on the server-side invite gate", () => {
    expect(signup).toContain("setWebToken(data.token)");
    expect(signup).toContain("await queryClient.invalidateQueries()");
    expect(signup).toContain("eligibility is verified securely when you submit");
    expect(signup).toContain('href="/waitlist"');
  });
});
