import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseMediaUrls } from "../lib/mediaUrls";
import { normalizeExternalUrl } from "../lib/urlSafety";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Expo config plugin imports", () => {
  it("uses the supported config-plugins package in the iOS maps plugin", () => {
    const pluginSource = readFileSync(
      new URL("../plugins/withRnMapsPodfileFix.js", import.meta.url),
      "utf8",
    );

    expect(pluginSource).toContain('require("@expo/config-plugins")');
    expect(pluginSource).not.toContain('require("expo/config-plugins")');
  });
});

describe("community media URL normalization", () => {
  it("accepts direct arrays and historical JSON text", () => {
    expect(parseMediaUrls(["https://example.com/a.jpg"])).toEqual([
      "https://example.com/a.jpg",
    ]);
    expect(parseMediaUrls('[\"https://example.com/a.jpg\"]')).toEqual([
      "https://example.com/a.jpg",
    ]);
  });

  it("drops malformed payloads and non-string entries without throwing", () => {
    expect(parseMediaUrls("{bad json")).toBeUndefined();
    expect(parseMediaUrls({ url: "https://example.com/a.jpg" })).toBeUndefined();
    expect(parseMediaUrls([" ", 1, null, "https://example.com/a.jpg"])).toEqual([
      "https://example.com/a.jpg",
    ]);
  });
});

describe("external URL normalization", () => {
  it("allows absolute http URLs and upgrades bare domains to https", () => {
    expect(normalizeExternalUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
    expect(normalizeExternalUrl("example.com")).toBe("https://example.com/");
  });

  it("rejects unsafe and incomplete schemes", () => {
    expect(normalizeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeExternalUrl("mailto:test@example.com")).toBeNull();
    expect(normalizeExternalUrl(" ")).toBeNull();
  });
});

describe("review-first business submission governance", () => {
  it("routes List My Business to pending review with bearer auth and retained fields", () => {
    const listBusiness = source("../app/list-business.tsx");
    expect(listBusiness).toContain("/api/community/business-submissions");
    expect(listBusiness).toContain("Authorization: `Bearer ${token}`");
    expect(listBusiness).toContain('"Idempotency-Key": clientRequestId');
    expect(listBusiness).toContain("postalCode: form.zip");
    expect(listBusiness).toContain("socialProfiles:");
    expect(listBusiness).toContain("Your submission is in review");
    expect(listBusiness).toContain("Directory\", value: \"Not public");
    expect(listBusiness).not.toContain("`${apiBase}/api/businesses`");
    expect(listBusiness).not.toContain("You&apos;re on the Map!");
    expect(listBusiness).not.toContain("isBlackOwned: true");
  });

  it("submits nominations once with rationale, provenance, and no fake Cookie header", () => {
    const nomination = source("../app/nominate-business.tsx");
    expect(nomination).toContain("/api/community/business-submissions");
    expect(nomination).toContain('headers["Authorization"] = `Bearer ${token}`');
    expect(nomination).toContain("submitterNote: why.trim() || undefined");
    expect(nomination).toContain("providerPlaceId: selectedPlace.id");
    expect(nomination).toContain('locationSource: "mwm_directory"');
    expect(nomination).toContain("is pending review and is not public yet");
    expect(nomination).not.toContain('headers["Cookie"]');
    expect(nomination).not.toContain('method: "PATCH"');
    expect(nomination).not.toContain("/api/business-nominations");
  });

  it("keeps the Smart Search shortcut authenticated, idempotent, and demographic-neutral", () => {
    const smartSearch = source("../app/smart-search.tsx");
    expect(smartSearch).toContain("/api/community/business-submissions");
    expect(smartSearch).toContain("Authorization: `Bearer ${token}`");
    expect(smartSearch).toContain('"Idempotency-Key": nominationRequestId');
    expect(smartSearch).toContain('sourceChannel: "expo_smart_search_nomination"');
    expect(smartSearch).not.toContain("/api/business-nominations");
    expect(smartSearch).not.toContain("blackOwned: true");
  });

  it("keeps review status reachable after success and from Profile", () => {
    const status = source("../app/my-business-submissions.tsx");
    const profile = source("../app/(tabs)/profile.tsx");
    const listBusiness = source("../app/list-business.tsx");
    expect(status).toContain("/api/community/business-submissions/mine");
    expect(status).toContain("Authorization: `Bearer ${token}`");
    expect(status).toContain("Community-listed · Unclaimed · Not verified");
    expect(status).toContain("More information needed");
    expect(profile).toContain('route: "/my-business-submissions"');
    expect(listBusiness).toContain('router.replace("/my-business-submissions"');
  });
});
