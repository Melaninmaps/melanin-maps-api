import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(fileURLToPath(new URL("../admin.ts", import.meta.url)), "utf8");

describe("Admin inventory profile snapshots", () => {
  it("returns the current editable profile values needed for audited enrichment planning", () => {
    const inventoryRoute = source.slice(
      source.indexOf('router.get("/admin/businesses"'),
      source.indexOf('router.patch("/admin/businesses/:id/archive"'),
    );
    expect(inventoryRoute).toContain("description, hours, tags, phone, website");
    expect(inventoryRoute).toContain("description: b.description");
    expect(inventoryRoute).toContain("hours: b.hours");
    expect(inventoryRoute).toContain("serviceTags: Array.isArray(b.tags) ? b.tags : []");
  });

  it("keeps the noncurrent cohort mutually exclusive from Kinfolk Current", () => {
    expect(source).toContain('intakeCohort === "non_kinfolk_current"');
    expect(source).toContain("NOT (${kinfolkCurrentPredicate})");
  });
});
