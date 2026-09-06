import { createHash } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";
import { getBusinessExperiencePolicy } from "@workspace/constants";
import { assertLocalDirectoryStagingFromProcess } from "./lib/local-directory-staging";

const MANIFEST = fileURLToPath(new URL(
  "../../data/founder-imports/2026-09-06-today-net-new-businesses/today-net-new-business-candidates.jsonl",
  import.meta.url,
));
const EXPECTED_ROWS = 3_367;
const EXPECTED_SHA256 = "144ca9d90ca9ea40445e957a62d6bf786d765657411fc40ee3c0b5433260bc49";
const ALLOWED_TARGETS = new Set(["business", "regulated_review", "manual_review"]);

type Candidate = {
  sourceRow: number;
  sourceWorkbook: string;
  sourceSheet: string;
  sourceWorkbookRow: number;
  targetKind: string;
  dedupeKey: string;
  name: string;
  city: string;
  state: string;
  category: string;
  subcategory?: string | null;
  culturalSpecialty?: string | null;
  address: string;
  phone?: string | null;
  website?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  sourceStatus?: string | null;
  ownershipDesignations?: string[];
  ownershipEvidence?: string | null;
  regulatedProfession?: boolean;
  publicDisplayRecommendation?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  socialSourceUrl?: string | null;
  priceRange?: string | null;
  priceBasis?: string | null;
  notes?: string | null;
  reviewGates: string[];
  rawRecord: Record<string, unknown>;
};

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function loadManifest(): Promise<Candidate[]> {
  if (sha256(MANIFEST) !== EXPECTED_SHA256) throw new Error("TODAY_NET_NEW_MANIFEST_CHECKSUM_MISMATCH");
  const candidates: Candidate[] = [];
  const lines = createInterface({ input: createReadStream(MANIFEST, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as Candidate;
    if (
      !Number.isInteger(row.sourceRow)
      || !Number.isInteger(row.sourceWorkbookRow)
      || !ALLOWED_TARGETS.has(row.targetKind)
      || !row.dedupeKey || !row.name || !row.city || !row.state || !row.category || !row.address
      || row.rawRecord?.country !== "USA"
      || !Array.isArray(row.reviewGates) || row.reviewGates.length === 0
      || (row.targetKind === "business" && row.regulatedProfession === true)
      || (row.targetKind === "business" && ![row.website,row.sourceUrl,row.instagramUrl,row.facebookUrl,row.tiktokUrl,row.socialSourceUrl].some(Boolean))
    ) throw new Error(`TODAY_NET_NEW_INVALID_CANDIDATE:${String(row.sourceRow ?? "unknown")}`);
    candidates.push(row);
  }
  if (candidates.length !== EXPECTED_ROWS || new Set(candidates.map((row) => row.sourceRow)).size !== EXPECTED_ROWS) {
    throw new Error("TODAY_NET_NEW_EXACT_COHORT_MISMATCH");
  }
  return candidates;
}

function linkEntry(url: string | null | undefined) {
  if (!url) return undefined;
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  return { url, result: "not_checked", status: null, finalUrl: null, finalHost: host, checkedAt: null };
}

function stagedRecord(candidate: Candidate) {
  const policy = getBusinessExperiencePolicy(candidate.category, candidate.subcategory);
  const linkValidation = Object.fromEntries([
    ["website", linkEntry(candidate.website)], ["source", linkEntry(candidate.sourceUrl)],
    ["instagram", linkEntry(candidate.instagramUrl)], ["facebook", linkEntry(candidate.facebookUrl)],
    ["tiktok", linkEntry(candidate.tiktokUrl)], ["socialSource", linkEntry(candidate.socialSourceUrl)],
  ].filter((entry): entry is [string, NonNullable<ReturnType<typeof linkEntry>>] => Boolean(entry[1])));
  return {
    source_row: candidate.sourceRow,target_kind:candidate.targetKind,status:"needs_research",dedupe_key:candidate.dedupeKey,
    name:candidate.name,city:candidate.city,state:candidate.state,category:candidate.category,subcategory:candidate.subcategory??null,
    cultural_specialty:candidate.culturalSpecialty??null,address:candidate.address,phone:candidate.phone??null,website:candidate.website??null,
    source_url:candidate.sourceUrl??null,source_name:candidate.sourceName??null,source_status:candidate.sourceStatus??null,
    ownership_designations:candidate.ownershipDesignations??[],ownership_evidence:candidate.ownershipEvidence??null,
    regulated_profession:candidate.regulatedProfession===true,public_display_recommendation:candidate.publicDisplayRecommendation??null,
    instagram_url:candidate.instagramUrl??null,facebook_url:candidate.facebookUrl??null,tiktok_url:candidate.tiktokUrl??null,
    social_source_url:candidate.socialSourceUrl??null,price_range:candidate.priceRange??null,price_basis:candidate.priceBasis??null,
    suggested_experience_keys:{policyCategory:policy.category,atmosphereLabel:policy.atmosphereLabel,reactionLabel:policy.reactionLabel,vibes:policy.vibeChoices.map((v)=>v.key),reactions:policy.reactionChoices.map((v)=>v.key),prices:policy.priceChoices.map((v)=>v.key)},
    link_validation:{...linkValidation,reviewGates:candidate.reviewGates},notes:candidate.notes??null,
    raw_record:{sourceWorkbook:candidate.sourceWorkbook,sourceSheet:candidate.sourceSheet,sourceWorkbookRow:candidate.sourceWorkbookRow,reviewGates:candidate.reviewGates,...candidate.rawRecord},
  };
}

async function insertChunk(client: PoolClient,batchId:string,rows:ReturnType<typeof stagedRecord>[]):Promise<number>{
  const result=await client.query(`INSERT INTO directory_import_candidates (
    batch_id,source_row,target_kind,status,dedupe_key,name,city,state,category,subcategory,cultural_specialty,address,phone,website,source_url,
    source_name,source_status,ownership_designations,ownership_evidence,regulated_profession,public_display_recommendation,instagram_url,facebook_url,
    tiktok_url,social_source_url,price_range,price_basis,suggested_experience_keys,link_validation,notes,raw_record)
    SELECT $1::uuid,x.source_row,x.target_kind,x.status,x.dedupe_key,x.name,x.city,x.state,x.category,x.subcategory,x.cultural_specialty,x.address,x.phone,x.website,x.source_url,
    x.source_name,x.source_status,x.ownership_designations,x.ownership_evidence,x.regulated_profession,x.public_display_recommendation,x.instagram_url,x.facebook_url,
    x.tiktok_url,x.social_source_url,x.price_range,x.price_basis,x.suggested_experience_keys,x.link_validation,x.notes,x.raw_record
    FROM jsonb_to_recordset($2::jsonb) AS x(source_row integer,target_kind text,status text,dedupe_key text,name text,city text,state text,category text,
    subcategory text,cultural_specialty text,address text,phone text,website text,source_url text,source_name text,source_status text,ownership_designations jsonb,
    ownership_evidence text,regulated_profession boolean,public_display_recommendation text,instagram_url text,facebook_url text,tiktok_url text,social_source_url text,
    price_range text,price_basis text,suggested_experience_keys jsonb,link_validation jsonb,notes text,raw_record jsonb)
    ON CONFLICT (batch_id,source_row) DO NOTHING`,[batchId,JSON.stringify(rows)]);
  return result.rowCount??0;
}

async function main():Promise<void>{
  const apply=process.argv.includes("--apply");
  const candidates=await loadManifest();
  const targetCounts=Object.fromEntries([...ALLOWED_TARGETS].sort().map((target)=>[target,candidates.filter((row)=>row.targetKind===target).length]));
  console.log(JSON.stringify({mode:apply?"stage_candidates":"dry_run",manifest:basename(MANIFEST),manifestHash:EXPECTED_SHA256,rows:candidates.length,targetCounts,publicationWrites:0},null,2));
  if(!apply)return;
  assertLocalDirectoryStagingFromProcess();
  const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1,connectionTimeoutMillis:10_000,statement_timeout:120_000,query_timeout:130_000});
  const client=await pool.connect();
  try{
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",["today-net-new-businesses-v1"]);
    const batch=await client.query<{id:string;status:string}>(`INSERT INTO directory_import_batches(source_name,source_sha256,source_row_count,status,created_by)
      VALUES($1,$2,$3,'staged',$4) ON CONFLICT(source_sha256) DO UPDATE SET updated_at=NOW() RETURNING id,status`,[basename(MANIFEST),EXPECTED_SHA256,EXPECTED_ROWS,"founder-authorized-today-net-new-2026-09-06"]);
    const batchId=batch.rows[0]!.id;
    if(batch.rows[0]!.status==="cancelled")throw new Error("TODAY_NET_NEW_BATCH_CANCELLED");
    let inserted=0;
    for(let index=0;index<candidates.length;index+=250)inserted+=await insertChunk(client,batchId,candidates.slice(index,index+250).map(stagedRecord));
    const post=await client.query<{count:string;business:string;regulated:string;manual:string}>(`SELECT count(*)::text count,
      count(*) FILTER(WHERE target_kind='business')::text business,count(*) FILTER(WHERE target_kind='regulated_review')::text regulated,
      count(*) FILTER(WHERE target_kind='manual_review')::text manual FROM directory_import_candidates WHERE batch_id=$1`,[batchId]);
    const row=post.rows[0]!;
    if(Number(row.count)!==EXPECTED_ROWS||Number(row.business)!==2_857||Number(row.regulated)!==459||Number(row.manual)!==51)throw new Error("TODAY_NET_NEW_STAGING_POSTCONDITION_FAILED");
    await client.query("UPDATE directory_import_batches SET status='in_review',source_row_count=$2,updated_at=NOW() WHERE id=$1",[batchId,EXPECTED_ROWS]);
    await client.query("COMMIT");
    console.log(JSON.stringify({mode:"staged",batchId,inserted,stagedRows:EXPECTED_ROWS,targetCounts,publicationWrites:0},null,2));
  }catch(error){await client.query("ROLLBACK").catch(()=>undefined);throw error;}finally{client.release();await pool.end();}
}

if(process.argv[1]&&process.argv[1]===fileURLToPath(import.meta.url))main().catch((error)=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
