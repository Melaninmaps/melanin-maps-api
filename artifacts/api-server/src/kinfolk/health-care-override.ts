import { permittedIdentityContext } from "./permitted-identity-context";
import type { KinfolkIntent } from "./intent-router";

export type HealthCareOverrideSource = Readonly<{
  title: string;
  url: string;
  source: "NCI" | "CDC" | "NIH MedlinePlus" | "HRSA" | "CMS Medicare";
}>;

export type HealthCareOverride = Readonly<{
  applies: boolean;
  suppressesGeneralBusinessCatalog: boolean;
  promptBlock: string;
  sources: HealthCareOverrideSource[];
}>;

const BREAST_CHANGE_RE =
  /\b(?:breast\s+(?:lump|mass|change|changes|pain|discharge)|lump\s+(?:in|on)\s+(?:my\s+)?breast|nipple\s+(?:change|changes|discharge))\b/i;

const MEDICATION_RE =
  /\b(?:medication|medicine|prescription|dose|dosage|side effect|drug interaction|interact(?:ion|s)?|missed dose|pharmacist)\b/i;

const CARE_NAVIGATION_RE =
  /\b(?:where\s+can\s+i\s+find|find\s+(?:me\s+)?|help\s+me\s+find|show\s+me|need\s+(?:a\s+)?|looking\s+for|appointment|seen\s+by|see\s+(?:a\s+)?)\b[\s\S]{0,80}\b(?:doctor|clinician|physician|specialist|hospital|clinic|primary\s+care|urgent\s+care|ob[\s/-]?gyn|gynecolog(?:ist|y)|breast\s+specialist|diagnostic\s+(?:imaging|mammogram)|oncolog(?:ist|y)|dermatolog(?:ist|y)|pharmacist)\b/i;

const EMPTY_OVERRIDE: HealthCareOverride = {
  applies: false,
  suppressesGeneralBusinessCatalog: false,
  promptBlock: "",
  sources: [],
};

function uniqueSources(
  sources: readonly HealthCareOverrideSource[],
): HealthCareOverrideSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

/**
 * Creates a health-only care-navigation contract. It deliberately does not query
 * or rank the ordinary business catalog: MWM's general directory does not store
 * current clinical credential, appointment, insurance, price, or care-quality data.
 *
 * The override is additive and applies only to the current medical turn. It does
 * not rewrite a saved Support Lens, infer a demographic, change discovery policy
 * for non-health requests, or claim that a care option is culturally responsive.
 */
export function buildHealthCareOverride(input: {
  message: string;
  intentClass: KinfolkIntent;
}): HealthCareOverride {
  if (input.intentClass !== "medical_health") return EMPTY_OVERRIDE;

  const message = input.message.trim();
  const hasBreastChange = BREAST_CHANGE_RE.test(message);
  const hasMedicationQuestion = MEDICATION_RE.test(message);
  const isCareNavigation = hasBreastChange || CARE_NAVIGATION_RE.test(message);

  if (!hasBreastChange && !hasMedicationQuestion && !isCareNavigation) {
    return EMPTY_OVERRIDE;
  }

  const identity = permittedIdentityContext(message);
  const explicitBlackWomanContext = identity.demographicQualifier === "Black woman"
    || identity.requestedPopulation === "Black women";

  const sources: HealthCareOverrideSource[] = [
    {
      title: "HRSA Find a Health Center",
      url: "https://findahealthcenter.hrsa.gov/",
      source: "HRSA",
    },
    {
      title: "Medicare Care Compare",
      url: "https://www.medicare.gov/care-compare/",
      source: "CMS Medicare",
    },
  ];

  if (hasBreastChange) {
    sources.unshift({
      title: "National Cancer Institute: Mammograms",
      url: "https://www.cancer.gov/types/breast/screening/mammograms",
      source: "NCI",
    });
  }
  if (hasBreastChange && explicitBlackWomanContext) {
    sources.push({
      title: "CDC: Cancer and African American People",
      url: "https://www.cdc.gov/cancer/health-equity/african-american.html",
      source: "CDC",
    });
  }
  if (hasMedicationQuestion) {
    sources.unshift({
      title: "MedlinePlus: Taking medicines — what to ask your provider",
      url: "https://medlineplus.gov/ency/patientinstructions/000535.htm",
      source: "NIH MedlinePlus",
    });
  }

  const breastChangeInstruction = hasBreastChange
    ? `
BREAST-SYMPTOM RULE:
- A reported lump, mass, nipple change, discharge, or other breast change needs a calm, direct care-navigation response. Do not diagnose it or reassure the member that it is benign.
- Explain that clinicians use diagnostic evaluation for a reported change; do not decide which test, treatment, or timeline is right for this individual.
- Encourage prompt contact with a licensed clinician or breast/diagnostic service. If the member describes severe or rapidly worsening symptoms, direct them to urgent local medical care or emergency services as appropriate.
- The NCI source in the returned list supports the general distinction between screening and diagnostic mammography after a lump or other change.
${explicitBlackWomanContext ? "- The member explicitly raised Black-woman context in this turn. CDC group-level context may be named carefully: it does not diagnose the member, predict an outcome, or establish provider quality." : "- Do not infer a race, ethnicity, sex, or cultural identity from saved preferences, account data, or the health concern."}`
    : "";

  const medicationInstruction = hasMedicationQuestion
    ? `
MEDICATION-QUESTION RULE:
- Do not prescribe, recommend a dose, tell the member to start/stop a medicine, or decide whether a drug interaction is safe.
- Offer a concise question list for a clinician or pharmacist: purpose, how and when to take it, expected effects, side effects, interactions with prescription/over-the-counter medicines and supplements, missed-dose instructions, and what to do before stopping.
- If the member reports a severe reaction or immediate danger, direct them to urgent local care or emergency services.`
    : "";

  const navigationInstruction = isCareNavigation
    ? `
CARE-NAVIGATION RULE:
- Health care is a care-override category for this turn. Never withhold or delay a qualified-care pathway because an ownership designation is absent from MWM.
- Do not use MWM ownership badges, a saved Support Lens, vibe tags, community popularity, reviews, or general business-directory status to determine clinical qualification, appointment speed, insurance coverage, price, safety, or patient respect.
- Do not output an ordinary MWM business card as a medical referral. The current general directory does not verify real-time appointment availability, insurance, price, or broad clinical credentials.
- Offer the official care-navigation links returned with this response. If location is needed, ask only for the city or ZIP necessary to help the member use a qualified official finder. Make clear that the member must confirm availability, network coverage, credentials, and fit directly with the practice.
- If the member explicitly asks for cultural context, present it as a preference or separately sourced group-level information; never treat it as a substitute for timely qualified care.`
    : "";

  return {
    applies: true,
    suppressesGeneralBusinessCatalog: isCareNavigation,
    promptBlock: `══════════════════════════════════════════════════════════
HEALTH CARE OVERRIDE — CURRENT TURN ONLY
══════════════════════════════════════════════════════════
Give general health information and care navigation, not diagnosis, treatment, a referral guarantee, or an assessment of provider quality. Use calm, precise language.
${navigationInstruction}${breastChangeInstruction}${medicationInstruction}
SOURCE USE:
- Distinguish authoritative health information from a care-finder link.
- Do not claim the care finder endorses a particular provider.
- Do not infer a race, ethnicity, sex, cultural identity, or care preference from account data, saved settings, or the health concern.
- Never fabricate an appointment, insurance acceptance, accessibility feature, price, clinician credential, patient experience, or culturally responsive practice.
══════════════════════════════════════════════════════════`,
    sources: uniqueSources(sources),
  };
}
