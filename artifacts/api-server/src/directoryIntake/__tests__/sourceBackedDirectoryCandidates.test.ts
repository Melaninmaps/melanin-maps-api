import { describe, expect, it } from "vitest";
import { sourceBackedDirectoryCandidates } from "../sourceBackedDirectoryCandidates";
import { minneapolisSourceBackedDirectoryCandidates } from "../minneapolisSourceBackedDirectoryCandidates";
import { mnblackStatewideSourceBackedDirectoryCandidates } from "../mnblackStatewideSourceBackedDirectoryCandidates";

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

  it("retains the complete Minneapolis proof cohort with searchable source details", () => {
    expect(minneapolisSourceBackedDirectoryCandidates).toHaveLength(129);
    expect(minneapolisSourceBackedDirectoryCandidates.every((candidate) => (
      candidate.city === "Minneapolis"
      && candidate.state === "MN"
      && candidate.batch === "mn_black_business_directory_minneapolis_2026_09_28"
      && candidate.ownershipDesignations.includes("Black / African American-Owned")
      && candidate.sourceListingUrl?.startsWith("https://mnblackbusiness.com/businesses/")
    ))).toBe(true);
    expect(minneapolisSourceBackedDirectoryCandidates.filter((candidate) => (
      candidate.sourceDescription?.trim().length
    ))).toHaveLength(123);
    expect(minneapolisSourceBackedDirectoryCandidates.some((candidate) => candidate.socialLinks?.instagram)).toBe(true);
    expect(minneapolisSourceBackedDirectoryCandidates.some((candidate) => !candidate.address && candidate.officialUrl)).toBe(true);
    expect(minneapolisSourceBackedDirectoryCandidates.filter((candidate) => (
      Boolean(candidate.officialUrl || candidate.socialLinks)
    ))).toHaveLength(127);
    expect(minneapolisSourceBackedDirectoryCandidates.filter((candidate) => (
      !candidate.officialUrl && !candidate.socialLinks
    ))).toHaveLength(2);
  });

  it("keeps the complete statewide Minnesota receipt separate from the Minneapolis proof batch", () => {
    expect(mnblackStatewideSourceBackedDirectoryCandidates).toHaveLength(357);
    expect(mnblackStatewideSourceBackedDirectoryCandidates.every((candidate) => (
      candidate.state === "MN"
      && candidate.batch === "mn_black_business_directory_statewide_2026_09_28"
      && candidate.ownershipDesignations.includes("Black / African American-Owned")
      && candidate.sourceListingUrl?.startsWith("https://mnblackbusiness.com/businesses/")
    ))).toBe(true);
    expect(mnblackStatewideSourceBackedDirectoryCandidates.filter((candidate) => (
      Boolean(candidate.officialUrl || candidate.socialLinks)
    ))).toHaveLength(339);
    expect(mnblackStatewideSourceBackedDirectoryCandidates.filter((candidate) => (
      !candidate.officialUrl && !candidate.socialLinks
    ))).toHaveLength(18);
  });
});
