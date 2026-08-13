/**
 * Kinfolk Cultural Retrieval — vector + full-text candidate recall
 *
 * Spec §E.3: Three retrieval paths feed the reranker.
 * This module owns paths 2 (full-text) and 3 (semantic vector).
 * Path 1 (exact alias SQL) remains in entity-resolver.ts.
 *
 * HARD FILTERS applied before any result leaves this module (spec §E.2):
 *   1. status = 'active' AND embedding_status = 'ready' (vector path)
 *   2. status = 'active' (lexical path)
 *   3. sensitivity_tier never exposed beyond 'standard'/'public_interest' without consent
 *   4. No private preferences used for candidate recall — only for reranking
 */

import { pool } from "@workspace/db";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RetrievedCandidate = {
  documentId: string;
  entityId: string | null;
  canonicalName: string;
  entityType: string;
  summary: string;
  category: string | null;
  sensitivityTier: string;
  languageCode: string;
  geographyScope: Record<string, unknown>;
  sourceScore: number;       // 0-100 from retrieval path
  retrievalPath: "exact" | "lexical" | "semantic";
  rawScore: number;          // cosine similarity (semantic) or rank (lexical)
};

export type ParsedSignals = {
  rawTerms: string[];        // tokenised words from the message
  normalizedQuery: string;   // lower + trimmed
  hasLocation: boolean;
  locationHint: string | null;
};

// ── Signal parser ─────────────────────────────────────────────────────────────

export function parseMessageSignals(message: string): ParsedSignals {
  const normalizedQuery = message.toLowerCase().trim();
  const rawTerms = normalizedQuery.split(/\s+/).filter((t) => t.length >= 2);

  // Location hints: "in <city>", "near me", "philadelphia", "nyc", etc.
  const locationMatch = normalizedQuery.match(
    /\bin\s+([a-z\s]+(?:,\s*[a-z]{2})?)|\bnear\s+(?:me|my location)\b/i,
  );
  const locationHint = locationMatch?.[1]?.trim() ?? null;
  const hasLocation = !!locationMatch;

  return { rawTerms, normalizedQuery, hasLocation, locationHint };
}

// ── Embed helper ──────────────────────────────────────────────────────────────
// Returns null when KINFOLK_EMBEDDING_DIMENSIONS env var is absent (embeddings not configured)

async function embedQuery(text: string): Promise<number[] | null> {
  const dims = process.env.KINFOLK_EMBEDDING_DIMENSIONS;
  if (!dims) return null;
  // We re-use the OpenAI client that kinfolk.ts already uses.
  // Dynamic import avoids circular deps; pool never created here.
  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    const resp = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8192),
    });
    return resp.data[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

// ── Full-text (lexical) candidates ────────────────────────────────────────────

export async function fullTextCandidates(
  signals: ParsedSignals,
  _location: { city?: string } | null,
): Promise<RetrievedCandidate[]> {
  if (!signals.rawTerms.length) return [];

  try {
    const tsQuery = signals.rawTerms
      .map((t) => t.replace(/[^a-z0-9\-]/g, ""))
      .filter(Boolean)
      .join(" | ");

    if (!tsQuery) return [];

    const res = await pool.query<{
      id: string;
      entity_id: string | null;
      canonical_name: string;
      entity_type: string;
      summary: string;
      category: string | null;
      sensitivity_tier: string;
      language_code: string;
      geography_scope: string;
      rank: number;
    }>(
      `SELECT
         kcd.id,
         ke.id            AS entity_id,
         COALESCE(ke.canonical_name, kcd.category, 'Unknown') AS canonical_name,
         COALESCE(ke.entity_type, 'general')                   AS entity_type,
         kcd.content      AS summary,
         kcd.category,
         kcd.sensitivity_tier,
         kcd.language_code,
         kcd.geography_scope::text,
         ts_rank(kcd.content_tsv, to_tsquery('english', $1)) AS rank
       FROM kinfolk_cultural_documents kcd
       LEFT JOIN kinfolk_entities ke ON ke.id = kcd.entity_id
       WHERE kcd.status = 'active'
         AND kcd.sensitivity_tier IN ('standard', 'public_interest')
         AND kcd.content_tsv @@ to_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT 8`,
      [tsQuery],
    );

    return res.rows.map((r) => ({
      documentId: r.id,
      entityId: r.entity_id,
      canonicalName: r.canonical_name,
      entityType: r.entity_type,
      summary: r.summary.slice(0, 500),
      category: r.category,
      sensitivityTier: r.sensitivity_tier,
      languageCode: r.language_code,
      geographyScope: safeParseJson(r.geography_scope),
      sourceScore: Math.round(r.rank * 100),
      retrievalPath: "lexical",
      rawScore: r.rank,
    }));
  } catch {
    return [];
  }
}

// ── Vector (semantic) candidates ──────────────────────────────────────────────

export async function vectorCandidates(
  signals: ParsedSignals,
  _location: { city?: string } | null,
): Promise<RetrievedCandidate[]> {
  const embedding = await embedQuery(signals.normalizedQuery);
  if (!embedding) return []; // embeddings not configured — degrade gracefully

  const vectorLiteral = `[${embedding.join(",")}]`;

  try {
    const res = await pool.query<{
      id: string;
      entity_id: string | null;
      canonical_name: string;
      entity_type: string;
      summary: string;
      category: string | null;
      sensitivity_tier: string;
      language_code: string;
      geography_scope: string;
      similarity: number;
    }>(
      `SELECT
         kcd.id,
         ke.id            AS entity_id,
         COALESCE(ke.canonical_name, kcd.category, 'Unknown') AS canonical_name,
         COALESCE(ke.entity_type, 'general')                   AS entity_type,
         kcd.content      AS summary,
         kcd.category,
         kcd.sensitivity_tier,
         kcd.language_code,
         kcd.geography_scope::text,
         1 - (kcd.embedding <=> $1::vector) AS similarity
       FROM kinfolk_cultural_documents kcd
       LEFT JOIN kinfolk_entities ke ON ke.id = kcd.entity_id
       WHERE kcd.status = 'active'
         AND kcd.embedding_status = 'ready'
         AND kcd.sensitivity_tier IN ('standard', 'public_interest')
       ORDER BY kcd.embedding <=> $1::vector
       LIMIT 6`,
      [vectorLiteral],
    );

    return res.rows
      .filter((r) => r.similarity > 0.65) // minimum similarity threshold
      .map((r) => ({
        documentId: r.id,
        entityId: r.entity_id,
        canonicalName: r.canonical_name,
        entityType: r.entity_type,
        summary: r.summary.slice(0, 500),
        category: r.category,
        sensitivityTier: r.sensitivity_tier,
        languageCode: r.language_code,
        geographyScope: safeParseJson(r.geography_scope),
        sourceScore: Math.round(r.similarity * 100),
        retrievalPath: "semantic",
        rawScore: r.similarity,
      }));
  } catch {
    return [];
  }
}

// ── Util ──────────────────────────────────────────────────────────────────────

function safeParseJson(val: unknown): Record<string, unknown> {
  if (typeof val !== "string") return {};
  try { return JSON.parse(val); } catch { return {}; }
}
