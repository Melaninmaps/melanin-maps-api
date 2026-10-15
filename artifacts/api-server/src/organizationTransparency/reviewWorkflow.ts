import type { ExperienceStatus, ExperiencePrivacyLevel } from "./policy";

export const EXPERIENCE_REVIEW_DISPOSITIONS = [
  "publish",
  "hold",
  "reject",
] as const;
export type ExperienceReviewDisposition =
  (typeof EXPERIENCE_REVIEW_DISPOSITIONS)[number];

export type ExperienceReviewDecision = Readonly<{
  disposition: ExperienceReviewDisposition;
  reason: string;
}>;

export type ExperienceReviewResult = Readonly<{
  experienceId: string;
  status: ExperienceStatus;
  privacyLevel: ExperiencePrivacyLevel;
  reviewerReason: string;
}>;

/**
 * Publication is permitted only for a pseudonymous-public experience. A private
 * submission can be reviewed and retained for moderator follow-up, but never
 * crosses into a public surface by an accidental decision label.
 */
export function statusForExperienceReview(
  decision: ExperienceReviewDecision,
  privacyLevel: ExperiencePrivacyLevel,
): ExperienceStatus {
  if (decision.disposition === "publish") {
    if (privacyLevel !== "pseudonymous_public") {
      throw new Error("Only a pseudonymous-public experience can be published");
    }
    return "published";
  }
  return decision.disposition === "hold" ? "held" : "rejected";
}

export function experienceStatusRecovery(status: ExperienceStatus): Readonly<{
  label: string;
  memberMessage: string;
  appealAvailable: boolean;
}> {
  switch (status) {
    case "pending_moderation":
      return {
        label: "Under review",
        memberMessage:
          "Your experience is under review and is not visible to other members.",
        appealAvailable: false,
      };
    case "published":
      return {
        label: "Published pseudonymously",
        memberMessage:
          "Your approved experience is visible without your member identity.",
        appealAvailable: false,
      };
    case "held":
      return {
        label: "Held for review",
        memberMessage:
          "Your experience is not public. You may submit a concise appeal or clarification for a reviewer.",
        appealAvailable: true,
      };
    case "rejected":
      return {
        label: "Not published",
        memberMessage:
          "Your experience is not public. You may submit one appeal with factual clarification for a reviewer.",
        appealAvailable: true,
      };
    case "withdrawn":
      return {
        label: "Withdrawn",
        memberMessage: "You withdrew this experience, and it is not public.",
        appealAvailable: false,
      };
  }
}
