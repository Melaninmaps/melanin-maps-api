/**
 * Audience Policy — Age-Aware Delivery
 *
 * Central enforcement point for age-band checks. All decisions use the derived
 * age_band from user_age_assurance; raw date_of_birth is never exposed here,
 * to Kinfolk, sessions, profiles, or any client-facing DTO.
 */

import { pool } from "@workspace/db";

export type AgeBand = "unknown" | "under_13" | "13_15" | "16_17" | "18_plus";
export type AudienceDecision = "allowed" | "adapted" | "context_screen" | "blocked";
export type GraphicLevel = "none" | "limited" | "graphic";

type StoredAgeBand = AgeBand | null | undefined;

const rank: Record<AgeBand, number> = {
  unknown: 0,
  under_13: -1,
  "13_15": 1,
  "16_17": 2,
  "18_plus": 3,
};

/**
 * Preserve an explicitly assured band.  A legacy null band may be upgraded
 * from DOB only when DOB proves the member is already 18; anything missing,
 * malformed, or younger remains protective.
 *
 * DOB is deliberately consumed here and is never returned to Kinfolk callers.
 */
export function resolveMemberAgeBand(
  storedBand: StoredAgeBand,
  dateOfBirth: Date | string | null | undefined,
  now = new Date(),
): AgeBand {
  if (storedBand === "under_13" || storedBand === "13_15" || storedBand === "16_17" || storedBand === "18_plus") {
    return storedBand;
  }

  if (!dateOfBirth) return "unknown";
  const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "unknown";

  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const birthdayHasOccurred = (
    now.getUTCMonth() > dob.getUTCMonth()
    || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() >= dob.getUTCDate())
  );
  if (!birthdayHasOccurred) age -= 1;
  return age >= 18 ? "18_plus" : "unknown";
}

export async function getMemberAgeBand(userId: string): Promise<AgeBand> {
  try {
    const r = await pool.query<{ age_band: StoredAgeBand; date_of_birth: Date | string | null }>(
      `SELECT uaa.age_band, u.date_of_birth
         FROM users u
         LEFT JOIN user_age_assurance uaa ON uaa.user_id = u.id
        WHERE u.id = $1
        LIMIT 1`,
      [userId],
    );
    return resolveMemberAgeBand(r.rows[0]?.age_band, r.rows[0]?.date_of_birth);
  } catch {
    return "unknown";
  }
}

export function decideAudienceAccess(input: {
  memberBand: AgeBand;
  minimumAgeBand: "13_15" | "16_17" | "18_plus";
  graphicLevel: GraphicLevel;
  requiresContextScreen: boolean;
  domain: "kinfolk" | "library" | "community" | "safety" | "event" | "business_media";
}): AudienceDecision {
  const { memberBand, minimumAgeBand, graphicLevel, requiresContextScreen, domain } = input;
  if (memberBand === "under_13") return "blocked";
  if (rank[memberBand] < rank[minimumAgeBand]) return "blocked";
  if (memberBand !== "18_plus" && graphicLevel === "graphic") return "blocked";
  if (memberBand !== "18_plus" && graphicLevel === "limited") return "context_screen";
  if (requiresContextScreen) return "context_screen";
  if (memberBand === "13_15" && (domain === "kinfolk" || domain === "library")) return "adapted";
  return "allowed";
}

export function buildAudienceDeliveryContext(band: AgeBand): {
  audienceBand: AgeBand;
  deliveryStyle: "protective" | "teen_clear" | "teen_nuanced" | "adult_standard";
  prohibitGraphicDetail: boolean;
  prohibitAdultSocialMedia: boolean;
} {
  if (band === "13_15") return {
    audienceBand: band,
    deliveryStyle: "teen_clear",
    prohibitGraphicDetail: true,
    prohibitAdultSocialMedia: true,
  };
  if (band === "16_17") return {
    audienceBand: band,
    deliveryStyle: "teen_nuanced",
    prohibitGraphicDetail: true,
    prohibitAdultSocialMedia: true,
  };
  if (band === "18_plus") return {
    audienceBand: band,
    deliveryStyle: "adult_standard",
    prohibitGraphicDetail: false,
    prohibitAdultSocialMedia: false,
  };
  // unknown or under_13 → protective
  return {
    audienceBand: band,
    deliveryStyle: "protective",
    prohibitGraphicDetail: true,
    prohibitAdultSocialMedia: true,
  };
}

/**
 * Build the exact system-prompt text that Kinfolk receives about audience.
 * Kinfolk receives only audienceBand — never DOB, numeric age, or parent data.
 */
export function buildAudienceSystemInstruction(band: AgeBand): string {
  const ctx = buildAudienceDeliveryContext(band);
  const baseRule = `
AGE-AWARE DELIVERY RULES
- You receive only a derived audience band, never a member's date of birth.
- For audienceBand=13_15: use plain, respectful, age-appropriate language; define unfamiliar terms; avoid graphic detail, adult sexual detail, mature community media, or fear-amplifying wording; never talk down to the member.
- Keep facts, source standards, uncertainty, and emergency safety guidance identical across audience bands. Adjust presentation, not truth.
- Do not ask the member to reveal age in a sensitive conversation. If age is unknown, use the protective delivery style.
- Do not infer maturity, identity, beliefs, health status, or support network from a member's questions.
- For medical information, state it is general education, not a diagnosis. If a message includes emergency warning signs, use the emergency response flow before any long explanation.
`.trim();

  if (ctx.prohibitGraphicDetail) {
    return `${baseRule}\n- audienceBand=${band}: prohibitGraphicDetail=true, prohibitAdultSocialMedia=true, deliveryStyle=${ctx.deliveryStyle}`;
  }
  return `${baseRule}\n- audienceBand=${band}: deliveryStyle=${ctx.deliveryStyle}`;
}
