/**
 * Kinfolk Health Intelligence Retrieval
 *
 * Retrieves condition-first health information from NIH MedlinePlus. A population
 * qualifier is supplemental only when directly stated in the current user turn.
 * Group-level evidence never diagnoses or predicts an individual outcome.
 */

import { permittedIdentityContext } from "./permitted-identity-context";

const NIH_MEDLINEPLUS_API = "https://wsearch.nlm.nih.gov/ws/query";
const HEALTH_RETRIEVAL_TIMEOUT_MS = 6000;
const MAX_RESULTS = 3;

const EXCLUDE_FROM_RETRIEVAL = new Set([
  "suicide", "self-harm", "overdose", "abortion",
  "divorce", "bankruptcy", "immigration status",
]);

interface NIHHealthResult {
  title: string;
  url: string;
  snippet: string;
  source: "NIH MedlinePlus";
}

export interface HealthRetrievalResult {
  topic: string;
  retrieved: NIHHealthResult[];
  retrievedAt: string;
  error?: string;
}

const CONDITION_PATTERNS: Array<[RegExp, string]> = [
  [/prostate\s+cancer/i, "prostate cancer"],
  [/breast\s+cancer/i, "breast cancer"],
  [/maternal\s+mort/i, "maternal mortality"],
  [/heart\s+(disease|attack|failure)/i, "heart disease"],
  [/hypertension|blood\s+pressure/i, "hypertension high blood pressure"],
  [/diabetes|diabetic/i, "type 2 diabetes"],
  [/sickle\s+cell/i, "sickle cell disease"],
  [/stroke/i, "stroke"],
  [/colon|colorectal|rectal\s+cancer/i, "colorectal cancer"],
  [/lung\s+cancer/i, "lung cancer"],
  [/kidney\s+(disease|failure)/i, "kidney disease"],
  [/covid|coronavirus/i, "COVID-19"],
  [/mental\s+health|depression|anxiety/i, "mental health"],
  [/lupus/i, "lupus"],
  [/obesity|overweight/i, "obesity"],
  [/asthma/i, "asthma"],
  [/hiv|aids/i, "HIV AIDS"],
];

/** Extract a neutral condition-first NIH query from the current turn. */
export function extractHealthTopic(message: string): string {
  const msg = message.trim();
  const condition = CONDITION_PATTERNS.find(([pattern]) => pattern.test(msg))?.[1];
  const identity = permittedIdentityContext(msg);
  const population = identity.demographicQualifier;

  if (condition) return [condition, population].filter(Boolean).join(" ");

  const cleaned = msg
    .toLowerCase()
    .replace(/^(tell me about|what is|what are|how do|why do|why does|explain|i want to know about|can you explain|what causes|is it true that)\s+/i, "")
    .replace(/\b(?:i am|i'm|i’m|i identify as|as)\s+(?:a|an)?\s*/i, "")
    .replace(/\?$/g, "")
    .trim()
    .slice(0, 80);

  return [cleaned || message.slice(0, 60), population].filter(Boolean).join(" ");
}

/** Query NIH MedlinePlus. Never throws; null means authoritative retrieval failed. */
async function fetchNIHHealthTopics(topic: string): Promise<NIHHealthResult[] | null> {
  try {
    const url = `${NIH_MEDLINEPLUS_API}?db=healthTopics&term=${encodeURIComponent(topic)}&rettype=brief`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(HEALTH_RETRIEVAL_TIMEOUT_MS),
      headers: { "User-Agent": "MappingWithMelanin/KinfolkAI (health evidence retrieval)" },
    });
    if (!res.ok) return null;

    const xml = await res.text();
    const documents: NIHHealthResult[] = [];
    const docRegex = /<document[^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/document>/g;
    const titleRegex = /<content name="title">([^<]+)<\/content>/;
    const snippetRegex = /<content name="snippet">([^<]+)<\/content>/;

    let match: RegExpExecArray | null;
    while ((match = docRegex.exec(xml)) !== null && documents.length < MAX_RESULTS) {
      const url = match[1] ?? "";
      const inner = match[2] ?? "";
      const title = inner.match(titleRegex)?.[1]?.trim() ?? "";
      const snippet = inner.match(snippetRegex)?.[1]
        ?.replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim() ?? "";
      if (title && url) documents.push({ title, url, snippet, source: "NIH MedlinePlus" });
    }

    return documents.length > 0 ? documents : null;
  } catch {
    return null;
  }
}

/** Build authoritative, neutral health evidence instructions for model synthesis. */
export async function buildHealthRetrievalContext(
  message: string,
  intentClass: string,
): Promise<{ contextBlock: string; sources: Array<{ title: string; url: string; source: string }> } | null> {
  if (intentClass !== "medical_health") return null;

  const msgLower = message.toLowerCase();
  for (const excluded of EXCLUDE_FROM_RETRIEVAL) {
    if (msgLower.includes(excluded)) return null;
  }

  const identity = permittedIdentityContext(message);
  const population = identity.demographicQualifier;
  const topic = extractHealthTopic(message);
  const nihResults = await fetchNIHHealthTopics(topic);
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const sources: Array<{ title: string; url: string; source: string }> = [];
  const evidenceLines: string[] = [];

  if (nihResults?.length) {
    evidenceLines.push(`RETRIEVED FROM NIH MEDLINEPLUS (${retrievedAt}):`);
    for (const result of nihResults) {
      evidenceLines.push(`• ${result.title} — ${result.snippet.slice(0, 200)}`);
      evidenceLines.push(`  Source: ${result.url}`);
      sources.push({ title: result.title, url: result.url, source: result.source });
    }
  } else {
    evidenceLines.push(
      `AUTHORITATIVE RETRIEVAL INCOMPLETE: No direct MedlinePlus match for "${topic}" (${retrievedAt}). ` +
      "Do not fill medical evidence gaps with unsupported model recall. Limit the answer to safe general guidance and direct the member to the official resources below.",
    );
  }

  sources.push(
    { title: "CDC Health Topics", url: "https://www.cdc.gov/health-topics.html", source: "CDC" },
    { title: "NIH Health Information", url: "https://www.nih.gov/health-information", source: "NIH" },
    { title: "FDA Consumer Health Information", url: "https://www.fda.gov/consumers/consumer-updates", source: "FDA" },
  );

  const populationInstruction = population
    ? `\nEXPLICIT POPULATION CONTEXT: The current turn names "${population}". Population evidence may be included only as group-level context. It is non-diagnostic, does not determine this member's risk or condition, and must not replace condition-first clinical guidance.\n`
    : "";

  const contextBlock = `
══════════════════════════════════════════════════════════
HEALTH INTELLIGENCE — AUTHORITATIVE EVIDENCE LAYER
══════════════════════════════════════════════════════════
${evidenceLines.join("\n")}
${populationInstruction}
REQUIRED RESPONSE STRUCTURE:
1. DIRECT ANSWER — Give the condition-first answer supported by the retrieved authority.
2. CLINICAL CONTEXT — Explain symptoms, risk, screening, or treatment at a general level. Never diagnose the member.
3. PRACTICAL NEXT STEPS — Explain when to contact a licensed clinician and when urgent care is appropriate.
4. SOURCES — Name the authoritative source supporting each material medical or statistical claim.
${population ? "5. POPULATION CONTEXT, IF MATERIAL — Frame explicitly requested population research as group-level, non-diagnostic evidence; do not attribute a group difference to biology without strong direct evidence." : ""}

SOURCE RULES:
• Use public-health agencies, peer-reviewed research, and recognized clinical bodies.
• Never use reviews, vibe tags, check-ins, community anecdotes, or business popularity as medical proof.
• Never fabricate a statistic. If authoritative retrieval did not support it, omit it.
• General health information is not a substitute for care from a licensed clinician.
══════════════════════════════════════════════════════════`;

  return { contextBlock, sources };
}
