export type ExplicitMemberMemory = Readonly<{
  content: string;
  purpose: "planning_context" | "profile_context";
  isSensitive: boolean;
}>;

const MEMORY_COMMAND = /^(?:hey\s+)?(?:kinfolk(?:ai)?[,.!\s]+)?(?:please\s+)?remember(?:\s+(?:this|that))?\s*[:,\-–—]?\s*(.+)$/i;
const QUESTION_AFTER_REMEMBER = /^(?:what|when|where|who|why|how|if|to)\b/i;

const PLANNING_CONTEXT = /\b(?:funds? (?:are|is) tight|money is tight|tight budget|budget|income|pay(?:\s+cut)?|hours? (?:are|were|was|have been|got)|shift|work schedule|new job|job search|career|children|kids?|son|daughter|daycare|aftercare|school pickup|caregiv(?:er|ing)|travel(?:s|ing)?(?: often)? for work|commute|moving|relocat(?:e|ing|ion))\b/i;

const SENSITIVE_CONTEXT = /\b(?:black|african|diaspora|woman|women|man|men|nonbinary|lgbtq(?:ia\+?)?|gay|lesbian|bisexual|trans(?:gender)?|\d{1,3}[- ]?year[- ]?old|divorc(?:ed|e)|married|single|income|six figures|salary|funds? (?:are|is) tight|money is tight|children|kids?|son|daughter|mother|father|mom|dad|health|medical|disab(?:led|ility))\b/i;

const NAME_OR_NICKNAME_CONTEXT = /\b(?:my name is|call me|prefer to be called|i go by|nickname)\b/i;
const LIFESTYLE_PROFILE_CONTEXT = /\b(?:travel(?:s|ing)? often for work|i am a\b|i enjoy\b|i like\b|i love\b)\b/i;
const TRAVEL_OR_LOCAL_REQUEST = /\b(?:travel|trip|work trip|visit|in|minneapolis|philadelphia|houston|los angeles|la\b|new york|nyc|washington|allentown|bucks county|city|neighborhood|near me|restaurant|spa|hotel|vacation|nightlife|things to do|what do i need to know)\b/i;
const FAMILY_OR_SCHEDULE_REQUEST = /\b(?:child(?:ren)?|kids?|son|daughter|family|daycare|aftercare|school|pickup|care|schedule|shift|work|job|commute)\b/i;
const PERSONAL_CONTEXT_REQUEST = /\b(?:remember|know about me|my profile|call me|what do you know)\b/i;

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
  const match = MEMORY_COMMAND.exec(normalized);
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
    isSensitive: SENSITIVE_CONTEXT.test(content),
  };
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
  return remembersFamilyOrSchedule && FAMILY_OR_SCHEDULE_REQUEST.test(currentMessage);
}
