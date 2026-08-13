/**
 * Kinfolk Health Intelligence Retrieval
 *
 * Fetches authoritative health information from NIH MedlinePlus (free, no API key)
 * and structures it for injection into the Kinfolk system prompt. This gives Kinfolk
 * CURRENT evidence from trusted sources — not just training-data knowledge.
 *
 * Architecture (per founder spec):
 *   UNDERSTAND → CLASSIFY → DETERMINE FRESHNESS → SEARCH → EVALUATE → RETRIEVE → SYNTHESIZE
 *
 * Source hierarchy for health topics:
 *   1. NIH MedlinePlus  — consumer-focused, authoritative, free
 *   2. Model knowledge  — labeled clearly, used when NIH doesn't match
 *   3. MWM platform data — community providers, always layered on top
 */

const NIH_MEDLINEPLUS_API = "https://wsearch.nlm.nih.gov/ws/query";
const HEALTH_RETRIEVAL_TIMEOUT_MS = 6000;
const MAX_RESULTS = 3;

// Topics that are too sensitive for growth signals or Library suggestions
// (these are already handled by SENSITIVE_TOPIC_PATTERNS in kinfolk.ts)
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

/**
 * Extract the primary health subject from a conversational message.
 * Returns a clean topic string suitable for an NIH search query.
 * Examples:
 *   "Tell me about prostate cancer" → "prostate cancer"
 *   "Why do Black men get hypertension more?" → "hypertension Black men"
 *   "What is sickle cell disease?" → "sickle cell disease"
 */
export function extractHealthTopic(message: string): string {
  const msg = message.toLowerCase().trim();

  // Prioritize well-known disparity topic patterns
  const disparityPatterns: Array<[RegExp, string]> = [
    [/prostate\s+cancer/i, "prostate cancer Black men disparities"],
    [/breast\s+cancer/i, "breast cancer Black women disparities"],
    [/maternal\s+mort/i, "Black maternal mortality CDC"],
    [/heart\s+(disease|attack|failure)/i, "heart disease Black Americans"],
    [/hypertension|blood\s+pressure/i, "hypertension high blood pressure Black Americans"],
    [/diabetes|diabetic/i, "type 2 diabetes Black Americans"],
    [/sickle\s+cell/i, "sickle cell disease"],
    [/stroke/i, "stroke Black Americans risk"],
    [/colon|colorectal|rectal\s+cancer/i, "colorectal cancer disparities"],
    [/lung\s+cancer/i, "lung cancer disparities"],
    [/kidney\s+(disease|failure)/i, "kidney disease Black Americans"],
    [/covid|coronavirus/i, "COVID-19 health disparities"],
    [/mental\s+health|depression|anxiety/i, "mental health Black Americans"],
    [/lupus/i, "lupus Black women"],
    [/obesity|overweight/i, "obesity Black Americans health"],
    [/asthma/i, "asthma Black children disparities"],
    [/hiv|aids/i, "HIV AIDS Black Americans"],
  ];

  for (const [pattern, topic] of disparityPatterns) {
    if (pattern.test(msg)) return topic;
  }

  // Generic extraction: strip question words and extract the medical subject
  const cleaned = msg
    .replace(/^(tell me about|what is|what are|how do|why do|why does|explain|i want to know about|can you explain|what causes|is it true that|do black|do black (men|women)|are black (men|women))\s+/i, "")
    .replace(/\?$/g, "")
    .replace(/\b(black (men|women|people|americans|community)|minority|african american)\b/gi, "")
    .trim()
    .slice(0, 80);

  return cleaned || message.slice(0, 60);
}

/**
 * Query NIH MedlinePlus Health Topics API.
 * Returns up to 3 results with title, URL, and snippet.
 * Never throws — returns null on any error.
 */
async function fetchNIHHealthTopics(topic: string): Promise<NIHHealthResult[] | null> {
  try {
    const url = `${NIH_MEDLINEPLUS_API}?db=healthTopics&term=${encodeURIComponent(topic)}&rettype=brief`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(HEALTH_RETRIEVAL_TIMEOUT_MS),
      headers: { "User-Agent": "MappingWithMelanin/KinfolkAI (community health intelligence)" },
    });
    if (!res.ok) return null;

    const xml = await res.text();

    // Parse XML with regex — avoids adding an XML parser dependency
    const documents: NIHHealthResult[] = [];
    const docRegex = /<document[^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/document>/g;
    const titleRegex = /<content name="title">([^<]+)<\/content>/;
    const snippetRegex = /<content name="snippet">([^<]+)<\/content>/;

    let match: RegExpExecArray | null;
    while ((match = docRegex.exec(xml)) !== null && documents.length < MAX_RESULTS) {
      const url = match[1] ?? "";
      const inner = match[2] ?? "";
      const titleMatch = inner.match(titleRegex);
      const snippetMatch = inner.match(snippetRegex);
      const title = titleMatch?.[1]?.trim() ?? "";
      const snippet = snippetMatch?.[1]?.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() ?? "";
      if (title && url) {
        documents.push({ title, url, snippet, source: "NIH MedlinePlus" });
      }
    }

    return documents.length > 0 ? documents : null;
  } catch {
    return null;
  }
}

/**
 * Build a formatted evidence context string for injection into the Kinfolk system prompt.
 * Returns null if no evidence was retrieved (Kinfolk falls back to model knowledge).
 *
 * The returned string tells Kinfolk:
 *  1. What NIH says about this topic (current, authoritative)
 *  2. How to format the response (ANSWER→CONTEXT→EXPLANATION→SOURCES)
 *  3. Which sources to cite
 */
export async function buildHealthRetrievalContext(
  message: string,
  intentClass: string,
): Promise<{ contextBlock: string; sources: Array<{ title: string; url: string; source: string }> } | null> {
  if (intentClass !== "medical_health") return null;

  // Sanitize — don't retrieve for excluded sensitive topics
  const msgLower = message.toLowerCase();
  for (const excluded of EXCLUDE_FROM_RETRIEVAL) {
    if (msgLower.includes(excluded)) return null;
  }

  const topic = extractHealthTopic(message);
  const nihResults = await fetchNIHHealthTopics(topic);

  const retrievedAt = new Date().toISOString().slice(0, 10);

  const sources: Array<{ title: string; url: string; source: string }> = [];
  const evidenceLines: string[] = [];

  if (nihResults && nihResults.length > 0) {
    evidenceLines.push(`RETRIEVED FROM NIH MEDLINEPLUS (${retrievedAt}):`);
    for (const r of nihResults) {
      evidenceLines.push(`• ${r.title} — ${r.snippet.slice(0, 200)}`);
      evidenceLines.push(`  Source: ${r.url}`);
      sources.push({ title: r.title, url: r.url, source: "NIH MedlinePlus" });
    }
  } else {
    evidenceLines.push(
      `NIH RETRIEVAL: No direct MedlinePlus match for "${topic}" (${retrievedAt}). ` +
      `Answer from model knowledge — label each claim with its source type (CDC, NIH, research).`,
    );
  }

  // Always add authoritative health sources for the response
  sources.push(
    { title: "CDC Health Statistics", url: "https://www.cdc.gov/nchs/", source: "CDC" },
    { title: "NIH Health Information", url: "https://www.nih.gov/health-information", source: "NIH" },
    { title: "HHS Office of Minority Health", url: "https://minorityhealth.hhs.gov/", source: "HHS" },
  );

  const contextBlock = `
══════════════════════════════════════════════════════════
HEALTH INTELLIGENCE — CURRENT EVIDENCE LAYER
══════════════════════════════════════════════════════════
${evidenceLines.join("\n")}

REQUIRED RESPONSE STRUCTURE FOR THIS HEALTH QUESTION:
Format your answer in this exact order. This is mandatory for health topics.

1. DIRECT ANSWER — State the key finding immediately. No hedging opener.
   Example: "Prostate cancer does affect Black men at higher rates — and knowing this matters."

2. THE DISPARITY / CONTEXT — What is the documented disparity or issue? Give the actual numbers or scale when known. Label the source: "According to the CDC..." or "NIH research shows..."

3. WHY IT HAPPENS — The documented reasons (structural, systemic, access-based, historical). NEVER attribute disparities to biology or genetics as primary cause. Cite research.

4. WHAT THIS MEANS FOR THE COMMUNITY — Practical takeaways. What to watch for. When to talk to a doctor. Not fear — information that gives the community power.

5. SOURCES & NEXT STEPS — Name the authoritative source(s) supporting each major claim. Recommend verified resources (CDC, NIH, MWM community providers when available). The platform will make source URLs clickable.

SHOW MORE / SHOW LESS DEPTH RULES:
• BRIEF (show less): Steps 1 + 2 only, 3-4 sentences total
• STANDARD (default): All 5 steps, 2-3 sentences each
• DEEP (show more): All 5 steps fully developed — statistics, preventability data, systemic analysis, MWM provider suggestions

SOURCE ATTRIBUTION RULES:
• Every statistical claim must name its source: "The CDC reports...", "NIH data shows..."
• Never fabricate statistics. If you don't have the number, say: "CDC data documents a significant disparity — exact current rates are at cdc.gov/nchs"
• Training-data knowledge is acceptable — just label it: "Based on published CDC/NIH data..."
══════════════════════════════════════════════════════════`;

  return { contextBlock, sources };
}
