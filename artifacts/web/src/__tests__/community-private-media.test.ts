import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const media = readFileSync(fileURLToPath(new URL("../components/community/CommunityMedia.tsx", import.meta.url)), "utf8");
const community = readFileSync(fileURLToPath(new URL("../pages/community.tsx", import.meta.url)), "utf8");
const group = readFileSync(fileURLToPath(new URL("../pages/community-group.tsx", import.meta.url)), "utf8");

describe("secure Community private media clients", () => {
  it("renders only application-relative private media paths without external-link fallbacks", () => {
    expect(media).toContain("privateMedia?: boolean");
    expect(media).toContain("/^\\/api\\/community\\/posts\\/");
    expect(media).toContain("allowExternal={!privatePath}");
  });

  it("uploads restricted follower and Group media as private assets", () => {
    expect(community).toContain('"community_post_private"');
    expect(community).toContain("privateMediaAssetIds");
    expect(group).toContain("uploadGroupMedia");
    expect(group).toContain('purpose=community_post_private');
  });

  it("maps only server-issued private media descriptors into post rendering", () => {
    expect(community).toContain("normalizePrivateMedia");
    expect(group).toContain("normalizePrivateMedia");
    expect(community).toContain("privateMedia={item.privateMedia}");
  });
});
