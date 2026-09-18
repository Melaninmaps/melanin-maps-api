import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../pages/business-detail.tsx", import.meta.url), "utf8");

describe("business shop website checkout", () => {
  it("renders the seller Shop on the existing business-detail page", () => {
    expect(source).toContain('function BusinessShop(');
    expect(source).toContain('data-testid="business-shop"');
    expect(source).toContain('<BusinessShop businessId={business.id} focusedListingId={focusedListingId} />');
    expect(source).toContain('new URLSearchParams(search).get("shop")');
  });

  it("creates marketplace Checkout only from the website after displaying a listing", () => {
    expect(source).toContain('fetch(`${base}/api/businesses/${businessId}/listings`)');
    expect(source).toContain('fetch(`${base}/api/connect/listings/${listing.id}/checkout`');
    expect(source).toContain('credentials: "include"');
    expect(source).toContain('window.location.assign(data.url)');
    expect(source).not.toContain('auth_session_token');
  });
});
