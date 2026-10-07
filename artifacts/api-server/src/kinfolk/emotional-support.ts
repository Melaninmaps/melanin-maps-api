import type { KinfolkConversationalIntent } from "./general-answer-routing";
import {
  isImmediateMedicalEmergency,
  isImmediateSafetyEmergency,
} from "./emergency-medical-response";

export type EmotionalSupportNeed =
  | "vent"
  | "problem_solving"
  | "tool_or_exercise"
  | "uncertain"
  | "celebration"
  | "grief_support";

export type EmotionalSupportGuidance = Readonly<{
  need: EmotionalSupportNeed;
  likelyEmotion: string | null;
}>;

const CRISIS_SIGNAL = /\b(?:suicid(?:e|al)?|self[ -]?harm|hurt myself|kill myself|end my life|want to die|overdos(?:e|ing)|not safe|in immediate danger|cannot leave safely|can'?t leave safely|being abused|domestic violence|sexual assault|partner (?:hit|hurt|threatened) me)\b/i;
const EXPLICIT_VENT_SIGNAL = /\b(?:just|need to|wanna|want to)\s+(?:vent|be heard|talk it out|get it off my chest)\b|\b(?:don't|do not)\s+(?:need|want)\s+(?:advice|solutions?|a plan|fixes?)\b/i;
const EXPLICIT_TOOL_SIGNAL = /\b(?:breath(?:ing)? exercise|box breathing|grounding exercise|5[ -]?4[ -]?3[ -]?2[ -]?1|ground me|pause and plan|calm(?:ing)? exercise|stress(?:-| )management exercise|help me (?:breathe|ground|reset|calm down)|walk me through (?:a )?(?:breath|grounding|pause))\b/i;
const EXPLICIT_PROBLEM_SOLVING_SIGNAL = /\b(?:can you )?help me (?:make|build|figure out|break down|prioriti[sz]e|plan)|what should i do next|next step|help me draft|how do i handle|help me prepare\b/i;
const UNCERTAIN_NEED_SIGNAL = /\b(?:i (?:do not|don't) know what i need|not sure what i need|don't know where to start|i'?m lost|i am lost)\b/i;
const CONTEXTUAL_STRESS_SIGNAL = /\b(?:this mess|all of this|everything(?:'s| is)? (?:piling|hitting)|rent(?: is)? due|behind on (?:rent|bills)|bills? (?:are )?piling|money(?:'s| is)? tight|short on rent|can'?t afford|cannot afford|nobody checks on me|feel(?:ing)? invisible|stomach(?:'s| is)? in knots|head(?:'s| is)? spinning|spiral(?:ing)?|workload(?:'s| is)? too much)\b/i;

const EMOTION_SIGNALS: ReadonlyArray<Readonly<{ label: string; pattern: RegExp }>> = [
  { label: "overwhelmed", pattern: /\b(?:overwhelm(?:ed|ing)?|overwelmed|too much|piling up|drown(?:ing|ed)?|swamped|at my limit)\b/i },
  { label: "financially stressed", pattern: /\b(?:rent(?: is)? due|behind on (?:rent|bills)|bills? (?:are )?piling|money(?:'s| is)? tight|short on rent|can'?t afford|cannot afford|financial(?:ly)? stressed|money stress)\b/i },
  { label: "stressed", pattern: /\b(?:stress(?:ed|ing)?|stresed|pressure(?:d)?|burn(?:ed|t)? out|burnout)\b/i },
  { label: "anxious or nervous", pattern: /\b(?:anxi(?:ous|ety)|anxous|nerv(?:ous|es|us)|freak(?:ing)? out|on edge|my nerves? (?:are|is) (?:bad|shot)|worried|worrying|stomach(?:'s| is)? in knots|head(?:'s| is)? spinning|spiral(?:ing)?)\b/i },
  { label: "sad or grieving", pattern: /\b(?:sad|heartbroken|grief|grieving|mourn(?:ing)?|loss|lost (?:my|a) |miss(?:ing)? (?:my|them|her|him)|heavy heart|(?:my|our|their) (?:aunt|uncle|mom|mother|dad|father|parent|friend|partner|sibling|grand(?:ma|pa|mother|father)) (?:died|passed away))\b/i },
  { label: "angry or frustrated", pattern: /\b(?:ang(?:ry|er)|mad|annoy(?:ed|ing)?|frustrat(?:ed|ing|ion)|frusrated|irritat(?:ed|ing)|fed up|pissed|tight|got me heated)\b/i },
  { label: "lonely", pattern: /\b(?:lonely|alone|isolated|by myself|no one (?:gets|understands) me|nobody checks on me|feel(?:ing)? invisible)\b/i },
  { label: "uncertain", pattern: /\b(?:uncertain|unsure|confused|stuck|in my feelings|all over the place)\b/i },
  { label: "relieved", pattern: /\b(?:relieved|relief|weight off my shoulders?|finally (?:over|done)|can breathe again)\b/i },
  { label: "excited", pattern: /\b(?:excited|exciting|thrilled|so happy|good news|celebrat(?:e|ing|ion)|proud of myself|we did it|i'?m hype|got (?:the )?(?:offer|job|promotion|news)|we won)\b/i },
];

function matchedEmotion(message: string): string | null {
  return EMOTION_SIGNALS.find((signal) => signal.pattern.test(message))?.label ?? null;
}

/**
 * Classifies the immediate conversational need without recording, inferring, or
 * persisting a member attribute. This is a response-framing safeguard, not a
 * mental-health assessment. Crisis language is intentionally excluded so the
 * existing emergency route and deterministic crisis policy retain precedence.
 */
export function resolveEmotionalSupportGuidance(input: Readonly<{
  message: string;
  semanticIntent?: KinfolkConversationalIntent | null;
}>): EmotionalSupportGuidance | null {
  const message = input.message.trim();
  if (
    !message ||
    CRISIS_SIGNAL.test(message) ||
    isImmediateMedicalEmergency(message) ||
    isImmediateSafetyEmergency(message)
  ) {
    return null;
  }

  const likelyEmotion = matchedEmotion(message);
  const semanticSupport = input.semanticIntent === "emotional_support";
  const explicitProblemSolving = EXPLICIT_PROBLEM_SOLVING_SIGNAL.test(message);
  const emotionalContext =
    Boolean(likelyEmotion) ||
    semanticSupport ||
    UNCERTAIN_NEED_SIGNAL.test(message) ||
    CONTEXTUAL_STRESS_SIGNAL.test(message);

  if (
    !emotionalContext &&
    !EXPLICIT_VENT_SIGNAL.test(message) &&
    !EXPLICIT_TOOL_SIGNAL.test(message)
  ) {
    return null;
  }
  if (EXPLICIT_VENT_SIGNAL.test(message)) return { need: "vent", likelyEmotion };
  if (EXPLICIT_TOOL_SIGNAL.test(message)) return { need: "tool_or_exercise", likelyEmotion };
  if (UNCERTAIN_NEED_SIGNAL.test(message)) return { need: "uncertain", likelyEmotion };
  if (likelyEmotion === "sad or grieving") {
    return { need: "grief_support", likelyEmotion };
  }
  if (likelyEmotion === "excited" || likelyEmotion === "relieved") {
    return { need: "celebration", likelyEmotion };
  }
  if (explicitProblemSolving) {
    return { need: "problem_solving", likelyEmotion };
  }
  return { need: "uncertain", likelyEmotion };
}

/**
 * Adds a bounded response shape after evidence, emergency, memory, and selected
 * conversation-mode policies have already been fixed. It does not diagnose,
 * alter facts, create a task, or authorize saving any current-turn detail.
 */
export function buildEmotionalSupportResponseContract(
  guidance: EmotionalSupportGuidance | null,
): string {
  if (!guidance) return "";

  const reflection = guidance.likelyEmotion
    ? `Use a plain, hedged reflection such as “It sounds like this may feel ${guidance.likelyEmotion}.” Do not state that the member definitely feels anything.`
    : "Use a plain, hedged acknowledgment without guessing at a specific feeling.";

  const needInstruction: Record<EmotionalSupportNeed, string> = {
    vent:
      "The member may want to be heard. Start by acknowledging them; do not lead with a checklist, reminder, diagnosis, directory suggestion, or forced fix. Offer one gentle choice to keep talking, make a plan, or take a quick pause only after the acknowledgment.",
    problem_solving:
      "Acknowledge first, then offer no more than two relevant, adjustable next-step choices. Examples can include sorting priorities, a brief grounding pause, breaking down a task, drafting a message, or preparing questions. Do not prescribe a clinical treatment or pretend there is one right answer.",
    tool_or_exercise:
      "Offer one optional, brief, accessible exercise. Ask permission or frame it as an invitation; never force it. Keep a breathing, grounding, pause-and-plan, grief-support, or small-next-step exercise short and do not represent it as treatment.",
    uncertain:
      "Acknowledge first, then ask one gentle choice question, such as whether the member wants to talk it out, make a plan, or take a quick pause. Do not force advice or a detailed checklist.",
    celebration:
      "Acknowledge the good news warmly and invite the member to share or enjoy it. Do not manufacture intimacy, exaggerate the event, or turn celebration into a task list unless the member asks.",
    grief_support:
      "Acknowledge a possible loss gently without assuming its details. Offer a choice to talk it out, take a quiet pause, or make one small practical plan only if that would help. Do not rush grief, minimize it, diagnose it, or treat it as a problem to solve.",
  };

  return [
    "EMOTIONAL SUPPORT RESPONSE CONTRACT:",
    reflection,
    needInstruction[guidance.need],
    "When the member has not already chosen a direction, offer choice rather than a forced solution: they can talk it out, make a plan, or take a quick pause first.",
    "Do not diagnose, minimize, overpromise, claim to be a clinician, or make a clinical assessment. Existing emergency and self-harm escalation rules always win over this contract.",
    "Keep the selected Kinfolk mode's warmth and structure, but do not let the mode change facts, evidence requirements, emergency behavior, or privacy boundaries.",
    "Do not silently save the member's emotion, grief, health detail, conversation, or inferred preference as memory. Any retention remains explicit and consent-based.",
  ].join(" ");
}
