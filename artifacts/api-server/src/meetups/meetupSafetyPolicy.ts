export const MEETUP_SAFETY_POLICY_VERSION = "consent_first_meetups_v1";
export const MEETUP_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export type MeetupAgeBand = "unknown" | "13_15" | "16_17" | "18_plus";
export type MeetupEligibilityCode =
  | "eligible_adult"
  | "eligible_guardian_approved"
  | "age_assurance_required"
  | "under_16_not_available"
  | "guardian_approval_required";

export type MeetupEligibility = {
  allowed: boolean;
  code: MeetupEligibilityCode;
  message: string;
};

export function resolveMeetupEligibility(
  ageBand: MeetupAgeBand,
  hasGuardianApproval: boolean,
): MeetupEligibility {
  if (ageBand === "18_plus") {
    return {
      allowed: true,
      code: "eligible_adult",
      message: "Meetup Verification is available.",
    };
  }

  if (ageBand === "16_17" && hasGuardianApproval) {
    return {
      allowed: true,
      code: "eligible_guardian_approved",
      message: "Meetup Verification is available with recorded guardian approval.",
    };
  }

  if (ageBand === "16_17") {
    return {
      allowed: false,
      code: "guardian_approval_required",
      message: "Meetup Verification requires recorded guardian approval for members ages 16–17.",
    };
  }

  if (ageBand === "13_15") {
    return {
      allowed: false,
      code: "under_16_not_available",
      message: "Meetup Verification is not available to members under 16.",
    };
  }

  return {
    allowed: false,
    code: "age_assurance_required",
    message: "Confirm your age range before using Meetup Verification.",
  };
}

export function parseOptionalFutureDate(value: unknown, fieldName: string): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${fieldName} must be an ISO date-time.`);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${fieldName} must be a valid date-time.`);
  if (parsed.getTime() <= Date.now()) throw new Error(`${fieldName} must be in the future.`);
  if (parsed.getTime() > Date.now() + 366 * 24 * 60 * 60 * 1000) {
    throw new Error(`${fieldName} must be within one year.`);
  }
  return parsed;
}

export function optionalSafeText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${fieldName} must be text.`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  if (normalized.length > maxLength) throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  return normalized;
}

export function containsLikelyStreetAddress(value: string | null): boolean {
  if (!value) return false;
  return /\b\d{1,6}\s+[^,]+\s+(street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|court|ct\.?|parkway|pkwy\.?|way)\b/i.test(value);
}

export function validateMeetingPlace(city: string | null, venueName: string | null): void {
  if (containsLikelyStreetAddress(city) || containsLikelyStreetAddress(venueName)) {
    throw new Error("Use a city, neighborhood, or public venue name—not a street address.");
  }
}

export function nonSensitiveMeetupFields() {
  return [
    "city",
    "venueName",
    "scheduledFor",
    "note",
    "trustedSafetyContact",
    "arrivalCheckAt",
    "homeCheckAt",
  ] as const;
}
