import { createHash } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";
import { assertLocalDirectoryStagingFromProcess } from "./lib/local-directory-staging";
import { canonicalStreetIdentity } from "./publish-founder-business-inventory";

const MANIFEST = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-06-today-net-new-businesses/today-net-new-business-candidates.jsonl",
  import.meta.url,
));
const RESULTS = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-06-today-net-new-businesses/census-geocode-results.jsonl",
  import.meta.url,
));
const SOURCE_NAME = "today-net-new-business-candidates.jsonl";
const SOURCE_SHA256 = "144ca9d90ca9ea40445e957a62d6bf786d765657411fc40ee3c0b5433260bc49";
const SOURCE_ROWS = 3_367;
const RESULTS_SHA256 = "2dc4e1752853821fc61575f8f574d93b2fbef8453d96e3de3335769623a30a6b";
const EXPECTED_ACCEPTED_BUSINESS_ROWS = 2_170;
const PUBLICATION_ACTOR = "founder-authorized-bulk-searchable-2026-09-06";
const POLICY_VERSION = "founder-census-exact-address-v1";

type CandidateManifest = {
  sourceRow: number; targetKind: string; name: string; address: string; city: string; state: string;
};
type GeocodeResult = {
  sourceRow: number; targetKind: string; accepted: boolean; latitude: number | null; longitude: number | null;
  matchedAddress: string | null; tigerLineId: string | null; matchStatus: string; matchType: string;
  provider: string; benchmark: string; policyVersion: string; coordinatePrecision: string;
  verifiedBusinessLocation: boolean;
};
type DatabaseRow = {
  candidate_id: string; source_row: number; candidate_status: string; candidate_address: string | null;
  candidate_city: string; candidate_state: string | null; published_record_id: string | null;
  business_id: string | null; business_address: string | null; business_city: string | null;
  business_state: string | null; business_country: string | null; business_postal_code: string | null;
  latitude: string | null; longitude: string | null; listing_status: string | null; business_status: string | null;
  publication_count: string;
};
type Plan = {
  record_id: string; latitude: number; longitude: number; matched_address: string; tiger_line_id: string | null;
  candidate_ids: string[]; source_rows: number[]; address: string; city: string; state: string | null;
  country: string | null; postal_code: string | null;
};

function sha256(path: string): string { return createHash("sha256").update(readFileSync(path)).digest("hex"); }
function normalize(value: unknown): string {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function validCoordinates(lat: number | null, lng: number | null): lat is number {
  return typeof lat === "number" && Number.isFinite(lat) && typeof lng === "number" && Number.isFinite(lng)
    && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0);
}
async function loadJsonl<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  const lines = createInterface({ input: createReadStream(path, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of lines) if (line.trim()) rows.push(JSON.parse(line) as T);
  return rows;
}
async function sourceRows(): Promise<{ manifest: Map<number,CandidateManifest>; accepted: GeocodeResult[] }> {
  if (sha256(MANIFEST) !== SOURCE_SHA256 || sha256(RESULTS) !== RESULTS_SHA256) throw new Error("CENSUS_PIN_SOURCE_CHECKSUM_MISMATCH");
  const manifestRows = await loadJsonl<CandidateManifest>(MANIFEST);
  const resultRows = await loadJsonl<GeocodeResult>(RESULTS);
  if (manifestRows.length !== SOURCE_ROWS || resultRows.length !== SOURCE_ROWS) throw new Error("CENSUS_PIN_SOURCE_COHORT_MISMATCH");
  const manifest = new Map(manifestRows.map((row) => [row.sourceRow,row]));
  if (manifest.size !== SOURCE_ROWS || new Set(resultRows.map((row)=>row.sourceRow)).size !== SOURCE_ROWS) throw new Error("CENSUS_PIN_SOURCE_IDENTITY_MISMATCH");
  const accepted = resultRows.filter((row) => row.accepted && row.targetKind === "business");
  if (accepted.length !== EXPECTED_ACCEPTED_BUSINESS_ROWS || accepted.some((row) =>
    !validCoordinates(row.latitude,row.longitude) || row.matchStatus !== "Match" || row.matchType !== "Exact"
    || !row.matchedAddress
    || row.provider !== "US Census Geocoder" || row.benchmark !== "Public_AR_Current"
    || row.policyVersion !== POLICY_VERSION || row.coordinatePrecision !== "interpolated_address_range"
    || row.verifiedBusinessLocation !== false || !manifest.has(row.sourceRow)
  )) throw new Error("CENSUS_PIN_ACCEPTED_RESULT_CONTRACT_MISMATCH");
  return { manifest, accepted };
}

async function loadDatabaseRows(client: PoolClient, acceptedRows: number[], lock: boolean): Promise<DatabaseRow[]> {
  const { rows } = await client.query<DatabaseRow>(`WITH batch AS (
    SELECT id FROM directory_import_batches WHERE source_name=$1 AND source_sha256=$2 AND source_row_count=$3
  )
  SELECT c.id::text candidate_id,c.source_row,c.status candidate_status,c.address candidate_address,c.city candidate_city,c.state candidate_state,
         c.published_record_id,b.id business_id,b.address business_address,b.city business_city,b.state business_state,b.country business_country,
         b.postal_code business_postal_code,b.latitude::text,b.longitude::text,b.listing_status,b.status business_status,
         (SELECT count(*)::text FROM directory_import_publications p WHERE p.candidate_id=c.id AND p.record_type='business'
           AND p.record_id=c.published_record_id AND p.actor_id=$5) publication_count
    FROM batch JOIN directory_import_candidates c ON c.batch_id=batch.id
    JOIN businesses b ON b.id=c.published_record_id
   WHERE c.source_row=ANY($4::integer[]) AND c.target_kind='business'
   ORDER BY c.source_row
   ${lock ? "FOR UPDATE OF c,b" : ""}`,[SOURCE_NAME,SOURCE_SHA256,SOURCE_ROWS,acceptedRows,PUBLICATION_ACTOR]);
  return rows;
}

function createPlans(databaseRows: DatabaseRow[], manifest: Map<number,CandidateManifest>, accepted: GeocodeResult[]) {
  const bySource = new Map(databaseRows.map((row)=>[row.source_row,row]));
  const resultBySource = new Map(accepted.map((row)=>[row.sourceRow,row]));
  const pendingPublication = accepted.filter((row)=>!bySource.get(row.sourceRow)?.published_record_id).length;
  const inconsistent: number[] = [];
  const grouped = new Map<string,Plan>();
  let alreadyPinned = 0;
  let locationMismatchHeld = 0;
  for (const result of accepted) {
    const row=bySource.get(result.sourceRow); const source=manifest.get(result.sourceRow)!;
    if(!row?.published_record_id)continue;
    if(row.candidate_status!=="published"||row.published_record_id!==row.business_id||row.publication_count!=="1"
      ||!["live_unclaimed","live_claimed"].includes(row.listing_status??"")
      ||["duplicate","permanently_hidden","removed","deleted"].includes(row.business_status??"")
      ||normalize(row.candidate_address)!==normalize(source.address)||normalize(row.candidate_city)!==normalize(source.city)
      ||normalize(row.candidate_state)!==normalize(source.state)) {
      inconsistent.push(result.sourceRow);continue;
    }
    const sourceStreet=canonicalStreetIdentity(source.address,source.city,source.state);
    const businessStreet=canonicalStreetIdentity(row.business_address,row.business_city??"",row.business_state);
    if(!sourceStreet||!businessStreet||sourceStreet!==businessStreet
      ||normalize(row.business_city)!==normalize(source.city)||normalize(row.business_state)!==normalize(source.state)) {
      locationMismatchHeld+=1;continue;
    }
    const hasLat=row.latitude!==null,hasLng=row.longitude!==null;
    if(hasLat!==hasLng){inconsistent.push(result.sourceRow);continue;}
    if(hasLat&&hasLng){alreadyPinned+=1;continue;}
    const latitude=result.latitude!,longitude=result.longitude!;
    const existing=grouped.get(row.business_id!);
    if(existing){
      if(existing.latitude!==latitude||existing.longitude!==longitude
        ||canonicalStreetIdentity(existing.address,existing.city,existing.state)!==sourceStreet) inconsistent.push(result.sourceRow);
      else {existing.candidate_ids.push(row.candidate_id);existing.source_rows.push(result.sourceRow);}
    }else grouped.set(row.business_id!,{
      record_id:row.business_id!,latitude,longitude,matched_address:result.matchedAddress!,tiger_line_id:result.tigerLineId,
      candidate_ids:[row.candidate_id],source_rows:[result.sourceRow],address:row.business_address!,city:row.business_city!,state:row.business_state,
      country:row.business_country,postal_code:row.business_postal_code,
    });
  }
  if(inconsistent.length)throw new Error(`CENSUS_PIN_DATABASE_CONTRACT_MISMATCH:${inconsistent.length}`);
  return {plans:[...grouped.values()],pendingPublication,alreadyPinned,locationMismatchHeld,acceptedRows:resultBySource.size};
}

async function installPlans(client:PoolClient,plans:Plan[]):Promise<void>{
  await client.query(`CREATE TEMP TABLE mwm_census_pin_plan(record_id text PRIMARY KEY,latitude double precision NOT NULL,longitude double precision NOT NULL,
    matched_address text NOT NULL,tiger_line_id text,candidate_ids uuid[] NOT NULL,source_rows integer[] NOT NULL,address text NOT NULL,city text NOT NULL,
    state text,country text,postal_code text) ON COMMIT DROP`);
  await client.query(`INSERT INTO mwm_census_pin_plan SELECT * FROM jsonb_to_recordset($1::jsonb) AS p(record_id text,latitude double precision,longitude double precision,
    matched_address text,tiger_line_id text,candidate_ids uuid[],source_rows integer[],address text,city text,state text,country text,postal_code text)`,[JSON.stringify(plans)]);
}

async function apply(client:PoolClient,manifest:Map<number,CandidateManifest>,accepted:GeocodeResult[]){
  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  try{
    await client.query("SET LOCAL lock_timeout='10s'");await client.query("SET LOCAL statement_timeout='180s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[POLICY_VERSION]);
    const rows=await loadDatabaseRows(client,accepted.map((row)=>row.sourceRow),true);
    const prepared=createPlans(rows,manifest,accepted);
    if(prepared.pendingPublication!==0)throw new Error(`CENSUS_PIN_UNPUBLISHED_ACCEPTED_ROWS:${prepared.pendingPublication}`);
    await installPlans(client,prepared.plans);
    const uuidPattern = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$";
    await client.query(`SELECT c.id FROM canonical_record_locations c JOIN mwm_census_pin_plan p
      ON p.record_id~$1 AND c.record_type='business' AND c.record_id=p.record_id::uuid
      ORDER BY c.record_id,c.id FOR UPDATE OF c`,[uuidPattern]);
    const canonicalAmbiguities=await client.query<{count:string}>(`SELECT count(*)::text count FROM (
      SELECT p.record_id
      FROM mwm_census_pin_plan p JOIN canonical_record_locations c
        ON p.record_id~$1 AND c.record_type='business' AND c.record_id=p.record_id::uuid
      GROUP BY p.record_id,p.city,p.state
      HAVING count(*) FILTER (WHERE c.is_primary=true)>1
        OR count(*) FILTER (WHERE lower(btrim(c.city_name))=lower(btrim(p.city))
          AND upper(btrim(COALESCE(c.state_code,'')))=upper(btrim(COALESCE(p.state,''))))>1
    ) ambiguous`,[uuidPattern]);
    if(Number(canonicalAmbiguities.rows[0]?.count??0)!==0)throw new Error("CENSUS_PIN_AMBIGUOUS_CANONICAL_LOCATION_ROWS");
    const canonicalConflicts=await client.query<{count:string}>(`SELECT count(*)::text count
      FROM canonical_record_locations c JOIN mwm_census_pin_plan p
        ON p.record_id~$1 AND c.record_type='business' AND c.record_id=p.record_id::uuid
      WHERE (
        c.is_primary=true AND (
          lower(btrim(c.city_name))<>lower(btrim(p.city))
          OR upper(btrim(COALESCE(c.state_code,'')))<>upper(btrim(COALESCE(p.state,'')))
        )
      ) OR (
        lower(btrim(c.city_name))=lower(btrim(p.city))
        AND upper(btrim(COALESCE(c.state_code,'')))=upper(btrim(COALESCE(p.state,'')))
        AND (
          (c.latitude IS NULL)<>(c.longitude IS NULL)
          OR (c.latitude IS NOT NULL AND c.longitude IS NOT NULL AND (
            c.latitude<>round(p.latitude::numeric,6) OR c.longitude<>round(p.longitude::numeric,6)
          ))
        )
      )`,[uuidPattern]);
    if(Number(canonicalConflicts.rows[0]?.count??0)!==0)throw new Error("CENSUS_PIN_EXISTING_CANONICAL_LOCATION_CONFLICT");
    const updated=await client.query(`UPDATE businesses b SET latitude=round(p.latitude::numeric,7),longitude=round(p.longitude::numeric,7),public_location_kind='address',
      source_evidence=CASE WHEN jsonb_typeof(COALESCE(b.source_evidence,'[]'::jsonb))='array' THEN COALESCE(b.source_evidence,'[]'::jsonb)||jsonb_build_array(
        jsonb_build_object('sourceType','US Census Geocoder','field','address_location','supports',true,'verifiedByMwm',false,'matchedAddress',p.matched_address,
        'benchmark','Public_AR_Current','coordinatePrecision','interpolated_address_range','policyVersion',$1::text,'tigerLineId',p.tiger_line_id))
        ELSE jsonb_build_array(b.source_evidence,jsonb_build_object('sourceType','US Census Geocoder','field','address_location','supports',true,'verifiedByMwm',false,
        'matchedAddress',p.matched_address,'benchmark','Public_AR_Current','coordinatePrecision','interpolated_address_range','policyVersion',$1::text,'tigerLineId',p.tiger_line_id)) END,
      updated_at=NOW() FROM mwm_census_pin_plan p WHERE b.id=p.record_id AND b.latitude IS NULL AND b.longitude IS NULL
      AND b.address IS NOT DISTINCT FROM p.address AND b.city IS NOT DISTINCT FROM p.city AND b.state IS NOT DISTINCT FROM p.state
      AND b.country IS NOT DISTINCT FROM p.country AND b.postal_code IS NOT DISTINCT FROM p.postal_code
      AND b.listing_status IN('live_unclaimed','live_claimed') AND COALESCE(b.is_duplicate,false)=false
      AND COALESCE(b.status,'active') NOT IN('duplicate','permanently_hidden','removed','deleted') RETURNING b.id`,[POLICY_VERSION]);
    if((updated.rowCount??0)!==prepared.plans.length)throw new Error("CENSUS_PIN_BUSINESS_UPDATE_POSTCONDITION_FAILED");
    const canonicalFilled=await client.query(`UPDATE canonical_record_locations c
      SET latitude=round(p.latitude::numeric,6),longitude=round(p.longitude::numeric,6),updated_at=NOW()
      FROM mwm_census_pin_plan p
      WHERE p.record_id~$1 AND c.record_type='business' AND c.record_id=p.record_id::uuid
        AND lower(btrim(c.city_name))=lower(btrim(p.city))
        AND upper(btrim(COALESCE(c.state_code,'')))=upper(btrim(COALESCE(p.state,'')))
        AND c.latitude IS NULL AND c.longitude IS NULL`,[uuidPattern]);
    const canonicalInserted=await client.query(`INSERT INTO canonical_record_locations(
        record_type,record_id,city_name,state_code,neighborhood_name,latitude,longitude,is_primary,verified_at,created_at,updated_at)
      SELECT 'business',p.record_id::uuid,p.city,p.state,NULL,round(p.latitude::numeric,6),round(p.longitude::numeric,6),true,NULL,NOW(),NOW()
      FROM mwm_census_pin_plan p
      WHERE p.record_id~$1
        AND NOT EXISTS (SELECT 1 FROM canonical_record_locations c WHERE c.record_type='business' AND c.record_id=p.record_id::uuid
          AND (c.is_primary=true OR (
            lower(btrim(c.city_name))=lower(btrim(p.city))
            AND upper(btrim(COALESCE(c.state_code,'')))=upper(btrim(COALESCE(p.state,'')))
          )))
      ON CONFLICT DO NOTHING`,[uuidPattern]);
    const candidateUpdate=await client.query(`UPDATE directory_import_candidates c SET review_evidence=COALESCE(c.review_evidence,'{}'::jsonb)||jsonb_build_object(
      'mapPin',true,'locationSource','US Census Geocoder','locationPolicyVersion',$1::text,'coordinatePrecision','interpolated_address_range','verified',false),
      review_note='Founder-authorized searchable listing with a U.S. Census exact address match and interpolated address-range map pin; listing remains unclaimed and not verified.',
      review_revision=review_revision+1,updated_at=NOW() FROM mwm_census_pin_plan p WHERE c.id=ANY(p.candidate_ids) AND c.status='published'
      AND c.published_record_type='business' AND c.published_record_id=p.record_id RETURNING c.id`,[POLICY_VERSION]);
    const expectedCandidateUpdates=prepared.plans.reduce((sum,p)=>sum+p.candidate_ids.length,0);
    if((candidateUpdate.rowCount??0)!==expectedCandidateUpdates)throw new Error("CENSUS_PIN_CANDIDATE_AUDIT_POSTCONDITION_FAILED");
    const post=await client.query<{count:string}>(`SELECT count(*)::text count FROM mwm_census_pin_plan p JOIN businesses b ON b.id=p.record_id
      WHERE b.latitude=round(p.latitude::numeric,7) AND b.longitude=round(p.longitude::numeric,7) AND b.public_location_kind='address'`);
    if(Number(post.rows[0]?.count??0)!==prepared.plans.length)throw new Error("CENSUS_PIN_PERSISTED_POSTCONDITION_FAILED");
    const canonicalPost=await client.query<{count:string}>(`SELECT count(*)::text count FROM mwm_census_pin_plan p
      WHERE p.record_id!~$1 OR EXISTS (
        SELECT 1 FROM canonical_record_locations c WHERE c.record_type='business' AND c.record_id=p.record_id::uuid
          AND lower(btrim(c.city_name))=lower(btrim(p.city))
          AND upper(btrim(COALESCE(c.state_code,'')))=upper(btrim(COALESCE(p.state,'')))
          AND c.latitude=round(p.latitude::numeric,6) AND c.longitude=round(p.longitude::numeric,6)
      )`,[uuidPattern]);
    if(Number(canonicalPost.rows[0]?.count??0)!==prepared.plans.length)throw new Error("CENSUS_PIN_CANONICAL_LOCATION_POSTCONDITION_FAILED");
    const legacyIds=prepared.plans.filter((plan)=>!new RegExp(uuidPattern).test(plan.record_id)).length;
    await client.query("COMMIT");
    return {
      acceptedBusinessRows: prepared.acceptedRows,
      pendingPublication: prepared.pendingPublication,
      alreadyPinnedCandidateRows: prepared.alreadyPinned,
      locationMismatchCandidateRowsHeld: prepared.locationMismatchHeld,
      pinnableRecords: prepared.plans.length,
      pinnedNow: updated.rowCount??0,
      candidateAuditRows: candidateUpdate.rowCount??0,
      canonicalLocationsFilled: canonicalFilled.rowCount??0,
      canonicalLocationsInserted: canonicalInserted.rowCount??0,
      canonicalLocationLegacyIdsHeld: legacyIds,
    };
  }catch(error){await client.query("ROLLBACK");throw error;}
}

async function main():Promise<void>{
  const applyFlag=process.argv.includes("--apply");assertLocalDirectoryStagingFromProcess();
  const source=await sourceRows();
  const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1,connectionTimeoutMillis:10_000,query_timeout:240_000});
  const client=await pool.connect();
  try{
    if(applyFlag){console.log(JSON.stringify({mode:"applied",policyVersion:POLICY_VERSION,...await apply(client,source.manifest,source.accepted)},null,2));return;}
    const rows=await loadDatabaseRows(client,source.accepted.map((row)=>row.sourceRow),false);
    const prepared=createPlans(rows,source.manifest,source.accepted);
    console.log(JSON.stringify({
      mode:"dry_run",policyVersion:POLICY_VERSION,acceptedBusinessRows:prepared.acceptedRows,
      pendingPublication:prepared.pendingPublication,alreadyPinnedCandidateRows:prepared.alreadyPinned,
      locationMismatchCandidateRowsHeld:prepared.locationMismatchHeld,pinnableRecords:prepared.plans.length,
    },null,2));
  }finally{client.release();await pool.end();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch((error)=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});

export { createPlans, normalize, validCoordinates };
