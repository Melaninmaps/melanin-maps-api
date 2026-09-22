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

  it("keeps email recovery and adds verified-phone recovery rather than phone login", () => {
    expect(mobileRecovery).toContain('useState<"email" | "phone">("email")');
    expect(mobileRecovery).toContain('"/api/auth/phone/forgot-password/send"');
    expect(mobileRecovery).toContain('"/api/auth/phone/reset-password"');
    expect(mobileRecovery).toContain("Verified Phone Number");
  });
});
