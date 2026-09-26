import { parseLocalMapSearch } from "./parseLocalMapSearch";

export type BusinessMapSearchPhrase = {
  search: string;
  city?: string;
  stateCode?: string;
  ownership?: "black-owned";
  category?: string;
};

/**
 * Separates explicit directory constraints from a map search phrase.
 * This keeps a phrase such as “Black-owned restaurants in Philadelphia, PA”
 * as ownership + category + geography rather than treating it as an unrelated
 * general keyword search.
 */
export function parseBusinessMapSearchPhrase(input: string): BusinessMapSearchPhrase {
  const local = parseLocalMapSearch(input);
  const ownership = /\bblack[- ]owned\b/i.test(input)
    ? "black-owned" as const
    : undefined;
  const category =
    /\bgrocery\s+stores?\b/i.test(input) ? "Grocery" :
    /\brestaurants?\b|\bdining\b/i.test(input) ? "Food & Drink" :
    /\bbarber|salon|beauty\b/i.test(input) ? "Beauty & Personal Care" :
    undefined;

  const search = input
    .replace(/\bblack[- ]owned\b/gi, "")
    .replace(/\bgrocery\s+stores?\b/gi, "")
    .replace(/\brestaurants?\b|\bdining\b/gi, "")
    .replace(/\bbarber(?:s|shop)?|salon|beauty\b/gi, "")
    .replace(/\bin\s+[a-z][a-z .'-]+?(?:,?\s*(?:[A-Z]{2}|[A-Za-z]+))?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    search,
    city: local.city,
    stateCode: local.stateCode,
    ownership,
    category,
  };
}
