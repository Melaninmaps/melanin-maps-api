import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(fileURLToPath(new URL("../app/(tabs)/index.tsx", import.meta.url)), "utf8");

function block(start: string, end: string): string {
  const from = homeSource.indexOf(start);
  const to = homeSource.indexOf(end, from + start.length);
  expect(from).toBeGreaterThan(-1);
  expect(to).toBeGreaterThan(from);
  return homeSource.slice(from, to);
}

describe("mobile Community Spotlights free-core journey", () => {
  it("fetches the existing Hidden Gems endpoint with available authentication and renders its unlocked gems", () => {
    const fetchEffect = block("const [spotlights, setSpotlights]", "  const [showPrefsSurvey");
    const spotlightSection = block("{/* Community Spotlights", "{/* Hero banner */}");

    expect(fetchEffect).toContain("fetch(`${base}/api/hidden-gems?limit=10`");
    expect(fetchEffect).toContain("headers: token ? { Authorization: `Bearer ${token}` } : {}");
    expect(fetchEffect).toContain("const data = await res.json() as { locked?: boolean; gems: typeof spotlights };");
    expect(fetchEffect).toContain("if (data.locked)");
    expect(fetchEffect).toContain("setGemsLocked(false);");
    expect(fetchEffect).toContain("setSpotlights(data.gems ?? []);");
    expect(spotlightSection).toContain("Community Spotlights");
    expect(spotlightSection).toContain("data={spotlights}");
    expect(spotlightSection).toContain('keyExtractor={(item) => `gem-${item.id}`}');
    expect(spotlightSection).toContain('pathname: "/business/[id]", params: { id: item.id }');
  });
});
