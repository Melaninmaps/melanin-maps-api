import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const manager = readFileSync(`${root}artifacts/web/src/components/kinfolk/KinfolkInterestIntelligenceManager.tsx`, "utf8");
const feed = readFileSync(`${root}artifacts/web/src/components/kinfolk/KinfolkInterestDiscoveryFeed.tsx`, "utf8");
const settings = readFileSync(`${root}artifacts/web/src/components/kinfolk/KinfolkExperienceSettings.tsx`, "utf8");

describe("web Kinfolk interest intelligence", () => {
  it("provides consented, reviewable controls in existing Kinfolk settings", () => {
    expect(manager).toContain("Recognize repeated topics");
    expect(manager).toContain("Show proactive discoveries");
    expect(manager).toContain("never stores chat or search text");
    expect(manager).toContain("health, family/caregiving");
    expect(manager).toContain("Add and confirm");
    expect(settings).toContain("KinfolkInterestIntelligenceManager");
    expect(settings).toContain("KinfolkInterestDiscoveryFeed");
  });

  it("keeps sharing and removal explicit", () => {
    expect(manager).toContain("Share with Circle");
    expect(manager).toContain("Only this interest is shared");
    expect(manager).toContain("Remove “${interest.label}” and every Circle share of it?");
    expect(manager).toContain('request(`/interests/${interest.id}`, "DELETE")');
    expect(feed).toContain("never raw chat or search text");
    expect(feed).toContain("Not interested");
    expect(feed).toContain("api/saved-places");
  });
});
