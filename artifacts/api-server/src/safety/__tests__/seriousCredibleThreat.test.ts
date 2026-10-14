import { describe, expect, it } from "vitest";
import {
  assessSeriousCredibleThreat,
  planThreatLifecycleUpdate,
  recordThreatNotificationOutcome,
  type SeriousCredibleThreatSubmission,
} from "../seriousCredibleThreat";

const NOW = new Date("2026-10-10T15:00:00.000Z");
const EXPIRES_AT = new Date("2026-10-10T17:00:00.000Z");

function validSubmission(
  overrides: Partial<SeriousCredibleThreatSubmission> = {},
): SeriousCredibleThreatSubmission {
  return {
    kind: "serious_credible_threat",
    category: "imminent_violence",
    consent: { privateReview: true, anonymousCityLevelNotice: true },
    evidence: [
      {
        referenceId: "official-reference-1",
        kind: "official_public_safety_source",
        independentlyVerified: true,
        verifiedAt: new Date("2026-10-10T14:30:00.000Z"),
      },
      {
        referenceId: "organization-reference-2",
        kind: "trusted_organization",
        independentlyVerified: true,
        verifiedAt: new Date("2026-10-10T14:35:00.000Z"),
      },
    ],
    area: { city: "Philadelphia", region: "PA" },
    moderation: {
      decision: "approved",
      moderatorId: "moderator-opaque-id",
      reviewedAt: new Date("2026-10-10T14:45:00.000Z"),
      publicSummary: "A verified serious safety threat is under active review. Follow official guidance.",
    },
    requestedExpiresAt: EXPIRES_AT,
    ...overrides,
  };
}

describe("Safety Hub P0 serious credible-threat workflow", () => {
  it("keeps ordinary Police and ICE observations out of the credible-threat workflow", () => {
    for (const kind of ["police", "ice", "police_observation", "ice_observation"]) {
      const assessment = assessSeriousCredibleThreat(
        validSubmission({ kind, category: kind === "ice" || kind === "ice_observation" ? "ice" : "police" }),
        NOW,
      );
      expect(assessment.eligibleToQueue).toBe(false);
      expect(assessment.blockers).toContain("wrong_workflow");
      expect(assessment.blockers).toContain("ordinary_observation");
      expect(assessment.safeNotice).toBeNull();
      expect(assessment.notificationState).toBe("not_eligible");
    }
  });

  it("fails closed until both explicit consent choices are present", () => {
    const assessment = assessSeriousCredibleThreat(validSubmission({
      consent: { privateReview: true, anonymousCityLevelNotice: false },
    }), NOW);

    expect(assessment).toMatchObject({
      eligibleToQueue: false,
      notificationState: "not_eligible",
      safeNotice: null,
    });
    expect(assessment.blockers).toContain("missing_explicit_consent");
  });

  it("fails closed for malformed runtime payloads instead of creating a notice", () => {
    const assessment = assessSeriousCredibleThreat({
      kind: null,
      category: { value: "imminent_violence" },
      consent: null,
      evidence: "unverified",
      area: null,
      moderation: null,
      requestedExpiresAt: "later",
    }, NOW);

    expect(assessment).toMatchObject({
      eligibleToQueue: false,
      notificationState: "not_eligible",
      safeNotice: null,
    });
    expect(assessment.blockers).toEqual(expect.arrayContaining([
      "wrong_workflow",
      "invalid_category",
      "missing_explicit_consent",
      "unsafe_or_precise_location",
      "insufficient_verified_evidence",
      "moderation_not_approved",
      "expired",
    ]));
  });

  it("requires two distinct independently verified evidence references", () => {
    const oneVerifiedReference = validSubmission({
      evidence: [{
        referenceId: "only-reference",
        kind: "official_public_safety_source",
        independentlyVerified: true,
        verifiedAt: new Date("2026-10-10T14:30:00.000Z"),
      }],
    });
    const duplicateReferences = validSubmission({
      evidence: validSubmission().evidence.map((evidence) => ({ ...evidence, referenceId: "same-reference" })),
    });
    const unrecognizedEvidence = validSubmission({
      evidence: validSubmission().evidence.map((evidence) => ({ ...evidence, kind: "unverified_source" })) as never,
    });
    const futureDatedEvidence = validSubmission({
      evidence: validSubmission().evidence.map((evidence) => ({
        ...evidence,
        verifiedAt: new Date("2026-10-10T15:01:00.000Z"),
      })),
    });

    expect(assessSeriousCredibleThreat(oneVerifiedReference, NOW).blockers).toContain("insufficient_verified_evidence");
    expect(assessSeriousCredibleThreat(duplicateReferences, NOW).blockers).toContain("insufficient_verified_evidence");
    expect(assessSeriousCredibleThreat(unrecognizedEvidence, NOW).blockers).toContain("insufficient_verified_evidence");
    expect(assessSeriousCredibleThreat(futureDatedEvidence, NOW).blockers).toContain("insufficient_verified_evidence");
  });

  it("requires an approved, attributable moderator decision and moderated public copy", () => {
    const assessment = assessSeriousCredibleThreat(validSubmission({
      moderation: {
        decision: "approved",
        moderatorId: null,
        reviewedAt: new Date("2026-10-10T14:45:00.000Z"),
        publicSummary: null,
      },
    }), NOW);

    expect(assessment.eligibleToQueue).toBe(false);
    expect(assessment.blockers).toContain("moderation_not_approved");
    expect(assessment.safeNotice).toBeNull();
  });

  it("rejects exact member-location fields and produces an anonymous city-level notice only after every gate passes", () => {
    const preciseArea = {
      city: "123 Market Street",
      region: "PA",
      latitude: 39.9526,
      longitude: -75.1652,
    } as never;
    const blocked = assessSeriousCredibleThreat(validSubmission({ area: preciseArea }), NOW);
    expect(blocked.blockers).toContain("unsafe_or_precise_location");
    expect(blocked.safeNotice).toBeNull();

    const assessment = assessSeriousCredibleThreat(validSubmission(), NOW);
    expect(assessment).toMatchObject({
      blockers: [],
      eligibleToQueue: true,
      notificationState: "queued",
      safeNotice: {
        threatCategory: "imminent_violence",
        city: "Philadelphia",
        region: "PA",
        noticeState: "active",
      },
    });
    expect(JSON.stringify(assessment.safeNotice)).not.toMatch(
      /reporter|moderator|reference|evidence|latitude|longitude|street|venue/i,
    );
  });

  it("does not overstate queued or provider-accepted notifications as delivered", () => {
    expect(recordThreatNotificationOutcome("not_eligible", "provider_accepted")).toBe("not_eligible");
    expect(recordThreatNotificationOutcome("queued", "delivery_confirmed")).toBe("queued");
    expect(recordThreatNotificationOutcome("queued", "provider_accepted")).toBe("provider_accepted");
    expect(recordThreatNotificationOutcome("provider_accepted", "delivery_confirmed")).toBe("delivery_confirmed");
    expect(recordThreatNotificationOutcome("queued", "delivery_failed")).toBe("delivery_failed");
  });

  it("plans expiration, withdrawal, and correction as auditable state changes without deletion", () => {
    const active = {
      noticeState: "active" as const,
      summary: "Follow official guidance.",
      expiresAt: new Date("2026-10-10T14:59:00.000Z"),
    };

    const expired = planThreatLifecycleUpdate(active, {
      action: "expire",
      actor: "scheduler",
      occurredAt: NOW,
    });
    expect(expired).toMatchObject({
      accepted: true,
      nextRecord: { noticeState: "expired", summary: active.summary },
      deactivateNotice: true,
      irreversibleDeletion: false,
      auditEvent: { action: "expire", actor: "scheduler" },
    });

    const withdrawn = planThreatLifecycleUpdate(active, {
      action: "withdraw",
      actor: "reporter_verified",
      occurredAt: NOW,
      reason: "I am withdrawing this report.",
    });
    expect(withdrawn).toMatchObject({
      accepted: true,
      nextRecord: { noticeState: "withdrawn", summary: active.summary },
      deactivateNotice: true,
      irreversibleDeletion: false,
      auditEvent: { action: "withdraw", actor: "reporter_verified" },
    });

    const corrected = planThreatLifecycleUpdate(active, {
      action: "correct",
      actor: "moderator",
      occurredAt: NOW,
      correctedSummary: "Official guidance was updated; follow the revised notice.",
    });
    expect(corrected).toMatchObject({
      accepted: true,
      nextRecord: {
        noticeState: "corrected",
        summary: "Official guidance was updated; follow the revised notice.",
      },
      deactivateNotice: false,
      irreversibleDeletion: false,
      auditEvent: { action: "correct", actor: "moderator" },
    });
  });
});
