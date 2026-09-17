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
});
