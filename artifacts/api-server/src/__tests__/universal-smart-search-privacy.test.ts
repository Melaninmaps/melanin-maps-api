import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isPrivacySafeSmartSearchRequest } from "../routes/universal-search";

describe("universal Smart Search privacy mode", () => {
  it("only recognizes the explicit allowlisted mobile mode", () => {
    expect(isPrivacySafeSmartSearchRequest({ surface: "smart_search", privacy_mode: "discovery_v1" })).toBe(true);
    expect(isPrivacySafeSmartSearchRequest({ surface: "smart_search" })).toBe(false);
    expect(isPrivacySafeSmartSearchRequest({ surface: "general", privacy_mode: "discovery_v1" })).toBe(false);
    expect(isPrivacySafeSmartSearchRequest({ surface: "smart_search", noLog: "true" })).toBe(false);
  });

  it("guards both raw-query tables and every zero-result path", () => {
    const source = readFileSync(new URL("../routes/universal-search.ts", import.meta.url), "utf8");
    const logCall = source.indexOf("void logSearchEvent({");
    const privacyGuard = source.lastIndexOf("if (!privacySafeSmartSearch)", logCall);
    expect(privacyGuard).toBeGreaterThan(-1);
    expect(source).toContain("!privacySafeSmartSearch && totalResults === 0");
    expect(source).toContain("INSERT INTO business_search_inquiries");
    // Library growth can retain canonical subjects too, so it is deliberately
    // excluded from the private Smart Search path.
    expect(source).toContain("if (!privacySafeSmartSearch && user?.id");
  });
});