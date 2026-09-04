/**
 * Kinfolk Member Context — Minimum-Use Policy
 *
 * Assembles only the identity signals Kinfolk is actually permitted to use
 * for a given request. This is the ONLY place sex/gender/pronoun signals
 * are translated into Kinfolk-usable form. All other code must go through here.
 *
 * PERMITTED USES:
 *   audienceBand      → age-appropriate content delivery (from user_age_assurance)
 *   pronounMode       → Kinfolk writing tone (opt-in only, allowPronounAwareLanguage=true)
 *   reproductiveContext → medically relevant context for opted-in reproductive anatomy questions only
 *
 * PROHIBITED USES (enforced by not returning them):
 *   - Cultural, business, or safety recommendation ranking
 *   - Creator or partnership matching
 *   - Library growth signal derivation
 *   - Advertising or any public-facing feature
 *   - Any intent class other than 'medical_health' for reproductiveContext
 *   - Political, opinion, cultural-consensus questions
 *
 * DATA MINIMIZATION: this function is the ceiling, not the floor.
 * Callers may use fewer fields than returned. They must not fetch
 * identity context through any other mechanism.
 */

import { pool } from "@workspace/db";
import { resolveMemberAgeBand, type AgeBand } from "../lib/audience-policy";

export type AudienceBand = AgeBand;

export type PronounMode =
  | "none"       // not opted in, or not set
  | "she_her"
  | "he_him"
  | "they_them"
  | "use_name"   // Kinfolk uses the member's first name instead of pronouns
  | "custom";    // custom text (passed as customPronounsText, never stored in prompt)

export type KinfolkMemberContext = {
  audienceBand: AudienceBand;
  pronounMode: PronounMode;
  customPronounsText?: string | null;
  // Only present when: allowMedicallyRelevantContext=true AND intentClass='medical_health'
  // AND isReproductiveAnatomyRelevant(topic)=true. Never present otherwise.
  reproductiveContext?: "female" | "male" | "intersex";
};

/** Raw row returned from identity context query */
interface IdentityContextRow {
  sex_assigned_at_birth: string | null;
  gender_identity: string | null;
  pronoun_set: string | null;
  custom_pronouns_ciphertext: string | null;
  allow_medically_relevant_context: boolean;
  allow_pronoun_aware_language: boolean;
}

/** Raw row from age assurance query */
interface AgeAssuranceRow {
  age_band: AudienceBand | null;
  date_of_birth: Date | string | null;
}

// Keywords that indicate the question is specifically about reproductive anatomy.
// This list is conservative — false negatives (not triggering context) are acceptable;
// false positives (triggering when irrelevant) are not.
const REPRODUCTIVE_ANATOMY_PATTERNS = [
  /\b(prostate|psa|prostatitis)\b/i,
  /\b(ovari|uterus|uterine|endometri|fallopian|menstrual|menstruation|period|menopause|pcos|polycystic ovary)\b/i,
  /\b(cervical|cervix|pap smear|colposcopy)\b/i,
  /\b(testicular|testicle|testis|orchitis)\b/i,
  /\b(breast cancer|mammogram|mastectomy)\b/i,
  /\b(pregnancy|prenatal|postpartum|maternal|childbirth|labor|delivery|obstetric|ob.gyn|midwife)\b/i,
  /\b(fertility|infertility|ivf|egg freezing|sperm count|vasectomy|tubal)\b/i,
  /\b(erectile dysfunction|penis|vagina|vulva|clitoris|labia)\b/i,
  /\b(sex hormone|testosterone|estrogen|progesterone|hrt|hormone replacement)\b/i,
];

export function isReproductiveAnatomyRelevant(topic: string): boolean {
  return REPRODUCTIVE_ANATOMY_PATTERNS.some((re) => re.test(topic));
}

function mapPronounSet(row: IdentityContextRow): PronounMode {
  switch (row.pronoun_set) {
    case "she_her":   return "she_her";
    case "he_him":    return "he_him";
    case "they_them": return "they_them";
    case "use_my_name": return "use_name";
    case "custom":    return "custom";
    default:          return "none";
  }
}

/**
 * Load and assemble a Kinfolk-safe member context for one request.
 * Returns a minimal context with audienceBand='unknown' and pronounMode='none'
 * on any database error — never throws.
 *
 * Call once per chat request, before building the system prompt.
 */
export async function loadKinfolkMemberContext(
  userId: string,
  intentClass: string,
  topic: string,
): Promise<KinfolkMemberContext> {
  try {
    const [ageRow, identityRow] = await Promise.all([
      pool.query<AgeAssuranceRow>(
        `SELECT uaa.age_band, u.date_of_birth
           FROM users u
           LEFT JOIN user_age_assurance uaa ON uaa.user_id = u.id
          WHERE u.id = $1
          LIMIT 1`,
        [userId],
      ).then((r) => r.rows[0] ?? null),
      pool.query<IdentityContextRow>(
        `SELECT sex_assigned_at_birth, gender_identity, pronoun_set,
                custom_pronouns_ciphertext,
                allow_medically_relevant_context, allow_pronoun_aware_language
         FROM user_identity_context WHERE user_id = $1 LIMIT 1`,
        [userId],
      ).then((r) => r.rows[0] ?? null),
    ]);

    // A legacy null band can use DOB only to establish adulthood. Minors and
    // absent/invalid DOBs remain in the protective unknown band.
    const audienceBand: AudienceBand = resolveMemberAgeBand(
      ageRow?.age_band,
      ageRow?.date_of_birth,
    );

    const out: KinfolkMemberContext = {
      audienceBand,
      pronounMode: "none",
    };

    if (identityRow) {
      // Pronouns — only if opted in
      if (identityRow.allow_pronoun_aware_language) {
        out.pronounMode = mapPronounSet(identityRow);
        // Custom pronouns: pass the raw ciphertext key version so the caller
        // knows a custom value exists, but never decode it here. The actual
        // text is fetched separately only for the identity-context GET endpoint
        // (same authenticated member only).
        if (out.pronounMode === "custom") {
          out.customPronounsText = null; // placeholder — caller fetches if needed
        }
      }

      // Reproductive context — narrowly scoped to medical + anatomy relevance + opt-in
      if (
        identityRow.allow_medically_relevant_context &&
        intentClass === "medical_health" &&
        isReproductiveAnatomyRelevant(topic)
      ) {
        const saab = identityRow.sex_assigned_at_birth;
        if (saab === "female" || saab === "male" || saab === "intersex") {
          out.reproductiveContext = saab;
        }
      }
    }

    return out;
  } catch {
    // Non-fatal: return minimal context. Never expose errors to caller.
    return { audienceBand: "unknown", pronounMode: "none" };
  }
}

/**
 * Build a Kinfolk system prompt addendum for pronoun-aware language.
 * Returns empty string when pronouns are not opted in.
 *
 * The addendum tells Kinfolk how to refer to the member, nothing more.
 * It must not leak the stored value to the model in a way that could
 * appear in a response or log.
 */
export function buildPronounInstruction(
  ctx: KinfolkMemberContext,
  memberFirstName: string | null,
): string {
  if (ctx.pronounMode === "none") return "";
  const name = memberFirstName ?? "this member";
  switch (ctx.pronounMode) {
    case "she_her":
      return `PRONOUN PREFERENCE (private): When referring to this member in the third person, use she/her. Never announce the stored preference.`;
    case "he_him":
      return `PRONOUN PREFERENCE (private): When referring to this member in the third person, use he/him. Never announce the stored preference.`;
    case "they_them":
      return `PRONOUN PREFERENCE (private): When referring to this member in the third person, use they/them. Never announce the stored preference.`;
    case "use_name":
      return `PRONOUN PREFERENCE (private): When referring to this member in the third person, use their name (${name}) instead of a pronoun. Never announce the stored preference.`;
    case "custom":
      // Custom pronouns are not decoded at this layer — don't inject the ciphertext.
      // The model won't know the custom set; default to name usage.
      return `PRONOUN PREFERENCE (private): When referring to this member in the third person, use their name (${name}) or rephrase to avoid pronouns. Never announce the stored preference.`;
    default:
      return "";
  }
}

/**
 * Build the reproductive context addendum for the Kinfolk system prompt.
 * Returns empty string when context is not available or not applicable.
 *
 * Kinfolk may say something like:
 *   "If you want, I can explain how this affects people with
 *    the reproductive anatomy you selected in your private settings."
 * It must NOT announce the stored selection, imply a diagnosis,
 * or use it for anything other than anatomy-specific context.
 */
export function buildReproductiveContextInstruction(
  ctx: KinfolkMemberContext,
): string {
  if (!ctx.reproductiveContext) return "";
  return `REPRODUCTIVE CONTEXT (private, medical use only): This member has opted in to receive ` +
    `anatomy-specific medical context. Their recorded sex assigned at birth is: ${ctx.reproductiveContext}. ` +
    `Use this ONLY to add relevant anatomy-specific detail to this medical response. ` +
    `Do NOT announce, reference, or imply this stored value in your reply. ` +
    `Do NOT use it to assume any other aspect of gender identity, cultural identity, or personal history. ` +
    `Do NOT use it for any non-medical part of this conversation.`;
}
