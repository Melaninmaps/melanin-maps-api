import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const colors = readFileSync(new URL("../constants/colors.ts", import.meta.url), "utf8");
const travel = readFileSync(new URL("../app/travel.tsx", import.meta.url), "utf8");
const sensitiveMemoryConfirmation = readFileSync(
  new URL("../components/KinfolkSensitiveMemoryConfirmation.tsx", import.meta.url),
  "utf8",
);

function themeToken(theme: "light" | "dark", token: "primary" | "primaryForeground"): string {
  const start = colors.indexOf(`  ${theme}: {`);
  const end = colors.indexOf("  },", start);
  const match = colors.slice(start, end).match(new RegExp(`${token}: "(#[0-9A-F]{6})"`));
  if (!match) throw new Error(`Missing ${theme}.${token} color token`);
  return match[1];
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Kinfolk primary foreground contracts", () => {
  it("keeps the light token and gives dark primary actions WCAG AA contrast", () => {
    expect(themeToken("light", "primaryForeground")).toBe("#FFFFFF");
    expect(contrastRatio(themeToken("dark", "primary"), themeToken("dark", "primaryForeground"))).toBeGreaterThanOrEqual(4.5);
  });

  it("renders semantic primary foregrounds for active travel controls", () => {
    expect(travel).toContain('backgroundColor: colors.primary');
    expect(travel).toContain('color={colors.primaryForeground}');
    expect(travel).toContain('color: colors.primaryForeground');
    expect(travel).toContain('sel ? colors.primaryForeground : colors.text');
    expect(travel).toContain('continuityEnabled ? colors.primary : colors.primaryForeground');
    expect(travel).toContain('color={voiceOutput ? colors.primaryForeground : colors.mutedForeground}');
    expect(travel).toContain('generatingImage ? <ActivityIndicator size="small" color={colors.primaryForeground}');
    expect(travel).not.toContain('sel ? "#fff" : colors.text');
  });

  it("uses the semantic primary foreground without changing sensitive-memory consent semantics", () => {
    expect(sensitiveMemoryConfirmation).toContain('backgroundColor: colors.primary');
    expect(sensitiveMemoryConfirmation).toContain('color: colors.primaryForeground');
    expect(sensitiveMemoryConfirmation).toContain(
      'body: JSON.stringify({ consent: true, sensitiveConsent: true, sensitiveRestricted: false, content, purpose, sessionId: sessionId ?? undefined })',
    );
    expect(sensitiveMemoryConfirmation).toContain("This choice keeps the detail private");
  });
});
