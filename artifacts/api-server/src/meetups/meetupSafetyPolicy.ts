export const MEETUP_SAFETY_POLICY_VERSION = "consent_first_adult_identity_transparency_v2";
export const MEETUP_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export type MeetupAgeBand = "unknown" | "13_15" | "16_17" | "18_plus";
export type MeetupEligibilityCode =
  | "eligible_adult"
  | "age_assurance_required"
  | "minor_not_available";

export type MeetupEligibility = {
  allowed: boolean;
  code: MeetupEligibilityCode;
  message: string;
};

export function resolveMeetupEligibility(
  ageBand: MeetupAgeBand,
): MeetupEligibility {
  if (ageBand === "18_plus") {
    return {
      allowed: true,
      code: "eligible_adult",
      message: "Meetup Verification is available.",
    };
  }

  if (ageBand === "16_17" || ageBand === "13_15") {
    return {
      allowed: false,
      code: "minor_not_available",
      message: "Meetup Verification is currently available only to members confirmed as 18+. A minor-specific safety design has not been approved.",
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
