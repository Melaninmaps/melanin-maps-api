import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";
import { assertLocalDirectoryStagingFromProcess } from "./lib/local-directory-staging";
import { canonicalCountryCode } from "./lib/country-normalization";

const ACTOR_ID = "founder-authorized-bulk-searchable-2026-09-06";
const SOURCE_NAME = "cumulative-content-global-candidates.jsonl";
const SOURCE_SHA256 = "6f1e686856eb79e45add03f2208ac836167cde7d5ca69ea99f4464eeae9169a8";
const SOURCE_ROW_COUNT = 7_315;
const EXPECTED_REPAIR_ROWS = 903;
const EXPECTED_COLLISIONS = 273;
const EXPECTED_CANONICAL_UPDATES = 630;
const PUBLISHER_LOCK_KEY = "founder-searchable-v1";
const POLICY_VERSION = "founder-global-location-canonicalization-v1";

// This is intentionally a single-use migration. A successful apply changes the
// source city values and collision publication actions, so a rerun fails the
// exact 903-row precondition before any write. Use the persisted postcondition
// query/report from the apply run for later verification rather than rerunning.

type BusinessRow = {
  id: string;
  name: string;
  address: string | null;
  city: string;
  state: string | null;
  country: string | null;
  status: string;
  listing_status: string | null;
  is_duplicate: boolean | null;
  permanently_hidden: boolean | null;
  website: string | null;
  source_url: string | null;
  source_evidence?: unknown;
  created_at: string;
};

type RepairRow = {
  new_id: string;
  original_city: string;
  original_state: string | null;
  canonical_city: string;
  canonical_state: string;
  canonical_country: string;
  canonical_country_code: string;
  canonical_dedupe_key: string;
  target_id: string | null;
  target_name: string | null;
  target_country: string | null;
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeCountry(value: unknown): string {
  return canonicalCountryCode(value) ?? "";
}

function targetCountryIsCompatible(sourceCountryCode: string, targetCountry: unknown): boolean {
  const rawTarget = typeof targetCountry === "string" ? targetCountry.trim() : "";
  return rawTarget === "" || normalizeCountry(rawTarget) === sourceCountryCode;
}

function dedupeKey(business: Pick<BusinessRow, "name" | "address"> & { city: string; state: string }): string {
  const name = normalizeText(business.name);
  const address = normalizeText(business.address);
  const city = normalizeText(business.city);
  const state = normalizeText(business.state);
  return address ? `${name}|${city}|${state}|addr:${address}` : `${name}|${city}|${state}|no-location`;
}

function parseCityRegion(city: string): { city: string; state: string } | null {
  const match = city.trim().match(/^(.+?),\s*([A-Za-z]{2})$/);
  if (!match) return null;
  return { city: match[1].trim(), state: match[2].toUpperCase() };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function evidenceScore(row: BusinessRow): number {
  return Number(Boolean(row.address?.trim())) + Number(Boolean(row.website?.trim())) + Number(Boolean(row.source_url?.trim()));
}

function chooseWinner(candidates: BusinessRow[]): BusinessRow | null {
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) =>
    evidenceScore(b) - evidenceScore(a)
    || Date.parse(a.created_at) - Date.parse(b.created_at)
    || a.id.localeCompare(b.id)
  )[0];
}

function publicIdentity(row: Pick<BusinessRow, "name" | "city" | "state">): string {
  return [normalizeText(row.name), normalizeText(row.city), normalizeText(row.state)].join("|");
}

async function verifyDedupeIndexDefinitions(client: PoolClient): Promise<void> {
  const { rows } = await client.query<{
    indexname: string; indisunique: boolean; indisvalid: boolean; indisready: boolean;
    key_count: number; key_columns: string[]; predicate_md5: string;
  }>(`
    SELECT index_class.relname indexname,i.indisunique,i.indisvalid,i.indisready,
           i.indnkeyatts::integer key_count,
           ARRAY(SELECT a.attname::text FROM unnest(i.indkey) WITH ORDINALITY k(attnum,ord)
             JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum=k.attnum
             WHERE ord<=i.indnkeyatts ORDER BY ord)::text[] key_columns,
           md5(pg_get_expr(i.indpred,i.indrelid)) predicate_md5
    FROM pg_index i
    JOIN pg_class index_class ON index_class.oid=i.indexrelid
    JOIN pg_class table_class ON table_class.oid=i.indrelid
    JOIN pg_namespace n ON n.oid=table_class.relnamespace
    WHERE n.nspname='public' AND table_class.relname='businesses'
      AND index_class.relname IN ('businesses_active_dedupe_key_unique','businesses_canonical_dedupe_key_unique')
    ORDER BY index_class.relname
  `);
  const expectedPredicates = new Map([
    ["businesses_active_dedupe_key_unique", "b6c7b82a358f47453d8dd3b8eb783dbf"],
    ["businesses_canonical_dedupe_key_unique", "a35be5564d3fd29ddd97c96989ec00fb"],
  ]);
  const valid = rows.length === expectedPredicates.size && rows.every((row) =>
    row.indisunique && row.indisvalid && row.indisready && row.key_count === 1
    && row.key_columns.length === 1 && row.key_columns[0] === "dedupe_key"
    && row.predicate_md5 === expectedPredicates.get(row.indexname),
  );
  if (!valid) {
    throw new Error("LOCATION_REPAIR_DEDUPE_INDEX_DEFINITION_MISMATCH");
  }
}

async function verifyAndLockBatch(client: PoolClient): Promise<string> {
  const batch = await client.query<{ id: string; source_row_count: number }>(`
    SELECT id,source_row_count FROM directory_import_batches
     WHERE source_name=$1::text AND source_sha256=$2::text
     FOR UPDATE
  `, [SOURCE_NAME, SOURCE_SHA256]);
  if (batch.rowCount !== 1 || batch.rows[0].source_row_count !== SOURCE_ROW_COUNT) {
    throw new Error("LOCATION_REPAIR_BATCH_IDENTITY_MISMATCH");
  }
  const staged = await client.query<{ count: string }>(`
    SELECT count(*)::text count FROM directory_import_candidates WHERE batch_id=$1::uuid
  `, [batch.rows[0].id]);
  if (Number(staged.rows[0]?.count ?? 0) !== SOURCE_ROW_COUNT) {
    throw new Error("LOCATION_REPAIR_STAGED_ROW_COUNT_MISMATCH");
  }
  return batch.rows[0].id;
}

async function buildLockedPlan(client: PoolClient): Promise<{ batchId: string; repairs: RepairRow[]; collisions: number; multiMatchRows: number }> {
  await verifyDedupeIndexDefinitions(client);
  const batchId = await verifyAndLockBatch(client);
  const source = await client.query<BusinessRow>(`
    SELECT b.id,b.name,b.address,b.city,b.state,b.country,b.status,b.listing_status,
           b.is_duplicate,b.permanently_hidden,b.website,b.source_url,b.source_evidence,b.created_at::text
      FROM directory_import_publications p
      JOIN directory_import_candidates c ON c.id=p.candidate_id AND p.batch_id=c.batch_id
      JOIN businesses b ON b.id=p.record_id
     WHERE c.batch_id=$1::uuid AND c.target_kind='business'
       AND p.record_type='business' AND p.actor_id=$2::text AND p.publication_action='create'
       AND b.city ~ ', [A-Z]{2}$'
     FOR UPDATE OF b,p,c
  `, [batchId, ACTOR_ID]);
  if (source.rowCount !== EXPECTED_REPAIR_ROWS) {
    throw new Error(`LOCATION_REPAIR_COUNT_MISMATCH:${source.rowCount ?? 0}`);
  }
  const publicRows = await client.query<BusinessRow>(`
    SELECT id,name,address,city,state,country,status,listing_status,is_duplicate,permanently_hidden,
           website,source_url,source_evidence,created_at::text
      FROM businesses b
     WHERE public.business_record_is_public(b.status,b.listing_status,b.is_duplicate,b.permanently_hidden,b.name,b.description,b.data_source,b.phone)
  `);
  const publicByIdentity = new Map<string, BusinessRow[]>();
  for (const row of publicRows.rows) {
    const existing = publicByIdentity.get(publicIdentity(row)) ?? [];
    existing.push(row);
    publicByIdentity.set(publicIdentity(row), existing);
  }
  let collisions = 0;
  let multiMatchRows = 0;
  const repairs = source.rows.map((row): RepairRow => {
    const parsed = parseCityRegion(row.city);
    if (!parsed) throw new Error(`UNPARSEABLE_CITY_REGION:${row.id}`);
    const key = [normalizeText(row.name), normalizeText(parsed.city), normalizeText(parsed.state)].join("|");
    const sourceCountry = normalizeCountry(row.country);
    if (!sourceCountry) throw new Error(`LOCATION_REPAIR_SOURCE_COUNTRY_MISSING:${row.id}`);
    const matches = (publicByIdentity.get(key) ?? []).filter((candidate) =>
      candidate.id !== row.id
      && targetCountryIsCompatible(sourceCountry, candidate.country)
    );
    if (matches.length) collisions += 1;
    if (matches.length > 1) multiMatchRows += 1;
    const target = chooseWinner(matches);
    if (target && !isUuid(target.id)) throw new Error(`LOCATION_REPAIR_NON_UUID_TARGET:${target.id}`);
    return {
      new_id: row.id,
      original_city: row.city,
      original_state: row.state,
      canonical_city: parsed.city,
      canonical_state: parsed.state,
      canonical_country: row.country!.trim(),
      canonical_country_code: sourceCountry,
      canonical_dedupe_key: dedupeKey({ name: row.name, address: row.address, city: parsed.city, state: parsed.state }),
      target_id: target?.id ?? null,
      target_name: target?.name ?? null,
      target_country: target?.country ?? null,
    };
  });
  const canonicalUpdates = repairs.filter((row) => !row.target_id).length;
  if (repairs.length !== EXPECTED_REPAIR_ROWS || collisions !== EXPECTED_COLLISIONS || canonicalUpdates !== EXPECTED_CANONICAL_UPDATES) {
    throw new Error(`LOCATION_REPAIR_PLAN_MISMATCH:${repairs.length}:${collisions}:${canonicalUpdates}`);
  }
  const targetIds = [...new Set(repairs.flatMap((row) => row.target_id ? [row.target_id] : []))];
  if (targetIds.length) {
    const lockedTargets = await client.query<{ id: string }>(`
      SELECT id FROM businesses WHERE id=ANY($1::text[]) FOR UPDATE
    `, [targetIds]);
    if (lockedTargets.rowCount !== targetIds.length) throw new Error("LOCATION_REPAIR_TARGET_LOCK_MISMATCH");
  }
  return { batchId, repairs, collisions, multiMatchRows };
}

async function installPlan(client: PoolClient, batchId: string, repairs: RepairRow[]): Promise<void> {
  await client.query(`
    CREATE TEMP TABLE mwm_global_location_repair (
      new_id text PRIMARY KEY, original_city text NOT NULL, original_state text,
      canonical_city text NOT NULL, canonical_state text NOT NULL, canonical_country text NOT NULL,
      canonical_country_code char(2) NOT NULL, canonical_dedupe_key text NOT NULL,
      target_id text, target_name text, target_country text
    ) ON COMMIT DROP
  `);
  await client.query(`
    INSERT INTO mwm_global_location_repair
    SELECT * FROM jsonb_to_recordset($1::jsonb) AS r(
      new_id text, original_city text, original_state text, canonical_city text,
      canonical_state text, canonical_country text, canonical_country_code char(2),
      canonical_dedupe_key text, target_id text, target_name text, target_country text
    )
  `, [JSON.stringify(repairs)]);
  await client.query(`
    CREATE TEMP TABLE mwm_global_location_pointer_snapshot ON COMMIT DROP AS
    SELECT r.*,p.id publication_id,p.candidate_id,p.batch_id
    FROM mwm_global_location_repair r
    JOIN directory_import_publications p ON p.record_id=r.new_id
      AND p.batch_id=$1::uuid AND p.record_type='business' AND p.actor_id=$2::text AND p.publication_action='create'
    JOIN directory_import_candidates c ON c.id=p.candidate_id AND c.batch_id=p.batch_id
      AND c.target_kind='business' AND c.status='published'
      AND c.matched_business_id=r.new_id AND c.published_record_type='business' AND c.published_record_id=r.new_id
  `, [batchId, ACTOR_ID]);
  const snapshot = await client.query<{ count: string }>(`SELECT count(*)::text count FROM mwm_global_location_pointer_snapshot`);
  if (Number(snapshot.rows[0]?.count ?? 0) !== EXPECTED_REPAIR_ROWS) throw new Error("LOCATION_REPAIR_POINTER_SNAPSHOT_MISMATCH");
  await client.query(`
    CREATE TEMP TABLE mwm_global_location_event_snapshot ON COMMIT DROP AS
    SELECT e.id event_id,s.new_id,s.target_id,s.candidate_id,s.batch_id
    FROM mwm_global_location_pointer_snapshot s
    JOIN directory_import_decision_events e ON e.candidate_id=s.candidate_id AND e.batch_id=s.batch_id
      AND e.actor_id=$1::text AND e.published_record_type='business' AND e.published_record_id=s.new_id
  `, [ACTOR_ID]);
  const events = await client.query<{ count: string }>(`SELECT count(*)::text count FROM mwm_global_location_event_snapshot`);
  if (Number(events.rows[0]?.count ?? 0) !== EXPECTED_REPAIR_ROWS) throw new Error("LOCATION_REPAIR_EVENT_SNAPSHOT_MISMATCH");
  await client.query(`
    CREATE TEMP TABLE mwm_global_location_identity_snapshot ON COMMIT DROP AS
    SELECT i.identity_key,s.new_id,s.target_id
    FROM mwm_global_location_pointer_snapshot s
    JOIN business_publication_identities i ON i.business_id=s.new_id
  `);
  const identities = await client.query<{ count: string }>(`SELECT count(*)::text count FROM mwm_global_location_identity_snapshot`);
  if (Number(identities.rows[0]?.count ?? 0) !== EXPECTED_REPAIR_ROWS) throw new Error("LOCATION_REPAIR_IDENTITY_SNAPSHOT_MISMATCH");
  const unexpectedPointers = await client.query<{ count: string }>(`
    SELECT (
      (SELECT count(*) FROM directory_import_publications p JOIN mwm_global_location_repair r ON p.record_id=r.new_id
        WHERE NOT EXISTS (SELECT 1 FROM mwm_global_location_pointer_snapshot s WHERE s.publication_id=p.id))
      + (SELECT count(*) FROM directory_import_decision_events e JOIN mwm_global_location_repair r ON e.published_record_id=r.new_id
        WHERE NOT EXISTS (SELECT 1 FROM mwm_global_location_event_snapshot s WHERE s.event_id=e.id))
      + (SELECT count(*) FROM business_publication_identities i JOIN mwm_global_location_repair r ON i.business_id=r.new_id
        WHERE NOT EXISTS (SELECT 1 FROM mwm_global_location_identity_snapshot s WHERE s.identity_key=i.identity_key))
      + (SELECT count(*) FROM directory_import_candidates c JOIN mwm_global_location_repair r
          ON c.matched_business_id=r.new_id OR c.published_record_id=r.new_id
        WHERE NOT EXISTS (SELECT 1 FROM mwm_global_location_pointer_snapshot s WHERE s.candidate_id=c.id))
    )::text count
  `);
  if (Number(unexpectedPointers.rows[0]?.count ?? 0) !== 0) throw new Error("LOCATION_REPAIR_UNEXPECTED_POINTERS");
}

async function applyLockedPlan(client: PoolClient, batchId: string, repairs: RepairRow[]): Promise<void> {
  await installPlan(client, batchId, repairs);
  const badTargets = await client.query<{
    count: string; not_public: string; name_mismatch: string; city_mismatch: string;
    state_mismatch: string; country_snapshot_mismatch: string;
  }>(`
    SELECT count(*)::text count,
      count(*) FILTER (WHERE NOT public.business_record_is_public(b.status,b.listing_status,b.is_duplicate,b.permanently_hidden,b.name,b.description,b.data_source,b.phone))::text not_public,
      count(*) FILTER (WHERE b.name IS DISTINCT FROM r.target_name)::text name_mismatch,
      count(*) FILTER (WHERE lower(btrim(b.city)) <> lower(r.canonical_city))::text city_mismatch,
      count(*) FILTER (WHERE upper(btrim(COALESCE(b.state,''))) <> r.canonical_state)::text state_mismatch,
      count(*) FILTER (WHERE b.country IS DISTINCT FROM r.target_country)::text country_snapshot_mismatch
    FROM mwm_global_location_repair r
    JOIN businesses b ON b.id=r.target_id
    WHERE r.target_id IS NOT NULL AND (
      NOT public.business_record_is_public(b.status,b.listing_status,b.is_duplicate,b.permanently_hidden,b.name,b.description,b.data_source,b.phone)
      OR b.name IS DISTINCT FROM r.target_name
      OR lower(btrim(b.city)) <> lower(r.canonical_city)
      OR upper(btrim(COALESCE(b.state,''))) <> r.canonical_state
      OR b.country IS DISTINCT FROM r.target_country
    )
  `);
  if (process.argv.includes("--diagnose-targets")) {
    throw new Error(`LOCATION_REPAIR_TARGET_DIAGNOSTIC:${JSON.stringify(badTargets.rows[0] ?? {})}`);
  }
  if (Number(badTargets.rows[0]?.count ?? 0) !== 0) {
    throw new Error(`LOCATION_REPAIR_TARGET_CHANGED:${JSON.stringify(badTargets.rows[0] ?? {})}`);
  }
  const dualIndexConflicts = await client.query<{ count: string }>(`
    SELECT count(*)::text count FROM mwm_global_location_repair r
    JOIN businesses b ON b.dedupe_key=r.canonical_dedupe_key AND b.id<>r.new_id
    WHERE r.target_id IS NULL AND b.dedupe_key IS NOT NULL
      AND COALESCE(b.is_duplicate,false)=false
      AND COALESCE(b.status,'active') NOT IN ('duplicate','permanently_hidden')
  `);
  if (Number(dualIndexConflicts.rows[0]?.count ?? 0) !== 0) throw new Error("LOCATION_REPAIR_DUAL_INDEX_CONFLICT");

  const candidatesUpdated = await client.query(`
    UPDATE directory_import_candidates c
       SET city=s.canonical_city,state=s.canonical_state,
           matched_business_id=COALESCE(s.target_id,s.new_id),published_record_id=COALESCE(s.target_id,s.new_id),
           review_note=concat_ws(' | ',NULLIF(c.review_note,''),$1::text),
           review_evidence=COALESCE(c.review_evidence,'{}'::jsonb) || jsonb_build_object(
             'locationCanonicalizationPolicy',$1::text,'canonicalCity',s.canonical_city,
             'canonicalState',s.canonical_state,'duplicateMergedFrom',CASE WHEN s.target_id IS NULL THEN NULL ELSE s.new_id END,
             'canonicalRecordId',COALESCE(s.target_id,s.new_id)
           ),review_revision=c.review_revision+1,updated_at=NOW()
      FROM mwm_global_location_pointer_snapshot s
     WHERE c.id=s.candidate_id AND c.batch_id=s.batch_id
       AND c.matched_business_id=s.new_id AND c.published_record_id=s.new_id
       AND c.published_record_type='business' AND c.status='published'
  `, [POLICY_VERSION]);
  if (candidatesUpdated.rowCount !== EXPECTED_REPAIR_ROWS) throw new Error(`LOCATION_REPAIR_CANDIDATE_UPDATE_MISMATCH:${candidatesUpdated.rowCount ?? 0}`);

  const canonicalUpdated = await client.query(`
    UPDATE businesses b
       SET city=r.canonical_city,state=r.canonical_state,country=r.canonical_country,
           dedupe_key=r.canonical_dedupe_key,updated_at=NOW(),
           source_evidence=COALESCE(b.source_evidence,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
             'sourceType','location_canonicalization','policyVersion',$1::text,
             'previousCity',r.original_city,'previousState',r.original_state,'verifiedByMwm',false
           ))
      FROM mwm_global_location_repair r
     WHERE b.id=r.new_id AND r.target_id IS NULL
       AND b.city=r.original_city AND b.state IS NOT DISTINCT FROM r.original_state
  `, [POLICY_VERSION]);
  if (canonicalUpdated.rowCount !== EXPECTED_CANONICAL_UPDATES) throw new Error(`LOCATION_REPAIR_CANONICAL_UPDATE_MISMATCH:${canonicalUpdated.rowCount ?? 0}`);

  await client.query(`
    CREATE TEMP TABLE mwm_global_location_merge_aggregate ON COMMIT DROP AS
    WITH source_inputs AS (
      SELECT r.target_id,b.id,b.address,NULLIF(btrim(b.website),'') website,
             NULLIF(btrim(b.source_url),'') source_url,b.created_at,false is_target,
             r.canonical_country,r.canonical_country_code
      FROM mwm_global_location_repair r JOIN businesses b ON b.id=r.new_id
      WHERE r.target_id IS NOT NULL
    ), target_inputs AS (
      SELECT DISTINCT ON (r.target_id) r.target_id,b.id,b.address,NULLIF(btrim(b.website),'') website,
             NULLIF(btrim(b.source_url),'') source_url,b.created_at,true is_target,
             COALESCE(NULLIF(btrim(r.target_country),''),r.canonical_country) canonical_country,
             r.canonical_country_code
      FROM mwm_global_location_repair r JOIN businesses b ON b.id=r.target_id
      WHERE r.target_id IS NOT NULL
      ORDER BY r.target_id,r.new_id
    ), merge_inputs AS (
      SELECT * FROM source_inputs UNION ALL SELECT * FROM target_inputs
    )
    SELECT target_id,
      (array_agg(website ORDER BY
        (CASE WHEN address IS NULL OR btrim(address)='' THEN 0 ELSE 1 END
         + CASE WHEN website IS NULL THEN 0 ELSE 1 END
         + CASE WHEN source_url IS NULL THEN 0 ELSE 1 END) DESC,
        is_target DESC,created_at,id) FILTER (WHERE website IS NOT NULL))[1] website,
      (array_agg(source_url ORDER BY
        (CASE WHEN address IS NULL OR btrim(address)='' THEN 0 ELSE 1 END
         + CASE WHEN website IS NULL THEN 0 ELSE 1 END
         + CASE WHEN source_url IS NULL THEN 0 ELSE 1 END) DESC,
        is_target DESC,created_at,id) FILTER (WHERE source_url IS NOT NULL))[1] source_url,
      (array_agg(canonical_country ORDER BY is_target DESC,id))[1] canonical_country,
      '[]'::jsonb merged_source_evidence
    FROM merge_inputs
    GROUP BY target_id
    HAVING count(DISTINCT canonical_country_code)=1
  `);
  const targetGroups = new Set(repairs.flatMap((row) => row.target_id ? [row.target_id] : [])).size;
  const aggregateCount = await client.query<{ count: string }>(`SELECT count(*)::text count FROM mwm_global_location_merge_aggregate`);
  if (Number(aggregateCount.rows[0]?.count ?? 0) !== targetGroups) throw new Error("LOCATION_REPAIR_TARGET_AGGREGATE_MISMATCH");
  await client.query(`
    UPDATE mwm_global_location_merge_aggregate a
       SET merged_source_evidence=(
         WITH evidence_items AS (
           SELECT jsonb_array_elements(CASE
             WHEN target.source_evidence IS NULL THEN '[]'::jsonb
             WHEN jsonb_typeof(target.source_evidence)='array' THEN target.source_evidence
             ELSE jsonb_build_array(target.source_evidence) END) item
           UNION ALL
           SELECT jsonb_array_elements(CASE
             WHEN source.source_evidence IS NULL THEN '[]'::jsonb
             WHEN jsonb_typeof(source.source_evidence)='array' THEN source.source_evidence
             ELSE jsonb_build_array(source.source_evidence) END) item
             FROM mwm_global_location_repair r JOIN businesses source ON source.id=r.new_id
            WHERE r.target_id=a.target_id
           UNION ALL
           SELECT jsonb_build_object('sourceType','duplicate_merge','policyVersion',$1::text,
             'mergedRecordId',r.new_id,'verifiedByMwm',false) item
             FROM mwm_global_location_repair r WHERE r.target_id=a.target_id
         )
         SELECT COALESCE(jsonb_agg(item ORDER BY item::text),'[]'::jsonb)
         FROM (SELECT DISTINCT item FROM evidence_items) deduplicated
       )
      FROM businesses target WHERE target.id=a.target_id
  `, [POLICY_VERSION]);
  const targetsUpdated = await client.query(`
    UPDATE businesses target
       SET website=a.website,source_url=a.source_url,
           country=a.canonical_country,source_evidence=a.merged_source_evidence,updated_at=NOW()
      FROM mwm_global_location_merge_aggregate a
     WHERE target.id=a.target_id
  `);
  if (targetsUpdated.rowCount !== targetGroups) throw new Error(`LOCATION_REPAIR_TARGET_UPDATE_MISMATCH:${targetsUpdated.rowCount ?? 0}`);

  const duplicatesUpdated = await client.query(`
    UPDATE businesses source
       SET city=r.canonical_city,state=r.canonical_state,country=r.canonical_country,
           dedupe_key=r.canonical_dedupe_key,is_duplicate=true,duplicate_of_id=r.target_id::uuid,
           duplicate_reason=$1::text,duplicate_marked_at=COALESCE(source.duplicate_marked_at,NOW()),
           status=CASE WHEN source.status='permanently_hidden' THEN source.status ELSE 'duplicate' END,updated_at=NOW()
      FROM mwm_global_location_repair r
     WHERE source.id=r.new_id AND r.target_id IS NOT NULL
       AND source.city=r.original_city AND source.state IS NOT DISTINCT FROM r.original_state
  `, [`${POLICY_VERSION}: exact normalized name/city/state/country collision`]);
  if (duplicatesUpdated.rowCount !== EXPECTED_COLLISIONS) throw new Error(`LOCATION_REPAIR_DUPLICATE_UPDATE_MISMATCH:${duplicatesUpdated.rowCount ?? 0}`);

  const identitiesUpdated = await client.query(`
    UPDATE business_publication_identities i SET business_id=s.target_id
    FROM mwm_global_location_identity_snapshot s
    WHERE i.identity_key=s.identity_key AND i.business_id=s.new_id AND s.target_id IS NOT NULL
  `);
  if (identitiesUpdated.rowCount !== EXPECTED_COLLISIONS) throw new Error(`LOCATION_REPAIR_IDENTITY_UPDATE_MISMATCH:${identitiesUpdated.rowCount ?? 0}`);
  const eventsUpdated = await client.query(`
    UPDATE directory_import_decision_events e
       SET published_record_id=COALESCE(s.target_id,s.new_id),
           review_evidence=COALESCE(e.review_evidence,'{}'::jsonb) || jsonb_build_object(
             'locationCanonicalizationPolicy',$1::text,'mergedRecordId',CASE WHEN s.target_id IS NULL THEN NULL ELSE s.new_id END,
             'canonicalRecordId',COALESCE(s.target_id,s.new_id)
           )
      FROM mwm_global_location_event_snapshot s
     WHERE e.id=s.event_id AND e.candidate_id=s.candidate_id AND e.batch_id=s.batch_id
       AND e.published_record_id=s.new_id
  `, [POLICY_VERSION]);
  if (eventsUpdated.rowCount !== EXPECTED_REPAIR_ROWS) throw new Error(`LOCATION_REPAIR_EVENT_UPDATE_MISMATCH:${eventsUpdated.rowCount ?? 0}`);
  const publicationsUpdated = await client.query(`
    UPDATE directory_import_publications p
       SET record_id=s.target_id,publication_action='link_existing'
      FROM mwm_global_location_pointer_snapshot s
     WHERE p.id=s.publication_id AND p.candidate_id=s.candidate_id AND p.batch_id=s.batch_id
       AND p.record_id=s.new_id AND s.target_id IS NOT NULL
  `);
  if (publicationsUpdated.rowCount !== EXPECTED_COLLISIONS) throw new Error(`LOCATION_REPAIR_PUBLICATION_UPDATE_MISMATCH:${publicationsUpdated.rowCount ?? 0}`);

  const post = await client.query<{ repaired: string; collisions: string; canonical_updates: string; candidates: string; publications: string; events: string; identities: string; targets: string }>(`
    SELECT
      (SELECT count(*)::text FROM mwm_global_location_pointer_snapshot) repaired,
      (SELECT count(*)::text FROM mwm_global_location_repair r JOIN businesses b ON b.id=r.new_id
        WHERE r.target_id IS NOT NULL AND b.is_duplicate=true AND b.status='duplicate'
          AND b.duplicate_of_id::text=r.target_id AND b.city=r.canonical_city AND b.state=r.canonical_state
          AND b.country=r.canonical_country AND b.dedupe_key=r.canonical_dedupe_key) collisions,
      (SELECT count(*)::text FROM mwm_global_location_repair r JOIN businesses b ON b.id=r.new_id
        WHERE r.target_id IS NULL AND COALESCE(b.is_duplicate,false)=false
          AND b.city=r.canonical_city AND b.state=r.canonical_state
          AND b.country=r.canonical_country AND b.dedupe_key=r.canonical_dedupe_key) canonical_updates,
      (SELECT count(*)::text FROM mwm_global_location_pointer_snapshot s JOIN directory_import_candidates c ON c.id=s.candidate_id
        WHERE c.batch_id=s.batch_id AND c.city=s.canonical_city AND c.state=s.canonical_state
          AND c.matched_business_id=COALESCE(s.target_id,s.new_id) AND c.published_record_id=COALESCE(s.target_id,s.new_id)
          AND c.review_evidence->>'locationCanonicalizationPolicy'=$1::text) candidates,
      (SELECT count(*)::text FROM mwm_global_location_pointer_snapshot s JOIN directory_import_publications p ON p.id=s.publication_id
        WHERE p.candidate_id=s.candidate_id AND p.batch_id=s.batch_id
          AND p.record_id=COALESCE(s.target_id,s.new_id)
          AND p.publication_action=CASE WHEN s.target_id IS NULL THEN 'create' ELSE 'link_existing' END) publications,
      (SELECT count(*)::text FROM mwm_global_location_event_snapshot s JOIN directory_import_decision_events e ON e.id=s.event_id
        WHERE e.candidate_id=s.candidate_id AND e.batch_id=s.batch_id
          AND e.published_record_id=COALESCE(s.target_id,s.new_id)
          AND e.review_evidence->>'locationCanonicalizationPolicy'=$1::text) events,
      (SELECT count(*)::text FROM mwm_global_location_identity_snapshot s JOIN business_publication_identities i ON i.identity_key=s.identity_key
        WHERE i.business_id=COALESCE(s.target_id,s.new_id)) identities,
      (SELECT count(*)::text FROM mwm_global_location_repair r JOIN businesses b ON b.id=r.target_id
        WHERE r.target_id IS NOT NULL
          AND public.business_record_is_public(b.status,b.listing_status,b.is_duplicate,b.permanently_hidden,b.name,b.description,b.data_source,b.phone)
          AND b.country IS NOT DISTINCT FROM COALESCE(NULLIF(btrim(r.target_country),''),r.canonical_country)) targets
  `, [POLICY_VERSION]);
  const result = post.rows[0];
  if (!result
    || Number(result.repaired) !== EXPECTED_REPAIR_ROWS
    || Number(result.collisions) !== EXPECTED_COLLISIONS
    || Number(result.canonical_updates) !== EXPECTED_CANONICAL_UPDATES
    || Number(result.candidates) !== EXPECTED_REPAIR_ROWS
    || Number(result.publications) !== EXPECTED_REPAIR_ROWS
    || Number(result.events) !== EXPECTED_REPAIR_ROWS
    || Number(result.identities) !== EXPECTED_REPAIR_ROWS
    || Number(result.targets) !== EXPECTED_COLLISIONS) {
    throw new Error(`LOCATION_REPAIR_PERSISTED_POSTCONDITION_FAILED:${JSON.stringify(result ?? {})}`);
  }
  const dangling = await client.query<{ count: string }>(`
    SELECT (
      (SELECT count(*) FROM directory_import_publications p JOIN mwm_global_location_repair r ON p.record_id=r.new_id WHERE r.target_id IS NOT NULL)
      + (SELECT count(*) FROM directory_import_decision_events e JOIN mwm_global_location_repair r ON e.published_record_id=r.new_id WHERE r.target_id IS NOT NULL)
      + (SELECT count(*) FROM business_publication_identities i JOIN mwm_global_location_repair r ON i.business_id=r.new_id WHERE r.target_id IS NOT NULL)
      + (SELECT count(*) FROM directory_import_candidates c JOIN mwm_global_location_repair r ON (c.matched_business_id=r.new_id OR c.published_record_id=r.new_id) WHERE r.target_id IS NOT NULL)
    )::text count
  `);
  if (Number(dangling.rows[0]?.count ?? 0) !== 0) throw new Error("LOCATION_REPAIR_DANGLING_CANONICAL_REFERENCE");
}

async function main(): Promise<void> {
  assertLocalDirectoryStagingFromProcess();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const apply = process.argv.includes("--apply");
  const pool = new Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 10_000, query_timeout: 240_000 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    await client.query("SET LOCAL lock_timeout='10s'");
    await client.query("SET LOCAL statement_timeout='210s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))", [PUBLISHER_LOCK_KEY]);
    const result = await buildLockedPlan(client);
    if (apply) {
      await applyLockedPlan(client, result.batchId, result.repairs);
      await client.query("COMMIT");
    } else {
      await client.query("ROLLBACK");
    }
    console.log(JSON.stringify({
      mode: apply ? "applied" : "dry_run", policyVersion: POLICY_VERSION,
      repairedRows: result.repairs.length, exactCollisionsMerged: result.collisions,
      multiMatchRowsResolvedByEvidenceThenAge: result.multiMatchRows,
      canonicalRowsUpdated: result.repairs.length - result.collisions,
    }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export { chooseWinner, dedupeKey, isUuid, normalizeCountry, normalizeText, parseCityRegion, targetCountryIsCompatible };
