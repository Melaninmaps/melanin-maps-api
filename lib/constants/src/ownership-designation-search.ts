/**
 * Search aliases only improve discovery of an already-approved canonical
 * designation. They never create, infer, or persist a new designation.
 */
const DESIGNATION_SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  "Black / African American-Owned": [
    "bl",
    "black",
    "african american",
    "african-american",
    "black owned",
  ],
  "Foundational Black American-Owned": [
    "fba",
    "foundational black",
    "black american",
  ],
  "Latino / Hispanic-Owned": [
    "his",
    "hispanic",
    "latino",
    "latina",
    "latinx",
    "latin",
  ],
  "LGBTQIA+-Owned": ["lgbt", "lgbtq", "lgbtqia", "queer"],
  "Divine Nine-Affiliated": ["d9", "divine nine"],
};

export type OwnershipDesignationSearchOption = Readonly<{
  value: string;
  label: string;
}>;

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

/**
 * Returns only canonical caller-supplied options that match a label or an
 * explicit search alias. For example, `BL` reaches Black / African
 * American-Owned and `HIS` reaches Latino / Hispanic-Owned.
 */
export function matchesOwnershipDesignationSearch(
  option: OwnershipDesignationSearchOption,
  query: string,
): boolean {
  const needle = normalized(query);
  if (!needle) return true;
  const searchable = [
    option.label,
    option.value,
    ...(DESIGNATION_SEARCH_ALIASES[option.value] ?? []),
  ];
  return searchable.some((entry) => normalized(entry).includes(needle));
}

export function filterOwnershipDesignationSearchOptions<T extends OwnershipDesignationSearchOption>(
  options: readonly T[],
  query: string,
): T[] {
  return options.filter((option) => matchesOwnershipDesignationSearch(option, query));
}
