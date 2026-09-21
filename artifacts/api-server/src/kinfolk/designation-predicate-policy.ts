/**
 * One policy for documentary Support Lens predicates. Legacy columns are
 * narrowly allow-listed; no other designation may be inferred from them.
 */
export function legacyDesignationColumn(id: string): "black_owned" | "minority_claim" | null {
  if (id === "black-african-american") return "black_owned";
  if (id === "minority-general-legacy") return "minority_claim";
  return null;
}

export function resolveDesignationScope(input: {
  explicit: readonly string[];
  supportScope?: string;
  saved: readonly string[];
  savedMode?: string | null;
}): string[] {
  if (input.explicit.length > 0) return [...input.explicit];
  if (input.supportScope === "all_businesses") return [];
  return input.savedMode === "strict_documented_designations" ? [...input.saved] : [];
}

export function buildDesignationPredicateSql(
  id: string,
  designationColumn: string,
  parameter: number,
): string {
  const documented = `EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(${designationColumn}, '[]'::jsonb)) AS designation(value) WHERE designation.value = ANY($${parameter}::text[]))`;
  const legacy = legacyDesignationColumn(id);
  if (legacy === "black_owned") return `(${documented} OR b.black_owned = TRUE)`;
  if (legacy === "minority_claim") {
    return `(${documented} OR b.ownership_claim = 'community_reported_minority_owned')`;
  }
  return `(${documented})`;
}