import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("waitlist preview access", () => {
  it("keeps confirmation, referral, and sign-in paths while offering the public preview", () => {
    const waitlist = source("../pages/waitlist.tsx");
    const app = source("../App.tsx");

    expect(waitlist).toContain("You're on the list!");
    expect(waitlist).toContain("Copy Referral Link");
    expect(waitlist).toContain('href="/preview"');
    expect(waitlist).toContain("Explore the Preview");
    expect(waitlist).toContain('href="/login"');
    expect(app).toContain('path="/preview"');
    expect(app).toContain("component={Preview}");
  });
});
