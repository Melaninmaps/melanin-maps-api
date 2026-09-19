/**
 * Canonical identity helpers. They intentionally do not mutate records: an
 * administrator can undo reconciliation by clearing duplicate_of_id.
 */
export interface CanonicalBusinessRecord {
  id: string;
  duplicateOfId?: string | null;
  duplicate_of_id?: string | null;
  isDuplicate?: boolean | null;
  is_duplicate?: boolean | null;
}

export function canonicalBusinessId(
  id: string,
  records: ReadonlyMap<string, CanonicalBusinessRecord>,
): string {
  const seen = new Set<string>();
  let current = id;
  while (!seen.has(current)) {
    seen.add(current);
    const row = records.get(current);
    const next = row?.duplicateOfId ?? row?.duplicate_of_id;
    if (!next || next === current || !records.has(next)) return current;
    current = next;
  }
  // A corrupt cycle must not make a request loop forever. Stable minimum ID
  // gives callers a deterministic, reversible answer while it is repaired.
  return [...seen].sort()[0]!;
}

export function isSupersededBusiness(record: CanonicalBusinessRecord): boolean {
  return Boolean(
    record.isDuplicate ?? record.is_duplicate ?? record.duplicateOfId ?? record.duplicate_of_id,
  );
}

/** Resolve legacy detail URLs without exposing the superseded row. */
export async function resolveCanonicalBusinessId(
  db: { query<T = { canonical_business_id: string }>(sql: string, values?: readonly unknown[]): Promise<{ rows: T[] }> },
  id: string,
): Promise<string | null> {
  const result = await db.query<{ canonical_business_id: string }>(
    `SELECT COALESCE(d.canonical_business_id, b.id) AS canonical_business_id
       FROM businesses b
       LEFT JOIN business_duplicate_resolutions d ON d.superseded_business_id = b.id
      WHERE b.id = $1
      LIMIT 1`,
    [id],
  );
  return result.rows[0]?.canonical_business_id ?? null;
}
