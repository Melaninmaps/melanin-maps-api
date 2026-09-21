import { describe, expect, it } from "vitest";
import {
  classifyAutomatedReviewBatch,
  exactBatchIdentity,
  type AutomatedReviewCandidate,
} from "../directoryImport/automatedReviewPolicy";

function candidate(
  overrides: Partial<AutomatedReviewCandidate> = {},
): AutomatedReviewCandidate {
  return {
    sourceRow: 1,
    targetKind: "business",
    name: "Duke's Cafe",
    city: "Horsham",
    state: "PA",
    country: "United States",
    address: "101 Main Street",
    website: "https://dukes.example/menu",
    socialSourceUrl: null,
    ownershipDesignations: [],
    regulatedProfession: false,
    destinationReachable: true,
    ...overrides,
  };
}

describe("automated directory review policy", () => {
  it("marks one fully evidenced physical business auto-ready", () => {
    const decision = classifyAutomatedReviewBatch([candidate()]).get(1);

    expect(decision).toMatchObject({
      outcome: "auto_ready",
      canonicalSourceRow: null,
      exceptionCodes: [],
      policyVersion: "directory-auto-review-v1",
    });
  });

  it("collapses an exact repeat without treating name plus city as sufficient", () => {
    const results = classifyAutomatedReviewBatch([
      candidate(),
      candidate({ sourceRow: 2 }),
      candidate({ sourceRow: 3, address: "200 Main Street" }),
    ]);

    expect(results.get(2)).toMatchObject({
      outcome: "deduplicated",
      canonicalSourceRow: 1,
      exceptionCodes: ["duplicate_within_batch"],
    });
    expect(results.get(3)).toMatchObject({ outcome: "auto_ready" });
  });

  it("holds a physical listing without a numbered address or reachable customer destination", () => {
    const decision = classifyAutomatedReviewBatch([
      candidate({ address: "Main Street", website: null, destinationReachable: false }),
    ]).get(1);

    expect(decision).toMatchObject({ outcome: "needs_research" });
    expect(decision?.exceptionCodes).toEqual(
      expect.arrayContaining([
        "numbered_street_address_required",
        "official_customer_destination_required",
        "customer_destination_requires_review",
      ]),
    );
  });

  it("keeps regulated, ownership, resource, cultural, and manual records out of automatic publication", () => {
    const results = classifyAutomatedReviewBatch([
      candidate({ sourceRow: 1, regulatedProfession: true }),
      candidate({ sourceRow: 2, address: "102 Main Street", ownershipDesignations: ["Black-owned"] }),
      candidate({ sourceRow: 3, address: "103 Main Street", targetKind: "community_resource" }),
      candidate({ sourceRow: 4, address: "104 Main Street", targetKind: "cultural_place" }),
      candidate({ sourceRow: 5, address: "105 Main Street", targetKind: "manual_review" }),
    ]);

    expect(results.get(1)?.exceptionCodes).toContain("regulated_credential_review");
    expect(results.get(2)?.exceptionCodes).toContain("ownership_evidence_review");
    expect(results.get(3)?.exceptionCodes).toContain("resource_queue_only");
    expect(results.get(4)?.exceptionCodes).toContain("cultural_queue_only");
    expect(results.get(5)?.exceptionCodes).toContain("manual_review_target");
    for (const sourceRow of [1, 2, 3, 4, 5]) {
      expect(results.get(sourceRow)?.outcome).not.toBe("auto_ready");
    }
  });

  it("auto-readies a complete ownership-designated row only after protected ingress marks it source-backed", () => {
    const decision = classifyAutomatedReviewBatch([
      candidate({
        ownershipDesignations: ["Black-owned"],
        sourceBackedMwmCore: true,
      }),
    ]).get(1);

    expect(decision).toMatchObject({ outcome: "auto_ready", exceptionCodes: [] });
  });

  it("preserves online-only services as mapless when their customer destination is reachable", () => {
    const online = candidate({
      targetKind: "online_business",
      address: null,
      website: null,
      socialSourceUrl: "https://instagram.com/dukes-online",
    });
    const decision = classifyAutomatedReviewBatch([online]).get(1);

    expect(decision).toMatchObject({ outcome: "auto_ready" });
    expect(decision?.identityKey).toContain("online|");
  });

  it("uses an address-based physical identity and never a name-plus-city identity", () => {
    expect(exactBatchIdentity(candidate({ address: null }))).toBeNull();
    expect(exactBatchIdentity(candidate({ address: "101 Main Street" }))).toContain(
      "physical|duke s cafe|horsham|pa|united states|101 main street",
    );
  });
});
