import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const mobileRoot = resolve(__dirname, "..");
const ownerHome = readFileSync(
  resolve(mobileRoot, "app/business-owner/index.tsx"),
  "utf8",
);
const dashboard = readFileSync(
  resolve(mobileRoot, "app/business-dashboard.tsx"),
  "utf8",
);

describe("business dashboard selected context", () => {
  it("uses the managed-list response to validate a requested ID and never falls back to index zero for an invalid selection", () => {
    expect(dashboard).toContain("useMyBusiness(requestedBusinessId)");
    expect(dashboard).toContain(
      "managedBusinesses.find((candidate) => candidate.id === requestedBusinessId)",
    );
    expect(dashboard).toContain("managedBusinesses.length === 1");
    expect(dashboard).toContain(
      "A supplied stale/invalid selection never falls back to index zero.",
    );
    expect(dashboard).toContain(
      "setRequiresManagedBusinessSelection(Boolean(requestedBusinessId) || managedBusinesses.length > 1)",
    );
  });

  it("builds selected managed endpoint calls only after validation and removes the listed ambiguous legacy calls", () => {
    const selectedEndpoints = [
      "/analytics",
      "/skip-feedback",
      "/post-nudge",
      "/post-nudge/captions",
      "/post-nudge/notify",
      "/feedback-opt-in",
      "/growth-tools",
    ];
    for (const suffix of selectedEndpoints) {
      expect(dashboard).toContain(
        `mine/managed/${"${encodeURIComponent("}selectedBusinessId)}/${suffix.slice(1)}`,
      );
    }
    for (const legacy of [
      "/api/businesses/mine/analytics",
      "/api/businesses/mine/skip-feedback",
      "/api/businesses/mine/post-nudge",
      "/api/businesses/mine/feedback-opt-in",
      "/api/businesses/mine/growth-tools",
    ]) {
      expect(ownerHome.includes(legacy) || dashboard.includes(legacy)).toBe(
        false,
      );
    }
  });

  it("forwards only a validated one-business context into dashboard, identity, and broadcast flows", () => {
    expect(ownerHome).toContain("if (data.businesses.length !== 1) return;");
    expect(ownerHome).toContain(
      'pathname: "/business-dashboard", params: { businessId: business.id }',
    );
    expect(ownerHome).toContain(
      'pathname: "/business-owner/identity", params: { businessId: business.id }',
    );
    expect(ownerHome).toContain(
      'pathname: "/business-owner/broadcasts", params: { businessId: business.id }',
    );
    expect(ownerHome).toContain(
      'pathname: "/business-owner/vibe-tags", params: { businessId: business.id }',
    );
    expect(ownerHome).toContain(
      'pathname: "/business-owner/preview", params: { businessId: business.id }',
    );
    expect(ownerHome).not.toContain('route: "/business-dashboard"');
  });

  it("routes every listed or selected business public-profile action to that exact ID", () => {
    expect(ownerHome).toContain(
      "router.push(`/businesses/${encodeURIComponent(managedBusiness.id)}` as never)",
    );
    expect(ownerHome).toContain(
      "router.push(`/businesses/${encodeURIComponent(business.id)}` as never)",
    );
    expect(dashboard).toContain(
      "router.push(`/businesses/${encodeURIComponent(business.id)}` as never)",
    );
    expect(ownerHome).toContain("if (data.businesses.length !== 1) return;");
    expect(dashboard).toContain(
      "managedBusinesses.find((candidate) => candidate.id === requestedBusinessId)",
    );
    expect(ownerHome).not.toContain("router.push(`/business/${businesses[0]");
  });

  it("preserves the selected ID through the authorized profile-edit and refreshed managed-list flow", () => {
    expect(ownerHome).toContain(
      'pathname: "/business-owner/edit-profile", params: { businessId: managedBusiness.id }',
    );
    expect(dashboard).toContain("useMyBusiness(requestedBusinessId)");
    expect(dashboard).toContain("requestGenerationRef");
    expect(dashboard).toContain("candidate.id === requestedBusinessId");
  });

  it("fences selection changes and does not report notification success from a failed or stale request", () => {
    expect(ownerHome).toContain("loadGenerationRef");
    expect(dashboard).toContain("requestGenerationRef");
    expect(dashboard).toContain("activeBusinessIdRef");
    expect(dashboard).toContain(
      "response.ok && activeBusinessIdRef.current === selectedBusinessId",
    );
    expect(dashboard).toContain("disabled={nudgeNotifyLoading}");
    expect(dashboard).toContain("setNudgeNotifyLoading(true)");
  });
});
