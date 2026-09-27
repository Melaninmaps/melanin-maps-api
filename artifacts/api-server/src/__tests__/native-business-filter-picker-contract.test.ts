import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("native business filter picker", () => {
  const screen = source("../../../mobile/app/business-search.tsx");

  it("uses a compact optional category picker instead of a horizontal category strip", () => {
    expect(screen).toContain("const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)");
    expect(screen).toContain("<Modal visible={categoryPickerOpen}");
    expect(screen).toContain("Business category");
    expect(screen).toContain("All categories");
    expect(screen).toContain("Optional — leave this open to search every category.");
    expect(screen).not.toContain("contentContainerStyle={styles.categoryScroll}");
  });

  it("offers exact documented Black, Hispanic, and no-tag filters", () => {
    expect(screen).toContain("const OWNERSHIP_OPTIONS");
    expect(screen).toContain("Black / African American-Owned");
    expect(screen).toContain("Latino / Hispanic-Owned");
    expect(screen).toContain("No ownership tag");
    expect(screen).toContain('allParams.set("designations", searchOwnership)');
    expect(screen).toContain('allParams.set("ownership", "no_tag")');
    expect(screen).toContain("This filters only by labels recorded for a business. It does not infer identity.");
  });
});
