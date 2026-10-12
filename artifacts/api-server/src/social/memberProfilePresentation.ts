import { pool } from "@workspace/db";

export type MemberProfilePresentation = {
  coverObjectKey: string | null;
  showAge: boolean;
  showBirthday: boolean;
  showLocation: boolean;
  showProfessionalDetails: boolean;
  showBadges: boolean;
};

export const DEFAULT_MEMBER_PROFILE_PRESENTATION: MemberProfilePresentation = {
  coverObjectKey: null,
  showAge: false,
  showBirthday: false,
  showLocation: false,
  showProfessionalDetails: false,
  showBadges: false,
};

type PresentationRow = {
  cover_object_key: string | null;
  show_age: boolean | null;
  show_birthday: boolean | null;
  show_location: boolean | null;
  show_professional_details: boolean | null;
  show_badges: boolean | null;
};

function normalizeRow(row: PresentationRow | undefined): MemberProfilePresentation {
  if (!row) return { ...DEFAULT_MEMBER_PROFILE_PRESENTATION };
  return {
    coverObjectKey: row.cover_object_key ?? null,
    showAge: row.show_age === true,
    showBirthday: row.show_birthday === true,
    showLocation: row.show_location === true,
    showProfessionalDetails: row.show_professional_details === true,
    showBadges: row.show_badges === true,
  };
}

/**
 * Presentation preferences are additive. A deployment that has not yet applied
 * the additive table remains private-by-default rather than exposing optional
 * profile information while rolling out.
 */
export async function getMemberProfilePresentation(userId: string): Promise<MemberProfilePresentation> {
  try {
    const { rows } = await pool.query<PresentationRow>(
      `SELECT cover_object_key, show_age, show_birthday, show_location,
              show_professional_details, show_badges
         FROM member_profile_presentations_v1
        WHERE user_id = $1
        LIMIT 1`,
      [userId],
    );
    return normalizeRow(rows[0]);
  } catch {
    return { ...DEFAULT_MEMBER_PROFILE_PRESENTATION };
  }
}

export type MemberProfilePresentationPatch = Partial<Pick<
  MemberProfilePresentation,
  "showAge" | "showBirthday" | "showLocation" | "showProfessionalDetails" | "showBadges"
>>;

export function sanitizeMemberProfilePresentationPatch(value: unknown): MemberProfilePresentationPatch | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const patch: MemberProfilePresentationPatch = {};
  const fields: Array<[keyof MemberProfilePresentationPatch, string]> = [
    ["showAge", "showAge"],
    ["showBirthday", "showBirthday"],
    ["showLocation", "showLocation"],
    ["showProfessionalDetails", "showProfessionalDetails"],
    ["showBadges", "showBadges"],
  ];
  for (const [target, source] of fields) {
    if (source in raw) {
      if (typeof raw[source] !== "boolean") return null;
      patch[target] = raw[source] as never;
    }
  }
  return Object.keys(patch).length ? patch : null;
}

export async function updateMemberProfilePresentation(
  userId: string,
  patch: MemberProfilePresentationPatch & { coverObjectKey?: string | null },
): Promise<MemberProfilePresentation> {
  const current = await getMemberProfilePresentation(userId);
  const next = { ...current, ...patch };
  await pool.query(
    `INSERT INTO member_profile_presentations_v1
      (user_id, cover_object_key, show_age, show_birthday, show_location, show_professional_details, show_badges, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       cover_object_key = EXCLUDED.cover_object_key,
       show_age = EXCLUDED.show_age,
       show_birthday = EXCLUDED.show_birthday,
       show_location = EXCLUDED.show_location,
       show_professional_details = EXCLUDED.show_professional_details,
       show_badges = EXCLUDED.show_badges,
       updated_at = NOW()`,
    [
      userId,
      next.coverObjectKey,
      next.showAge,
      next.showBirthday,
      next.showLocation,
      next.showProfessionalDetails,
      next.showBadges,
    ],
  );
  return next;
}

export function ageOnDate(dateOfBirth: Date | null | undefined, now = new Date()): number | null {
  if (!(dateOfBirth instanceof Date) || Number.isNaN(dateOfBirth.getTime())) return null;
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const month = now.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < dateOfBirth.getUTCDate())) age -= 1;
  return age >= 0 && age <= 130 ? age : null;
}

export function publicBirthdayLabel(dateOfBirth: Date | null | undefined): string | null {
  if (!(dateOfBirth instanceof Date) || Number.isNaN(dateOfBirth.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(dateOfBirth);
}

/** No optional personal field is exposed for a minor, even if an older setting exists. */
export function canPresentOptionalPersonalDetails(dateOfBirth: Date | null | undefined): boolean {
  const age = ageOnDate(dateOfBirth);
  return age !== null && age >= 18;
}
