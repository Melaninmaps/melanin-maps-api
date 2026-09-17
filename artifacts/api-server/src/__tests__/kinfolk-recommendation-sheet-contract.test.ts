import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("Kinfolk recommendation sheet contract", () => {
  it("serializes only canonical public recommendation fields including address", () => {
    const governed = source("../kinfolk/governedBusinessRepository.ts");
    const route = source("../routes/kinfolk.ts");
    const enforcement = source("../kinfolk/four-purpose-enforcement.ts");
    expect(governed).toContain("b.address,");
    expect(governed).toContain("address: nullableText(row.address)");
    expect(route).toContain("address: business.address ?? undefined");
    expect(enforcement).toContain("address?: string | null");
  });

  it("renders a tap-through sheet with listing, directions, website, and phone controls", () => {
    const widget = source("../../../mobile/components/AIChatWidget.tsx");
    const sheet = source("../../../mobile/components/KinfolkBusinessRecommendationSheet.tsx");
    expect(widget).toContain("data.recommendations?.businesses");
    expect(widget).toContain("KinfolkBusinessRecommendationSheet");
    expect(widget).toContain('pathname: "/business/[id]"');
    expect(sheet).toContain("Directions");
    expect(sheet).toContain("Website");
    expect(sheet).toContain("View Business");
    expect(sheet).toContain("tel:${recommendation.phone}");
  });

  it("keeps the chat input above the keyboard and preserves conversation taps", () => {
    const widget = source("../../../mobile/components/AIChatWidget.tsx");
    expect(widget).toContain('behavior={Platform.OS === "ios" ? "padding" : "height"}');
    expect(widget).toContain("keyboardVerticalOffset={Platform.OS === \"ios\" ? insets.top : 0}");
    expect(widget).toContain('keyboardShouldPersistTaps="handled"');
    expect(widget).toContain("listRef.current?.scrollToEnd");
  });
});
