import { describe, expect, it } from "vitest";
import {
  buildPhiladelphiaKinfolkCurrentDuplicatePlan,
  type KinfolkCurrentBusinessRecord,
  type ProfileFieldReceipt,
} from "../philadelphiaKinfolkCurrentDuplicateReconciliation";

function record(
  overrides: Partial<KinfolkCurrentBusinessRecord>,
): KinfolkCurrentBusinessRecord {
  return {
    id: "business-pinned",
    name: "1617 BarberLife",
    address: "1617 Example Street",
    city: "Philadelphia",
    state: "PA",
    phone: "215-868-9480",
    website: "https://www.barberlife.example",
    instagram: null,
    facebook: null,
    tiktok: null,
    twitter: null,
    youtube: null,
    pinterest: null,
    latitude: 39.9526,
    longitude: -75.1652,
    updatedAt: "2026-10-14 20:00:00+00",
    ...overrides,
  };
}

function receipt(
  fieldName: ProfileFieldReceipt["fieldName"],
  field: string,
  value: string,
): ProfileFieldReceipt {
  return {
    fieldName,
    sourceUrl: "https://www.barberlife.example/contact",
    sourceLabel: "Official contact page",
    observedAt: "2026-10-01",
    confidence: "high",
    note: "Official profile link is published by the business.",
    observedValue: {
      fields: { [field]: value },
      identityMatch: { asserted: true, signal: "official_domain" },
    },
  };
}

describe("Philadelphia Kinfolk Current duplicate reconciliation", () => {
  it("keeps the only pinned record and transfers only source-receipted missing socials", () => {
    const pinned = record({ id: "business-pinned" });
    const duplicate = record({
      id: "business-socials",
      latitude: null,
      longitude: null,
      instagram: "https://www.instagram.com/barberlife/",
      facebook: "https://www.facebook.com/barberlife/",
      updatedAt: "2026-10-14 20:01:00+00",
    });
    const plan = buildPhiladelphiaKinfolkCurrentDuplicatePlan(
      [pinned, duplicate],
      new Map([
        [
          duplicate.id,
          [
            receipt("instagram", "instagram", duplicate.instagram!),
            receipt("facebook", "facebook", duplicate.facebook!),
          ],
        ],
      ]),
    );

    expect(plan.manualReview).toEqual([]);
    expect(plan.approved).toHaveLength(1);
    expect(plan.approved[0]).toMatchObject({
      canonicalId: pinned.id,
      duplicateId: duplicate.id,
      identityReasons: [
        "same_name_and_address",
        "same_official_domain",
        "same_phone",
      ],
    });
    expect(plan.approved[0]?.transfers.map((item) => item.field)).toEqual([
      "instagram",
      "facebook",
    ]);
  });

  it("leaves a social link without its own identity-attested receipt for manual review", () => {
    const pinned = record({ id: "business-pinned" });
    const duplicate = record({
      id: "business-socials",
      latitude: null,
      longitude: null,
      instagram: "https://www.instagram.com/barberlife/",
      updatedAt: "2026-10-14 20:01:00+00",
    });
    const plan = buildPhiladelphiaKinfolkCurrentDuplicatePlan(
      [pinned, duplicate],
      new Map(),
    );

    expect(plan.approved).toEqual([]);
    expect(plan.manualReview).toHaveLength(1);
    expect(plan.manualReview[0]?.reasons).toContain(
      "instagram lacks a matching identity-attested field receipt",
    );
  });

  it("never auto-merges two mapped rows or conflicting official social profiles", () => {
    const left = record({
      id: "business-one",
      instagram: "https://www.instagram.com/barberlife/",
    });
    const right = record({
      id: "business-two",
      latitude: 39.953,
      longitude: -75.166,
      instagram: "https://www.instagram.com/different-barberlife/",
    });
    const plan = buildPhiladelphiaKinfolkCurrentDuplicatePlan(
      [left, right],
      new Map(),
    );

    expect(plan.approved).toEqual([]);
    expect(plan.manualReview).toHaveLength(1);
    expect(plan.manualReview[0]?.reasons).toContain(
      "both records have stored map coordinates",
    );
  });
});
