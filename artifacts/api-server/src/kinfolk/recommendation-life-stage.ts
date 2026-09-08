import type { AgeBand } from "../lib/audience-policy";

export const RECOMMENDATION_LIFE_STAGES = ["unspecified", "18_39", "40_64", "65_plus"] as const;
export type RecommendationLifeStage = (typeof RECOMMENDATION_LIFE_STAGES)[number];

export function isRecommendationLifeStage(value: unknown): value is RecommendationLifeStage {
  return typeof value === "string" && RECOMMENDATION_LIFE_STAGES.includes(value as RecommendationLifeStage);
}

/**
 * A recommendation life stage is voluntary taste-profile data, not age assurance.
 * It is usable only for an assured adult. Unknown and minor audiences always
 * resolve to `unspecified`, even if a stale or adversarial value exists in storage.
 */
export function resolveRecommendationLifeStage(
  value: unknown,
  audienceBand: AgeBand,
): RecommendationLifeStage {
  if (audienceBand !== "18_plus") return "unspecified";
  return isRecommendationLifeStage(value) ? value : "unspecified";
}

export function buildRecommendationLifeStageInstruction(stage: RecommendationLifeStage): string {
  if (stage === "unspecified") return "";
  const label: Record<Exclude<RecommendationLifeStage, "unspecified">, string> = {
    "18_39": "18–39",
    "40_64": "40–64",
    "65_plus": "65+",
  };
  return [
    `OPTIONAL RECOMMENDATION LIFE STAGE (member selected): ${label[stage]}.`,
    "Use this only when life stage is materially relevant to the member's request, and only together with their explicit interests and constraints.",
    "Never infer income, mobility, health, family status, maturity, culture, or identity from this bracket.",
    "Never announce the stored bracket. Do not use it to weaken audience-safety rules or factual/source standards.",
  ].join(" ");
}
