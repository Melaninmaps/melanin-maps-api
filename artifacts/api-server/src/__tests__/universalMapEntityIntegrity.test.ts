import { describe, expect, it } from "vitest";
import { ATLANTA_HBCU_SEED } from "../map/atlantaHbcuSeed";
import { UNIVERSAL_MAP_ENTITY_KINDS } from "../map/ensureUniversalMapEntities";
import { boundedMapEntityLimit } from "../map/registerUniversalMapEntityRoutes";

describe("universal map entity contract", () => {
  it("preserves the institution-backed Atlanta HBCU foundation", () => {
    expect(ATLANTA_HBCU_SEED).toHaveLength(6);
    expect(ATLANTA_HBCU_SEED.map((item) => item.title)).toEqual(expect.arrayContaining([
      "Clark Atlanta University",
      "Morehouse College",
      "Spelman College",
      "Morehouse School of Medicine",
      "Morris Brown College",
      "Interdenominational Theological Center",
    ]));
    for (const institution of ATLANTA_HBCU_SEED) {
      expect(institution.addressLine1).toBeTruthy();
      expect(institution.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it("keeps every allowed non-business kind on the canonical place path", () => {
    expect(UNIVERSAL_MAP_ENTITY_KINDS).toEqual([
      "cultural_site",
      "hbcu",
      "festival",
      "community_event",
      "market",
      "public_art",
      "heritage_marker",
      "travel_destination",
    ]);
    const detailUrl = "/places/a7b90b34-7ef1-4d84-b6c5-c7a53d78e55a/example-hbcu";
    expect(detailUrl).toMatch(/^\/places\/[0-9a-f-]+\//);
  });

  it("bounds universal map responses while allowing the complete destination cohort", () => {
    expect(boundedMapEntityLimit("600")).toBe(600);
    expect(boundedMapEntityLimit("0")).toBe(1);
    expect(boundedMapEntityLimit("5000")).toBe(1000);
    expect(boundedMapEntityLimit("not-a-number")).toBe(1000);
    expect(boundedMapEntityLimit(undefined)).toBe(1000);
  });
});
