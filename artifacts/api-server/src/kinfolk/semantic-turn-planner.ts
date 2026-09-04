import type { EvidenceRoute } from "./evidence-route";

export type KinfolkTaskMode = "direct_answer" | "recipe_options" | "recipe_instructions" | "cultural_consensus" | "ranked_perspectives" | "entity_explorer" | "local_discovery" | "travel_plan" | "high_consequence" | "clarification";
export type CandidateMeaning = { label: string; domain: string; confidence: number; evidenceQuery: string | null };
export type SemanticTurnPlan = {
  taskMode: KinfolkTaskMode; primaryDomain: string;
  namedEntities: Array<{ text: string; type: string | null }>;
  candidateMeanings: CandidateMeaning[]; resolvedMeaning: string | null; confidence: number;
  needsClarification: boolean; clarificationQuestion: string | null;
  freshness: "stable" | "current" | "mixed";
  evidenceNeeds: Array<"approved_internal" | "official_current" | "primary_cultural" | "reputable_reporting" | "critical_consensus" | "creator_media" | "platform_records">;
  retrievalQueries: string[]; answerPerspective: "factual" | "evaluative" | "mixed";
  identityContextUsed: string[];
};

type PlannerCandidate = Partial<CandidateMeaning>;
export type SemanticPlannerInput = {
  message: string;
  evidenceRoute: EvidenceRoute;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  /** An optional, already consent-gated classifier. It receives no profile data. */
  classify?: (input: { message: string; history: Array<{ role: "user" | "assistant"; content: string }> }) => Promise<unknown>;
};

const cap = (value: unknown, max: number): string => typeof value === "string" ? value.trim().slice(0, max) : "";
const current = (message: string) => /\b(current|latest|today|tonight|recent|as of|right now)\b/i.test(message);
const recipe = (message: string) => /\b(recipe|cook|make|bake|roast|ingredients?)\b/i.test(message);
const high = (route: EvidenceRoute) => route.risk === "high";

function basePlan(input: SemanticPlannerInput): SemanticTurnPlan {
  const message = input.message.trim();
  const isRecipe = recipe(message);
  const broadIngredientQuestion = /^how\s+(?:do|would|should)\s+i\s+cook\s+[\p{L}\s'’-]{1,48}\??$/iu.test(message);
  const specificRecipe = isRecipe
    && !broadIngredientQuestion
    && /\b(make|recipe|how to|ingredients|steps|temperature|instructions)\b/i.test(message);
  const evaluative = input.evidenceRoute.claimMode === "evaluative";
  const entity = /^[A-Z][\p{L}'’-]+(?:\s+[A-Z][\p{L}'’-]+){0,3}$/u.test(message);
  const mode: KinfolkTaskMode = high(input.evidenceRoute) ? "high_consequence"
    : isRecipe ? (specificRecipe ? "recipe_instructions" : "recipe_options")
    : input.evidenceRoute.domain === "business_discovery" ? "local_discovery"
    : evaluative ? "ranked_perspectives" : entity ? "entity_explorer" : "direct_answer";
  const fresh = current(message);
  return {
    taskMode: mode, primaryDomain: input.evidenceRoute.domain,
    namedEntities: entity ? [{ text: message, type: null }] : [],
    candidateMeanings: [], resolvedMeaning: entity ? message : null, confidence: entity || isRecipe || high(input.evidenceRoute) ? 0.9 : 0.8,
    needsClarification: false, clarificationQuestion: null, freshness: fresh ? "current" : "stable",
    evidenceNeeds: high(input.evidenceRoute) ? ["official_current"] : fresh ? ["official_current"] : evaluative ? ["primary_cultural", "critical_consensus"] : ["approved_internal"],
    retrievalQueries: [message.slice(0, 180)], answerPerspective: evaluative ? "evaluative" : "factual",
    identityContextUsed: [],
  };
}

function ambiguous(message: string, plan: SemanticTurnPlan): boolean {
  if (plan.taskMode === "high_consequence" || recipe(message)) return false;
  const words = message.trim().split(/\s+/);
  // A short referential question ("Who won that conflict?", "Which one?") has
  // no stable named subject. This is intentionally domain-general: it does not
  // encode a particular cultural term, era, person, or demographic.
  const referential = /\b(that|this|the one|it|they|them|conflict|dispute|contest|battle|case|version)\b/i.test(message);
  const underspecifiedQuestion = /^(?:who|what|which|where|when|how)\b/i.test(message)
    && words.length <= 8
    && !/[A-Z][\p{L}'’-]+.*[A-Z][\p{L}'’-]+/u.test(message)
    && !/[\d][\d\s+*/().-]*[\d]/.test(message);
  return referential || underspecifiedQuestion;
}

function parsedPlan(base: SemanticTurnPlan, raw: unknown): SemanticTurnPlan {
  if (!raw || typeof raw !== "object") return base;
  const value = raw as Record<string, unknown>;
  const candidates = Array.isArray(value.candidateMeanings) ? value.candidateMeanings.slice(0, 4).map((item): CandidateMeaning | null => {
    const x = item as PlannerCandidate;
    const label = cap(x.label, 120); const domain = cap(x.domain, 80);
    if (!label || !domain) return null;
    const confidence = typeof x.confidence === "number" && Number.isFinite(x.confidence) ? Math.max(0, Math.min(1, x.confidence)) : 0;
    return { label, domain, confidence, evidenceQuery: cap(x.evidenceQuery, 180) || null };
  }).filter((x): x is CandidateMeaning => x !== null) : [];
  const confidence = typeof value.confidence === "number" && Number.isFinite(value.confidence) ? Math.max(0, Math.min(1, value.confidence)) : base.confidence;
  const materiallyAmbiguous = candidates.length > 1 && confidence < .75;
  return {
    ...base, candidateMeanings: candidates, confidence,
    resolvedMeaning: materiallyAmbiguous ? null : (cap(value.resolvedMeaning, 120) || base.resolvedMeaning),
    needsClarification: materiallyAmbiguous,
    clarificationQuestion: materiallyAmbiguous ? (cap(value.clarificationQuestion, 220) || "Which one do you mean?") : null,
    retrievalQueries: Array.isArray(value.retrievalQueries) ? value.retrievalQueries.map(x => cap(x, 180)).filter(Boolean).slice(0, 3) : base.retrievalQueries,
  };
}

/** A bounded planner: deterministic for clear turns and at most one injected model call for ambiguity. */
export async function planSemanticTurn(input: SemanticPlannerInput): Promise<SemanticTurnPlan> {
  const base = basePlan(input);
  if (!ambiguous(input.message, base) || !input.classify) return base;
  const history = (input.history ?? []).slice(-12).map(x => ({ role: x.role, content: cap(x.content, 1200) }));
  try { return parsedPlan(base, await input.classify({ message: cap(input.message, 2000), history })); }
  catch { return base; }
}