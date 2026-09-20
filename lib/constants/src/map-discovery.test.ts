import { describe, expect, it } from "vitest";
import {
  countMapDiscoveryFocuses,
  matchesMapDiscoveryFocus,
} from "./map-discovery";

const records = [
  { name: "Sister's Kitchen", category: "Restaurant", tags: ["brunch", "vegan"] },
  { name: "Amina Hair Studio", category: "Beauty & Personal Care", tags: ["natural hair"] },
  { name: "Northside Children's Museum", category: "Museum", tags: ["family", "youth"] },
  { name: "Neighborhood HVAC", category: "Home Repair", tags: ["heating"] },
] as const;

describe("map discovery grouping", () => {
  it("groups existing listing metadata without fabricating a recommendation", () => {
    expect(matchesMapDiscoveryFocus(records[0], "food")).toBe(true);
    expect(matchesMapDiscoveryFocus(records[1], "beauty")).toBe(true);
    expect(matchesMapDiscoveryFocus(records[2], "family")).toBe(true);
    expect(matchesMapDiscoveryFocus(records[2], "culture")).toBe(true);
    expect(matchesMapDiscoveryFocus(records[3], "everyday")).toBe(true);
  });

  it("only applies a grouping when the member actively chooses it", () => {
    expect(matchesMapDiscoveryFocus(records[0], "all")).toBe(true);
    expect(matchesMapDiscoveryFocus(records[0], "care")).toBe(false);
    expect(matchesMapDiscoveryFocus(records[1], "food")).toBe(false);
  });

  it("reports truthful overlapping category counts", () => {
    const counts = countMapDiscoveryFocuses(records);
    expect(counts.find((focus) => focus.id === "food")?.count).toBe(1);
    expect(counts.find((focus) => focus.id === "beauty")?.count).toBe(1);
    expect(counts.find((focus) => focus.id === "family")?.count).toBe(1);
    expect(counts.find((focus) => focus.id === "culture")?.count).toBe(1);
    expect(counts.find((focus) => focus.id === "everyday")?.count).toBe(1);
  });
});
