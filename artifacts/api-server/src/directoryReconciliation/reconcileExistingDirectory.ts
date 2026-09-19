import { randomUUID } from "node:crypto";

export interface ExistingDirectoryRow {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  address?: string | null;
  website?: string | null;
  sourceUrl?: string | null;
  phone?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  verified?: boolean | null;
  ownerClaimStatus?: string | null;
  createdAt?: Date | string | null;
  sourceEvidence?: number | null;
}
export interface ReconciliationDecision {
  identity: string;
  canonicalId: string;
  supersededIds: string[];
  scores: Record<string, number>;
  evidence: string[];
}
export interface ReconciliationReport {
  jobId: string; mode: "dry-run" | "apply"; groups: ReconciliationDecision[];
  examined: number; changed: number; deleted: 0;
}

const norm = (v: unknown) => String(v ?? "").toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
const phone = (v: unknown) => String(v ?? "").replace(/\D/g, "");
function host(v: unknown): string {
  try { return new URL(String(v)).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}
function numberedAddress(v: unknown): string {
  const value = norm(v);
  return /^\d+[a-z]?(?:\s|$)/.test(value) ? value : "";
}
function base(r: ExistingDirectoryRow) {
  return [norm(r.name), norm(r.city), norm(r.state), norm(r.country)].join("|");
}
function identityMatch(a: ExistingDirectoryRow, b: ExistingDirectoryRow): boolean {
  if (base(a) !== base(b) || !base(a).split("|").every(Boolean)) return false;
  const aa = numberedAddress(a.address), bb = numberedAddress(b.address);
  if (aa && bb) return aa === bb;
  const hosts = host(a.website) && host(a.website) === host(b.website);
  const phones = phone(a.phone) && phone(a.phone) === phone(b.phone);
  // A weak identity is only valid with a corroborating official host or phone.
  return Boolean(hosts || phones);
}
function score(r: ExistingDirectoryRow): number {
  let n = 0;
  if (r.ownerClaimStatus === "claimed") n += 10000;
  if (r.verified) n += 5000;
  if (host(r.website)) n += 1000;
  if (numberedAddress(r.address)) n += 500;
  if (r.latitude != null && r.longitude != null && Number(r.latitude) !== 0 && Number(r.longitude) !== 0) n += 250;
  n += Math.min(100, r.sourceEvidence ?? 0);
  return n;
}
function compare(a: ExistingDirectoryRow, b: ExistingDirectoryRow) {
  const d = score(b) - score(a); if (d) return d;
  const ad = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
  const bd = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
  return ad - bd || a.id.localeCompare(b.id);
}

export function planExistingDirectoryReconciliation(rows: readonly ExistingDirectoryRow[]): ReconciliationDecision[] {
  const groups: ExistingDirectoryRow[][] = [];
  for (const row of rows) {
    let group = groups.find((g) => g.some((other) => identityMatch(row, other)));
    if (!group) groups.push(group = [row]); else group.push(row);
  }
  return groups.filter((g) => g.length > 1).map((g) => {
    const ordered = [...g].sort(compare);
    return {
      identity: base(ordered[0]!),
      canonicalId: ordered[0]!.id,
      supersededIds: ordered.slice(1).map((r) => r.id),
      scores: Object.fromEntries(ordered.map((r) => [r.id, score(r)])),
      evidence: ["normalized name+locality", numberedAddress(ordered[0]!.address) ? "numbered address" : "matching official host or phone"],
    };
  }).sort((a, b) => a.identity.localeCompare(b.identity));
}

export interface ReconciliationWriter {
  query(text: string, values?: readonly unknown[]): Promise<{ rowCount?: number | null }>;
}
/** Persists mappings only; business rows and their content are never deleted or edited. */
export async function reconcileExistingDirectory(db: ReconciliationWriter, rows: readonly ExistingDirectoryRow[], mode: "dry-run" | "apply" = "dry-run", jobId = randomUUID()): Promise<ReconciliationReport> {
  const groups = planExistingDirectoryReconciliation(rows);
  let changed = 0;
  if (mode === "apply") for (const g of groups) for (const id of g.supersededIds) {
    const result = await db.query(
      `INSERT INTO business_duplicate_resolutions (job_id, canonical_business_id, superseded_business_id, identity_evidence, policy_version, scoring)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (superseded_business_id) DO UPDATE SET canonical_business_id=EXCLUDED.canonical_business_id, job_id=EXCLUDED.job_id, identity_evidence=EXCLUDED.identity_evidence, scoring=EXCLUDED.scoring`,
      [jobId, g.canonicalId, id, JSON.stringify(g.evidence), "strict-identity-v1", JSON.stringify(g.scores)],
    );
    changed += result.rowCount ?? 0;
  }
  return { jobId, mode, groups, examined: rows.length, changed, deleted: 0 };
}