/**
 * Immediate identity-context safety policy.
 *
 * This module deliberately accepts only the current user turn. Stored profiles, names,
 * locations, and preferences are not evidence of identity. A future purpose-consent
 * ledger may define a broader policy; until then, every returned value is ephemeral.
 */

export type ExplicitIdentityKind = "demographic" | "nationality" | "ethnicity" | "sex";

export interface UntrustedIdentityInputs {
  name?: string | null;
  city?: string | null;
  countryOriginPreference?: string | null;
  businessPreference?: string | null;
  storedCulturalProfile?: unknown;
}

export interface PermittedIdentityContext {
  /** A self-description, only when directly stated in this current turn. */
  demographic: string | null;
  /** Alias intended for retrieval query construction. */
  demographicQualifier: string | null;
  /** An explicitly named group, which is not necessarily the member's own identity. */
  requestedPopulation: string | null;
  identityKind: ExplicitIdentityKind | null;
  communityLabel: string;
  source: "explicit_current_turn" | "none";
  persist: false;
  persistence: "none";
  diagnosisAllowed: false;
  purposeConsentLedgerPresent: false;
}

const GROUP_WORDING = [
  "African American women",
  "African American men",
  "African Americans",
  "Black women",
  "Black woman",
  "Black men",
  "Black man",
  "Black people",
  "Black community",
  "Latina women",
  "Latino men",
  "Latinx people",
  "Hispanic women",
  "Hispanic men",
  "Indigenous women",
  "Indigenous men",
  "Native American women",
  "Native American men",
  "Asian American women",
  "Asian American men",
  "South Asian women",
  "South Asian men",
  "East Asian women",
  "East Asian men",
  "Middle Eastern women",
  "Middle Eastern men",
  "Arab women",
  "Arab men",
  "white women",
  "white men",
  "biracial people",
  "multiracial people",
] as const;

const NATIONALITY_WORDING = [
  "American", "Nigerian", "Ghanaian", "Kenyan", "Ethiopian", "Eritrean",
  "South African", "Jamaican", "Haitian", "Bahamian", "Barbadian",
  "Trinidadian", "Tobagonian", "Guyanese", "Brazilian", "Colombian",
  "Mexican", "Cuban", "Dominican", "Puerto Rican", "Canadian", "British",
  "French", "German", "Italian", "Spanish", "Portuguese", "Irish",
  "Indian", "Pakistani", "Bangladeshi", "Sri Lankan", "Chinese", "Japanese",
  "Korean", "Filipino", "Vietnamese", "Thai", "Indonesian", "Malaysian",
  "Australian", "New Zealander", "Egyptian", "Moroccan", "Lebanese",
  "Palestinian", "Jordanian", "Saudi", "Emirati", "Turkish",
] as const;

const ETHNICITY_WORDING = [
  "African American", "Afro-Caribbean", "Afro-Latino", "Afro-Latina",
  "Latino", "Latina", "Latinx", "Hispanic", "Indigenous", "Native American",
  "Asian American", "South Asian", "East Asian", "Middle Eastern", "Arab",
  "Black", "white", "biracial", "multiracial",
] as const;

const SEX_WORDING = ["female", "male", "intersex"] as const;

function escapedAlternation(values: readonly string[]): string {
  return [...values]
    .sort((a, b) => b.length - a.length)
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
}

const GROUP_ALTERNATION = escapedAlternation(GROUP_WORDING);
const NATIONALITY_ALTERNATION = escapedAlternation(NATIONALITY_WORDING);
const ETHNICITY_ALTERNATION = escapedAlternation(ETHNICITY_WORDING);
const SEX_ALTERNATION = escapedAlternation(SEX_WORDING);
const ANY_EXPLICIT_WORDING = `${GROUP_ALTERNATION}|${NATIONALITY_ALTERNATION}|${ETHNICITY_ALTERNATION}|${SEX_ALTERNATION}`;

function normalizeWording(value: string): string {
  const known = [...GROUP_WORDING, ...NATIONALITY_WORDING, ...ETHNICITY_WORDING, ...SEX_WORDING]
    .find((candidate) => candidate.toLowerCase() === value.trim().toLowerCase());
  return known ?? value.trim().replace(/\s+/g, " ");
}

function classifyKind(value: string): ExplicitIdentityKind {
  const lower = value.toLowerCase();
  if (SEX_WORDING.some((candidate) => candidate.toLowerCase() === lower)) return "sex";
  if (NATIONALITY_WORDING.some((candidate) => candidate.toLowerCase() === lower)) return "nationality";
  if (GROUP_WORDING.some((candidate) => candidate.toLowerCase() === lower)) return "demographic";
  return "ethnicity";
}

function labelFor(value: string): string {
  const labels: Record<string, string> = {
    "black woman": "Black women",
    "black man": "Black men",
    "african american woman": "African American women",
    "african american man": "African American men",
    female: "people who explicitly share that sex context",
    male: "people who explicitly share that sex context",
    intersex: "intersex people",
  };
  return labels[value.toLowerCase()] ?? (/\b(people|women|men|community|americans)\b/i.test(value)
    ? value
    : `${value} community`);
}

function explicitSelfDescription(turn: string): string | null {
  const declarationPatterns = [
    new RegExp(`\\b(?:i\\s+am|i['’]?m|i\\s+identify\\s+as)\\s+(?:a|an)?\\s*(${ANY_EXPLICIT_WORDING})\\b(?![-\\s]+owned)`, "i"),
    new RegExp(`\\bas\\s+(?:a|an)\\s+(${ANY_EXPLICIT_WORDING})\\b(?![-\\s]+owned)`, "i"),
    new RegExp(`\\bmy\\s+(?:race|ethnicity|nationality|sex)\\s+is\\s+(${ANY_EXPLICIT_WORDING})\\b`, "i"),
  ];

  for (const pattern of declarationPatterns) {
    const match = turn.match(pattern);
    if (match?.[1]) return normalizeWording(match[1]);
  }
  return null;
}

/** Return explicit group wording without converting it into a member identity claim. */
export function extractExplicitPopulationWording(currentUserTurn: string): string | null {
  const selfDescription = explicitSelfDescription(currentUserTurn);
  if (selfDescription) return selfDescription;

  const groupMatch = currentUserTurn.match(new RegExp(`\\b(${GROUP_ALTERNATION})\\b(?![-\\s]+owned)`, "i"));
  return groupMatch?.[1] ? normalizeWording(groupMatch[1]) : null;
}

/**
 * Resolve the only identity context permitted by the immediate policy.
 * `_ignored` documents unsafe inputs for callers and is intentionally never read.
 */
export function permittedIdentityContext(
  currentUserTurn: string,
  _ignored?: UntrustedIdentityInputs,
): PermittedIdentityContext {
  const demographic = explicitSelfDescription(currentUserTurn);
  const requestedPopulation = extractExplicitPopulationWording(currentUserTurn);
  const permittedValue = demographic ?? requestedPopulation;

  return {
    demographic,
    demographicQualifier: permittedValue,
    requestedPopulation,
    identityKind: demographic ? classifyKind(demographic) : null,
    communityLabel: permittedValue ? labelFor(permittedValue) : "your community",
    source: permittedValue ? "explicit_current_turn" : "none",
    persist: false,
    persistence: "none",
    diagnosisAllowed: false,
    purposeConsentLedgerPresent: false,
  };
}

export const getPermittedIdentityContext = permittedIdentityContext;
