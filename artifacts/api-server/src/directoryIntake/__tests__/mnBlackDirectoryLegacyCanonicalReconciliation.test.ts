import { describe, expect, it } from "vitest";
import { buildMinnesotaLegacyCanonicalReconciliations } from "../mnBlackDirectoryLegacyCanonicalReconciliation";
import type { SourceBackedDirectoryCandidate } from "../sourceBackedDirectoryCandidates";

const candidate: SourceBackedDirectoryCandidate = {
  name: "Quruxlow",
  category: "Restaurants, coffee shops, bars & bakeries",
  subcategory: "Restaurants, coffee shops, bars & bakeries",
  city: "Minneapolis",
  state: "MN",
  country: "US",
  address: "1414 E Lake St",
  phone: null,
  officialUrl: null,
  serviceTerms: ["Somali dishes"],
  sourceLabel: "Minnesota Black-Owned Business Directory",
  sourceUrl: "https://mnblackbusiness.com/",
  sourceListingUrl: "https://mnblackbusiness.com/businesses/quruxlow/",
  sourceRecordKey: "source-receipt:test:quruxlow",
  ownershipDesignations: ["Black / African American-Owned"],
  ownershipEvidence: "Directory-supported designation.",
  sourceDescription: "Traditional Somali dishes and fruit juices.",
  batch: "mn_black_business_directory_statewide_2026_09_28",
};

describe("buildMinnesotaLegacyCanonicalReconciliations", () => {
  it("targets only one matching legacy Minnesota location-card profile", () => {
    expect(buildMinnesotaLegacyCanonicalReconciliations([candidate], [{
      id: "national-quruxlow",
      name: "Quruxlow",
      city: "Minneapolis",
      state: "Minnesota",
      sourceUrl: "https://mnblackbusiness.com/listing-location/minneapolis/page/3/",
      description: "Black/African American business ecosystem Current Minneapolis listing in the Minnesota Black-Owned Business Directory.",
      isDuplicate: false,
    }])).toEqual([{ candidate, canonicalId: "national-quruxlow" }]);
  });

  it("does not guess among ambiguous names", () => {
    expect(buildMinnesotaLegacyCanonicalReconciliations([candidate], [{
      id: "one",
      name: "Quruxlow",
      city: "Minneapolis",
      state: "MN",
      sourceUrl: "https://mnblackbusiness.com/listing-location/minneapolis/page/3/",
      description: "Black/African American business ecosystem Current Minneapolis listing in the Minnesota Black-Owned Business Directory.",
      isDuplicate: false,
    }, {
      id: "two",
      name: "Quruxlow",
      city: "Minneapolis",
      state: "MN",
      sourceUrl: "https://mnblackbusiness.com/listing-location/minneapolis/page/3/",
      description: "Black/African American business ecosystem Current Minneapolis listing in the Minnesota Black-Owned Business Directory.",
      isDuplicate: false,
    }])).toEqual([]);
  });
});
