import { checkContent } from "../lib/contentFilter";
import type { ExperienceContext } from "./policy";

export type ExperienceSafetyAssessment = Readonly<{
  normalizedNarrative: string | undefined;
  moderationFlags: readonly string[];
}>;

/**
 * Focused privacy guard for Organization Transparency narratives.
 *
 * This guard is intentionally stricter than the general community content
 * filter: organization experiences can concern employment and healthcare, so
 * public text must not carry direct identifiers, record identifiers, medical
 * records, or a named individual clinician/worker allegation. It does not
 * diagnose truth; it routes bounded contextual claims to human moderation.
 */
const BLOCKED_PATTERNS: ReadonlyArray<
  Readonly<{ flag: string; expression: RegExp }>
> = [
  {
    flag: "email_address",
    expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  },
  {
    flag: "telephone_number",
    expression: /(?:\+?1[ .-]?)?(?:\(?\d{3}\)?[ .-]?)\d{3}[ .-]?\d{4}\b/,
  },
  { flag: "social_security_number", expression: /\b\d{3}-?\d{2}-?\d{4}\b/ },
  {
    flag: "medical_record_identifier",
    expression:
      /\b(?:MRN|medical\s+record(?:\s+(?:number|#))?|patient\s+(?:ID|number|#)|member\s+ID)\s*[:#-]?\s*[A-Z0-9-]{4,}\b/i,
  },
  {
    flag: "date_of_birth",
    expression: /\b(?:date\s+of\s+birth|DOB|born\s+on)\b/i,
  },
  {
    flag: "personal_address",
    expression:
      /\b\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:street|st\.?|avenue|ave\.?|road|rd\.?|drive|dr\.?|lane|ln\.?|boulevard|blvd\.?|court|ct\.?|apartment|apt\.?)\b/i,
  },
  {
    flag: "named_individual_clinician_or_worker",
    expression:
      /\b(?:Dr\.?|Doctor|Nurse|Manager|Supervisor|Therapist|Surgeon)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/,
  },
];

const HEIGHTENED_REVIEW_PATTERNS: ReadonlyArray<
  Readonly<{ flag: string; expression: RegExp }>
> = [
  {
    flag: "unverified_serious_allegation",
    expression:
      /\b(?:crime|criminal|fraud|theft|assault|abuse|neglect|malpractice|illegal|corrupt|retaliat(?:e|ed|ion)|discriminat(?:e|ed|ion))\b/i,
  },
  {
    flag: "medical_context",
    expression:
      /\b(?:diagnosis|medication|procedure|surgery|treatment|test result|medical condition)\b/i,
  },
  {
    flag: "employment_confidentiality_context",
    expression:
      /\b(?:personnel file|HR complaint|disciplinary action|termination paperwork|confidential client)\b/i,
  },
];

export class OrganizationExperienceSafetyError extends Error {
  readonly code = "ORGANIZATION_EXPERIENCE_SENSITIVE_INFORMATION";

  constructor() {
    super(
      "Please remove personal contact details, addresses, record identifiers, dates of birth, and named individual clinical or employment allegations before submitting.",
    );
  }
}

export function assessOrganizationExperienceNarrative(
  narrative: string | undefined,
  _context: ExperienceContext,
): ExperienceSafetyAssessment {
  if (!narrative)
    return { normalizedNarrative: undefined, moderationFlags: [] };
  const normalizedNarrative = narrative.replace(/\s+/g, " ").trim();
  const content = checkContent(normalizedNarrative);
  if (!content.ok) throw new Error(content.reason);

  for (const candidate of BLOCKED_PATTERNS) {
    if (candidate.expression.test(normalizedNarrative)) {
      throw new OrganizationExperienceSafetyError();
    }
  }

  const moderationFlags = HEIGHTENED_REVIEW_PATTERNS.filter((candidate) =>
    candidate.expression.test(normalizedNarrative),
  ).map((candidate) => candidate.flag);

  return { normalizedNarrative, moderationFlags };
}
