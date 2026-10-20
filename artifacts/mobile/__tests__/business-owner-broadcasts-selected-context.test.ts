import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const broadcastsScreen = readFileSync(
  new URL("../app/business-owner/broadcasts.tsx", import.meta.url),
  "utf8",
);

describe("native selected managed-business Broadcasts context", () => {
  it("requires an Owner Home businessId and validates it against the managed list before any Broadcasts request", () => {
    expect(broadcastsScreen).toContain("useLocalSearchParams<{ businessId?: string | string[] }>()");
    expect(broadcastsScreen).toContain("const requestedBusinessId");
    expect(broadcastsScreen).toContain("const hasMalformedRequestedBusinessId");
    expect(broadcastsScreen).toContain("/api/businesses/mine/managed");
    expect(broadcastsScreen).toContain("managedBusinesses.find((business) => business.id === requestedBusinessId)");
    expect(broadcastsScreen).not.toContain("/api/businesses/mine/broadcasts");
    expect(broadcastsScreen).not.toContain("managedBusinesses[0]");
  });

  it("does not invent a selection for either a single or multiple managed-business response", () => {
    expect(broadcastsScreen).toContain("const selectedBusiness = requestedBusinessId");
    expect(broadcastsScreen).toContain(": null;");
    expect(broadcastsScreen).not.toContain("managedBusinesses.length === 1");
  });

  it("accepts an explicit selected ID from a managed list and handles non-OK responses without legacy fallback", () => {
    expect(broadcastsScreen).toContain("managedBusinesses.find((business) => business.id === requestedBusinessId)");
    expect(broadcastsScreen).toContain("if (!managedResponse.ok)");
    expect(broadcastsScreen).toContain("if (res.ok)");
    expect(broadcastsScreen).not.toContain("/api/businesses/mine/broadcasts");
  });

  it("fails closed for zero, malformed, multiple-without-selection, and unowned or revoked contexts", () => {
    expect(broadcastsScreen).toContain("if (hasMalformedRequestedBusinessId)");
    expect(broadcastsScreen).toContain("Choose a business in Business Admin before using Broadcasts.");
    expect(broadcastsScreen).toContain("This business is no longer an approved owner context.");
    expect(broadcastsScreen).toContain("parseManagedBusinesses");
    expect(broadcastsScreen).toContain("if (!managedBusinesses)");
    expect(broadcastsScreen).toContain('denied.code === "unverified"');
    expect(broadcastsScreen).toContain('throw new Error(denied.error ?? "An approved business owner link is required.")');
    expect(broadcastsScreen).toContain('testID="business-broadcasts-context-recovery"');
    expect(broadcastsScreen).toContain("Back to Business Admin");
  });

  it("uses the selected ID for every Broadcasts read and post and does not expose controls before context resolution", () => {
    expect(broadcastsScreen).toContain("encodeURIComponent(selectedBusiness.id)}/broadcasts");
    expect(broadcastsScreen).toContain("const selectedBusinessId = businessId");
    expect(broadcastsScreen).toContain("encodeURIComponent(selectedBusinessId)}/broadcasts");
    expect(broadcastsScreen).toContain("{businessId ? (");
    expect(broadcastsScreen).toContain("!businessId ? (");
    expect(broadcastsScreen).toContain("if (!selectedBusinessId) return;");
  });

  it("clears prior business, broadcast, quota, and compose state on reload or context loss and fences late responses", () => {
    expect(broadcastsScreen).toContain("const requestEpoch = useRef(0)");
    expect(broadcastsScreen).toContain("const clearSelectedBusinessContext = useCallback");
    expect(broadcastsScreen).toContain("setBusinessId(null)");
    expect(broadcastsScreen).toContain("setBroadcasts([])");
    expect(broadcastsScreen).toContain("setQuota(null)");
    expect(broadcastsScreen).toContain('setTitle("")');
    expect(broadcastsScreen).toContain('setBody("")');
    expect(broadcastsScreen).toContain("if (epoch !== requestEpoch.current) return");
    expect(broadcastsScreen).toContain("if (epoch !== requestEpoch.current || selectedBusinessId !== businessId) return;");
  });

  it("carries only a validated unverified selected ID into the existing identity-completion gate", () => {
    expect(broadcastsScreen).toContain("setBusinessId(selectedBusiness.id)");
    expect(broadcastsScreen).toContain("pathname: \"/business-owner/identity\"");
    expect(broadcastsScreen).toContain("params: businessId ? { businessId } : {}");
    expect(broadcastsScreen).toContain("setUnverified(true)");
  });
});
