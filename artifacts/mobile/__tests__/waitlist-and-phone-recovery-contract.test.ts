import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const mobileWaitlist = readFileSync(resolve(here, "../app/waitlist.tsx"), "utf8");
const mobileRecovery = readFileSync(resolve(here, "../app/forgot-password.tsx"), "utf8");

describe("mobile waitlist and password recovery contract", () => {
  it("submits one platform-specific source and never shows success after a failed join", () => {
    expect(mobileWaitlist).toContain('signupSource: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web"');
    expect(mobileWaitlist).toContain("if (!res.ok)");
    expect(mobileWaitlist).toContain("setJoinError");
    expect(mobileWaitlist).toContain("setSubmitted(true);");
  });

  it("requires a member rollout city and submits it separately from a city nomination", () => {
    expect(mobileWaitlist).toContain('const [city, setCity] = useState("");');
    expect(mobileWaitlist).toContain('const [state, setState] = useState("");');
    expect(mobileWaitlist).toContain("const cityValid = city.trim().length >= 2;");
    expect(mobileWaitlist).toContain("const valid = emailValid && cityValid && websiteValid;");
    expect(mobileWaitlist).toContain("city: city.trim(),");
    expect(mobileWaitlist).toContain("state: state.trim().toUpperCase() || undefined,");
    expect(mobileWaitlist).toContain("Your City");
    expect(mobileWaitlist).toContain("cityNomination: cityNomination.trim() || undefined,");
  });

  it("keeps email recovery and adds verified-phone recovery rather than phone login", () => {
    expect(mobileRecovery).toContain('useState<"email" | "phone">("email")');
    expect(mobileRecovery).toContain('"/api/auth/phone/forgot-password/send"');
    expect(mobileRecovery).toContain('"/api/auth/phone/reset-password"');
    expect(mobileRecovery).toContain("Verified Phone Number");
  });
});
