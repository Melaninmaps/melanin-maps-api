import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("web visitor profile social activity", () => {
  const profile = source("../pages/member-profile.tsx");

  it("renders separate server-authorized posts, media, and tagged activity", () => {
    expect(profile).toContain("taggedUserId=${encodeURIComponent(userId)}");
    expect(profile).toContain('type ProfileTab = "posts" | "media" | "tagged" | "reviews" | "notes"');
    expect(profile).toContain("<CommunityMedia");
    expect(profile).toContain('setActiveTab("tagged")');
    expect(profile).toContain("No visible tagged Community activity yet.");
  });

  it("keeps direct actions inside current authorization boundaries", () => {
    expect(profile).toContain("data?.canReceiveDirectMessages");
    expect(profile).toContain("async function reportMember");
    expect(profile).toContain("async function blockMember");
    expect(profile).toContain("api/users/${encodeURIComponent(profile.id)}/block");
    expect(profile).toContain("data?.canSeeContent && typeof data?.followersCount");
  });
});
