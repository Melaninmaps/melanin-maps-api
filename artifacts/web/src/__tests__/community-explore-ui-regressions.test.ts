import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { classifyCommunityMedia, safeHttpUrl } from "../components/community/CommunityMedia";
import { exploreMapUrl, safeExploreDetailUrl } from "../features/explore/LocationFirstExplore";

const source = (relativePath: string) => readFileSync(
  fileURLToPath(new URL(relativePath, import.meta.url)),
  "utf8",
);

describe("Community and Explore UI regressions", () => {
  it("keeps Community conversation-first until a member explicitly changes presentation", () => {
    const community = source("../pages/community.tsx");

    expect(community).toContain('useState<CommunityFeedDisplay>("text_first")');
    expect(community).toContain('data-testid="community-feed-loading"');
    expect(community).toContain('data-testid="community-feed-empty"');
    expect(community).toContain('data-testid="community-my-groups-error"');
    expect(community).toContain('aria-label="Search community members"');
    expect(community).toContain('aria-pressed={feedMode === mode}');
  });

  it("never embeds or opens credentialed and non-HTTP Community attachments", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("https://member:secret@example.com/photo.jpg")).toBeNull();
    expect(classifyCommunityMedia("javascript:alert(1)")).toEqual({
      type: "provider-link",
      provider: "External media",
    });

    const media = source("../components/community/CommunityMedia.tsx");
    expect(media).toContain("Image preview unavailable");
    expect(media).toContain("Open on YouTube");
    expect(media).toContain("Attachment hidden by your video source preferences");
    expect(media).toContain('rel="noopener noreferrer"');
  });

  it("renders Explore states accessibly and accepts only internal discovery detail paths", () => {
    expect(safeExploreDetailUrl("/cultural-sites/123?from=explore")).toBe("/cultural-sites/123?from=explore");
    expect(safeExploreDetailUrl("//example.com/redirect")).toBeNull();
    expect(safeExploreDetailUrl("/\\example.com/redirect")).toBeNull();
    expect(safeExploreDetailUrl("https://example.com/redirect")).toBeNull();
    expect(safeExploreDetailUrl("javascript:alert(1)")).toBeNull();
    expect(exploreMapUrl({ city: "Philadelphia", stateCode: "PA" })).toBe("/map?area=Philadelphia%2C+PA");
    expect(exploreMapUrl({ city: null, stateCode: "PA" })).toBeNull();

    const activeExplore = source("../features/explore/LocationFirstExplore.tsx");
    expect(activeExplore).toContain('data-testid="explore-loading"');
    expect(activeExplore).toContain('data-testid="explore-error"');
    expect(activeExplore).toContain('testId="explore-empty-results"');
    expect(activeExplore).toContain('role="group" aria-label="Explore themes"');
    expect(activeExplore).toContain('data-testid="explore-map-handoff"');
    expect(activeExplore).toContain("View this area on the map");

    const directoryExplore = source("../pages/explore.tsx");
    expect(directoryExplore).toContain('data-testid="explore-directory-error"');
    expect(directoryExplore).toContain('data-testid="explore-directory-empty"');
    expect(directoryExplore).toContain('aria-label="View listings on map"');
    expect(directoryExplore).not.toContain('<Link href={`/businesses/${business.id}`} className="mt-auto">');
  });

  it("does not promise automatic owner publication or preferential ranking", () => {
    const owners = source("../pages/for-business-owners.tsx");
    expect(owners).toContain("Submission starts review; it does not publish a listing automatically.");
    expect(owners).toContain("evidence and eligibility checks");
    expect(owners).toContain("shown separately from ownership and evidence");
    expect(owners).not.toContain("business will appear on the platform");
    expect(owners).not.toContain("will find you first");
  });
});
