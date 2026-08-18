/**
 * Research policy — governs which sources Kinfolk may use, how it prefixes
 * community-lens queries, and what disclaimer (if any) accompanies an entry.
 *
 * Source domains intentionally favor government, clinical authority, and
 * vetted nonprofit sources over general web content. No new domain should
 * be added without a clear institutional mandate.
 */

export type ResearchDomain =
  | "medical"
  | "legal"
  | "financial"
  | "education"
  | "stem"
  | "history"
  | "general";

export type SourceTier = "primary" | "public-service" | "community-expert";

export const DEFAULT_COMMUNITY_LENS = "Black women and minority women";

export type ResearchPolicy = {
  domain: ResearchDomain;
  allowDomains: string[];
  archiveTtlHours: number;
  disclaimer: string | null;
  searchPrefix: boolean;
};

// ── Domain classification ────────────────────────────────────────────────────

const DOMAIN_PATTERNS: Array<{ domain: ResearchDomain; pattern: RegExp }> = [
  {
    domain: "medical",
    pattern:
      /\b(health|medical|doctor|nurse|clinic|hospital|symptom|diagnos|treatment|medicine|mental health|pregnan|wellness|disease|cancer|diabetes|blood pressure|vaccine|nutrition|therapy|immuniz|mammogram|screenings?|menopause|fibroid|sickle cell|hiv|aids|chronic)\b/i,
  },
  {
    domain: "legal",
    pattern:
      /\b(law|legal|rights|court|attorney|lawyer|eviction|lease|custody|contract|sue|lawsuit|discriminat|tenant|landlord|immigr|criminal|civil rights|justice|expungement|housing rights|workers? comp|class action)\b/i,
  },
  {
    domain: "financial",
    pattern:
      /\b(debt|credit|tax|invest|insurance|mortgage|loan|retirement|budget|money|finance|bank|savings|credit score|student loan|credit card|reparations|wealth|asset|financial literacy|cfpb|irs)\b/i,
  },
  {
    domain: "stem",
    pattern:
      /\b(stem|science|technology|engineering|math(?:ematics)?|coding|programming|computer science|data science|research|physics|chemistry|biology|artificial intelligence|robotics|stem program)\b/i,
  },
  {
    domain: "education",
    pattern:
      /\b(school|college|university|scholarship|hbcu|student|degree|career|opportunity|program|tuition|grant|fellowship|gpa|application|admission|education|learning|mentorship|internship|apprenticeship)\b/i,
  },
  {
    domain: "history",
    pattern:
      /\b(history|heritage|historical|civil rights|slavery|freedom|movement|culture|ancestry|museum|monument|landmark|legacy|archive|heritage site|underground railroad|emancipation|reconstruction|great migration)\b/i,
  },
];

const DOMAIN_POLICIES: Record<
  ResearchDomain,
  Pick<ResearchPolicy, "allowDomains" | "archiveTtlHours" | "disclaimer">
> = {
  medical: {
    allowDomains: [
      "*.gov",
      "medlineplus.gov",
      "nih.gov",
      "cdc.gov",
      "who.int",
      "*.edu",
      "mayoclinic.org",
      "hopkinsmedicine.org",
      "cancer.org",
      "heart.org",
      "diabetes.org",
      "nimh.nih.gov",
      "health.gov",
      "womenshealth.gov",
    ],
    archiveTtlHours: 24 * 7, // 1 week
    disclaimer:
      "This is educational health information and is not a medical diagnosis or treatment recommendation. Consult a qualified healthcare provider for guidance specific to your health situation.",
  },
  legal: {
    allowDomains: [
      "*.gov",
      "law.cornell.edu",
      "lawhelp.org",
      "lsc.gov",
      "americanbar.org",
      "*.edu",
      "courts.gov",
      "justia.com",
      "nolo.com",
      "aclu.org",
      "eeoc.gov",
      "hud.gov",
    ],
    archiveTtlHours: 24 * 14, // 2 weeks
    disclaimer:
      "This is general legal information and is not legal advice. Laws vary by jurisdiction and individual circumstances. Consult a qualified attorney for guidance specific to your situation.",
  },
  financial: {
    allowDomains: [
      "*.gov",
      "consumerfinance.gov",
      "investor.gov",
      "irs.gov",
      "usa.gov",
      "fdic.gov",
      "*.edu",
      "sec.gov",
      "federalreserve.gov",
      "mymoney.gov",
      "studentaid.gov",
    ],
    archiveTtlHours: 24 * 7,
    disclaimer:
      "This is general financial education and is not investment, tax, or personalized financial advice. Consult a qualified financial professional for guidance specific to your situation.",
  },
  stem: {
    allowDomains: [
      "*.gov",
      "nsf.gov",
      "nasa.gov",
      "nih.gov",
      "*.edu",
      "science.org",
      "ieee.org",
      "acm.org",
      "stemconnector.com",
      "blackgirlscode.com",
    ],
    archiveTtlHours: 24 * 30,
    disclaimer: null,
  },
  education: {
    allowDomains: [
      "*.gov",
      "ed.gov",
      "collegeboard.org",
      "*.edu",
      "studentaid.gov",
      "fastweb.com",
      "scholarships.com",
      "thurgoodmarshallcollege.org",
      "tmcf.org",
      "uncf.org",
    ],
    archiveTtlHours: 24 * 30,
    disclaimer: null,
  },
  history: {
    allowDomains: [
      "*.gov",
      "loc.gov",
      "archives.gov",
      "nps.gov",
      "si.edu",
      "smithsonianmag.com",
      "*.edu",
      "pbs.org",
      "africanamericanhistorymonth.gov",
      "naacp.org",
    ],
    archiveTtlHours: 24 * 90,
    disclaimer: null,
  },
  general: {
    allowDomains: ["*.gov", "*.edu", "*.org"],
    archiveTtlHours: 24 * 7,
    disclaimer: null,
  },
};

// ── Public API ───────────────────────────────────────────────────────────────

export function getResearchPolicy(question: string): ResearchPolicy {
  const match = DOMAIN_PATTERNS.find((p) => p.pattern.test(question));
  const domain = match?.domain ?? "general";
  const policy = DOMAIN_POLICIES[domain];

  // Apply the community lens unless the member already named a specific group.
  const hasExplicitLens =
    /\b(black(?:s| people| women| men)?|african american|minority|minorities|latina|latino|latinx|indigenous|asian american|immigrant)\b/i.test(
      question,
    );

  return { domain, ...policy, searchPrefix: !hasExplicitLens };
}

export function buildCommunityResearchQuery(question: string, _domain: ResearchDomain): string {
  const policy = getResearchPolicy(question);
  if (!policy.searchPrefix) return question;
  return `${DEFAULT_COMMUNITY_LENS} ${question}`;
}

/**
 * Validates that a URL's hostname is covered by the policy's allowDomains list.
 * Patterns starting with `*.` match any subdomain of the given TLD.
 */
export function isTrustedResearchUrl(url: string, policy: { allowDomains: string[] }): boolean {
  try {
    const hostname = new URL(url).hostname.toLocaleLowerCase("en-US");
    return policy.allowDomains.some((pattern) => {
      if (pattern.startsWith("*.")) {
        const suffix = pattern.slice(2);
        return hostname === suffix || hostname.endsWith(`.${suffix}`);
      }
      return hostname === pattern;
    });
  } catch {
    return false;
  }
}

/** Used by the API endpoint to classify a question without a full policy object. */
export function classifyResearchDomain(question: string): ResearchDomain {
  return getResearchPolicy(question).domain;
}
