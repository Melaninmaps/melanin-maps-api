import { HBCU_COMPLETE_SEED, type HBCUSeed } from "../data/hbcu-complete-seed";

function normalizeInstitutionName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const LEGACY_TITLE_ALIASES: Record<string, string> = {
  [normalizeInstitutionName("Bennett College — Greensboro's HBCU for Women")]: "Bennett College",
  [normalizeInstitutionName("Lincoln University")]: "Lincoln University of Pennsylvania",
  [normalizeInstitutionName("Southern University — Only HBCU System in the US")]: "Southern University and A&M College",
};

const HBCU_BY_NAME = new Map(
  HBCU_COMPLETE_SEED.map((institution) => [normalizeInstitutionName(institution.name), institution] as const),
);

export interface HbcuMapDetails {
  summary: string;
  significance: string;
  foundedYear: number;
  institutionControl: HBCUSeed["control"];
  websiteUrl: string;
  sourceUrl: string;
  sourceLabel: string;
}

export function findHbcuMapDetails(title: string, stateRegion?: string | null): HbcuMapDetails | null {
  const normalizedTitle = normalizeInstitutionName(title);
  const canonicalTitle = LEGACY_TITLE_ALIASES[normalizedTitle] ?? title;
  const institution = HBCU_BY_NAME.get(normalizeInstitutionName(canonicalTitle));
  if (!institution) return null;

  const normalizedState = stateRegion?.trim().toUpperCase();
  if (normalizedState && institution.state.toUpperCase() !== normalizedState) return null;

  return {
    summary: institution.description,
    significance: institution.significance,
    foundedYear: institution.founded,
    institutionControl: institution.control,
    websiteUrl: institution.externalUrl,
    sourceUrl: "https://sites.ed.gov/whhbcu/one-hundred-and-five-historically-black-colleges-and-universities/",
    sourceLabel: "U.S. Department of Education HBCU list",
  };
}
