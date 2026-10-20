import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function businessShopSource() {
  const source = readFileSync(
    new URL("../pages/business-detail.tsx", import.meta.url),
    "utf8",
  );
  const start = source.indexOf("function BusinessShop(");
  const end = source.indexOf("\nexport default function BusinessDetail", start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("BusinessShop closed marketplace rail", () => {
  it("retains active listing presentation without a checkout POST, redirect, or buy action", () => {
    const shop = businessShopSource();

    expect(shop).toContain("/api/businesses/${businessId}/listings");
    expect(shop).toContain("filter((listing) => listing.active)");
    expect(shop).toContain('data-testid="business-shop"');
    expect(shop).toContain("listing.category ?? listing.listingType ?? \"Listing\"");
    expect(shop).toContain("{listing.name}");
    expect(shop).toContain("{listing.description}");
    expect(shop).not.toContain("/api/connect/listings/${listing.id}/checkout");
    expect(shop).not.toContain("window.location.assign");
    expect(shop).not.toContain("startWebsiteCheckout");
    expect(shop).not.toContain("Buy securely");
    expect(shop).not.toContain("Opening…");
    expect(shop).not.toContain("onClick=");
  });

  it("renders only a truthful marketplace-unavailable recovery state", () => {
    const shop = businessShopSource();

    expect(shop).toContain('data-testid="marketplace-checkout-unavailable"');
    expect(shop).toContain('role="status"');
    expect(shop).toContain("Marketplace checkout is temporarily unavailable. Listing details remain available.");
    expect(shop).not.toContain("Purchase directly from this independent business through secure website checkout.");
  });
});
