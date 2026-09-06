import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";
import { assertLocalDirectoryStagingFromProcess } from "./lib/local-directory-staging";

const ACTOR_ID = "founder-authorized-global-destinations-2026-09-06";
const POLICY_VERSION = "founder-global-destinations-v1";
const SOURCE_NAME = "cumulative-content-global-candidates.jsonl";
const SOURCE_SHA256 = "6f1e686856eb79e45add03f2208ac836167cde7d5ca69ea99f4464eeae9169a8";
const SOURCE_ROW_COUNT = 7_315;
const EXPECTED_DESTINATIONS = 545;

type CandidateRow = {
  id: string;
  batch_id: string;
  source_row: number;
  name: string;
  city: string;
  state: string | null;
  category: string | null;
  status: string;
  raw_record: Record<string, unknown>;
  source_url: string | null;
};

type Destination = {
  candidateId: string;
  batchId: string;
  sourceRow: number;
  id: string;
  title: string;
  slug: string;
  city: string;
  stateRegion: string | null;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  summary: string;
  sourceUrl: string | null;
  sourceLabel: string;
  previousStatus: string;
  payloadHash: string;
};

function normalize(value: unknown): string {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function stableUuid(namespace: string): string {
  const hex = createHash("sha1").update(namespace).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20)}`;
}

function slugify(value: string): string {
  return normalize(value).replace(/\s+/g, "-").slice(0, 100);
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  // Founder source links are expected to use public DNS names. Reject every
  // literal IPv4/IPv6 host rather than maintaining an incomplete reserved-CIDR list.
  return host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || isIP(host) !== 0;
}

function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (isPrivateHostname(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const COUNTRY_ALIASES: Record<string, string> = {
  "antigua and barbuda": "AG",
  "bosnia and herzegovina": "BA",
  "cabo verde": "CV",
  "the gambia": "GM",
  "cote d ivoire": "CI",
  "turkiye": "TR",
  "federated states of micronesia": "FM",
  "micronesia": "FM",
  "macau": "MO",
  "hong kong": "HK",
  "sint eustatius": "BQ",
  "saba": "BQ",
  "bonaire": "BQ",
  "saint martin": "MF",
  "saint barthelemy": "BL",
  "saint kitts and nevis": "KN",
  "saint lucia": "LC",
  "saint vincent and the grenadines": "VC",
  "reunion": "RE",
  "sao tome and principe": "ST",
  "curacao": "CW",
  "taiwan": "TW",
  "trinidad and tobago": "TT",
  "turks and caicos islands": "TC",
  "bolivia": "BO",
};

let generatedCountryCodes: Map<string, string> | null = null;
function countryCodes(): Map<string, string> {
  if (generatedCountryCodes) return generatedCountryCodes;
  const display = new Intl.DisplayNames(["en"], { type: "region" });
  const map = new Map<string, string>();
  for (let a = 65; a <= 90; a += 1) {
    for (let b = 65; b <= 90; b += 1) {
      const code = String.fromCharCode(a, b);
      const name = display.of(code);
      if (name && name !== code) map.set(normalize(name), code);
    }
  }
  for (const [name, code] of Object.entries(COUNTRY_ALIASES)) map.set(name, code);
  generatedCountryCodes = map;
  return map;
}

function isoCountryCode(country: string): string {
  const code = countryCodes().get(normalize(country));
  if (!code) throw new Error(`UNKNOWN_DESTINATION_COUNTRY:${country}`);
  return code;
}

function exactCoordinate(latitude: unknown, longitude: unknown): { latitude: number; longitude: number } {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) {
    throw new Error("INVALID_DESTINATION_COORDINATES");
  }
  return { latitude: lat, longitude: lng };
}

function destinationFromCandidate(row: CandidateRow): Destination {
  const raw = row.raw_record ?? {};
  const country = String(raw.country ?? "").trim();
  const destination = String(raw.destination ?? row.name).trim();
  const region = String(raw.region ?? row.state ?? "").trim() || null;
  if (row.category !== "Travel Destination" || !destination || !country) {
    throw new Error(`INVALID_DESTINATION_IDENTITY:${row.source_row}`);
  }
  const coordinates = exactCoordinate(raw.latitude, raw.longitude);
  const evidenceScope = String(raw.evidenceScope ?? "Founder-curated travel planning").trim();
  const precision = String(raw.evidencePrecision ?? "Supplied destination coordinate").trim();
  const sourceUrl = safeExternalUrl(row.source_url);
  const safetyUrl = safeExternalUrl(raw.safetySource);
  if (row.source_url && !sourceUrl) throw new Error(`UNSAFE_DESTINATION_SOURCE_URL:${row.source_row}`);
  if (raw.safetySource && !safetyUrl) throw new Error(`UNSAFE_DESTINATION_SAFETY_URL:${row.source_row}`);
  const id = stableUuid(`${SOURCE_SHA256}:travel_destination:${row.source_row}`);
  const summary = `${evidenceScope}. ${precision}. Planning reference only; check current official travel guidance before travel.`;
  const payloadHash = createHash("sha256").update(JSON.stringify({ id, destination, country, region, coordinates, sourceUrl, safetyUrl, summary })).digest("hex");
  return {
    candidateId: row.id,
    batchId: row.batch_id,
    sourceRow: row.source_row,
    id,
    title: destination,
    slug: `${slugify(`${destination}-${country}`)}-${row.source_row}`,
    city: destination,
    stateRegion: region,
    country,
    countryCode: isoCountryCode(country),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    summary,
    sourceUrl,
    sourceLabel: sourceUrl ? "Founder-supplied travel evidence" : "Founder-supplied coordinate record",
    previousStatus: row.status,
    payloadHash,
  };
}

async function loadLockedDestinations(client: PoolClient): Promise<Destination[]> {
  const batch = await client.query<{ id: string; source_row_count: number }>(`
    SELECT id,source_row_count FROM directory_import_batches
     WHERE source_name=$1::text AND source_sha256=$2::text FOR UPDATE
  `, [SOURCE_NAME, SOURCE_SHA256]);
  if (batch.rowCount !== 1 || batch.rows[0].source_row_count !== SOURCE_ROW_COUNT) throw new Error("GLOBAL_DESTINATION_BATCH_MISMATCH");
  const staged = await client.query<{ count: string }>(`SELECT count(*)::text count FROM directory_import_candidates WHERE batch_id=$1::uuid`, [batch.rows[0].id]);
  if (Number(staged.rows[0]?.count ?? 0) !== SOURCE_ROW_COUNT) throw new Error("GLOBAL_DESTINATION_STAGED_COUNT_MISMATCH");
  const rows = await client.query<CandidateRow>(`
    SELECT id::text,batch_id::text,source_row,name,city,state,category,status,raw_record,source_url
      FROM directory_import_candidates
     WHERE batch_id=$1::uuid AND target_kind='manual_review' AND category='Travel Destination'
       AND raw_record ? 'latitude' AND raw_record ? 'longitude'
     ORDER BY source_row
     FOR UPDATE
  `, [batch.rows[0].id]);
  if (rows.rowCount !== EXPECTED_DESTINATIONS) throw new Error(`GLOBAL_DESTINATION_COUNT_MISMATCH:${rows.rowCount ?? 0}`);
  const destinations = rows.rows.map(destinationFromCandidate);
  if (new Set(destinations.map((row) => `${normalize(row.title)}|${normalize(row.country)}`)).size !== EXPECTED_DESTINATIONS) {
    throw new Error("GLOBAL_DESTINATION_DUPLICATE_IDENTITY");
  }
  return destinations;
}

async function applyDestinations(client: PoolClient, destinations: Destination[]): Promise<void> {
  await client.query(`
    CREATE TEMP TABLE mwm_global_destinations (
      candidate_id uuid PRIMARY KEY,batch_id uuid NOT NULL,source_row integer NOT NULL,id uuid NOT NULL,
      title text NOT NULL,slug text NOT NULL,city text NOT NULL,state_region text,country text NOT NULL,
      country_code char(2) NOT NULL,latitude double precision NOT NULL,longitude double precision NOT NULL,
      summary text NOT NULL,source_url text,source_label text NOT NULL,previous_status text NOT NULL,payload_hash text NOT NULL
    ) ON COMMIT DROP
  `);
  await client.query(`
    INSERT INTO mwm_global_destinations
    SELECT * FROM jsonb_to_recordset($1::jsonb) AS r(
      candidate_id uuid,batch_id uuid,source_row integer,id uuid,title text,slug text,city text,state_region text,
      country text,country_code char(2),latitude double precision,longitude double precision,summary text,
      source_url text,source_label text,previous_status text,payload_hash text
    )
  `, [JSON.stringify(destinations.map((row) => ({
    candidate_id: row.candidateId,batch_id: row.batchId,source_row: row.sourceRow,id: row.id,title: row.title,
    slug: row.slug,city: row.city,state_region: row.stateRegion,country: row.country,country_code: row.countryCode,
    latitude: row.latitude,longitude: row.longitude,summary: row.summary,source_url: row.sourceUrl,
    source_label: row.sourceLabel,previous_status: row.previousStatus,payload_hash: row.payloadHash,
  })))]);
  const conflicts = await client.query<{ count: string }>(`
    SELECT count(*)::text count FROM mwm_global_destinations d
    JOIN map_entities e ON (e.entity_kind='travel_destination' AND e.slug=d.slug) OR e.source_record_id=d.candidate_id
    WHERE e.id<>d.id OR e.source_record_id IS DISTINCT FROM d.candidate_id
       OR e.entity_kind<>'travel_destination' OR e.slug<>d.slug
  `);
  if (Number(conflicts.rows[0]?.count ?? 0) !== 0) throw new Error("GLOBAL_DESTINATION_EXISTING_IDENTITY_CONFLICT");
  const alreadyApplied = await client.query<{ count: string }>(`
    SELECT count(*)::text count FROM mwm_global_destinations d
    JOIN map_entities e ON e.id=d.id AND e.entity_kind='travel_destination' AND e.source_record_id=d.candidate_id
      AND e.published=true AND e.geocode_status='resolved' AND e.latitude=d.latitude AND e.longitude=d.longitude
    JOIN directory_import_candidates c ON c.id=d.candidate_id AND c.status='published'
      AND c.published_record_type='map_entity' AND c.published_record_id=d.id::text
      AND c.review_evidence->>'policyVersion'=$2::text
      AND c.review_evidence->>'coordinateSource'='founder_supplied'
      AND c.review_evidence->>'verifiedBusinessLocation'='false'
    JOIN directory_import_publications p ON p.candidate_id=d.candidate_id
      AND p.batch_id=d.batch_id AND p.record_type='map_entity' AND p.record_id=d.id::text
      AND p.actor_id=$1::text
      AND p.idempotency_key='global-destination:'||d.candidate_id::text||':'||$2::text
      AND p.payload_hash=d.payload_hash
    JOIN directory_import_decision_events v ON v.candidate_id=d.candidate_id
      AND v.batch_id=d.batch_id AND v.actor_id=$1::text AND v.action='publish' AND v.new_status='published'
      AND v.idempotency_key='global-destination-decision:'||d.candidate_id::text||':'||$2::text
      AND v.payload_hash=d.payload_hash
      AND v.published_record_type='map_entity' AND v.published_record_id=d.id::text
      AND v.review_evidence->>'policyVersion'=$2::text
      AND v.review_evidence->>'coordinateSource'='founder_supplied'
      AND v.review_evidence->>'verifiedBusinessLocation'='false'
  `, [ACTOR_ID, POLICY_VERSION]);
  const alreadyAppliedCount = Number(alreadyApplied.rows[0]?.count ?? 0);
  if (alreadyAppliedCount === EXPECTED_DESTINATIONS) return;
  if (alreadyAppliedCount !== 0) throw new Error(`GLOBAL_DESTINATION_PARTIAL_PRIOR_APPLY:${alreadyAppliedCount}`);
  const inserted = await client.query(`
    INSERT INTO map_entities (
      id,entity_kind,title,slug,summary,address_line1,city,state_region,postal_code,country_code,
      latitude,longitude,website_url,source_url,source_label,source_record_id,published,geocode_status
    )
    SELECT id,'travel_destination',title,slug,summary,NULL,city,state_region,NULL,country_code,
           latitude,longitude,NULL,source_url,source_label,candidate_id,true,'resolved'
      FROM mwm_global_destinations
    ON CONFLICT (entity_kind,slug) DO UPDATE SET
      title=EXCLUDED.title,summary=EXCLUDED.summary,city=EXCLUDED.city,state_region=EXCLUDED.state_region,
      country_code=EXCLUDED.country_code,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,
      source_url=EXCLUDED.source_url,source_label=EXCLUDED.source_label,source_record_id=EXCLUDED.source_record_id,
      published=true,geocode_status='resolved',updated_at=NOW()
    WHERE map_entities.source_record_id=EXCLUDED.source_record_id
  `);
  if (inserted.rowCount !== EXPECTED_DESTINATIONS) throw new Error(`GLOBAL_DESTINATION_UPSERT_MISMATCH:${inserted.rowCount ?? 0}`);
  await client.query(`
    INSERT INTO directory_import_publications (candidate_id,batch_id,record_type,record_id,publication_action,actor_id,idempotency_key,payload_hash)
    SELECT candidate_id,batch_id,'map_entity',id::text,'create',$1::text,
           'global-destination:'||candidate_id::text||':'||$2::text,payload_hash
      FROM mwm_global_destinations
    ON CONFLICT (candidate_id) DO UPDATE SET
      batch_id=EXCLUDED.batch_id,record_type='map_entity',record_id=EXCLUDED.record_id,
      publication_action='create',actor_id=EXCLUDED.actor_id,
      idempotency_key=EXCLUDED.idempotency_key,payload_hash=EXCLUDED.payload_hash
    WHERE directory_import_publications.record_type='map_entity' AND directory_import_publications.record_id=EXCLUDED.record_id
  `, [ACTOR_ID, POLICY_VERSION]);
  await client.query(`
    INSERT INTO directory_import_decision_events (
      candidate_id,batch_id,actor_id,action,previous_status,new_status,review_note,review_evidence,
      idempotency_key,payload_hash,published_record_type,published_record_id
    )
    SELECT candidate_id,batch_id,$1::text,'publish',previous_status,'published',
           'Published to the global travel destination map from supplied coordinates; not a business listing.',
           jsonb_build_object('policyVersion',$2::text,'sourceRow',source_row,'coordinateSource','founder_supplied','verifiedBusinessLocation',false),
           'global-destination-decision:'||candidate_id::text||':'||$2::text,payload_hash,'map_entity',id::text
      FROM mwm_global_destinations
    ON CONFLICT (idempotency_key) DO NOTHING
  `, [ACTOR_ID, POLICY_VERSION]);
  const updated = await client.query(`
    UPDATE directory_import_candidates c SET
      status='published',published_record_type='map_entity',published_record_id=d.id::text,
      review_note='Published to global travel destination map from supplied coordinates; not a business listing.',
      review_evidence=COALESCE(c.review_evidence,'{}'::jsonb)||jsonb_build_object(
        'policyVersion',$1::text,'mapEntityId',d.id,'coordinateSource','founder_supplied',
        'latitude',d.latitude,'longitude',d.longitude,'verifiedBusinessLocation',false
      ),review_revision=c.review_revision+1,updated_at=NOW()
    FROM mwm_global_destinations d
    WHERE c.id=d.candidate_id AND c.batch_id=d.batch_id AND c.target_kind='manual_review'
      AND c.category='Travel Destination' AND c.raw_record ? 'latitude' AND c.raw_record ? 'longitude'
  `, [POLICY_VERSION]);
  if (updated.rowCount !== EXPECTED_DESTINATIONS) throw new Error(`GLOBAL_DESTINATION_CANDIDATE_UPDATE_MISMATCH:${updated.rowCount ?? 0}`);
  const post = await client.query<{ count: string }>(`
    SELECT count(*)::text count FROM mwm_global_destinations d
    JOIN map_entities e ON e.id=d.id AND e.entity_kind='travel_destination' AND e.source_record_id=d.candidate_id
      AND e.published=true AND e.geocode_status='resolved' AND e.latitude=d.latitude AND e.longitude=d.longitude
    JOIN directory_import_candidates c ON c.id=d.candidate_id
    JOIN directory_import_publications p ON p.candidate_id=d.candidate_id
      AND p.batch_id=d.batch_id AND p.record_type='map_entity' AND p.record_id=d.id::text
      AND p.actor_id=$1::text
      AND p.idempotency_key='global-destination:'||d.candidate_id::text||':'||$2::text
      AND p.payload_hash=d.payload_hash
    JOIN directory_import_decision_events v ON v.candidate_id=d.candidate_id AND v.batch_id=d.batch_id
      AND v.actor_id=$1::text AND v.action='publish' AND v.new_status='published'
      AND v.idempotency_key='global-destination-decision:'||d.candidate_id::text||':'||$2::text
      AND v.payload_hash=d.payload_hash AND v.published_record_type='map_entity' AND v.published_record_id=d.id::text
      AND v.review_evidence->>'policyVersion'=$2::text
      AND v.review_evidence->>'coordinateSource'='founder_supplied'
      AND v.review_evidence->>'verifiedBusinessLocation'='false'
    WHERE c.status='published' AND c.published_record_type='map_entity' AND c.published_record_id=d.id::text
      AND c.review_evidence->>'policyVersion'=$2::text
      AND c.review_evidence->>'coordinateSource'='founder_supplied'
      AND c.review_evidence->>'verifiedBusinessLocation'='false'
  `, [ACTOR_ID, POLICY_VERSION]);
  if (Number(post.rows[0]?.count ?? 0) !== EXPECTED_DESTINATIONS) throw new Error("GLOBAL_DESTINATION_POSTCONDITION_FAILED");
}

async function main(): Promise<void> {
  assertLocalDirectoryStagingFromProcess();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const apply = process.argv.includes("--apply");
  const pool = new Pool({ connectionString: databaseUrl,max:1,connectionTimeoutMillis:10_000,query_timeout:240_000 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    await client.query("SET LOCAL lock_timeout='10s'");
    await client.query("SET LOCAL statement_timeout='210s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))", [POLICY_VERSION]);
    const destinations = await loadLockedDestinations(client);
    if (apply) {
      await applyDestinations(client,destinations);
      await client.query("COMMIT");
    } else {
      await client.query("ROLLBACK");
    }
    const coordinatePairs = new Set(destinations.map((row) => `${row.latitude}|${row.longitude}`)).size;
    console.log(JSON.stringify({
      mode:apply?'applied':'dry_run',policyVersion:POLICY_VERSION,destinations:destinations.length,
      countries:new Set(destinations.map((row)=>row.countryCode)).size,coordinatePairs,
      sharedCoordinateRows:destinations.length-coordinatePairs,allCoordinatesSupplied:true,businessListingsCreated:0,
    },null,2));
  } catch (error) {
    await client.query("ROLLBACK").catch(()=>undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  main().catch((error)=>{ console.error(error instanceof Error?error.message:String(error)); process.exitCode=1; });
}

export { destinationFromCandidate, exactCoordinate, isoCountryCode, normalize, safeExternalUrl, stableUuid };
