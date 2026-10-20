import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const source = (relative: string) => readFileSync(resolve(root, relative), "utf8");
const owner = source("app/business-owner/cultural-teaching.tsx");
const ownerIndex = source("app/business-owner/index.tsx");
const ownerLayout = source("app/business-owner/_layout.tsx");
const card = source("components/BusinessCulturalTeachingCard.tsx");
const detail = source("app/business/[id].tsx");

describe("native business cultural teaching surfaces", () => {
  it("registers the owner screen and provides confirmed save, retry, and withdrawal behavior", () => {
    expect(ownerLayout).toContain('name="cultural-teaching"');
    expect(ownerIndex).toContain("Optional Cultural Teaching");
    expect(ownerIndex).toContain("/business-owner/cultural-teaching");
    expect(owner).toContain("getApiBase, getMemberApiHeaders");
    expect(owner).toContain("/api/businesses/mine");
    expect(owner).toContain("/cultural-teaching/owner");
    expect(owner).toContain("ownerConfirmed: true");
    expect(owner).toContain("Withdraw teaching");
    expect(owner).toContain("Try again");
    expect(owner).toContain("never a culture label, rating, or automatic member prompt");
    expect(owner).not.toMatch(/\/kinfolk|analytics|chat|draft/i);
    expect(owner).not.toMatch(/\b(?:ai|model|provider|notification)\b|Linking|WebBrowser/i);
  });

  it("resolves Cultural Teaching only from a verified managed-business context", () => {
    expect(owner).toContain("useLocalSearchParams");
    expect(owner).toContain("/api/businesses/mine/managed");
    expect(owner).toContain("parseManagedBusinesses");
    expect(owner).toContain("hasEntryBusinessId");
    expect(owner).toContain("managedBusinesses.find((business) => business.id === requestedBusinessId)");
    expect(owner).toContain("managedBusinesses.length === 1");
    expect(owner).toContain("Choose an approved business in Business Admin before managing optional teaching.");
    expect(owner).toContain("Choose a business in Business Admin before managing optional teaching.");
    expect(owner).toContain("clearManagedContext");
    expect(owner).toContain("setTitle(\"\")");
    expect(owner).toContain("setTeaching(\"\")");
    expect(owner).toContain("setConfirmed(false)");
    expect(owner).toContain("setSaved(false)");
    expect(owner).toContain("loadEpoch");
    expect(owner).toContain("if (loadEpoch.current !== epoch) return;");
    expect(owner).toContain("encodeURIComponent(selectedBusiness.id)");
    expect(owner).toContain("encodeURIComponent(businessId)");

    const managedRead = owner.indexOf("/api/businesses/mine/managed");
    const selectedTeachingRead = owner.indexOf("encodeURIComponent(selectedBusiness.id)");
    expect(managedRead).toBeGreaterThanOrEqual(0);
    expect(selectedTeachingRead).toBeGreaterThan(managedRead);
    expect(owner).not.toContain("/api/businesses/mine`,");
  });

  it("forwards only an explicit managed-business selection from Owner Home", () => {
    expect(ownerIndex).toContain("businesses.length === 1 ? businesses[0] ?? null : null");
    expect(ownerIndex).toContain('pathname: "/business-owner/cultural-teaching", params: { businessId: business.id }');
    expect(ownerIndex).toContain('pathname: "/business-owner/cultural-teaching", params: { businessId: managedBusiness.id }');
    expect(ownerIndex).toContain("Manage optional teaching for ${managedBusiness.name}");
    expect(ownerIndex).not.toContain('route: "/business-owner/cultural-teaching"');
  });

  it("places a quiet, auth-gated opt-in card after About without persisting or sending a member choice", () => {
    expect(detail).toContain("BusinessCulturalTeachingCard");
    expect(card).toContain("getApiBase, getMemberApiHeaders");
    expect(card).toContain("/cultural-teaching");
    expect(card).toContain('cache: "no-store"');
    expect(card).toContain("Read optional teaching");
    expect(card).toContain("Not now");
    expect(card).toContain("if (!isAuthenticated || !checked || !teaching || notNow) return null");
    expect(card).toContain("setNotNow(true)");
    expect(card).not.toMatch(/method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/);
    expect(card).not.toMatch(/SecureStore|AsyncStorage|analytics|\/kinfolk|chat/i);
    expect(card).not.toMatch(/\b(?:ai|model|provider|notification)\b|Linking|WebBrowser/i);
    expect(card).not.toContain("Teaching unavailable");
  });
});
