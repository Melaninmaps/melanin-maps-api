import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const loginSource = readFileSync(resolve(here, "../app/login.tsx"), "utf8");

describe("mobile phone login removal contract", () => {
  it("does not expose the unfinished phone-code login path from the login screen", () => {
    expect(loginSource).not.toContain('router.push("/phone-login"');
    expect(loginSource).not.toContain("Continue with Phone");
  });

  it("keeps password recovery available when an account needs an email password", () => {
    expect(loginSource).toContain('router.push("/forgot-password" as any)');
    expect(loginSource).toContain("Set Up Email Password");
  });
});
