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
    expect(parseMediaUrls('["https://example.com/a.jpg"]')).toEqual([
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

describe("community-fed business publication governance", () => {
  it("routes List My Business to automatic publication with bearer auth, precise location fields, and explicit ownership provenance", () => {
    const listBusiness = source("../app/list-business.tsx");
    expect(listBusiness).toContain("/api/community/business-submissions");
    expect(listBusiness).toContain("Authorization: `Bearer ${token}`");
    expect(listBusiness).toContain('"Idempotency-Key": clientRequestId');
    expect(listBusiness).toContain("postalCode: form.zip");
    expect(listBusiness).toContain("socialProfiles:");
    expect(listBusiness).toContain("communityReportedOwnership: form.communityReportedOwnership");
    expect(listBusiness).toContain("ownershipDesignations: form.ownershipDesignations");
    expect(listBusiness).toContain("Published immediately");
    expect(listBusiness).toContain("Searchable with a precise pin");
    expect(listBusiness).toContain("Non-minority-owned");
    expect(listBusiness).toContain("community-listed, unclaimed, and not verified");
    expect(listBusiness).toContain("We never use 0,0 or a city-center fallback");
    expect(listBusiness).not.toContain("`${apiBase}/api/businesses`");
    expect(listBusiness).not.toContain("isBlackOwned");
  });

  it("submits nominations once with rationale, provenance, and no fake Cookie header", () => {
    const nomination = source("../app/nominate-business.tsx");
    expect(nomination).toContain("/api/community/business-submissions");
    expect(nomination).toContain('headers["Authorization"] = `Bearer ${token}`');
    expect(nomination).toContain("submitterNote: why.trim() || undefined");
    expect(nomination).toContain("providerPlaceId: selectedPlace.id");
    expect(nomination).toContain('locationSource: "mwm_directory"');
    expect(nomination).toContain("communityReportedOwnership");
    expect(nomination).toContain("Non-minority-owned");
    expect(nomination).toContain("Can&apos;t find it? Add the complete business");
    expect(nomination).toContain("View Community Listing");
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
    expect(smartSearch).toContain("Add details for an immediate pin");
    expect(smartSearch).toContain('router.push("/list-business"');
    expect(smartSearch).toContain("Community/founder-listed · Unclaimed · Not verified");
    expect(smartSearch).toContain("Community-reported minority-owned · Not verified");
    expect(smartSearch).toContain("Community-reported non-minority-owned · Not verified");
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

describe("safety report incident-location contract", () => {
  it("submits Police/ICE as a governed subtype and never sends exact GPS", () => {
    const reportSource = source("../app/report-police.tsx");
    expect(reportSource).toContain('category: "police"');
    expect(reportSource).toContain("encounterType: form.encounterType");
    expect(reportSource).toContain("isAnonymous: true");
    expect(reportSource).not.toContain("category: form.encounterType");
    expect(reportSource).not.toContain("geo.streetNumber");
    expect(reportSource).not.toContain("geo.street");
    const payload = reportSource.slice(reportSource.indexOf("body: JSON.stringify"), reportSource.indexOf("if (!res.ok)"));
    expect(payload).not.toContain("latitude");
    expect(payload).not.toContain("longitude");
  });

  it("requests current location only after the member chooses the incident-location button", () => {
    const reportSource = source("../app/report-safety.tsx");
    expect(reportSource).toContain("handleUseCurrentLocation");
    expect(reportSource).toContain("Use current location for this incident");
    expect(reportSource).toContain('locationSource: "current_device"');
    expect(reportSource).not.toContain("Auto-detect city from GPS on mount");
    expect(reportSource).not.toContain("useEffect(() =>");
    expect(reportSource).not.toContain("place.streetNumber");
    expect(reportSource).not.toContain("place.street");
  });
});
