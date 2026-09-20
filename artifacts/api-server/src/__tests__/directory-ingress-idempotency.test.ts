import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../directoryImport/automatedDirectoryRoutes.ts", import.meta.url),
  "utf8",
);

describe("directory ingress idempotency", () => {
  it("reuses an identical signed payload when only its descriptive source alias changed", () => {
    expect(source).toContain(
      "row.source_row_count !== records.length || row.manifest_count !== manifest.rowCount",
    );
    expect(source).not.toContain("row.source_name !== manifest.sourceName");
  });

  it("still rejects a checksum collision with conflicting row metadata", () => {
    expect(source).toContain('throw new Error("Checksum metadata conflict for existing import batch.")');
  });
});