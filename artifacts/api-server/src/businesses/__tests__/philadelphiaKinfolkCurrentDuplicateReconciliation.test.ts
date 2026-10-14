import { describe, expect, it } from "vitest";
import {
  buildKinfolkCurrentCityDuplicatePlan,
  buildPhiladelphiaKinfolkCurrentDuplicatePlan,
  type KinfolkCurrentBusinessRecord,
  type ProfileFieldReceipt,
} from "../philadelphiaKinfolkCurrentDuplicateReconciliation";
import { duplicateReviewCandidateAddress } from "../../scripts/reconcilePhiladelphiaKinfolkCurrentDuplicates";

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
  it("uses an audit-only non-null address fallback without changing a business record", () => {
    expect(
      duplicateReviewCandidateAddress(
        { address: "  12 Duplicate Lane  " },
        { address: "34 Canonical Avenue" },
      ),
    ).toBe("12 Duplicate Lane");
    expect(
      duplicateReviewCandidateAddress(
        { address: null },
        { address: "34 Canonical Avenue" },
      ),
    ).toBe("34 Canonical Avenue");
    expect(
      duplicateReviewCandidateAddress({ address: null }, { address: "" }),
    ).toBe("Address unavailable — see canonical business profile");
  });

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

  it("uses multiple exact identity signals before transferring an unreceipted social profile", () => {
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

    expect(plan.manualReview).toEqual([]);
    expect(plan.approved).toHaveLength(1);
    expect(plan.approved[0]?.transfers).toMatchObject([
      {
        field: "instagram",
        value: "https://www.instagram.com/barberlife/",
        provenance: "multi_signal_identity_legacy",
        receipt: {
          sourceLabel: "Legacy Kinfolk Current multi-signal identity match",
        },
      },
    ]);
  });

  it("keeps conflicting official phone numbers in manual review even with multiple other matching signals", () => {
    const pinned = record({ id: "business-pinned" });
    const duplicate = record({
      id: "business-socials",
      latitude: null,
      longitude: null,
      phone: "267-555-0142",
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
      "different normalized phone numbers",
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

  it("consolidates a single-pin exact duplicate even when no additional social profile is needed", () => {
    const pinned = record({
      id: "business-pinned",
      instagram: "https://www.instagram.com/barberlife/",
    });
    const duplicate = record({
      id: "business-identical-socials",
      latitude: null,
      longitude: null,
      instagram: "https://www.instagram.com/barberlife/",
      updatedAt: "2026-10-14 20:01:00+00",
    });

    const plan = buildPhiladelphiaKinfolkCurrentDuplicatePlan(
      [pinned, duplicate],
      new Map(),
    );

    expect(plan.manualReview).toEqual([]);
    expect(plan.approved).toHaveLength(1);
    expect(plan.approved[0]?.transfers).toEqual([]);
    expect(plan.approved[0]).toMatchObject({
      canonicalId: pinned.id,
      duplicateId: duplicate.id,
    });
  });

  it("copies an unreceipted social profile only with two independent exact identity signals", () => {
    const pinned = record({ id: "business-pinned", phone: null });
    const duplicate = record({
      id: "business-socials",
      latitude: null,
      longitude: null,
      phone: null,
      instagram: "https://www.instagram.com/barberlife/",
      updatedAt: "2026-10-14 20:01:00+00",
    });

    const plan = buildPhiladelphiaKinfolkCurrentDuplicatePlan(
      [pinned, duplicate],
      new Map(),
    );

    expect(plan.manualReview).toEqual([]);
    expect(plan.approved).toHaveLength(1);
    expect(plan.approved[0]?.transfers[0]).toMatchObject({
      field: "instagram",
      provenance: "multi_signal_identity_legacy",
    });
  });

  it("keeps same-name records in another city outside the selected city plan", () => {
    const philadelphiaPinned = record({ id: "philadelphia-pinned" });
    const philadelphiaDuplicate = record({
      id: "philadelphia-duplicate",
      latitude: null,
      longitude: null,
    });
    const baltimorePinned = record({
      id: "baltimore-pinned",
      city: "Baltimore",
      state: "MD",
    });
    const baltimoreDuplicate = record({
      id: "baltimore-duplicate",
      city: "Baltimore",
      state: "MD",
      latitude: null,
      longitude: null,
    });

    const plan = buildKinfolkCurrentCityDuplicatePlan(
      [
        philadelphiaPinned,
        philadelphiaDuplicate,
        baltimorePinned,
        baltimoreDuplicate,
      ],
      new Map(),
      { city: "Baltimore", state: "MD" },
    );

    expect(plan.approved).toHaveLength(1);
    expect(plan.approved[0]).toMatchObject({
      canonicalId: "baltimore-pinned",
      duplicateId: "baltimore-duplicate",
    });
  });
});
