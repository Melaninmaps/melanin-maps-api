/*
 * Replit Business Ingestion Pipeline
 *
 * Handles three inputs:
 *   1) image upload: OCR/vision extracts business candidates;
 *   2) URL: extracts JSON-LD, OpenGraph, and visible page text;
 *   3) natural-language request: converts the request into a structured search.
 *
 * The adapters below keep vendor-specific credentials out of the core logic.
 * Connect them to the providers already used by the Replit project.
 */

export type Input =
  | { kind: 'image'; fileUrl: string; requestedBy?: string }
  | { kind: 'url'; url: string; requestedBy?: string }
  | { kind: 'query'; text: string; requestedBy?: string };

export type SearchSpec = {
  category?: string;
  city?: string;
  state?: string;
  ownershipAttribute?: string;
  keywords: string[];
  rawRequest: string;
};

export type Evidence = {
  sourceType: 'official_website' | 'web_search' | 'maps' | 'directory' | 'image' | 'user_input';
  sourceUrl?: string;
  sourceId?: string;
  field: string;
  value: string;
  retrievedAt: string;
  confidence: number;
};

export type Candidate = {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  website?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  subcategory?: string;
  ownershipAttributes?: string[];
  sourceProvider: string;
  sourceRecordId?: string;
  sourceUrl?: string;
  evidence: Evidence[];
};

export type StoredBusiness = Candidate & {
  id: string;
  dedupeKey: string;
  status: 'active' | 'needs_review' | 'duplicate';
};

export interface BusinessStore {
  listActive(): Promise<StoredBusiness[]>;
  findByDedupeKey(key: string): Promise<StoredBusiness | null>;
  create(row: StoredBusiness): Promise<StoredBusiness>;
  update(id: string, patch: Partial<StoredBusiness>): Promise<void>;
  createReview(row: ReviewItem): Promise<void>;
}

export interface SearchAdapter {
  search(spec: SearchSpec): Promise<Candidate[]>;
}

export interface PageAdapter {
  fetchAndExtract(url: string): Promise<{ text: string; candidates: Candidate[]; evidence: Evidence[] }>;
}

export interface VisionAdapter {
  extractBusinesses(fileUrl: string): Promise<{ candidates: Candidate[]; evidence: Evidence[] }>;
}

export type ReviewItem = {
  candidate: Candidate;
  reason: string;
  score: number;
  matchedBusinessId?: string;
};

function ascii(value: unknown): string {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function normalizeText(value: unknown): string {
  return ascii(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizePhone(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

function coordinate(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(5)) : null;
}

function geoKey(c: Candidate): string | null {
  const lat = coordinate(c.latitude);
  const lon = coordinate(c.longitude);
  return lat !== null && lon !== null ? `geo:${lat},${lon}` : null;
}

export function dedupeKey(c: Candidate): string {
  const name = normalizeText(c.name);
  const geo = geoKey(c);
  if (geo) return `${name}|${geo}`;
  const address = normalizeText(c.address);
  const city = normalizeText(c.city);
  const state = normalizeText(c.state);
  if (address) return `${name}|${city}|${state}|addr:${address}`;
  return `${name}|${city}|${state}|no-location`;
}

function tokenSimilarity(a: string, b: string): number {
  const A = new Set(normalizeText(a).split(' ').filter(Boolean));
  const B = new Set(normalizeText(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  const intersection = [...A].filter((x) => B.has(x)).length;
  return (2 * intersection) / (A.size + B.size);
}

function sameLocation(a: Candidate, b: Candidate): boolean {
  const ag = geoKey(a);
  const bg = geoKey(b);
  if (ag && bg) return ag === bg;
  return !!normalizeText(a.address) &&
    normalizeText(a.address) === normalizeText(b.address) &&
    normalizeText(a.city) === normalizeText(b.city) &&
    normalizeText(a.state) === normalizeText(b.state);
}

function mergeEvidence(a: Evidence[], b: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  return [...a, ...b].filter((e) => {
    const key = `${e.sourceType}|${e.sourceUrl}|${e.field}|${e.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeCandidate(existing: StoredBusiness, incoming: Candidate): Partial<StoredBusiness> {
  const patch: Partial<StoredBusiness> = { evidence: mergeEvidence(existing.evidence, incoming.evidence) };
  for (const field of ['address','city','state','postalCode','website','phone','category','subcategory','latitude','longitude'] as const) {
    if (!existing[field] && incoming[field]) patch[field] = incoming[field] as never;
  }
  const attrs = new Set([...(existing.ownershipAttributes ?? []), ...(incoming.ownershipAttributes ?? [])]);
  if (attrs.size) patch.ownershipAttributes = [...attrs];
  return patch;
}

/** Convert a request such as "Black owned grocery stores in Atlanta" into search constraints. */
export function parseQuery(text: string): SearchSpec {
  const raw = text.trim();
  const lower = raw.toLowerCase();
  const ownershipAttribute = /black[- ]owned|black owned/.test(lower) ? 'Black-owned' : undefined;
  const category = /grocery|groceries|supermarket/.test(lower) ? 'Grocery Store' :
    /cafe|café|coffee/.test(lower) ? 'Cafe' : undefined;
  const cityMatch = lower.match(/\bin\s+([a-z .'-]+?)(?:\s*,\s*([a-z]{2})\b|$)/i);
  return {
    category,
    city: cityMatch?.[1]?.trim(),
    state: cityMatch?.[2]?.toUpperCase(),
    ownershipAttribute,
    keywords: [category, ownershipAttribute].filter(Boolean) as string[],
    rawRequest: raw,
  };
}

function evidenceForCandidate(c: Candidate): number {
  const sources = new Set(c.evidence.map((e) => e.sourceType));
  let score = 0;
  if (c.name) score += 15;
  if (c.address && c.city && c.state) score += 20;
  if (c.website) score += 10;
  if (c.phone) score += 10;
  if (c.latitude !== undefined && c.longitude !== undefined) score += 10;
  if (sources.has('maps')) score += 15;
  if (sources.has('official_website')) score += 15;
  if (sources.has('directory') || sources.has('web_search')) score += 5;
  return Math.min(score, 100);
}

/** Ownership claims require evidence; never infer ownership from a name, image, neighborhood, or appearance. */
function ownershipVerified(c: Candidate, requested?: string): boolean {
  if (!requested) return true;
  const wanted = normalizeText(requested);
  return (c.ownershipAttributes ?? []).some((x) => normalizeText(x) === wanted) &&
    c.evidence.some((e) => normalizeText(e.field).includes('ownership') && e.confidence >= 0.8 && !!e.sourceUrl);
}

async function candidatesFromInput(input: Input, adapters: { vision: VisionAdapter; page: PageAdapter; search: SearchAdapter }) {
  if (input.kind === 'query') {
    const spec = parseQuery(input.text);
    return { spec, candidates: await adapters.search.search(spec), inputEvidence: [] as Evidence[] };
  }
  if (input.kind === 'url') {
    const page = await adapters.page.fetchAndExtract(input.url);
    return { spec: parseQuery(page.text), candidates: page.candidates, inputEvidence: page.evidence };
  }
  const image = await adapters.vision.extractBusinesses(input.fileUrl);
  return { spec: parseQuery(image.candidates.map((c) => c.name).join(' ')), candidates: image.candidates, inputEvidence: image.evidence };
}

/**
 * Main operation. It searches/enriches candidates, prevents duplicate inserts,
 * and sends weak or ownership-unverified candidates to review.
 */
export async function ingestBusinessInput(
  input: Input,
  store: BusinessStore,
  adapters: { vision: VisionAdapter; page: PageAdapter; search: SearchAdapter },
) {
  const { spec, candidates, inputEvidence } = await candidatesFromInput(input, adapters);
  const results: Array<{ action: string; id?: string; name: string; reason?: string }> = [];

  for (const raw of candidates) {
    const candidate: Candidate = {
      ...raw,
      evidence: mergeEvidence(raw.evidence ?? [], inputEvidence),
    };
    const score = evidenceForCandidate(candidate);
    const ownershipOk = ownershipVerified(candidate, spec.ownershipAttribute);
    const key = dedupeKey(candidate);
    let existing = await store.findByDedupeKey(key);

    // Catch high-confidence naming variants at the same location.
    if (!existing) {
      existing = (await store.listActive()).find((row) =>
        sameLocation(row, candidate) && tokenSimilarity(row.name, candidate.name) >= 0.90,
      ) ?? null;
    }

    if (existing) {
      await store.update(existing.id, mergeCandidate(existing, candidate));
      results.push({ action: 'UPDATED_EXISTING', id: existing.id, name: candidate.name });
      continue;
    }

    if (score < 70 || !ownershipOk) {
      const reason = !ownershipOk ? 'Ownership attribute is not supported by sufficient source evidence.' : 'Insufficient identity or location evidence.';
      await store.createReview({ candidate, reason, score });
      results.push({ action: 'NEEDS_REVIEW', name: candidate.name, reason });
      continue;
    }

    const created = await store.create({
      ...candidate,
      id: crypto.randomUUID(),
      dedupeKey: key,
      status: 'active',
    });
    results.push({ action: 'CREATED', id: created.id, name: created.name });
  }
  return { request: spec, results };
}
