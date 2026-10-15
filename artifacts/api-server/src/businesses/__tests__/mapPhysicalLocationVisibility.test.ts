import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("../../routes/businesses.ts", import.meta.url)),
  "utf8",
);

describe("public map physical-location visibility", () => {
  it("does not make ZIP a map-return condition while excluding explicitly nonphysical locations", () => {
    expect(source).toContain("MAP_PHYSICAL_LOCATION_SQL");
    expect(source).toContain("service_area");
    expect(source).toContain("public_location_kind");
    expect(source).toContain("'online_only'");
    expect(source).toContain("'service_area'");
    expect(source).toContain("'private_residence'");
    expect(source).toContain("'home_based'");
    expect(source).toContain("'storefront'");
    expect(source).toContain("'customer_facing'");
    expect(source).toContain("FROM public.public_businesses AS public_businesses");
    expect(source).toContain("to_jsonb(public_businesses)");
    expect(source).not.toContain("to_jsonb(public.public_businesses)");
    expect(source).not.toMatch(/map-pins[\s\S]{0,800}postal_code/i);
  });

  it("uses the canonical eligible public collection for both map counts and preview records", () => {
    // The shared public view excludes hidden, duplicate, archived/delete-review,
    // and otherwise non-public records before clustering can count a marker.
    expect(source).toContain("FROM public.public_businesses AS public_businesses");
    expect(source).toContain('documentedDiscoveryEligibilitySqlPredicate("public_businesses.id", "map")');
    expect(source).toContain("COALESCE(name, '') NOT ILIKE '%[demo]%'");
    expect(source).toContain("COALESCE(description, '') NOT ILIKE '%[demo]%'");
    expect(source).toContain("website, instagram, facebook, tiktok, listing_status");
  });
});
