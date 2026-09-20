import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** The wire contract for an import is deliberately small and deterministic. */
export interface IngressHeaders {
  timestamp: string;
  nonce: string;
  checksum: string;
  signature: string;
}

export function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function signDirectoryIngress(
  body: string,
  headers: Pick<IngressHeaders, "timestamp" | "nonce" | "checksum">,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`${headers.timestamp}.${headers.nonce}.${headers.checksum}.${body}`)
    .digest("hex");
}

/**
 * Verifies the checksum before parsing. This prevents a valid signature from
 * being accidentally applied to a modified JSONL stream.
 */
export function verifyDirectoryIngress(
  body: string,
  headers: IngressHeaders,
  secret: string,
  now = Date.now(),
  maxAgeMs = 5 * 60_000,
): { ok: true; checksum: string } | { ok: false; reason: string } {
  const timestamp = Number(headers.timestamp);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > maxAgeMs)
    return { ok: false, reason: "stale_timestamp" };
  if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(headers.nonce))
    return { ok: false, reason: "invalid_nonce" };
  const checksum = sha256Hex(body);
  if (checksum !== headers.checksum.toLowerCase())
    return { ok: false, reason: "checksum_mismatch" };
  const expected = signDirectoryIngress(body, headers, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(headers.signature);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return { ok: false, reason: "signature_mismatch" };
  return { ok: true, checksum };
}

export function parseDirectoryJsonl(body: string): unknown[] {
  const records: unknown[] = [];
  for (const [index, line] of body.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let record: unknown;
    try { record = JSON.parse(line); } catch {
      throw new Error(`Invalid JSONL at line ${index + 1}.`);
    }
    if (!record || typeof record !== "object" || Array.isArray(record))
      throw new Error(`JSONL line ${index + 1} must be an object.`);
    records.push(record);
  }
  return records;
}

export interface DirectoryManifest {
  sha256: string;
  rowCount: number;
  sourceName: string;
}

export function verifyDirectoryManifest(body: string, manifest: DirectoryManifest): unknown[] {
  const records = parseDirectoryJsonl(body);
  if (!/^[a-f0-9]{64}$/i.test(manifest.sha256) || sha256Hex(body) !== manifest.sha256.toLowerCase())
    throw new Error("Manifest checksum does not match JSONL payload.");
  if (!Number.isSafeInteger(manifest.rowCount) || manifest.rowCount !== records.length)
    throw new Error("Manifest row count does not match JSONL payload.");
  if (!manifest.sourceName?.trim()) throw new Error("Manifest sourceName is required.");
  return records;
}

export function validateDirectorySourceRows(records: unknown[]): void {
  const seen = new Set<string>();
  records.forEach((record, index) => {
    const value = record as Record<string, unknown>;
    const row = value.source_row_id ?? value.sourceRowId ?? value.source_row ?? value.sourceRow;
    if (typeof row !== "string" && typeof row !== "number")
      throw new Error(`Source row ${index + 1} must include source_row_id.`);
    const id = String(row).trim();
    if (!id || seen.has(id)) throw new Error(`Duplicate source row ID: ${id || index + 1}.`);
    seen.add(id);
  });
}

export type DirectoryClassification =
  | "business" | "online_business" | "community_resource" | "cultural_place"
  | "regulated_review" | "manual_review" | "internal_only";

/** Pure classifier: identical source records always produce identical output. */
export function classifyDirectoryRecord(record: Record<string, unknown>): DirectoryClassification {
  const kind = String(record.target_kind ?? record.targetKind ?? "").trim().toLowerCase();
  if (["business", "online_business", "community_resource", "cultural_place",
    "regulated_review", "manual_review", "internal_only"].includes(kind))
    return kind as DirectoryClassification;
  if (record.internal_only === true || record.internalOnly === true) return "internal_only";
  if (record.regulated_profession === true || record.regulatedProfession === true) return "regulated_review";
  if (record.online_only === true || record.onlineOnly === true) return "online_business";
  if (record.resource_category || record.resourceCategory) return "community_resource";
  if (record.cultural_specialty || record.culturalSpecialty) return "cultural_place";
  if (record.name && (record.city || record.country)) return "business";
  return "manual_review";
}

export function canonicalDirectoryPayload(record: Record<string, unknown>): string {
  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, child]) => [key, normalize(child)]),
      );
    }
    return value;
  };
  return JSON.stringify(normalize(record));
}

export const DIRECTORY_REVIEW_SQL = {
  immutableOutbox: `CREATE TABLE IF NOT EXISTS directory_review_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_key TEXT NOT NULL UNIQUE,
    aggregate_id TEXT NOT NULL, payload JSONB NOT NULL, payload_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','publishing','published','failed')),
    attempts INTEGER NOT NULL DEFAULT 0, available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ, last_error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  inbox: `CREATE TABLE IF NOT EXISTS directory_production_inbox (
    event_key TEXT PRIMARY KEY, payload_hash TEXT NOT NULL, received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ, error TEXT
  );`,
  provenance: `CREATE TABLE IF NOT EXISTS directory_publication_provenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_key TEXT NOT NULL UNIQUE,
    source_batch_id UUID NOT NULL, source_row INTEGER NOT NULL, source_sha256 TEXT NOT NULL,
    record_id TEXT NOT NULL, payload_hash TEXT NOT NULL, published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
} as const;

export function retryDelayMs(attempt: number): number {
  return Math.min(60 * 60_000, 1000 * 2 ** Math.max(0, attempt - 1));
}

export function directoryWorkerConcurrency(environment: NodeJS.ProcessEnv = process.env): number {
  const value = Number(environment.DIRECTORY_PUBLISHER_CONCURRENCY ?? "1");
  return Number.isInteger(value) && value > 0 && value <= 32 ? value : 1;
}