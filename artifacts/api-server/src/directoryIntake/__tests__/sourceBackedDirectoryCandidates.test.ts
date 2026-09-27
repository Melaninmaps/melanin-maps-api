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
});
