import {
  getBusinessExperiencePolicy,
  THE_REAL_DISPLAY_THRESHOLD,
  THE_REAL_TAGS,
} from "@workspace/constants";

/** A member-backed signal that is safe to show beside a public business listing. */
export type PublicCommunitySignal = Readonly<{
  key: string;
  label: string;
  count: number;
}>;

export type PublicCommunitySignalSummary = Readonly<{
  /** Category-permitted, positive quick-review selections. */
  quickReviews: PublicCommunitySignal[];
  /** Member-applied atmosphere descriptors, separate from owner VIBES. */
  communityVibes: PublicCommunitySignal[];
  /** Professional trust signals that reached the existing public display threshold. */
  theReal: PublicCommunitySignal[];
}>;

type AggregateRow = Readonly<{
  business_id: string;
  kind: "vibe" | "caption";
  key: string;
  count: number | string;
}>;

type TheRealRow = Readonly<{
  business_id: string;
  tag_key: string;
  count: number | string;
}>;

type BusinessContext = Readonly<{
  id: string;
  category: string | null | undefined;
  subcategory?: string | null;
}>;

type Queryable = Readonly<{
  query<T>(sql: string, params?: readonly unknown[]): Promise<{ rows: T[] }>;
}>;

const EMPTY_SUMMARY: PublicCommunitySignalSummary = {
  quickReviews: [],
  communityVibes: [],
  theReal: [],
};

function count(value: number | string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function orderedSignals(
  values: PublicCommunitySignal[],
): PublicCommunitySignal[] {
  return values
    .filter((signal) => signal.count > 0)
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 3);
}

/**
 * Maps stored identifiers to governed display labels without modifying stored
 * feedback, VIBE, or endorsement values. Unknown/out-of-policy keys are not
 * publicized as a community claim.
 */
export function summarizeCommunitySignals(input: Readonly<{
  business: BusinessContext;
  feedback: readonly AggregateRow[];
  theReal: readonly TheRealRow[];
}>): PublicCommunitySignalSummary {
  const policy = getBusinessExperiencePolicy(
    input.business.category,
    input.business.subcategory,
  );
  const reactionLabels = new Map(
    policy.reactionChoices.map((choice) => [choice.key, choice.label]),
  );
  const vibeLabels = new Map(
    policy.vibeChoices.map((choice) => [choice.key, choice.label]),
  );
  const realLabels = new Map(
    THE_REAL_TAGS
      .filter((tag) => tag.category === policy.category)
      .map((tag) => [tag.tag_key, tag.label]),
  );

  const quickReviews = orderedSignals(
    input.feedback.flatMap((row) => {
      if (row.kind !== "caption" || row.key.startsWith("price:")) return [];
      const label = reactionLabels.get(row.key);
      return label ? [{ key: row.key, label, count: count(row.count) }] : [];
    }),
  );
  const communityVibes = orderedSignals(
    input.feedback.flatMap((row) => {
      if (row.kind !== "vibe") return [];
      const label = vibeLabels.get(row.key);
      return label ? [{ key: row.key, label, count: count(row.count) }] : [];
    }),
  );
  const theReal = orderedSignals(
    input.theReal.flatMap((row) => {
      const label = realLabels.get(row.tag_key);
      return label ? [{ key: row.tag_key, label, count: count(row.count) }] : [];
    }),
  );

  return { quickReviews, communityVibes, theReal };
}

/**
 * Loads only published, aggregate member signals for a bounded set of public
 * listings. This keeps direct directory, Map, and Kinfolk presentation aligned
 * while preserving the source tables and their existing display threshold.
 */
export async function loadCommunitySignalSummaries(
  pool: Queryable,
  businesses: readonly BusinessContext[],
): Promise<Map<string, PublicCommunitySignalSummary>> {
  const contexts = new Map(
    businesses
      .filter((business) => business.id.trim().length > 0)
      .map((business) => [business.id, business]),
  );
  if (contexts.size === 0) return new Map();
  const ids = [...contexts.keys()];

  const [feedbackResult, realResult] = await Promise.all([
    pool.query<AggregateRow>(
      `SELECT business_id::text, kind, key, COUNT(*)::int AS count
         FROM business_member_feedback
        WHERE business_id::text = ANY($1::text[])
          AND status = 'active'
          AND is_load_test = FALSE
        GROUP BY business_id, kind, key`,
      [ids],
    ),
    pool.query<TheRealRow>(
      `SELECT business_id::text, tag_key, COUNT(*)::int AS count
         FROM business_endorsement_taps
        WHERE business_id::text = ANY($1::text[])
        GROUP BY business_id, tag_key
       HAVING COUNT(*) >= $2`,
      [ids, THE_REAL_DISPLAY_THRESHOLD],
    ),
  ]);

  const feedbackByBusiness = new Map<string, AggregateRow[]>();
  for (const row of feedbackResult.rows) {
    const rows = feedbackByBusiness.get(row.business_id) ?? [];
    rows.push(row);
    feedbackByBusiness.set(row.business_id, rows);
  }
  const realByBusiness = new Map<string, TheRealRow[]>();
  for (const row of realResult.rows) {
    const rows = realByBusiness.get(row.business_id) ?? [];
    rows.push(row);
    realByBusiness.set(row.business_id, rows);
  }

  return new Map([...contexts.entries()].map(([id, business]) => [
    id,
    summarizeCommunitySignals({
      business,
      feedback: feedbackByBusiness.get(id) ?? [],
      theReal: realByBusiness.get(id) ?? [],
    }),
  ]));
}

export function emptyCommunitySignalSummary(): PublicCommunitySignalSummary {
  return EMPTY_SUMMARY;
}
