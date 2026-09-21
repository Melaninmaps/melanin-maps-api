import { describe, expect, it } from "vitest";
import { buildDesignationPredicateSql, legacyDesignationColumn, resolveDesignationScope } from "../designation-predicate-policy";

describe("shared Support Lens designation predicate policy", () => {
  it("keeps legacy columns narrowly allow-listed", () => {
    expect(legacyDesignationColumn("black-african-american")).toBe("black_owned");
    expect(legacyDesignationColumn("minority-general-legacy")).toBe("minority_claim");
    expect(legacyDesignationColumn("woman")).toBeNull();
  });

  it("builds documented predicates with the same legacy parity for every SQL surface", () => {
    const black = buildDesignationPredicateSql("black-african-american", "b.ownership_designations", 7);
    const minority = buildDesignationPredicateSql("minority-general-legacy", "b.ownership_designations", 8);
    const woman = buildDesignationPredicateSql("woman", "b.ownership_designations", 9);
    expect(black).toContain("b.black_owned = TRUE");
    expect(minority).toContain("b.ownership_claim = 'community_reported_minority_owned'");
    expect(woman).not.toContain("black_owned");
    expect(woman).not.toContain("ownership_claim");
    expect(black).toContain("$7::text[]");
    expect(minority).toContain("$8::text[]");
  });

  it("enforces explicit > all-businesses override > saved strict precedence", () => {
    const saved = ["black-african-american", "woman"];
    expect(resolveDesignationScope({ explicit: ["woman"], supportScope: "all_businesses", saved, savedMode: "strict_documented_designations" })).toEqual(["woman"]);
    expect(resolveDesignationScope({ explicit: [], supportScope: "all_businesses", saved, savedMode: "strict_documented_designations" })).toEqual([]);
    expect(resolveDesignationScope({ explicit: [], saved, savedMode: "strict_documented_designations" })).toEqual(saved);
  });
});