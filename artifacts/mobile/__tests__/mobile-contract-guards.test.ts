import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseMediaUrls } from "../lib/mediaUrls";
import { normalizeExternalUrl } from "../lib/urlSafety";
import { parseSafeSourceLink } from "../lib/sourceLinks";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("Expo config plugin imports", () => {
  it("uses the supported config-plugins package in the iOS maps plugin", () => {
    const pluginSource = readFileSync(
      new URL("../plugins/withRnMapsPodfileFix.js", import.meta.url),
      "utf8",
    );

    expect(pluginSource).toContain('require("expo/config-plugins")');
    expect(pluginSource).not.toContain('require("@expo/config-plugins")');
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
    // Autocomplete results carry provider provenance; do not relabel them as MWM directory rows.
    expect(nomination).toContain('locationSource: "google_places"');
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
    expect(smartSearch).toContain("Unclaimed · Not verified");
    expect(smartSearch).toContain("Community-reported minority-owned · Not verified");
    expect(smartSearch).toContain("Community-reported non-minority-owned · Not verified");
    expect(smartSearch).not.toContain("/api/business-nominations");
    expect(smartSearch).not.toContain("blackOwned: true");
  });

  it("keeps review status reachable after success and from Settings", () => {
    const status = source("../app/my-business-submissions.tsx");
    const settings = source("../app/settings.tsx");
    const listBusiness = source("../app/list-business.tsx");
    expect(status).toContain("/api/community/business-submissions/mine");
    expect(status).toContain("Authorization: `Bearer ${token}`");
    expect(status).toContain("Community-listed · Unclaimed · Not verified");
    expect(status).toContain("More information needed");
    expect(settings).toContain('route: "/my-business-submissions"');
    expect(listBusiness).toContain('router.replace("/my-business-submissions"');
  });

  it("keeps member-owned and community-recommended business journeys distinct", () => {
    const listBusiness = source("../app/list-business.tsx");
    const profile = source("../app/(tabs)/profile.tsx");
    const settings = source("../app/settings.tsx");

    expect(listBusiness).toContain('const isOwnerIntent = intent === "owner"');
    expect(listBusiness).toContain('submissionIntent: isOwnerIntent ? "owner" : "community"');
    expect(listBusiness).toContain('ownerAttestation: form.ownerAttestation');
    expect(listBusiness).toContain('This is a community recommendation. It will not be connected to your profile as an owner.');
    expect(listBusiness).toContain('This creates a business page tied to your profile.');
    expect(listBusiness).toContain('Your claim is reviewed separately from the public listing and does not create a verification badge.');
    expect(profile).toContain('params: { intent: "owner" }');
    expect(settings).toContain('label: "Add My Business"');
    expect(settings).toContain('label: "Share Another Business"');
  });

  it("uses the canonical protected claim endpoint and never equates a claim with verification", () => {
    const claimModal = source("../components/ClaimBusinessModal.tsx");
    const businessDetail = source("../app/business/[id].tsx");

    expect(claimModal).toContain('from "@/lib/api"');
    expect(claimModal).toContain('/api/businesses/${businessId}/claims');
    expect(claimModal).toContain('getMemberApiHeaders()');
    expect(claimModal).toContain('businessEmail: email.trim()');
    expect(claimModal).toContain('verificationMethod');
    expect(claimModal).toContain('attestation: true');
    expect(claimModal).not.toContain('/api/businesses/${businessId}/claim`');
    expect(claimModal).toContain('does not verify this business or its ownership designations');
    expect(businessDetail).toContain('ownership and verification are reviewed separately');
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

describe("Kinfolk verified-radius contract", () => {
  it("sends a public origin only for the current turn and clears it from the mobile composer", () => {
    const travel = source("../app/travel.tsx");
    const hook = source("../hooks/useKinfolk.ts");

    expect(travel).toContain("Exact-radius origin (public place only)");
    expect(travel).toContain("setExactRadiusOrigin(\"\")");
    expect(travel).toContain("not saved to Kinfolk memory or your profile");
    expect(hook).toContain("publicOrigin: opts?.publicOrigin?.trim() || undefined");
    expect(hook).not.toContain("rememberThis: opts?.publicOrigin");
  });
});

describe("Build 106 protected-read and Kinfolk response contracts", () => {
  it("authenticates nearby safety reads and never substitutes fabricated all-clear alerts", () => {
    const activityAlerts = source("../hooks/useActivityAlerts.ts");
    const alerts = source("../hooks/useAlerts.ts");
    const safetyHub = source("../app/(tabs)/safety-hub.tsx");
    const home = source("../app/(tabs)/index.tsx");

    expect(activityAlerts).toContain("Authorization: `Bearer ${token}`");
    expect(activityAlerts).toContain("setError(cause instanceof Error");
    expect(alerts).toContain("Authorization: `Bearer ${token}`");
    expect(alerts).not.toContain('import { ALERTS } from "@/constants/data"');
    // Discovery no longer renders safety status. Its absence is safer than a
    // fabricated all-clear state; Safety Hub owns the protected read below.
    expect(home).not.toContain('import { ALERTS } from "@/constants/data"');
    expect(home).not.toContain('useAlerts("GA")');
    expect(safetyHub).toContain("Authorization: `Bearer ${token}`");
    expect(safetyHub).toContain("Could not verify nearby conditions");
    expect(safetyHub).toContain("!intelLoading && !intelError && intelChecked && intelAlerts.length === 0");
    expect(safetyHub).toContain("!intelLoading && !intelError && !intelChecked");
    expect(safetyHub).toContain("if (!token) throw new Error");
    expect(safetyHub).toContain("setProtectedDataError");
    expect(safetyHub).toContain("Protected safety records unavailable");
    const protectedLoader = safetyHub.slice(
      safetyHub.indexOf("const fetchData = useCallback"),
      safetyHub.indexOf("const moveWidget"),
    );
    expect(protectedLoader).not.toContain("token ? { Authorization");
  });

  it("carries safe sources and evidence-focused Library actions through the alternate Kinfolk widget", () => {
    const widget = source("../components/AIChatWidget.tsx");
    expect(parseSafeSourceLink({ title: "Source", url: "https://example.com/report" })).toEqual({
      title: "Source",
      url: "https://example.com/report",
    });
    expect(parseSafeSourceLink({ title: "Source", url: "https://user@example.com/report" })).toBeNull();
    expect(parseSafeSourceLink({ title: "Source", url: "https://user:secret@example.com/report" })).toBeNull();
    expect(parseSafeSourceLink({ title: "Source", url: "http://example.com/report" })).toBeNull();
    expect(parseSafeSourceLink({ title: "Source", url: "https://localhost/report" })).toBeNull();
    expect(parseSafeSourceLink({ title: "Source", url: "https://service.internal/report" })).toBeNull();
    expect(parseSafeSourceLink({ title: "Source", url: "https://127.0.0.1/report" })).toBeNull();
    expect(parseSafeSourceLink({ title: "Source", url: "https://[::1]/report" })).toBeNull();
    expect(widget).toContain("parseSafeSourceLink(source)");
    expect(widget).toContain('accessibilityRole="link"');
    expect(widget).toContain('pathname: "/library-topic"');
    expect(widget).toContain('focus: "evidence"');
  });

  it("uploads native Kinfolk voice as bounded multipart audio with duration metadata", () => {
    const widget = source("../components/AIChatWidget.tsx");
    const voiceUpload = source("../lib/kinfolkVoiceUpload.ts");
    expect(widget).toContain("prepareKinfolkVoiceUpload(uri, Platform.OS)");
    expect(widget).toContain('form.append("audio", voiceUpload.body, voiceUpload.filename)');
    expect(widget).toContain('form.append("durationMs", String(durationMs))');
    expect(widget).toContain('form.append("mimeType", voiceUpload.mimeType)');
    expect(widget).toContain("voiceUpload?.cleanup()");
    expect(widget).toContain("setInput(preservedDraft)");
    expect(voiceUpload).toContain('new Blob([recordingFile], { type: plan.mimeType })');
    expect(voiceUpload).toContain("readBytes(12)");
    expect(widget).toContain("if (errBody.message) serverMessage = errBody.message");
    expect(widget).not.toContain('"Content-Type": "multipart/form-data"');
  });

  it("uses the configured API host for native business, profile, reference, and preview requests", () => {
    for (const relativePath of [
      "../app/business/[id].tsx",
      "../app/(tabs)/index.tsx",
      "../app/(tabs)/profile.tsx",
      "../app/(tabs)/safety-hub.tsx",
      "../app/community-reference.tsx",
      "../app/preview.tsx",
      "../components/AIChatWidget.tsx",
    ]) {
      const route = source(relativePath);
      expect(route).toContain('from "@/lib/api"');
      expect(route).not.toMatch(/fetch\((?:`|"|')\/api\//);
      expect(route).not.toContain("EXPO_PUBLIC_DOMAIN");
      expect(route).not.toMatch(/function getApiBase|const getApiBase/);
    }
  });
});
