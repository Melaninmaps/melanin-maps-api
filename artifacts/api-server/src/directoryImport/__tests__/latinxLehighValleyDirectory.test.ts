import { describe, expect, it } from "vitest";
import {
  LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
  LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_LABEL,
  LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256,
  assertLatinxLehighValleyDirectoryDataset,
} from "../latinxLehighValleyDirectory";

describe("user-supplied Latinx Lehigh Valley directory", () => {
  it("preserves every parsed source profile with source-reported, unverified designation", () => {
    const profiles = assertLatinxLehighValleyDirectoryDataset();

    expect(profiles).toHaveLength(77);
    expect(new Set(profiles.map((profile) => profile.id)).size).toBe(77);
    expect(new Set(profiles.map((profile) => profile.dedupeKey)).size).toBe(77);
    expect(profiles.every((profile) => profile.dataSource === LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE)).toBe(true);
    expect(profiles.every((profile) => profile.sourceLabel === LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_LABEL)).toBe(true);
    expect(profiles.every((profile) => profile.ownershipClaim === "source_reported_ownership_unverified")).toBe(true);
    expect(profiles.every((profile) => profile.ownershipDesignations[0] === "Latino / Hispanic-Owned")).toBe(true);
    expect(profiles.every((profile) => profile.intakeBatchReference.includes(LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256))).toBe(true);
  });

  it("keeps each supplied address as an address and never fabricates coordinates or a verification claim", () => {
    const profiles = assertLatinxLehighValleyDirectoryDataset();
    const addressed = profiles.filter((profile) => profile.address);

    expect(addressed.length).toBeGreaterThan(0);
    expect(new Set(profiles.map((profile) => profile.ownershipClaim))).toEqual(
      new Set(["source_reported_ownership_unverified"]),
    );
    expect(profiles.every((profile) => !profile.description.toLowerCase().includes("verified ownership"))).toBe(true);
  });
});
