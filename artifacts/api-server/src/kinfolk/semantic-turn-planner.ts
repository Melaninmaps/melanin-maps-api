import type { EvidenceRoute } from "./evidence-route";
import { temporalEvidencePolicy } from "./current-research";

export type KinfolkTaskMode = "direct_answer" | "recipe_options" | "recipe_instructions" | "cultural_consensus" | "ranked_perspectives" | "entity_explorer" | "local_discovery" | "travel_plan" | "city_briefing" | "high_consequence" | "clarification";
export type CandidateMeaning = { label: string; domain: string; confidence: number; evidenceQuery: string | null };
export type SemanticTurnPlan = {
  taskMode: KinfolkTaskMode; primaryDomain: string;
  namedEntities: Array<{ text: string; type: string | null }>;
  candidateMeanings: CandidateMeaning[]; resolvedMeaning: string | null; confidence: number;
  needsClarification: boolean; clarificationQuestion: string | null;
  freshness: "stable" | "current" | "historical" | "mixed";
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

export type ConversationalResearchSubject = Readonly<{
  /** The member's visible wording is never changed in the rendered chat. */
  memberMessage: string;
  /** A bounded, server-only retrieval instruction that keeps a short follow-up on topic. */
  researchMessage: string;
  inheritedSubject: string | null;
}>;

const cap = (value: unknown, max: number): string => typeof value === "string" ? value.trim().slice(0, max) : "";
const recipe = (message: string) => /\b(recipe|cook|cooking|bake|baking|roast|braise|grill|fry|ingredients?|dish|meal|beef|chicken|pork|fish|rice|pasta|soup|stew|cake|bread)\b/i.test(message);
const culturalConflict = (message: string) => /\b(diss|feud|rap battle)\b/i.test(message)
  || /\b(?:won|winner|between)\b.{0,40}\bbeef\b|\bbeef\b.{0,40}\b(?:between|winner)\b/i.test(message);
const travelPlan = (message: string) => /\b(plan|build|create|suggest|help with)\b.{0,40}\b(trip|itinerary|vacation|visit|weekend|getaway)\b|\b(trip|itinerary|vacation|getaway)\b.{0,40}\b(to|in|for)\b/i.test(message);
const high = (route: EvidenceRoute) => route.risk === "high";

const ARTICLE_FOLLOW_UP_RE = /^\s*(?:(?:can|could|would)\s+you\s+)?(?:show|find|give|send|share|pull\s+up)\s+(?:me\s+)?(?:some\s+)?(?:articles?|links?|sources?|reports?|news)(?:\s+(?:about|on|for)\s+.+)?[.?!]*\s*$/i;

function priorTopicalUserTurn(
  history: SemanticPlannerInput["history"],
): string | null {
  const prior = [...(history ?? [])]
    .reverse()
    .find((turn) => turn.role === "user" && turn.content.trim().length >= 8);
  return prior ? cap(prior.content, 360) : null;
}

/**
 * A brief request such as “show me articles” inherits the immediately preceding
 * user subject. The member should not have to repeat “the war in Iran” merely
 * because they asked for a useful next step. This is retrieval-only context: it
 * neither persists a memory nor infers identity, preferences, or intent.
 */
export function resolveConversationalResearchSubject(
  message: string,
  history?: SemanticPlannerInput["history"],
): ConversationalResearchSubject {
  const memberMessage = cap(message, 2_000);
  if (!ARTICLE_FOLLOW_UP_RE.test(memberMessage)) {
    return { memberMessage, researchMessage: memberMessage, inheritedSubject: null };
  }
  const inheritedSubject = priorTopicalUserTurn(history);
  if (!inheritedSubject) {
    return { memberMessage, researchMessage: memberMessage, inheritedSubject: null };
  }
  return {
    memberMessage,
    inheritedSubject,
    researchMessage: `${inheritedSubject}\n\nFollow-up request: ${memberMessage}\nRetrieve only current, directly relevant, reputable articles about the preceding subject. Do not ask the member to repeat the subject.`,
  };
}

const ARITHMETIC_MAX_INPUT_LENGTH = 200;
const ARITHMETIC_MAX_TOKENS = 80;
const ARITHMETIC_MAX_DEPTH = 12;
const ARITHMETIC_MAX_NUMBER_DIGITS = 15;

type ArithmeticToken =
  | { kind: "number"; value: number }
  | { kind: "operator"; value: "+" | "-" | "*" | "/" }
  | { kind: "open" | "close" | "percent" | "of" };

/**
 * Strips only a complete, familiar request wrapper. Anything before or after
 * the calculation is intentionally rejected rather than treated as a fragment
 * to extract from prose.
 */
function standaloneArithmeticExpression(message: string): string | null {
  let expression = message.trim();
  if (!expression || expression.length > ARITHMETIC_MAX_INPUT_LENGTH) return null;
  if (expression.endsWith("?")) expression = expression.slice(0, -1).trim();
  const wrapped = expression.match(/^(?:what(?:'s|\s+is)|calculate)\s+(.+)$/i);
  if (wrapped) expression = wrapped[1].trim();
  return expression || null;
}

function tokenizeArithmetic(expression: string): ArithmeticToken[] | null {
  const tokens: ArithmeticToken[] = [];
  const normalized = expression.replaceAll("×", "*").replaceAll("÷", "/");
  let index = 0;
  while (index < normalized.length) {
    const character = normalized[index];
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    if (character === "+" || character === "-" || character === "*" || character === "/") {
      tokens.push({ kind: "operator", value: character });
      index += 1;
    } else if (character === "(") {
      tokens.push({ kind: "open" });
      index += 1;
    } else if (character === ")") {
      tokens.push({ kind: "close" });
      index += 1;
    } else if (character === "%") {
      tokens.push({ kind: "percent" });
      index += 1;
    } else if (character === "o" || character === "O") {
      if (normalized.slice(index, index + 2).toLowerCase() !== "of") return null;
      tokens.push({ kind: "of" });
      index += 2;
    } else if (/\d/.test(character) || (character === "." && /\d/.test(normalized[index + 1] ?? ""))) {
      const start = index;
      let digitCount = 0;
      if (character === ".") {
        index += 1;
        while (/\d/.test(normalized[index] ?? "")) {
          digitCount += 1;
          index += 1;
        }
      } else {
        while (/\d/.test(normalized[index] ?? "")) {
          digitCount += 1;
          index += 1;
        }
        if (normalized[index] === ".") {
          index += 1;
          while (/\d/.test(normalized[index] ?? "")) {
            digitCount += 1;
            index += 1;
          }
        }
      }
      if (digitCount > ARITHMETIC_MAX_NUMBER_DIGITS) return null;
      const number = Number(normalized.slice(start, index));
      if (!Number.isFinite(number)) return null;
      tokens.push({ kind: "number", value: number });
    } else {
      return null;
    }
    if (tokens.length > ARITHMETIC_MAX_TOKENS) return null;
  }
  return tokens;
}

function formatArithmeticResult(value: number): string | null {
  if (!Number.isFinite(value)) return null;
  // Fifteen significant digits remove ordinary IEEE-754 display noise while
  // keeping the result deterministic and compact (for example, 0.1 + 0.2).
  const rounded = Number(value.toPrecision(15));
  if (!Number.isFinite(rounded)) return null;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** Deliberately small grammar: arithmetic is answered locally, never retrieved. */
export function deterministicArithmeticAnswer(message: string): string | null {
  const expression = standaloneArithmeticExpression(message);
  if (!expression) return null;
  const tokens = tokenizeArithmetic(expression);
  if (!tokens?.length) return null;
  let index = 0;
  let depth = 0;

  const peek = () => tokens[index];
  const finite = (value: number) => Number.isFinite(value) ? value : null;
  function parsePrimary(): number | null {
    const token = peek();
    if (token?.kind === "number") {
      index += 1;
      return token.value;
    }
    if (token?.kind !== "open" || depth >= ARITHMETIC_MAX_DEPTH) return null;
    index += 1;
    depth += 1;
    const value = parseAdditive();
    if (value === null || peek()?.kind !== "close") return null;
    index += 1;
    depth -= 1;
    return value;
  }
  function parseUnary(): number | null {
    const token = peek();
    if (token?.kind === "operator" && (token.value === "+" || token.value === "-")) {
      index += 1;
      const value = parseUnary();
      return value === null ? null : finite(token.value === "-" ? -value : value);
    }
    return parsePrimary();
  }
  function parseMultiplicative(): number | null {
    let value = parseUnary();
    while (value !== null) {
      const operator = peek();
      if (operator?.kind !== "operator" || (operator.value !== "*" && operator.value !== "/")) break;
      index += 1;
      const right = parseUnary();
      if (right === null || (operator.value === "/" && right === 0)) return null;
      value = finite(operator.value === "*" ? value * right : value / right);
    }
    return value;
  }
  function parseAdditive(): number | null {
    let value = parseMultiplicative();
    while (value !== null) {
      const operator = peek();
      if (operator?.kind !== "operator" || (operator.value !== "+" && operator.value !== "-")) break;
      index += 1;
      const right = parseMultiplicative();
      if (right === null) return null;
      value = finite(operator.value === "+" ? value + right : value - right);
    }
    return value;
  }
  const startsPercentageOf = () => {
    let candidate = index;
    const sign = tokens[candidate];
    if (sign?.kind === "operator" && (sign.value === "+" || sign.value === "-")) candidate += 1;
    return tokens[candidate]?.kind === "number"
      && tokens[candidate + 1]?.kind === "percent"
      && tokens[candidate + 2]?.kind === "of";
  };

  let result: number | null;
  if (startsPercentageOf()) {
    const sign = peek();
    const multiplier = sign?.kind === "operator" && sign.value === "-" ? -1 : 1;
    if (sign?.kind === "operator") index += 1;
    const percent = peek();
    if (percent?.kind !== "number") return null;
    index += 3; // number, %, of
    const base = parseAdditive();
    result = base === null ? null : finite(multiplier * (percent.value / 100) * base);
  } else {
    result = parseAdditive();
  }
  return result === null || index !== tokens.length ? null : formatArithmeticResult(result);
}

function basePlan(input: SemanticPlannerInput): SemanticTurnPlan {
  const message = input.message.trim();
  const namedConflictParticipants = (message.match(/\b[A-Z][\p{L}'’-]+\b/gu) ?? [])
    .filter((token) => !/^(Who|What|Which|Where|When|How|Did|Does|Is|Was|The)$/i.test(token));
  const namedVersusBeef = /\b(?:versus|vs\.?)\b.{0,40}\bbeef\b|\bbeef\b.{0,40}\b(?:versus|vs\.?)\b/i.test(message)
    && namedConflictParticipants.length >= 2
    && !/\b(cook|recipe|ingredients?|stew|roast|braise|grill|fry|bake)\b/i.test(message);
  const isCulturalConflict = culturalConflict(message) || namedVersusBeef;
  const isRecipe = recipe(message) && !isCulturalConflict;
  const broadIngredientQuestion = /^how\s+(?:do|would|should)\s+i\s+cook\s+[\p{L}\s'’-]{1,48}\??$/iu.test(message);
  const specificRecipe = isRecipe
    && !broadIngredientQuestion
    && /\b(make|recipe|how to|ingredients|steps|temperature|instructions)\b/i.test(message);
  const evaluative = input.evidenceRoute.claimMode === "evaluative";
  const entity = /^[A-Z][\p{L}'’-]+(?:\s+[A-Z][\p{L}'’-]+){0,3}$/u.test(message);
  const isTravelPlan = travelPlan(message);
  const isCulturalConsensus = isCulturalConflict && namedConflictParticipants.length >= 2;
  const mode: KinfolkTaskMode = high(input.evidenceRoute) ? "high_consequence"
    : isRecipe ? (specificRecipe ? "recipe_instructions" : "recipe_options")
    : isTravelPlan ? "travel_plan"
    : isCulturalConsensus ? "cultural_consensus"
    : input.evidenceRoute.domain === "business_discovery" ? "local_discovery"
    : evaluative ? "ranked_perspectives" : entity ? "entity_explorer" : "direct_answer";
  const temporalPolicy = temporalEvidencePolicy(message);
  const freshness = temporalPolicy.freshness;
  return {
    taskMode: mode, primaryDomain: input.evidenceRoute.domain,
    namedEntities: entity ? [{ text: message, type: null }] : [],
    candidateMeanings: [], resolvedMeaning: entity ? message : null, confidence: entity || isRecipe || high(input.evidenceRoute) ? 0.9 : 0.8,
    needsClarification: false, clarificationQuestion: null, freshness,
    evidenceNeeds: high(input.evidenceRoute) ? ["official_current"]
      : isRecipe ? ["approved_internal", "creator_media"]
      : freshness !== "stable" || isTravelPlan || input.evidenceRoute.domain === "business_discovery" ? ["official_current", "platform_records"]
      : evaluative || isCulturalConsensus ? ["primary_cultural", "critical_consensus"]
      : entity ? ["approved_internal", "primary_cultural"]
      : ["approved_internal"],
    retrievalQueries: [message.slice(0, 180)], answerPerspective: evaluative ? "evaluative" : "factual",
    identityContextUsed: [],
  };
}

/**
 * Resolves only the immediate, bounded arithmetic antecedent in a current
 * conversation. It does not create memory or make older calculations available
 * to unrelated turns.
 */
export function hasResolvedImmediateArithmeticFollowUp(
  message: string,
  history?: SemanticPlannerInput["history"],
): boolean {
  const recent = history?.slice(-2) ?? [];
  const priorArithmetic = recent.length === 2 && recent[0]?.role === "user"
    ? deterministicArithmeticAnswer(recent[0].content)
    : null;
  const immediateArithmeticExchange = priorArithmetic !== null
    && recent[1]?.role === "assistant"
    && recent[1].content.trim() === priorArithmetic;
  const arithmeticReferentialFollowUp = /\b(that|the answer|the result|how did you get|what was|what is)\b/i.test(message)
    && !/\b(conflict|dispute|contest|battle|case|version|person|place)\b/i.test(message);
  return immediateArithmeticExchange && arithmeticReferentialFollowUp;
}

function ambiguous(message: string, plan: SemanticTurnPlan, history?: SemanticPlannerInput["history"]): boolean {
  if (plan.taskMode === "high_consequence" || plan.taskMode === "recipe_options" || plan.taskMode === "recipe_instructions") return false;
  const words = message.trim().split(/\s+/);
  // A short referential question ("Who won that conflict?", "Which one?") has
  // no stable named subject. This is intentionally domain-general: it does not
  // encode a particular cultural term, era, person, or demographic.
  const referential = /\b(that|this|the one|it|they|them|conflict|dispute|contest|battle|case|version)\b/i.test(message);
  const underspecifiedQuestion = /^(?:who|what|which|where|when|how)\b/i.test(message)
    && words.length <= 8
    && !/[A-Z][\p{L}'’-]+.*[A-Z][\p{L}'’-]+/u.test(message)
    && !/[\d][\d\s+*/().-]*[\d]/.test(message);
  const hasImmediateArithmeticAntecedent =
    plan.taskMode === "direct_answer" &&
    hasResolvedImmediateArithmeticFollowUp(message, history);
  return !hasImmediateArithmeticAntecedent && (referential || underspecifiedQuestion);
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
  if (!ambiguous(input.message, base, input.history) || !input.classify) return base;
  const history = (input.history ?? []).slice(-12).map(x => ({ role: x.role, content: cap(x.content, 1200) }));
  try { return parsedPlan(base, await input.classify({ message: cap(input.message, 2000), history })); }
  catch { return base; }
}
