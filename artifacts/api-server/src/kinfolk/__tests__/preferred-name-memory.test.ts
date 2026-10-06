import { describe, expect, it } from "vitest";
import {
  formatPreferredNameMemory,
  normalizePreferredName,
  parsePreferredNameMemory,
  PREFERRED_NAME_MEMORY_PURPOSE,
} from "../preferred-name-memory";

describe("explicit preferred-name memory", () => {
  it("accepts a member's chosen name without using account or profile data", () => {
    expect(normalizePreferredName("  J   Money  ")).toBe("J Money");
    expect(
      parsePreferredNameMemory({
        purpose: PREFERRED_NAME_MEMORY_PURPOSE,
        content: formatPreferredNameMemory("J Money"),
      }),
    ).toBe("J Money");
  });

  it("rejects malformed values and unrelated private-memory rows", () => {
    expect(normalizePreferredName("\n\t")).toBeNull();
    expect(normalizePreferredName("J Money <script>")).toBeNull();
    expect(
      parsePreferredNameMemory({
        purpose: "profile_context",
        content: "Preferred name: J Money",
      }),
    ).toBeNull();
  });
});
