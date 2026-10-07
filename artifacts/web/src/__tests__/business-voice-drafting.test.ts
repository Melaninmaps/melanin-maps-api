import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(
    new URL(
      "../features/businesses/BusinessVoiceProfileEditor.tsx",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("Business Voice editable drafting presentation", () => {
  it("requires a direct request and keeps the result editable and review-only", () => {
    expect(source).toContain("/kinfolk-drafts");
    expect(source).toContain("ownerRequested: true");
    expect(source).toContain("Prepare editable draft");
    expect(source).toContain("Editable draft — owner review required");
    expect(source).toContain("value={editableDraft}");
  });

  it("states that drafting never posts, sends, replies, or changes a business record", () => {
    expect(source).toContain("never posts, sends, replies, or changes your business record");
    expect(source).not.toContain("window.open(");
  });
});
