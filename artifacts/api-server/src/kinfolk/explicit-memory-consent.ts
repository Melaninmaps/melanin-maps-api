import {
  parseExplicitMemberMemory,
  type ExplicitMemberMemory,
} from "./explicit-member-memory";
import {
  sensitiveMemoryTopic,
  type SensitiveMemoryTopic,
} from "./sensitive-memory";

type ConsentSensitiveTopic = SensitiveMemoryTopic | "birthday_age";

export type ExplicitMemoryConsentItem = Readonly<{
  id: string;
  kind: "ordinary" | "sensitive";
  label: string;
  content: string;
  topic?: ConsentSensitiveTopic;
}>;

export type ExplicitMemoryConsentPlan = Readonly<{
  purpose: ExplicitMemberMemory["purpose"];
  ordinary: readonly ExplicitMemoryConsentItem[];
  sensitive: readonly ExplicitMemoryConsentItem[];
}>;

const MEMORY_CLAUSE_BOUNDARY = /\s+(?=(?:i\s+(?:am|am\s+not|have|do\s+not\s+have|don't\s+have|prefer|enjoy|like|love)|i['’]m|my\s+(?:birthday|age|allerg(?:y|ies))|as\s+a)\b)/gi;
const OWNERSHIP_SUPPORT_PREFERENCE = /\b(?:prefer|support|open\s+to|owned\s+business(?:es)?|minority[-\s]?owned)\b/i;
const AGE_OR_BIRTHDAY = /\b(?:birthday|born\b|age\s*(?:is|:)?\s*\d{1,3}|i(?:\s+am|'m)\s+\d{1,3})\b/i;
const ALLERGY_STATUS = /\b(?:no|not|without|have|has)\b[^.]{0,40}\b(?:allerg(?:y|ies)|allergic)\b/i;

function normalizeClause(value: string): string {
  return value
    .replace(/^[,;:\-–—\s]+|[,;:\-–—\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitMemoryClauses(content: string): string[] {
  return content
    .replace(/\s+(?=\d{1,3}\s+my\s+birthday\b)/gi, "\n")
    .replace(MEMORY_CLAUSE_BOUNDARY, "\n")
    .split(/[\n.;]+/)
    .map(normalizeClause)
    .filter((clause) => clause.length >= 3)
    .slice(0, 12);
}

function sensitiveLabel(topic: ConsentSensitiveTopic): string {
  switch (topic) {
    case "health":
      return "Health or allergy information";
    case "exact_location":
      return "Exact location";
    case "race_ethnicity":
      return "Identity or background";
    case "religion":
      return "Religion or belief";
    case "sexuality":
      return "Sexual orientation or gender identity";
    case "finances":
      return "Financial information";
    case "children":
      return "Children or family information";
    case "birthday_age":
      return "Birthday or age";
  }
}

function ordinaryLabel(content: string): string {
  if (/\b(?:prefer|support|owned\s+business|minority[-\s]?owned)\b/i.test(content)) {
    return "Support preference";
  }
  if (/\b(?:enjoy|like|love|hobby|hobbies|travel|concerts?|food)\b/i.test(content)) {
    return "Interest or lifestyle preference";
  }
  if (/\b(?:project manager|work|job|career|profession)\b/i.test(content)) {
    return "Work or planning preference";
  }
  return "Private preference";
}

function clauseTopic(content: string): SensitiveMemoryTopic | null {
  if (ALLERGY_STATUS.test(content)) return "health";
  // A support preference can reference a documented ownership designation without
  // turning the preference itself into an identity record.
  if (OWNERSHIP_SUPPORT_PREFERENCE.test(content)) {
    const withoutDesignation = content.replace(/\b(?:black|african(?:[-\s]american)?|hispanic|latina|latino|latinx|asian(?:[-\s]american)?|indigenous|native(?:\s+american)?)\b/gi, " ");
    const nonIdentityTopic = sensitiveMemoryTopic(withoutDesignation);
    return nonIdentityTopic;
  }
  return sensitiveMemoryTopic(content);
}

/**
 * Creates a deterministic, client-renderable choice set from an explicit member
 * memory instruction. It never stores a detail and never sends personal content
 * to an LLM merely to decide whether it is sensitive.
 */
export function buildExplicitMemoryConsentPlan(value: unknown): ExplicitMemoryConsentPlan | null {
  const parsed = parseExplicitMemberMemory(value);
  if (!parsed) return null;

  const clauses = splitMemoryClauses(parsed.content);
  const ordinary: ExplicitMemoryConsentItem[] = [];
  const sensitive: ExplicitMemoryConsentItem[] = [];

  clauses.forEach((content, index) => {
    const topic = AGE_OR_BIRTHDAY.test(content) ? "birthday_age" : clauseTopic(content);
    if (topic) {
      sensitive.push({
        id: `s-${index + 1}`,
        kind: "sensitive",
        label: sensitiveLabel(topic),
        content,
        topic,
      });
      return;
    }
    ordinary.push({
      id: `o-${index + 1}`,
      kind: "ordinary",
      label: ordinaryLabel(content),
      content,
    });
  });

  // A conservative fallback keeps the direct instruction reviewable even when
  // the member supplied one compact phrase that did not split into a clause.
  if (ordinary.length === 0 && sensitive.length === 0) {
    const topic = AGE_OR_BIRTHDAY.test(parsed.content) ? "birthday_age" : clauseTopic(parsed.content);
    (topic ? sensitive : ordinary).push(topic
      ? { id: "s-1", kind: "sensitive", label: sensitiveLabel(topic), content: parsed.content, topic }
      : { id: "o-1", kind: "ordinary", label: ordinaryLabel(parsed.content), content: parsed.content });
  }

  return { purpose: parsed.purpose, ordinary, sensitive };
}
