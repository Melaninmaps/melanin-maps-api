import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const sheet = source("../components/KinfolkLifelongCompanionSheet.tsx");
const primary = source("../app/travel.tsx");
const widget = source("../components/AIChatWidget.tsx");

const requiredCopy = [
  "Kinfolk is your lifelong cultural companion.",
  "Who do you hope to become?",
  "Mapping With Melanin™ doesn't ask people to prove where they come from. It gives them opportunities to discover where others come from — and, if they choose, reconnect with parts of their own story.",
  "Your story is still unfolding.",
  "Kinfolk will never rush your journey. It will simply remember where you left off, celebrate what you've discovered, and be ready whenever you're curious to take the next step.",
];

describe("Kinfolk lifelong companion identity", () => {
  it("keeps the founder-required identity and promise copy verbatim in one read-only native surface", () => {
    for (const text of requiredCopy) expect(sheet).toContain(text);
    expect(sheet).toContain('testID="kinfolk-lifelong-companion-sheet"');
    expect(sheet).toContain("accessibilityViewIsModal");
    expect(sheet).not.toMatch(/fetch\(|SecureStore|AsyncStorage|progress|streak|achievement/iu);
  });

  it("makes the full promise reachable from both primary and floating Kinfolk", () => {
    for (const surface of [primary, widget]) {
      expect(surface).toContain("KinfolkLifelongCompanionSheet");
      expect(surface).toContain("setShowCompanionIdentity(true)");
      expect(surface).toContain('accessibilityLabel="Learn about Kinfolk as a lifelong cultural companion"');
    }
  });
});
