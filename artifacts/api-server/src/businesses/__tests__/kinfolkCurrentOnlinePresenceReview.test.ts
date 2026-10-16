import { describe, expect, it } from "vitest";
import {
  KINFOLK_CURRENT_ONLINE_PRESENCE_MANIFEST_VERSION,
  kinfolkCurrentOnlinePresenceManifestFingerprint,
  parseKinfolkCurrentOnlinePresenceManifest,
  ensureKinfolkCurrentDeleteReviewTransferSchema,
} from "../kinfolkCurrentOnlinePresenceReview";

const inactiveWebsite = {
  classification: "REMOVE_CONFIRMED_INACTIVE",
  originalUrl: "https://closed.example",
  reason: "The destination is unavailable (dns_nxdomain).",
};

function validManifest() {
  const unsigned = {
    kind: KINFOLK_CURRENT_ONLINE_PRESENCE_MANIFEST_VERSION as typeof KINFOLK_CURRENT_ONLINE_PRESENCE_MANIFEST_VERSION,
    generatedAt: "2026-10-15T15:26:45.115Z",
    source: {
      verifierVersion: "kinfolk-current-online-presence-v1",
      inputSha256: "f".repeat(64),
      completedAt: "2026-10-15T15:26:45.115Z",
    },
    websiteRemovals: [
      {
        businessId: "keep-social",
        businessName: "Keep Social",
        city: "Philadelphia",
        state: "PA",
        originalWebsite: "https://closed.example",
        verifiedOfficialSocial: [{ platform: "facebook", url: "https://facebook.com/keep-social" }],
        verification: inactiveWebsite,
        currentSnapshotHash: "a".repeat(64),
      },
    ],
    deleteReviews: [
      {
        businessId: "delete-review",
        businessName: "Delete Review",
        city: "Houston",
        state: "TX",
        currentSnapshotHash: "b".repeat(64),
        originalLinks: { website: "https://closed-two.example", social: {} },
        websiteVerification: inactiveWebsite,
        socialVerification: {},
        originalSnapshot: { listingVisibility: "live_unclaimed" },
      },
    ],
  };
  return {
    ...unsigned,
    manifestFingerprint: kinfolkCurrentOnlinePresenceManifestFingerprint(unsigned),
  };
}

function resealManifest(manifest: any): void {
  const { manifestFingerprint: _ignored, ...unsigned } = manifest;
  manifest.manifestFingerprint = kinfolkCurrentOnlinePresenceManifestFingerprint(unsigned);
}

describe("Kinfolk Current online-presence manifest", () => {
  it("accepts a strictly scoped social-preserving removal and a reversible delete review", () => {
    const manifest = parseKinfolkCurrentOnlinePresenceManifest(validManifest());
    expect(manifest.websiteRemovals).toHaveLength(1);
    expect(manifest.deleteReviews).toHaveLength(1);
    expect(manifest.websiteRemovals[0]?.verifiedOfficialSocial[0]?.platform).toBe("facebook");
  });

  it("accepts identity-unverified evidence for reversible Delete Review while preserving the exact stored social link", () => {
    const manifest = validManifest();
    manifest.deleteReviews[0]!.originalLinks.social = {
      instagram: "https://instagram.com/example",
    };
    manifest.deleteReviews[0]!.socialVerification = {
      instagram: {
        classification: "UNVERIFIED_OR_IDENTITY_UNCLEAR",
        sourceClassification: "HOLD_INCONCLUSIVE",
      },
    };
    resealManifest(manifest);
    expect(parseKinfolkCurrentOnlinePresenceManifest(manifest).deleteReviews[0]?.socialVerification.instagram?.classification)
      .toBe("UNVERIFIED_OR_IDENTITY_UNCLEAR");
  });

  it("rejects a Delete Review record with a claimed active social source", () => {
    const manifest = validManifest();
    manifest.deleteReviews[0]!.originalLinks.social = {
      instagram: "https://instagram.com/example",
    };
    manifest.deleteReviews[0]!.socialVerification = {
      instagram: { classification: "KEEP_ACTIVE_SOCIAL" },
    };
    resealManifest(manifest);
    expect(() => parseKinfolkCurrentOnlinePresenceManifest(manifest)).toThrow(
      "identity-unverified official social URL",
    );
  });

  it("accepts a review-only record when no website is stored and every stored social link is decisively inactive", () => {
    const manifest = validManifest();
    const review = manifest.deleteReviews[0] as any;
    review.originalLinks = { website: null, social: { facebook: "https://facebook.com/closed-profile" } };
    review.websiteVerification = {
      classification: "MISSING",
      reason: "No website is stored.",
    };
    review.socialVerification = {
      facebook: { classification: "INACTIVE_OR_REMOVED" },
    };
    resealManifest(manifest);
    expect(parseKinfolkCurrentOnlinePresenceManifest(manifest).deleteReviews[0]?.originalLinks.website).toBeNull();
  });

  it("rejects duplicate business IDs across the two action lanes", () => {
    const manifest = validManifest();
    manifest.deleteReviews[0]!.businessId = "keep-social";
    resealManifest(manifest);
    expect(() => parseKinfolkCurrentOnlinePresenceManifest(manifest)).toThrow(
      "only one online-presence action",
    );
  });

  it("rejects a forged mutation even when it repeats an expected classification", () => {
    const manifest = validManifest();
    manifest.websiteRemovals[0]!.originalWebsite = "https://actually-active.example";
    expect(() => parseKinfolkCurrentOnlinePresenceManifest(manifest)).toThrow(
      "integrity fingerprint",
    );
  });
});

describe("Kinfolk Current Delete Review explicit transfer schema", () => {
  it("adds a distinct transferred state, never rewrites original evidence or disables guards", async () => {
    const statements: string[] = [];
    await ensureKinfolkCurrentDeleteReviewTransferSchema({ query: async (sql) => { statements.push(sql); } });
    const sql = statements.join("\n");
    expect(sql).toContain("'queued', 'restored', 'transferred_to_delete_queue'");
    expect(sql).not.toContain("UPDATE businesses");
    expect(sql).not.toContain("UPDATE kinfolk_current_online_presence_reviews");
    expect(sql).not.toContain("DELETE FROM");
    expect(sql).not.toContain("DROP TRIGGER");
    expect(sql).not.toContain("original_listing_state =");
    expect(sql).not.toContain("verification_evidence =");
  });
});
