import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
const editor = source("../features/businesses/BusinessCulturalTeachingEditor.tsx");
const card = source("../features/businesses/BusinessCulturalTeachingCard.tsx");
const dashboard = source("../pages/business-dashboard.tsx");
const detail = source("../pages/business-detail.tsx");

describe("web business cultural teaching surfaces", () => {
  it("mounts the owner editor and uses only the creator owner endpoints with direct confirmation", () => {
    expect(dashboard).toContain("BusinessCulturalTeachingEditor");
    expect(editor).toContain("/cultural-teaching/owner");
    expect(editor).toContain('method: "PUT"');
    expect(editor).toContain('method: "DELETE"');
    expect(editor).toContain("ownerConfirmed: true");
    expect(editor).toContain("type=\"checkbox\"");
    expect(editor).toContain("Withdraw teaching");
    expect(editor).toContain("never a culture label, rating, or automatic member prompt");
    expect(editor).not.toMatch(/\/kinfolk|posthog|analytics|draft/i);
    expect(editor).not.toMatch(/\b(?:ai|model|provider|notification)\b|window\.open|href=/i);
  });

  it("mounts an opt-in detail-only card whose Not now choice has no network write or visible unavailable state", () => {
    expect(detail).toContain("BusinessCulturalTeachingCard");
    expect(card).toContain("Read optional teaching");
    expect(card).toContain("Not now");
    expect(card).toContain('cache: "no-store"');
    expect(card).toContain("/cultural-teaching");
    expect(card).toContain("if (!isAuthenticated || !checked || !teaching || notNow) return null");
    expect(card).toContain("setNotNow(true)");
    expect(card).not.toMatch(/method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/);
    expect(card).not.toMatch(/localStorage|sessionStorage|posthog|analytics|\/kinfolk|chat/i);
    expect(card).not.toMatch(/\b(?:ai|model|provider|notification)\b|window\.open|href=/i);
    expect(card).not.toContain("Teaching unavailable");
  });
});
