import { readFileSync } from "node:fs";
import { transformSync } from "esbuild";
import { describe, expect, it } from "vitest";

type ManagedBusiness = {
  id: string;
  name: string;
  managementRole: "owner" | "manager";
};

type SelectionHelpers = {
  parseManagedPinnedBusinesses(value: unknown): ManagedBusiness[] | null;
  resolvePinnedHighlightsBusiness(
    incomingBusinessId: string | string[] | undefined,
    localBusinessId: string | null,
    managedBusinesses: unknown,
  ): ManagedBusiness | null;
  isPinnedListForSelectedBusiness(value: unknown, selectedBusinessId: string): boolean;
  isSelectedPinSuccess(value: unknown, selectedBusinessId: string): boolean;
};

const screenSource = readFileSync(
  new URL("../app/business-owner/pinned-highlights.tsx", import.meta.url),
  "utf8",
);

function loadSelectionHelpers(): SelectionHelpers {
  const start = screenSource.indexOf("function isWellFormedBusinessId");
  const end = screenSource.indexOf("export default function PinnedHighlightsScreen", start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  const helperSource = screenSource.slice(start, end);
  const compiled = transformSync(helperSource, {
    loader: "ts",
    format: "cjs",
    target: "es2022",
  }).code;
  const module = { exports: {} as Record<string, unknown> };
  new Function("module", "exports", compiled)(module, module.exports);
  return module.exports as unknown as SelectionHelpers;
}

const helpers = loadSelectionHelpers();
const ownerA = { id: "business-a", name: "A Studio", managementRole: "owner" } as const;
const ownerB = { id: "business-b", name: "B Studio", managementRole: "owner" } as const;
const managerC = { id: "business-c", name: "C Studio", managementRole: "manager" } as const;

describe("business-owner Pinned Highlights selected-context isolation", () => {
  it("resolves only an exact incoming active owner business from the authenticated managed response", () => {
    expect(helpers.resolvePinnedHighlightsBusiness("business-b", null, [ownerA, ownerB]))
      .toEqual(ownerB);
    expect(helpers.resolvePinnedHighlightsBusiness("business-c", null, [ownerA, managerC]))
      .toBeNull();
    expect(helpers.resolvePinnedHighlightsBusiness("not-owned", null, [ownerA, ownerB]))
      .toBeNull();
  });

  it("permits legacy fallback only for exactly one well-formed owner relationship", () => {
    expect(helpers.resolvePinnedHighlightsBusiness(undefined, null, [ownerA])).toEqual(ownerA);
    expect(helpers.resolvePinnedHighlightsBusiness(undefined, null, [ownerA, ownerB])).toBeNull();
    expect(helpers.resolvePinnedHighlightsBusiness(undefined, null, [managerC])).toBeNull();
    expect(helpers.resolvePinnedHighlightsBusiness(undefined, null, [])).toBeNull();
  });

  it("fails closed for malformed, duplicate, array, and unowned selected contexts without index-zero fallback", () => {
    expect(helpers.parseManagedPinnedBusinesses([{ id: "business-a", managementRole: "owner" }, { id: "business-a", managementRole: "owner" }])).toBeNull();
    expect(helpers.parseManagedPinnedBusinesses([{ id: " business-a", managementRole: "owner" }])).toBeNull();
    expect(helpers.parseManagedPinnedBusinesses([{ id: "business-a", managementRole: "editor" }])).toBeNull();
    expect(helpers.resolvePinnedHighlightsBusiness(["business-a"], null, [ownerA])).toBeNull();
    expect(helpers.resolvePinnedHighlightsBusiness(" ", null, [ownerA])).toBeNull();
    expect(helpers.resolvePinnedHighlightsBusiness(undefined, "business-b", [ownerA])).toBeNull();
    expect(screenSource).not.toContain("managedBusinesses[0]");
  });

  it("accepts selected-route payloads only when every displayed pin belongs to the selected owner business", () => {
    const validPin = { id: 1, businessId: "business-a" };
    expect(helpers.isPinnedListForSelectedBusiness({ businessId: "business-a", pinned: [validPin] }, "business-a")).toBe(true);
    expect(helpers.isPinnedListForSelectedBusiness({ businessId: "business-b", pinned: [validPin] }, "business-a")).toBe(false);
    expect(helpers.isPinnedListForSelectedBusiness({ businessId: "business-a", pinned: [{ ...validPin, businessId: "business-b" }] }, "business-a")).toBe(false);
    expect(helpers.isSelectedPinSuccess({ businessId: "business-a", pinned: validPin }, "business-a")).toBe(true);
    expect(helpers.isSelectedPinSuccess({ businessId: "business-a", pinned: { ...validPin, businessId: "business-b" } }, "business-a")).toBe(false);
  });

  it("uses validated selected GET, pin, and unpin routes; never the implicit legacy route", () => {
    expect(screenSource).toContain('fetch(`${getApiBase()}/api/businesses/mine/managed`');
    expect(screenSource).toContain('/api/businesses/mine/managed/${encodeURIComponent(selectedBusiness.id)}/pinned');
    expect(screenSource).toContain('/api/businesses/mine/managed/${encodeURIComponent(selectedBusinessId)}/pinned/${encodeURIComponent(String(itemId))}');
    expect(screenSource).not.toContain('/api/business/pinned');
    expect(screenSource).toContain('review.businessId !== selectedBusinessId');
  });

  it("clears selected data and actions before each retry, fences stale A-to-B responses, and never reports false pin success", () => {
    const clearStart = screenSource.indexOf("const clearSelectedBusinessState");
    const loadStart = screenSource.indexOf("const loadPinned");
    const unpinStart = screenSource.indexOf("const handleUnpin");
    const pinStart = screenSource.indexOf("const handlePinReview");
    const activeStart = screenSource.indexOf("const activePins");
    const clearBlock = screenSource.slice(clearStart, loadStart);
    const loadBlock = screenSource.slice(loadStart, unpinStart);
    const unpinBlock = screenSource.slice(unpinStart, pinStart);
    const pinBlock = screenSource.slice(pinStart, activeStart);

    expect(clearBlock).toContain("setBusinessId(null)");
    expect(clearBlock).toContain("setPinned([])");
    expect(clearBlock).toContain("setShowPickReview(false)");
    expect(clearBlock).toContain("setShowExpiryPrompt(null)");
    expect(clearBlock).toContain("setPinningReviewId(null)");
    expect(clearBlock).toContain("setUnpinning(null)");
    expect(loadBlock).toContain("requestVersion.current = requestId");
    expect(loadBlock).toContain("if (!isCurrentRequest(requestId, selectedBusiness.id)) return;");
    expect(loadBlock).toContain("if (!isPinnedListForSelectedBusiness(data, selectedBusiness.id))");
    expect(unpinBlock).toContain("if (!isCurrentRequest(requestId, selectedBusinessId) || !res.ok) return;");
    expect(pinBlock).toContain("if (!isCurrentRequest(requestId, selectedBusinessId) || !res.ok || !isSelectedPinSuccess(data, selectedBusinessId)) return;");
  });
});
