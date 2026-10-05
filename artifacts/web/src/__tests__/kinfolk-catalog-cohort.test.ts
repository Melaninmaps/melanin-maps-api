import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = () => readFileSync(
  fileURLToPath(new URL("../components/KinfolkCatalogCohort.tsx", import.meta.url)),
  "utf8",
);

describe("Kinfolk Catalog cohort admin view", () => {
  it("loads a searchable, paginated administrator-only cohort instead of copying directory listings", () => {
    const component = source();
    expect(component).toContain("/api/admin/kinfolk-catalog?");
    expect(component).toContain("Search name, city, or category");
    expect(component).toContain("pageSize: \"50\"");
    expect(component).toContain("Existing business");
  });

  it("states catalog isolation from public lifecycle and owner verification", () => {
    const component = source();
    expect(component).toContain("does not create a profile, change public listing status, or mark a business owner-verified");
    expect(component).toContain("Add an existing business from its Business Admin profile editor");
  });
});
