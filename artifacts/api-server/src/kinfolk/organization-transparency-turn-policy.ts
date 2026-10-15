/**
 * Current-turn organization research policy for Kinfolk.
 *
 * This is intentionally independent from the existing broad Kinfolk intent
 * class. A single high-level medical or business intent can contain materially
 * different organization questions, and those questions must not be answered
 * by blending clinical evidence, workplace experience, factual identity, or
 * promotional eligibility.
 */

export type OrganizationTransparencyTurnKind =
  | "not_applicable"
  | "organization_factual_lookup"
  | "organization_experience_submission"
  | "employer_research"
  | "healthcare_workplace_research"
  | "healthcare_care_research";

const HEALTHCARE_ORGANIZATION =
  /\b(?:hospital|health\s*system|clinic|medical\s*center|doctor(?:'s)?\s*office|urgent\s*care|nursing\s*home|care\s*facility|dental\s*(?:office|clinic)|pharmacy)\b/i;
const CARE_REQUEST =
  /\b(?:patient|caregiver|care\s+quality|clinical|treatment|appointment|diagnosis|procedure|insurance|medical\s+care|health\s+care|doctor|nurse|clinician)\b/i;
const WORKPLACE_REQUEST =
  /\b(?:work(?:ed|ing)?|employee|former\s+employee|staff(?:ing)?|nurses?|workplace|employer|hiring|job\s+applicant|contractor|manager|compensation|pay|benefits|scheduling|retaliation|accommodation|union)\b/i;
const EXPERIENCE_REQUEST =
  /\b(?:share|submit|add|write|leave|report)\b[\s\S]{0,80}\b(?:experience|review|feedback|workplace|patient|caregiver)\b/i;
const FACTUAL_ORGANIZATION_REQUEST =
  /\b(?:is|does|what|where|who)\b[\s\S]{0,100}\b(?:company|organization|employer|hospital|clinic|business|school|nonprofit)\b/i;

export function classifyOrganizationTransparencyTurn(
  message: string,
): OrganizationTransparencyTurnKind {
  const trimmed = message.trim();
  if (!trimmed) return "not_applicable";
  if (EXPERIENCE_REQUEST.test(trimmed))
    return "organization_experience_submission";
  if (
    HEALTHCARE_ORGANIZATION.test(trimmed) &&
    WORKPLACE_REQUEST.test(trimmed)
  ) {
    return "healthcare_workplace_research";
  }
  if (HEALTHCARE_ORGANIZATION.test(trimmed) && CARE_REQUEST.test(trimmed)) {
    return "healthcare_care_research";
  }
  if (
    WORKPLACE_REQUEST.test(trimmed) &&
    /\b(?:company|organization|employer|workplace|job|office|business|school|nonprofit|retailer)\b/i.test(
      trimmed,
    )
  ) {
    return "employer_research";
  }
  if (FACTUAL_ORGANIZATION_REQUEST.test(trimmed))
    return "organization_factual_lookup";
  return "not_applicable";
}

export function buildOrganizationTransparencyPrompt(
  kind: OrganizationTransparencyTurnKind,
): string {
  if (kind === "not_applicable") return "";

  const common = [
    "ORGANIZATION TRANSPARENCY RULES — CURRENT TURN ONLY",
    "- Keep factual organization identity, member experience, owner claims, map eligibility, Kinfolk eligibility, and promotional eligibility separate.",
    "- Never infer an ownership designation, verified owner, map pin, recommendation, promotion, legal compliance, clinical quality, or platform consensus from a name, a member story, a review, or a claim.",
    "- Do not create a universal star score or turn a thematic member experience into a ranking.",
  ];

  if (kind === "organization_factual_lookup") {
    return [
      ...common,
      "- Answer only from current factual/official sources or a verified MWM factual profile. State when a fact is not verified.",
      "- A factual listing may be searchable even when it is not pinnable, promoted, or eligible for a Kinfolk recommendation.",
    ].join("\n");
  }

  if (kind === "organization_experience_submission") {
    return [
      ...common,
      "- Explain that a member experience must use a relationship type (current employee, former employee, contractor, job applicant, customer, patient, or caregiver), bounded themes, privacy choice, and moderation.",
      "- Do not ask the member to disclose diagnosis, full employment file, legal strategy, unrelated personal data, or protected medical information in chat.",
      "- Do not present submission as an automatic public post; it remains pending moderation.",
    ].join("\n");
  }

  if (kind === "employer_research") {
    return [
      ...common,
      "- Treat workplace experience as contextual member perspective, not a legal conclusion about discrimination, retaliation, compensation, compliance, or a guaranteed employment outcome.",
      "- Separate management/respect, compensation/advancement, accommodations, scheduling/benefits, complaint handling, and workplace culture. Do not flatten them into a score.",
      "- When a request may involve legal rights or an urgent safety issue, preserve the existing legal or safety evidence route instead of relying on community experience.",
    ].join("\n");
  }

  if (kind === "healthcare_workplace_research") {
    return [
      ...common,
      "- This is healthcare workplace research, not patient-care quality research. Keep staff workplace experience separate from clinical outcomes, diagnosis, treatment, appointment availability, licensing, and patient safety claims.",
      "- Staff themes may cover staffing, management, safety-reporting process, scheduling, advancement, or discrimination/retaliation, but they are not proof of care quality.",
      "- Do not use staff or patient stories to recommend or rule out medical care. Preserve any medical/legal/safety guardrails for the current turn.",
    ].join("\n");
  }

  return [
    ...common,
    "- This is healthcare care research. Community experience is contextual only and must never support a clinical-quality, credential, treatment, appointment, insurance, price, accessibility, or referral claim.",
    "- Use source-backed clinical information only: official facility sources, government sources, accreditors, licensing boards, or professional associations. Include source date when available and state what remains unverified.",
    "- Do not substitute a general business listing, a map pin, an ownership tag, a rating, or a Kinfolk promotion for a qualified care pathway.",
  ].join("\n");
}
