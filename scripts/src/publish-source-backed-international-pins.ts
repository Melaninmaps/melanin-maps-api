import { createHash } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";
import { assertLocalDirectoryStagingFromProcess } from "./lib/local-directory-staging";
import { canonicalCountryCode } from "./lib/country-normalization";

const BUNDLE = fileURLToPath(new URL("../../data/founder-imports/2026-09-06-international-address-recovery/", import.meta.url));
const ACCEPTED = resolve(BUNDLE, "accepted-source-backed-pin-candidates.jsonl");
const SOURCE_POINTER = resolve(BUNDLE, "source-page-evidence-current.json");
const DETAIL_POINTER = resolve(BUNDLE, "detail-page-evidence/current.json");
const ACCEPTED_SHA256 = "12afafca97e50d106030cf437352eb948f27ca68c2fd8f17c8346dc4bc298355";
const EXPECTED_ROWS = 2;
const SOURCE_BATCH_NAME = "cumulative-content-global-candidates.jsonl";
const SOURCE_BATCH_SHA256 = "6f1e686856eb79e45add03f2208ac836167cde7d5ca69ea99f4464eeae9169a8";
const SOURCE_BATCH_ROWS = 7_315;
const PUBLICATION_ACTOR = "founder-authorized-bulk-searchable-2026-09-06";
const POLICY_VERSION = "source-backed-international-address-v1";

interface AcceptedPin {
  recordId: string; name: string; city: string; country: string; address: string; postalCode: string;
  latitude: number; longitude: number; sourceUrl: string; directEvidenceUrl: string; sourceResponseSha256: string;
  evidenceKind: string; coordinatePrecision: string; verificationStatus: string;
  verifiedBusinessLocation: boolean; policyVersion: string;
}
interface EvidenceCandidate {
  address?: Record<string, string>; embeddedCoordinates?: { latitude: number; longitude: number };
  detailSourceResponseSha256?: string; detailSourceUrl?: string;
}
interface EvidenceRow {
  id: string; name: string; city: string; country: string; sourceUrl?: string; status: string; sourceResponseSha256?: string;
  addressCandidates: EvidenceCandidate[];
}
interface DatabaseRow {
  id: string; name: string; city: string; country: string; address: string | null; postal_code: string | null;
  latitude: string | null; longitude: string | null; verified: boolean; unclaimed: boolean;
  owner_claim_status: string | null; ownership_control_status: string | null; verification_status: string | null;
  source_url: string | null; data_source: string | null; listing_status: string | null; status: string | null;
  enrichment_source: string | null; public_location_kind: string | null; is_public: boolean;
  candidate_ids: string[]; publication_count: string;
  canonical_count: string; canonical_primary_count: string; canonical_coordinate_count: string;
}
interface Plan extends AcceptedPin { candidateIds: string[]; }

function sha256(path: string): string { return createHash("sha256").update(readFileSync(path)).digest("hex"); }
function normalize(value: unknown): string {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function validCoordinates(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    && !(latitude === 0 && longitude === 0);
}
async function jsonl<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  const lines = createInterface({ input: createReadStream(path, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of lines) if (line.trim()) rows.push(JSON.parse(line) as T);
  return rows;
}
function verifiedEvidenceRows(pointerPath: string): EvidenceRow[] {
  const pointer = JSON.parse(readFileSync(pointerPath, "utf8")) as { manifest: string; manifestSha256: string };
  const manifestPath = resolve(BUNDLE, pointerPath === DETAIL_POINTER ? "detail-page-evidence" : ".", pointer.manifest);
  if (sha256(manifestPath) !== pointer.manifestSha256) throw new Error("INTERNATIONAL_EVIDENCE_MANIFEST_CHECKSUM_MISMATCH");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { results: { path: string; sha256: string } };
  const resultsPath = resolve(pointerPath === DETAIL_POINTER ? resolve(BUNDLE, "detail-page-evidence") : BUNDLE, manifest.results.path);
  if (sha256(resultsPath) !== manifest.results.sha256) throw new Error("INTERNATIONAL_EVIDENCE_RESULTS_CHECKSUM_MISMATCH");
  return readFileSync(resultsPath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as EvidenceRow);
}
async function sourceRows(): Promise<AcceptedPin[]> {
  if (sha256(ACCEPTED) !== ACCEPTED_SHA256) throw new Error("INTERNATIONAL_PIN_ACCEPTED_CHECKSUM_MISMATCH");
  const rows = await jsonl<AcceptedPin>(ACCEPTED);
  if (rows.length !== EXPECTED_ROWS || new Set(rows.map((row) => row.recordId)).size !== EXPECTED_ROWS) throw new Error("INTERNATIONAL_PIN_ACCEPTED_COHORT_MISMATCH");
  const evidence = [...verifiedEvidenceRows(SOURCE_POINTER), ...verifiedEvidenceRows(DETAIL_POINTER)];
  for (const row of rows) {
    if (!validCoordinates(row.latitude, row.longitude) || row.verificationStatus !== "candidate_unverified" || row.verifiedBusinessLocation !== false
      || row.policyVersion !== POLICY_VERSION || row.evidenceKind !== "business_specific_jsonld_exact_name_city_country"
      || row.coordinatePrecision !== "business_supplied_embedded_geo") throw new Error("INTERNATIONAL_PIN_ACCEPTED_POLICY_MISMATCH");
    const match = evidence.find((item) => item.id === row.recordId && item.status === "structured_address_candidate" && item.addressCandidates.length === 1
      && normalize(item.name) === normalize(row.name) && normalize(item.city) === normalize(row.city) && normalize(item.country) === normalize(row.country));
    const candidate = match?.addressCandidates[0];
    const address = candidate?.address;
    const coordinates = candidate?.embeddedCoordinates;
    const responseHash = candidate?.detailSourceResponseSha256 ?? match?.sourceResponseSha256;
    const directEvidenceUrl = candidate?.detailSourceUrl ?? match?.sourceUrl;
    if (!match || !address || !coordinates || normalize(address.streetAddress) !== normalize(row.address)
      || normalize(address.addressLocality) !== normalize(row.city) || normalize(address.postalCode) !== normalize(row.postalCode)
      || canonicalCountryCode(address.addressCountry) !== canonicalCountryCode(row.country)
      || Number(coordinates.latitude) !== row.latitude || Number(coordinates.longitude) !== row.longitude
      || responseHash !== row.sourceResponseSha256 || directEvidenceUrl !== row.directEvidenceUrl) throw new Error("INTERNATIONAL_PIN_EVIDENCE_CONTRACT_MISMATCH");
  }
  return rows;
}

async function databaseRows(client: PoolClient, ids: string[], lock: boolean): Promise<DatabaseRow[]> {
  const { rows } = await client.query<DatabaseRow>(`WITH batch AS (
    SELECT id FROM directory_import_batches WHERE source_name=$1 AND source_sha256=$2 AND source_row_count=$3
  ), candidates AS (
    SELECT c.published_record_id record_id,array_agg(c.id ORDER BY c.id)::text[] candidate_ids,count(p.id)::text publication_count
    FROM batch JOIN directory_import_candidates c ON c.batch_id=batch.id
    JOIN directory_import_publications p ON p.candidate_id=c.id AND p.record_type='business' AND p.record_id=c.published_record_id AND p.actor_id=$5
    WHERE c.target_kind='business' AND c.status='published' AND c.published_record_type='business' AND c.published_record_id=ANY($4::text[])
    GROUP BY c.published_record_id
  )
  SELECT b.id,b.name,b.city,b.country,b.address,b.postal_code,b.latitude::text,b.longitude::text,b.verified,
         b.claimed_owner_member_id IS NULL unclaimed,b.owner_claim_status,b.ownership_control_status,b.verification_status,
         b.source_url,b.data_source,b.listing_status,b.status,b.enrichment_source,b.public_location_kind,
         public.business_record_is_public(b.status,b.listing_status,b.is_duplicate,b.permanently_hidden,b.name,b.description,b.data_source,b.phone) is_public,
         c.candidate_ids,c.publication_count,
         (SELECT count(*)::text FROM canonical_record_locations l WHERE l.record_type='business' AND l.record_id=b.id::uuid) canonical_count,
         (SELECT count(*)::text FROM canonical_record_locations l WHERE l.record_type='business' AND l.record_id=b.id::uuid AND l.is_primary) canonical_primary_count,
         (SELECT count(*)::text FROM canonical_record_locations l WHERE l.record_type='business' AND l.record_id=b.id::uuid AND (l.latitude IS NOT NULL OR l.longitude IS NOT NULL)) canonical_coordinate_count
    FROM businesses b JOIN candidates c ON c.record_id=b.id WHERE b.id=ANY($4::text[]) ORDER BY b.id
    ${lock ? "FOR UPDATE OF b" : ""}`,[SOURCE_BATCH_NAME,SOURCE_BATCH_SHA256,SOURCE_BATCH_ROWS,ids,PUBLICATION_ACTOR]);
  return rows;
}

function plansFor(accepted: AcceptedPin[], rows: DatabaseRow[]): { plans: Plan[]; alreadyPinned: number } {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const plans: Plan[] = [];
  let alreadyPinned = 0;
  for (const acceptedRow of accepted) {
    const row = byId.get(acceptedRow.recordId);
    if (!row || !row.is_public || !row.unclaimed || row.verified || row.owner_claim_status !== "unclaimed" || row.ownership_control_status !== "unclaimed"
      || row.verification_status !== "not_requested" || row.data_source !== "founder_directory_import"
      || normalize(row.name) !== normalize(acceptedRow.name) || normalize(row.city) !== normalize(acceptedRow.city)
      || normalize(row.country) !== normalize(acceptedRow.country) || row.source_url !== acceptedRow.sourceUrl
      || !["live_unclaimed"].includes(row.listing_status ?? "") || ["duplicate","permanently_hidden","removed","deleted"].includes(row.status ?? "")
      || row.publication_count !== String(row.candidate_ids.length) || row.candidate_ids.length < 1
      || row.canonical_count !== "1" || row.canonical_primary_count !== "1") throw new Error("INTERNATIONAL_PIN_DATABASE_CONTRACT_MISMATCH");
    const hasLatitude = row.latitude !== null, hasLongitude = row.longitude !== null;
    if (hasLatitude !== hasLongitude) throw new Error("INTERNATIONAL_PIN_PARTIAL_COORDINATE_CONFLICT");
    if (hasLatitude && hasLongitude) {
      if (Number(row.latitude) !== acceptedRow.latitude || Number(row.longitude) !== acceptedRow.longitude
        || normalize(row.address) !== normalize(acceptedRow.address) || normalize(row.postal_code) !== normalize(acceptedRow.postalCode)
        || row.public_location_kind !== "address") throw new Error("INTERNATIONAL_PIN_EXISTING_LOCATION_CONFLICT");
      alreadyPinned += 1; continue;
    }
    if (row.address !== null || row.postal_code !== null || row.canonical_coordinate_count !== "0") throw new Error("INTERNATIONAL_PIN_EXISTING_ADDRESS_CONFLICT");
    plans.push({ ...acceptedRow, candidateIds: row.candidate_ids });
  }
  if (rows.length !== EXPECTED_ROWS || plans.length + alreadyPinned !== EXPECTED_ROWS) throw new Error("INTERNATIONAL_PIN_PLAN_COUNT_MISMATCH");
  return { plans, alreadyPinned };
}

async function installPlans(client: PoolClient, plans: Plan[]): Promise<void> {
  await client.query(`CREATE TEMP TABLE mwm_international_pin_plan(
    record_id text PRIMARY KEY,name text NOT NULL,city text NOT NULL,country text NOT NULL,address text NOT NULL,postal_code text NOT NULL,
    latitude double precision NOT NULL,longitude double precision NOT NULL,source_url text NOT NULL,direct_evidence_url text NOT NULL,
    source_response_sha256 text NOT NULL,evidence_kind text NOT NULL,coordinate_precision text NOT NULL,verification_status text NOT NULL,
    verified_business_location boolean NOT NULL,policy_version text NOT NULL,candidate_ids uuid[] NOT NULL) ON COMMIT DROP`);
  await client.query(`INSERT INTO mwm_international_pin_plan SELECT * FROM jsonb_to_recordset($1::jsonb) AS p(
    record_id text,name text,city text,country text,address text,postal_code text,latitude double precision,longitude double precision,
    source_url text,direct_evidence_url text,source_response_sha256 text,evidence_kind text,coordinate_precision text,
    verification_status text,verified_business_location boolean,policy_version text,candidate_ids uuid[])`, [JSON.stringify(plans.map((plan) => ({
      record_id: plan.recordId, name: plan.name, city: plan.city, country: plan.country, address: plan.address, postal_code: plan.postalCode,
      latitude: plan.latitude, longitude: plan.longitude, source_url: plan.sourceUrl, direct_evidence_url: plan.directEvidenceUrl,
      source_response_sha256: plan.sourceResponseSha256, evidence_kind: plan.evidenceKind, coordinate_precision: plan.coordinatePrecision,
      verification_status: plan.verificationStatus, verified_business_location: plan.verifiedBusinessLocation,
      policy_version: plan.policyVersion, candidate_ids: plan.candidateIds,
    })))]);
}

async function apply(client: PoolClient, accepted: AcceptedPin[]) {
  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  try {
    await client.query("SET LOCAL lock_timeout='10s'"); await client.query("SET LOCAL statement_timeout='120s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [POLICY_VERSION]);
    const rows = await databaseRows(client, accepted.map((row) => row.recordId), true);
    const prepared = plansFor(accepted, rows);
    if (!prepared.plans.length) { await client.query("COMMIT"); return { pinnableRecords: 0, alreadyPinned: prepared.alreadyPinned, pinnedNow: 0, candidateAuditRows: 0, canonicalLocationsUpdated: 0 }; }
    await installPlans(client, prepared.plans);
    await client.query(`SELECT l.id FROM canonical_record_locations l JOIN mwm_international_pin_plan p ON l.record_type='business' AND l.record_id=p.record_id::uuid ORDER BY l.id FOR UPDATE OF l`);
    const canonicalCheck = await client.query<{ count: string }>(`SELECT count(*)::text count FROM mwm_international_pin_plan p
      JOIN canonical_record_locations l ON l.record_type='business' AND l.record_id=p.record_id::uuid
      WHERE l.is_primary AND l.latitude IS NULL AND l.longitude IS NULL`);
    if (Number(canonicalCheck.rows[0]?.count ?? 0) !== prepared.plans.length) throw new Error("INTERNATIONAL_PIN_CANONICAL_PREFLIGHT_FAILED");
    const updated = await client.query(`UPDATE businesses b SET address=p.address,postal_code=p.postal_code,
      latitude=round(p.latitude::numeric,7),longitude=round(p.longitude::numeric,7),public_location_kind='address',
      enrichment_source='business-specific public page',
      source_evidence=CASE WHEN jsonb_typeof(COALESCE(b.source_evidence,'[]'::jsonb))='array' THEN COALESCE(b.source_evidence,'[]'::jsonb)||jsonb_build_array(
        jsonb_build_object('sourceType','business-specific public page','field','address_location','supports',true,'verifiedByMwm',false,
        'directEvidenceUrl',p.direct_evidence_url,'sourceResponseSha256',p.source_response_sha256,'coordinatePrecision',p.coordinate_precision,
        'evidenceKind',p.evidence_kind,'policyVersion',p.policy_version))
        ELSE jsonb_build_array(b.source_evidence,jsonb_build_object('sourceType','business-specific public page','field','address_location','supports',true,
        'verifiedByMwm',false,'directEvidenceUrl',p.direct_evidence_url,'sourceResponseSha256',p.source_response_sha256,
        'coordinatePrecision',p.coordinate_precision,'evidenceKind',p.evidence_kind,'policyVersion',p.policy_version)) END,
      updated_at=NOW() FROM mwm_international_pin_plan p WHERE b.id=p.record_id AND b.latitude IS NULL AND b.longitude IS NULL
      AND b.address IS NULL AND b.postal_code IS NULL AND b.verified=false AND b.claimed_owner_member_id IS NULL
      AND b.owner_claim_status='unclaimed' AND b.ownership_control_status='unclaimed' AND b.verification_status='not_requested'
      AND b.listing_status='live_unclaimed' AND COALESCE(b.is_duplicate,false)=false
      AND COALESCE(b.status,'active') NOT IN('duplicate','permanently_hidden','removed','deleted') RETURNING b.id`);
    if ((updated.rowCount ?? 0) !== prepared.plans.length) throw new Error("INTERNATIONAL_PIN_BUSINESS_UPDATE_FAILED");
    const canonical = await client.query(`UPDATE canonical_record_locations l SET latitude=round(p.latitude::numeric,6),longitude=round(p.longitude::numeric,6),updated_at=NOW()
      FROM mwm_international_pin_plan p WHERE l.record_type='business' AND l.record_id=p.record_id::uuid AND l.is_primary AND l.latitude IS NULL AND l.longitude IS NULL RETURNING l.id`);
    if ((canonical.rowCount ?? 0) !== prepared.plans.length) throw new Error("INTERNATIONAL_PIN_CANONICAL_UPDATE_FAILED");
    const candidateAudit = await client.query(`UPDATE directory_import_candidates c SET
      address=p.address,review_evidence=COALESCE(c.review_evidence,'{}'::jsonb)||jsonb_build_object(
        'mapPin',true,'locationSource','business-specific public page','locationPolicyVersion',p.policy_version,
        'coordinatePrecision',p.coordinate_precision,'directEvidenceUrl',p.direct_evidence_url,'verified',false),
      review_note='Founder-authorized searchable listing with a business-specific public-page address and embedded map coordinates; listing remains unclaimed and not verified.',
      review_revision=review_revision+1,updated_at=NOW()
      FROM mwm_international_pin_plan p WHERE c.id=ANY(p.candidate_ids) AND c.status='published'
      AND c.published_record_type='business' AND c.published_record_id=p.record_id RETURNING c.id`);
    const expectedAuditRows = prepared.plans.reduce((sum, plan) => sum + plan.candidateIds.length, 0);
    if ((candidateAudit.rowCount ?? 0) !== expectedAuditRows) throw new Error("INTERNATIONAL_PIN_CANDIDATE_AUDIT_FAILED");
    const post = await client.query<{ count: string }>(`SELECT count(*)::text count FROM mwm_international_pin_plan p JOIN businesses b ON b.id=p.record_id
      JOIN canonical_record_locations l ON l.record_type='business' AND l.record_id=b.id::uuid AND l.is_primary
      WHERE b.address=p.address AND b.postal_code=p.postal_code AND b.latitude=round(p.latitude::numeric,7) AND b.longitude=round(p.longitude::numeric,7)
        AND l.latitude=round(p.latitude::numeric,6) AND l.longitude=round(p.longitude::numeric,6)
        AND b.public_location_kind='address' AND b.verified=false AND b.claimed_owner_member_id IS NULL
        AND public.business_record_is_public(b.status,b.listing_status,b.is_duplicate,b.permanently_hidden,b.name,b.description,b.data_source,b.phone)`);
    if (Number(post.rows[0]?.count ?? 0) !== prepared.plans.length) throw new Error("INTERNATIONAL_PIN_PERSISTED_POSTCONDITION_FAILED");
    await client.query("COMMIT");
    return { pinnableRecords: prepared.plans.length, alreadyPinned: prepared.alreadyPinned, pinnedNow: updated.rowCount ?? 0,
      candidateAuditRows: candidateAudit.rowCount ?? 0, canonicalLocationsUpdated: canonical.rowCount ?? 0 };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
}

async function main(): Promise<void> {
  const applyFlag = process.argv.includes("--apply"); assertLocalDirectoryStagingFromProcess();
  const accepted = await sourceRows();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10_000, query_timeout: 180_000 });
  const client = await pool.connect();
  try {
    if (applyFlag) { console.log(JSON.stringify({ mode: "applied", policyVersion: POLICY_VERSION, ...await apply(client, accepted) }, null, 2)); return; }
    const rows = await databaseRows(client, accepted.map((row) => row.recordId), false);
    const prepared = plansFor(accepted, rows);
    console.log(JSON.stringify({ mode: "dry_run", policyVersion: POLICY_VERSION, acceptedEvidenceRows: accepted.length,
      pinnableRecords: prepared.plans.length, alreadyPinned: prepared.alreadyPinned }, null, 2));
  } finally { client.release(); await pool.end(); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });

export { plansFor, sourceRows, validCoordinates };
