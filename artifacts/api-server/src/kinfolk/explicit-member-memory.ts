import { sensitiveMemoryTopic } from "./sensitive-memory";

export type ExplicitMemberMemory = Readonly<{
  content: string;
  purpose: "planning_context" | "profile_context";
  isSensitive: boolean;
}>;

const MEMORY_COMMANDS = [
  /^(?:hey\s+)?(?:kinfolk(?:ai)?[,.!\s]+)?(?:please\s+)?remember(?:\s+(?:this|that))?\s*[:,\-–—]?\s*(.+)$/i,
  /^(?:hey\s+)?(?:kinfolk(?:ai)?[,.!\s]+)?(?:(?:this|here)\s+is\s+what\s+I\s+want\s+you\s+to\s+remember\s+about\s+me|I\s+want\s+you\s+to\s+remember\s+(?:this\s+)?about\s+me)\s*[:,\-–—]?\s*(.+)$/i,
];
const QUESTION_AFTER_REMEMBER = /^(?:what|when|where|who|why|how|if|to)\b/i;
const MEMORY_CAPABILITY_QUESTION = /^(?:(?:can|could|do|will)\s+(?:you|kinfolk(?:ai)?)\s+)?(?:remember|store|save|keep)\s+(?:my\s+)?(?:personal\s+)?(?:information|details?|preferences?|context|memory)(?:\s+(?:about\s+me|for\s+me))?\??$/i;

const PLANNING_CONTEXT = /\b(?:funds? (?:are|is) tight|money is tight|tight budget|budget|income|pay(?:\s+cut)?|hours? (?:are|were|was|have been|got)|shift|work schedule|new job|job search|career|children|kids?|son|daughter|daycare|aftercare|school pickup|caregiv(?:er|ing)|travel(?:s|ing)?(?: often)? for work|commute|moving|relocat(?:e|ing|ion))\b/i;

const NAME_OR_NICKNAME_CONTEXT = /\b(?:my name is|call me|prefer to be called|i go by|nickname)\b/i;
const LIFESTYLE_PROFILE_CONTEXT = /\b(?:travel(?:s|ing)? often for work|i am a\b|i enjoy\b|i like\b|i love\b)\b/i;
const TRAVEL_OR_LOCAL_REQUEST = /\b(?:travel|trip|work trip|visit|in|minneapolis|philadelphia|houston|los angeles|la\b|new york|nyc|washington|allentown|bucks county|city|neighborhood|near me|restaurant|spa|hotel|vacation|nightlife|things to do|what do i need to know)\b/i;
const FAMILY_OR_SCHEDULE_REQUEST = /\b(?:child(?:ren)?|kids?|son|daughter|family|daycare|aftercare|school|pickup|care|schedule|shift|work|job|commute)\b/i;
const PERSONAL_CONTEXT_REQUEST = /\b(?:remember|know about me|my profile|call me|what do you know)\b/i;
const HEALTH_OR_PERSONAL_SERVICE_REQUEST = /\b(?:doctor|physician|medical|health(?:\s+care)?|therap(?:y|ist)|counsel(?:or|ling)|dentist|specialist|clinic|hospital|midwi(?:fe|fery)|ob[- ]?gyn|pediatric(?:ian|s)?)\b/i;
const CURRENT_AFFAIRS_INTEREST = /\b(?:military|deployment|war|conflict|foreign policy|geopolitic(?:s|al)|oil|energy)\b/i;
const CURRENT_AFFAIRS_REQUEST = /\b(?:war|conflict|military|deployment|foreign policy|geopolitic(?:s|al)|iran|oil|energy)\b/i;

const DISCOVERY_CONTEXT_TERMS: ReadonlyArray<{
  pattern: RegExp;
  terms: readonly string[];
}> = [
  { pattern: /\b(?:hispanic|latina|latino|latinx)\b/i, terms: ["Hispanic", "Latina", "Latino", "Latinx"] },
  { pattern: /\b(?:black|african american|african-american)\b/i, terms: ["Black", "African American"] },
  { pattern: /\b(?:woman|women)\b/i, terms: ["Woman", "Women"] },
  { pattern: /\b(?:asian|asian american|asian-american)\b/i, terms: ["Asian", "Asian American"] },
  { pattern: /\b(?:native|indigenous|american indian|alaska native)\b/i, terms: ["Native", "Indigenous"] },
  { pattern: /\b(?:lgbtq(?:ia\+?)?|gay|lesbian|bisexual|trans(?:gender)?)\b/i, terms: ["LGBTQ", "LGBTQIA+"] },
];

/**
 * A chat message becomes stored memory only when the member expressly asks
 * Kinfolk to remember it. A question such as "remember where we ate?" does not
 * become memory; ordinary conversation is never silently retained as a profile
 * fact by this parser.
 */
export function parseExplicitMemberMemory(
  value: unknown,
): ExplicitMemberMemory | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  const match = MEMORY_COMMANDS.map((command) => command.exec(normalized)).find(
    (candidate): candidate is RegExpExecArray => candidate !== null,
  );
  if (!match) return null;

  const content = match[1]?.trim() ?? "";
  if (content.length < 3 || content.length > 1_000 || QUESTION_AFTER_REMEMBER.test(content) || /\?$/.test(content)) {
    return null;
  }

  return {
    content,
    purpose:
      NAME_OR_NICKNAME_CONTEXT.test(content) ||
      LIFESTYLE_PROFILE_CONTEXT.test(content)
        ? "profile_context"
        : PLANNING_CONTEXT.test(content)
          ? "planning_context"
          : "profile_context",
    isSensitive: sensitiveMemoryTopic(content) !== null,
  };
}

/**
 * A capability question has one accurate product answer. Keeping it outside the
 * model prevents the private-memory boundary from being misrepresented as a
 * claim that Kinfolk cannot remember a member's direct instruction.
 */
export function isExplicitMemberMemoryCapabilityQuestion(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return MEMORY_CAPABILITY_QUESTION.test(value.replace(/\s+/g, " ").trim());
}

/**
 * Identity context is a soft ranking cue only for already-governed records
 * whose own published metadata includes a matching term. It never creates an
 * ownership claim or a mandatory directory filter.
 */
export function profileDiscoveryContextTerms(
  memory: { content: string; purpose: string },
): string[] {
  if (memory.purpose !== "profile_context") return [];
  return [
    ...new Set(
      DISCOVERY_CONTEXT_TERMS
        .filter(({ pattern }) => pattern.test(memory.content))
        .flatMap(({ terms }) => terms),
    ),
  ];
}

/**
 * Profile memory is never a blanket identity filter. It is supplied only when a
 * member asks a matching personal, local, family, schedule, or travel question.
 * A chosen name/nickname is the limited exception: it may be used as address on
 * any turn for that same authenticated member.
 */
export function isExplicitProfileMemoryRelevant(
  memory: { content: string; purpose: string },
  currentMessage: string,
): boolean {
  if (memory.purpose !== "profile_context") return false;
  if (NAME_OR_NICKNAME_CONTEXT.test(memory.content)) return true;
  if (PERSONAL_CONTEXT_REQUEST.test(currentMessage)) return true;

  const remembersTravelOrLocation = /\b(?:travel|work|city|neighborhood|vacation|nightlife|restaurant|spa|hotel|trip|visit)\b/i.test(memory.content);
  if (remembersTravelOrLocation && TRAVEL_OR_LOCAL_REQUEST.test(currentMessage)) return true;

  const remembersFamilyOrSchedule = /\b(?:children|kids?|son|daughter|mother|father|mom|dad|schedule|shift|hours?|work|job|care)\b/i.test(memory.content);
  if (remembersFamilyOrSchedule && FAMILY_OR_SCHEDULE_REQUEST.test(currentMessage)) return true;

  // A saved identity can help rank published culturally relevant health records.
  // It never determines a provider's ownership, identity, or eligibility.
  if (profileDiscoveryContextTerms(memory).length > 0 && HEALTH_OR_PERSONAL_SERVICE_REQUEST.test(currentMessage)) return true;

  // A saved interest can provide an optional next-read or follow-up direction
  // for a matching current-affairs question. It never changes the factual answer.
  return CURRENT_AFFAIRS_INTEREST.test(memory.content) && CURRENT_AFFAIRS_REQUEST.test(currentMessage);
}
