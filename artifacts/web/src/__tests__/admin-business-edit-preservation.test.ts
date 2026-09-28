import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = () =>
  readFileSync(
    fileURLToPath(new URL("../components/AdminEditBusiness.tsx", import.meta.url)),
    "utf8",
  );

describe("admin business edit preservation", () => {
  it("keeps an older stored category visible rather than presenting an empty selector", () => {
    const editor = source();
    expect(editor).toContain("const hasLegacyCategory");
    expect(editor).toContain("(current category)");
    expect(editor).toContain('value={category}');
  });

  it("does not overwrite a retained category with an empty value and reports transport failures", () => {
    const editor = source();
    expect(editor).toContain("if (category.trim()) body.category = category.trim();");
    expect(editor).toContain("else if (biz?.category?.trim()) body.category = biz.category.trim();");
    expect(editor).toContain("Could not save this business. Check the connection and try again.");
  });
});
