import { describe, expect, it } from "vitest";
import { sourceBackedDirectoryCandidates } from "../sourceBackedDirectoryCandidates";

describe("source-backed directory candidate manifest", () => {
  it("preserves the complete community-sourced Philadelphia Black restaurant sheet", () => {
    const phillyCommunityRows = sourceBackedDirectoryCandidates.filter(
      (candidate) => candidate.batch === "philadelphia_community_black_restaurants_2026_09_27",
    );
    expect(phillyCommunityRows).toHaveLength(209);
    expect(phillyCommunityRows.every((candidate) =>
      candidate.ownershipDesignations.includes("Black / African American-Owned"),
    )).toBe(true);
    expect(phillyCommunityRows.some((candidate) => !candidate.address)).toBe(true);
  });

  it("keeps every candidate independently retry-safe with a source receipt key", () => {
    const keys = sourceBackedDirectoryCandidates.map((candidate) => candidate.sourceRecordKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every((key) => key.startsWith("source-receipt:"))).toBe(true);
  });

  it("retains the complete source-receipted 45-city founder cohort for protected reconciliation", () => {
    const founderCityRows = sourceBackedDirectoryCandidates.filter(
      (candidate) => candidate.batch === "founder_city_directories_2026_09_27",
    );
    expect(founderCityRows).toHaveLength(11_082);
    expect(new Set(founderCityRows.map((candidate) => `${candidate.city}|${candidate.state}`)).size).toBeGreaterThanOrEqual(45);
    expect(founderCityRows.every((candidate) => candidate.sourceUrl.startsWith("http"))).toBe(true);
    expect(founderCityRows.every((candidate) => candidate.sourceLabel.trim().length > 0)).toBe(true);
  });
});
