import { describe, expect, it } from "vitest";
import {
  applyPreferredNameAddress,
  buildPreferredNameRecallReply,
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

  it("adds the active exact address to an ordinary reply without duplicating it", () => {
    expect(applyPreferredNameAddress({
      name: "Kinfolk QA Nova 260",
      reply: "Start with one small task you can finish today.",
    })).toBe("Kinfolk QA Nova 260 — Start with one small task you can finish today.");
    expect(applyPreferredNameAddress({
      name: "Kinfolk QA Nova 260",
      reply: "Kinfolk QA Nova 260, start with one small task today.",
    })).toBe("Kinfolk QA Nova 260, start with one small task today.");
  });

  it("answers an explicit recall with only the saved preferred name", () => {
    expect(buildPreferredNameRecallReply({
      name: "MWM QA",
      includeWelcome: false,
    })).toBe("I'll call you MWM QA.");
    expect(buildPreferredNameRecallReply({
      name: "MWM QA",
      includeWelcome: true,
    })).toContain("Welcome, MWM QA");
    expect(buildPreferredNameRecallReply({
      name: "<script>",
      includeWelcome: false,
    })).toBeNull();
  });
});
