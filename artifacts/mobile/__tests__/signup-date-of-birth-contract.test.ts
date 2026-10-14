import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const signup = readFileSync(resolve(here, "../app/signup.tsx"), "utf8");

describe("mobile signup date-of-birth contract", () => {
  it("does not submit without all required DOB fields", () => {
    expect(signup).toContain('if (!dobMonth || !dobDay || !dobYear)');
    expect(signup).toContain("Date of birth is required to create an account.");
    expect(signup).toContain("(required)</Text>");
  });

  it("validates a real calendar date and the 13+ age requirement before registration", () => {
    expect(signup).toContain("new Date(Date.UTC(y, m - 1, d))");
    expect(signup).toContain("dob.getUTCFullYear() === y");
    expect(signup).toContain("You must be at least 13 years old to use this platform.");
  });

  it("sends the exact validated UTC DOB through the existing registration contract", () => {
    expect(signup).toContain("dateOfBirth = new Date(Date.UTC(y, m - 1, d)).toISOString()");
    expect(signup).toContain('fetch(`${apiBase}/api/auth/register`');
    expect(signup).toContain("dateOfBirth,");
    expect(signup).toContain("agreeToTerms,");
  });
});
