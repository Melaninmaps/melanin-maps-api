export type CommunityResearchLensId =
  | "diaspora"
  | "black-women"
  | "black-men"
  | "black-students"
  | "hbcu-students";

export type CommunityResearchLens = Readonly<{
  id: CommunityResearchLensId;
  facetKey: `research-lens:${CommunityResearchLensId}`;
  tag: string;
  label: string;
  researchTerms: string;
  directEvidenceTerms: readonly string[];
  isProductDefault: boolean;
}>;

const LENSES: readonly CommunityResearchLens[] = [
  {
    id: "diaspora",
    facetKey: "research-lens:diaspora",
    tag: "#Diaspora",
    label: "African diaspora and Black communities",
    researchTerms: "African diaspora and Black communities",
    directEvidenceTerms: ["african diaspora", "black communities"],
    isProductDefault: true,
  },
  {
    id: "black-women",
    facetKey: "research-lens:black-women",
    tag: "#BlackWomen",
    label: "Black women",
    researchTerms: "Black women",
    directEvidenceTerms: ["black women", "black woman", "african american women", "african american woman"],
    isProductDefault: false,
  },
  {
    id: "black-men",
    facetKey: "research-lens:black-men",
    tag: "#BlackMen",
    label: "Black men and boys",
    researchTerms: "Black men and boys",
    directEvidenceTerms: ["black men", "black man", "black boys", "black boy", "african american men", "african american man"],
    isProductDefault: false,
  },
  {
    id: "black-students",
    facetKey: "research-lens:black-students",
    tag: "#BlackStudents",
    label: "Black students",
    researchTerms: "Black students",
    directEvidenceTerms: ["black students", "black student", "african american students", "african american student"],
    isProductDefault: false,
  },
  {
    id: "hbcu-students",
    facetKey: "research-lens:hbcu-students",
    tag: "#HBCUStudents",
    label: "HBCU students and alumni",
    researchTerms: "HBCU students and alumni",
    directEvidenceTerms: ["hbcu", "historically black college", "historically black university"],
    isProductDefault: false,
  },
] as const;

const EXPLICIT_TAG_ALIASES: Readonly<Record<Exclude<CommunityResearchLensId, "diaspora">, readonly string[]>> = {
  "black-women": ["blackwomen", "blackwoman"],
  "black-men": ["blackmen", "blackman", "blackboys"],
  "black-students": ["blackstudents", "blackstudent"],
  "hbcu-students": ["hbcustudents", "hbcustudent", "hbcu"],
};

const EXPLICIT_WORDING: Readonly<Record<Exclude<CommunityResearchLensId, "diaspora">, RegExp>> = {
  "black-women": /\b(?:black women|black woman|african american women|african american woman)\b/i,
  "black-men": /\b(?:black men|black man|black boys|black boy|african american men|african american man)\b/i,
  "black-students": /\b(?:black students?|african american students?)\b/i,
  "hbcu-students": /\b(?:hbcu students?|historically black college(?:s| and universities)? students?|hbcu alumni)\b/i,
};

export const COMMUNITY_RESEARCH_LENS_TAGS = LENSES.map((lens) => lens.tag);

function lensFor(id: CommunityResearchLensId): CommunityResearchLens {
  const lens = LENSES.find((candidate) => candidate.id === id);
  if (!lens) throw new Error(`Unknown community research lens: ${id}`);
  return lens;
}

function hashtagLensIds(value: string): CommunityResearchLensId[] {
  const ids: CommunityResearchLensId[] = [];
  const normalized = value.normalize("NFKC").toLocaleLowerCase("en-US");
  if (/(?:^|\s)#diaspora\b/.test(normalized)) ids.push("diaspora");
  for (const [id, aliases] of Object.entries(EXPLICIT_TAG_ALIASES) as Array<[
    Exclude<CommunityResearchLensId, "diaspora">,
    readonly string[],
  ]>) {
    if (aliases.some((alias) => new RegExp(`(?:^|\\s)#${alias}\\b`, "i").test(normalized))) {
      ids.push(id);
    }
  }
  return ids;
}

function explicitWordingLensIds(value: string): CommunityResearchLensId[] {
  return (Object.entries(EXPLICIT_WORDING) as Array<[
    Exclude<CommunityResearchLensId, "diaspora">,
    RegExp,
  ]>)
    .filter(([, pattern]) => pattern.test(value))
    .map(([id]) => id);
}

/**
 * A Library research lens is an explicit research scope, not a statement about
 * the reader. MWM's diaspora lens is the product default. A person can narrow
 * the evidence packet by typing a supported hashtag or naming a group in the
 * present question; neither choice is persisted as profile identity.
 */
export function resolveCommunityResearchLenses(question: string): CommunityResearchLens[] {
  const ids = [...new Set([
    ...hashtagLensIds(question),
    ...explicitWordingLensIds(question),
  ])];
  const selected = ids.length > 0 ? ids : ["diaspora" as const];
  return selected.map(lensFor);
}

export function stripCommunityResearchLensTags(question: string): string {
  return question
    .normalize("NFKC")
    .replace(/(?:^|\s)#(?:diaspora|blackwomen|blackwoman|blackmen|blackman|blackboys|blackstudents|blackstudent|hbcustudents|hbcustudent|hbcu)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function researchLensFacetKeys(lenses: readonly CommunityResearchLens[]): string[] {
  return [...new Set(lenses.map((lens) => lens.facetKey))];
}

export function researchLensTagFromFacetKey(value: string): string | null {
  return LENSES.find((lens) => lens.facetKey === value)?.tag ?? null;
}

export function researchLensCommunityLabel(lenses: readonly CommunityResearchLens[]): string {
  const tags = lenses.map((lens) => lens.tag).join(", ");
  const labels = lenses.map((lens) => lens.label).join(" and ");
  return `MWM diaspora-first research lens ${tags}: ${labels}. This is a requested evidence scope, not a claim about the reader's identity.`;
}

export function buildCommunityLensResearchQuery(
  question: string,
  lenses: readonly CommunityResearchLens[],
): string {
  const searchableQuestion = stripCommunityResearchLensTags(question) || question.trim();
  const labels = lenses.map((lens) => lens.researchTerms).join("; ");
  return [
    searchableQuestion,
    `Research lens: ${labels}.`,
    "Prioritize authoritative evidence directly relevant to this lens before general population context.",
    "For every explicitly selected non-default lens, retrieve at least one trusted source that directly names that population or institution; otherwise report that the Library could not verify enough scoped evidence.",
    "Use general clinical, educational, legal, or financial evidence only as a clearly labeled foundation; never use it to make an unsupported group-specific claim.",
  ].join("\n");
}

export function researchLensGuidance(lenses: readonly CommunityResearchLens[]): string {
  const tags = lenses.map((lens) => lens.tag).join(" ");
  const labels = lenses.map((lens) => lens.label).join(" and ");
  return `${tags} directs this search toward evidence relevant to ${labels}. It describes the research scope, not the reader. Material group-specific claims must be directly supported; otherwise the Library says that evidence is limited instead of substituting a generic result.`;
}

/**
 * Default diaspora framing governs source ordering. A narrower, expressly
 * selected lens has a stronger rule: at least one returned source must directly
 * name it. The Library fails closed rather than relabeling generic evidence as
 * community-specific information.
 */
export function hasDirectEvidenceForExplicitResearchLenses(
  documents: readonly Pick<{ title: string; url: string; content: string }, "title" | "url" | "content">[],
  lenses: readonly CommunityResearchLens[],
): boolean {
  const explicitLenses = lenses.filter((lens) => !lens.isProductDefault);
  return explicitLenses.every((lens) => documents.some((document) => {
    const searchable = `${document.title}\n${document.url}\n${document.content}`.toLocaleLowerCase("en-US");
    return lens.directEvidenceTerms.some((term) => searchable.includes(term.toLocaleLowerCase("en-US")));
  }));
}
