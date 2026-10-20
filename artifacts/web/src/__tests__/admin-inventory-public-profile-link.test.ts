import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = () => readFileSync(
  fileURLToPath(new URL("../pages/admin.tsx", import.meta.url)),
  "utf8",
);

describe("Admin inventory canonical public-profile links", () => {
  it("uses the repository's semantic internal link form for an available inventory record", () => {
    const admin = source();

    expect(admin).toContain('import { Link, Redirect } from "wouter"');
    expect(admin).toContain("canOpenPublicBusinessProfile(biz) ?");
    expect(admin).toContain("<Link");
    expect(admin).toContain('href={`/businesses/${encodeURIComponent(biz.id)}`}');
    expect(admin).toContain('aria-label={`Open ${biz.name} public profile`}');
  });

  it("keeps the displayed name and canonical-profile action non-link controls for unavailable records", () => {
    const admin = source();

    expect(admin).toContain('business.listingStatus === "live_unclaimed"');
    expect(admin).toContain('business.listingStatus === "live_claimed"');
    expect(admin).toContain("!business.isDuplicate");
    expect(admin).toContain("!business.permanentlyClosed");
    expect(admin).toContain("business.id.trim().length > 0");
    expect(admin).toContain("Public profile unavailable");
  });

  it("keeps the separate Edit profile action unchanged", () => {
    const admin = source();

    expect(admin).toContain("setEditingBiz({ id: biz.id, name: biz.name });");
    expect(admin).toContain(">\n                                  Edit profile\n                                </button>");
  });
});
