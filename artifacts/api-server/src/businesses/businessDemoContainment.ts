export const CONFIGURED_TEST_BUSINESS_PHONE_DIGITS = [
  "15555550100",
  "5555550100",
] as const;

/**
 * Proven demo/test business predicate used by both startup containment and
 * governed Kinfolk reads. The alias must be `b`.
 *
 * A row is contained when any one of these exact, case-insensitive signals is
 * present:
 *   - `[DEMO]` appears in name or description;
 *   - data_source is exactly `demo` or `demo_seed` after trim/lower;
 *   - status is exactly `demo` or `test`, or listing_status is exactly `demo`;
 *   - phone digits equal the configured auth test number, with or without its
 *     US country code: 15555550100 / 5555550100.
 *
 * Deliberately absent: broad `LIKE '%555%'`, `LIKE '%555-%'`, and generic
 * name/description matches for words such as "test" or "demo". Those broader
 * predicates can hide legitimate North American 555 exchange or address data.
 */
export const PROVEN_DEMO_BUSINESS_SQL_PREDICATE = `(
  COALESCE(b.name, '') ILIKE '%[DEMO]%'
  OR COALESCE(b.description, '') ILIKE '%[DEMO]%'
  OR LOWER(BTRIM(COALESCE(b.data_source, ''))) IN ('demo', 'demo_seed')
  OR LOWER(BTRIM(COALESCE(b.status, ''))) IN ('demo', 'test')
  OR LOWER(BTRIM(COALESCE(b.listing_status, ''))) = 'demo'
  OR REGEXP_REPLACE(COALESCE(b.phone, ''), '[^0-9]', '', 'g')
    IN ('${CONFIGURED_TEST_BUSINESS_PHONE_DIGITS.join("', '")}')
)`;

export type DemoBusinessCandidate = Readonly<{
  name?: string | null;
  description?: string | null;
  dataSource?: string | null;
  data_source?: string | null;
  status?: string | null;
  listingStatus?: string | null;
  listing_status?: string | null;
  phone?: string | null;
}>;

/** Pure equivalent of the SQL predicate for focused fixture tests. */
export function isProvenDemoBusiness(record: DemoBusinessCandidate): boolean {
  const name = record.name ?? "";
  const description = record.description ?? "";
  const dataSource = (record.dataSource ?? record.data_source ?? "")
    .trim()
    .toLowerCase();
  const status = (record.status ?? "").trim().toLowerCase();
  const listingStatus = (record.listingStatus ?? record.listing_status ?? "")
    .trim()
    .toLowerCase();
  const phoneDigits = (record.phone ?? "").replace(/\D/g, "");

  return (
    name.toLowerCase().includes("[demo]") ||
    description.toLowerCase().includes("[demo]") ||
    dataSource === "demo" ||
    dataSource === "demo_seed" ||
    status === "demo" ||
    status === "test" ||
    listingStatus === "demo" ||
    CONFIGURED_TEST_BUSINESS_PHONE_DIGITS.some(
      (configured) => phoneDigits === configured,
    )
  );
}
