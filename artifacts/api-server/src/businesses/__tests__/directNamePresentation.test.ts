import { describe, expect, it } from "vitest";
import { stripDirectNameOwnershipPresentation } from "../directNamePresentation";

describe("direct-name public-directory presentation", () => {
  it("keeps a direct profile lookup ownership-neutral even when stored or documented ownership data exists", () => {
    const [profile] = stripDirectNameOwnershipPresentation([
      {
        id: "public-directory-business",
        name: "Public Directory Business",
        category: "Retail",
        ownershipDesignations: ["Black / African American-Owned"],
        blackOwned: true,
        verifiedDesignations: ["Black / African American-Owned"],
        ownershipClaim: "community_reported_minority_owned",
        documentedOwnership: {
          status: "documented_by_source",
          labels: ["Black / African American-Owned — documented by source"],
        },
        featured: true,
        promotionType: "featured_listing",
        culturalMatch: true,
      },
    ]);

    expect(profile).toEqual({
      id: "public-directory-business",
      name: "Public Directory Business",
      category: "Retail",
    });
    expect(profile).not.toHaveProperty("ownershipDesignations");
    expect(profile).not.toHaveProperty("blackOwned");
    expect(profile).not.toHaveProperty("verifiedDesignations");
    expect(profile).not.toHaveProperty("ownershipClaim");
    expect(profile).not.toHaveProperty("documentedOwnership");
    expect(profile).not.toHaveProperty("featured");
    expect(profile).not.toHaveProperty("promotionType");
    expect(profile).not.toHaveProperty("culturalMatch");
  });
});
