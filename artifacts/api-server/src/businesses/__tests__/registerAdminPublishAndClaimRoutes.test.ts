import { describe, expect, it } from "vitest";
import {
  buildStagedDirectBusinessInsert,
  validateDirectBusiness,
} from "../registerAdminPublishAndClaimRoutes";

const basicShell = {
  name: "Community Books",
  category: "Books & Media",
  city: "Philadelphia",
  state: "PA",
  address: "123 Main Street",
  phone: "215-555-0100",
};

describe("legacy administrator direct creation", () => {
  it("accepts only a staged, receipt-free shell", () => {
    const parsed = validateDirectBusiness(basicShell);
    expect(parsed.listingStatus).toBe("staged");

    const insert = buildStagedDirectBusinessInsert(parsed, "admin-1", "shell-1");
    expect(insert).toMatchObject({
      id: "shell-1",
      status: "pending_review",
      listingStatus: "staged",
      blackOwned: false,
      ownershipDesignations: [],
      address: "123 Main Street",
      phone: "215-555-0100",
    });
    expect(insert).not.toHaveProperty("latitude");
    expect(insert).not.toHaveProperty("longitude");
    expect(insert).not.toHaveProperty("website");
    expect(insert).not.toHaveProperty("imageUrl");
    expect(insert).not.toHaveProperty("photos");
  });

  it("rejects public lifecycle, unreceipted official presence, ownership, and media", () => {
    expect(() => validateDirectBusiness({ ...basicShell, listingStatus: "live_unclaimed" }))
      .toThrow("must remain staged");
    expect(() => validateDirectBusiness({ ...basicShell, website: "https://communitybooks.example" }))
      .toThrow("cannot attach unreceipted presence");
    expect(() => validateDirectBusiness({ ...basicShell, ownershipDesignations: ["Black-Owned"] }))
      .toThrow("cannot attach unreceipted presence");
    expect(() => validateDirectBusiness({ ...basicShell, blackOwned: true }))
      .toThrow("cannot attach unreceipted presence");
    expect(() => validateDirectBusiness({ ...basicShell, mediaAssetUrls: ["https://cdn.example/logo.png"] }))
      .toThrow("cannot attach unreceipted presence");
  });
});
