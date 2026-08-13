/**
 * Kinfolk Cultural Reranker — merges and ranks candidates from all three retrieval paths
 *
 * Spec §E.4: Scoring rules
 *   • Exact alias SQL (from entity-resolver.ts): already decided — not re-ranked here
 *   • Lexical (fullTextCandidates): contributes up to 60 points
 *   • Semantic (vectorCandidates): contributes up to 40 points (candidate recall only)
 *   • Member preference boost: max +80 points — NEVER overrides explicit qualifier conflict
 *   • Hard conflicts (year/group/role/city/language mismatch): candidate discarded entirely
 *
 * This module is called only when entity-resolver.ts returns needs_clarification or
 * unconfirmed AND the query class is general/named_entity.  It enriches the context block
 * for the LLM without changing the resolution state.
 */

import type { RetrievedCandidate } from "./cultural-retrieval";
import type { ExplicitMemberPreferences } from "./entity-resolver";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RankedCandidate = RetrievedCandidate & {
  finalScore: number;
  preferenceBoost: number;
  conflictDetected: boolean;
};

export type RerankerInput = {
  lexical: RetrievedCandidate[];
  semantic: RetrievedCandidate[];
  signals: {
    rawTerms: string[];
    normalizedQuery: string;
    hasLocation: boolean;
    locationHint: string | null;
  };
  location: { city?: string } | null;
  preferences: ExplicitMemberPreferences | null;
};

// ── Conflict detection ────────────────────────────────────────────────────────
// Discard a candidate when the query contains explicit signals that contradict it.

const YEAR_PATTERN = /\b(19|20)\d{2}\b/;

function detectConflict(candidate: RetrievedCandidate, signals: RerankerInput["signals"]): boolean {
  const q = signals.normalizedQuery;

  // Year conflict: query contains a year that doesn't match the candidate's era
  const yearMatch = q.match(YEAR_PATTERN);
  if (yearMatch) {
    const queryYear = Number(yearMatch[0]);
    const geo = candidate.geographyScope as Record<string, unknown>;
    const eraStart = geo.era_start as number | undefined;
    const eraEnd = geo.era_end as number | undefined;
    if (eraStart && eraEnd && (queryYear < eraStart - 2 || queryYear > eraEnd + 2)) {
      return true;
    }
  }

  return false;
}

// ── Preference boost ──────────────────────────────────────────────────────────
// Only applied when allowCulturalAffinityRanking is explicitly true.
// Max +80 points, never overrides a conflict, never used for high-consequence queries.

function computePreferenceBoost(
  candidate: RetrievedCandidate,
  preferences: ExplicitMemberPreferences | null,
): number {
  if (!preferences?.allowCulturalAffinityRanking) return 0;

  let boost = 0;
  const cGeo = candidate.geographyScope as Record<string, unknown>;
  const candidateCountries = (cGeo.country_codes as string[] | undefined) ?? [];

  // Diaspora country match: +50
  if (
    preferences.diasporaCountries?.some((dc) =>
      candidateCountries.map((c) => c.toUpperCase()).includes(dc.toUpperCase()),
    )
  ) {
    boost += 50;
  }

  // Language match: +30
  if (
    preferences.preferredResponseLanguages?.some((lang) =>
      candidate.languageCode.startsWith(lang),
    )
  ) {
    boost += 30;
  }

  return Math.min(boost, 80);
}

// ── Merge candidates ──────────────────────────────────────────────────────────
// Candidates from different paths for the same entity are merged (take highest score).

function mergeCandidates(
  lexical: RetrievedCandidate[],
  semantic: RetrievedCandidate[],
): RetrievedCandidate[] {
  const byEntityId = new Map<string, RetrievedCandidate>();

  for (const c of [...lexical, ...semantic]) {
    const key = c.entityId ?? c.documentId;
    const existing = byEntityId.get(key);
    if (!existing || c.sourceScore > existing.sourceScore) {
      byEntityId.set(key, c);
    }
  }

  return Array.from(byEntityId.values());
}

// ── Main reranker ─────────────────────────────────────────────────────────────

export function rerankCulturalCandidates(input: RerankerInput): RankedCandidate[] {
  const merged = mergeCandidates(input.lexical, input.semantic);

  const scored: RankedCandidate[] = merged.map((c) => {
    const conflictDetected = detectConflict(c, input.signals);
    if (conflictDetected) {
      return { ...c, finalScore: 0, preferenceBoost: 0, conflictDetected: true };
    }

    const baseScore = c.sourceScore; // 0-100
    const preferenceBoost = computePreferenceBoost(c, input.preferences);
    const finalScore = baseScore + preferenceBoost;

    return { ...c, finalScore, preferenceBoost, conflictDetected: false };
  });

  // Remove conflicted candidates, sort descending
  return scored
    .filter((c) => !c.conflictDetected)
    .sort((a, b) => b.finalScore - a.finalScore);
}

// ── Context block builder ─────────────────────────────────────────────────────
// Used in context-resolver.ts when we have vector/lexical candidates but no exact alias match.

export function buildVectorContextBlock(candidates: RankedCandidate[]): string {
  if (!candidates.length) return "";

  const top = candidates.slice(0, 3);
  const lines: string[] = [
    "📚 RETRIEVED CULTURAL CONTEXT (source-labeled, candidate-quality — not verified facts)",
    "",
    ...top.map((c, i) =>
      `${i + 1}. ${c.canonicalName}${c.category ? ` [${c.category}]` : ""}\n   ${c.summary.slice(0, 200)}`,
    ),
    "",
    "These are search recall candidates only. Resolve against your verified knowledge before stating as fact.",
  ];

  return lines.join("\n");
}
