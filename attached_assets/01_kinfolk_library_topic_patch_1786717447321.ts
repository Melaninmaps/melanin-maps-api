/*
 * SURGICAL PATCH 01 — KinfolkAI Library-topic 500
 * Target: map/routes/kinfolk.ts
 *
 * Verified failing request:
 * POST /api/kinfolk/chat
 * {"message":"What can I learn from the Divine Nine library topic?"}
 * Live result: HTTP 500 { code:"KINFOLK_ERROR", error:"Kinfolk is having trouble..." }
 *
 * Apply this patch in three parts. Do not paste this file as a second route.
 */

import { sql } from "drizzle-orm";

type LibraryGrounding = {
  id: string;
  topicName: string;
  category: string | null;
  description: string | null;
  keywords: string[];
  trustedSources: Array<{ title: string; url: string }>;
};

function normalizeTopicText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLibraryTopicQuestion(message: string): boolean {
  const text = normalizeTopicText(message);
  return /\b(library|learn|topic|history|what can i learn|tell me about)\b/.test(text)
    || /\b(divine nine|alpha kappa alpha|alpha phi alpha|delta sigma theta|omega psi phi)\b/.test(text);
}

/**
 * Use only columns that exist in the supplied knowledgeTopicsTable definition.
 * JSONB trusted_sources is normalized defensively so bad/empty data cannot throw.
 */
async function loadLibraryGrounding(pool: any, message: string): Promise<LibraryGrounding | null> {
  if (!isLibraryTopicQuestion(message)) return null;

  const normalized = normalizeTopicText(message);
  const tokens = normalized.split(" ").filter((t) => t.length >= 4);
  const searchTerms = Array.from(new Set([
    normalized,
    ...tokens,
    ...(normalized.includes("divine nine") ? ["divine nine", "divine"] : []),
  ])).slice(0, 12);

  try {
    const result = await pool.query<{
      id: string;
      topic_name: string;
      category: string | null;
      description: string | null;
      keywords: unknown;
      trusted_sources: unknown;
    }>(
      `SELECT id, topic_name, category, description, keywords, trusted_sources
       FROM knowledge_topics
       WHERE enabled = true
         AND (
           lower(topic_name) LIKE ANY($1::text[])
           OR EXISTS (
             SELECT 1 FROM unnest(COALESCE(keywords, ARRAY[]::text[])) AS kw
             WHERE lower(kw) LIKE ANY($1::text[])
           )
           OR lower(COALESCE(category, '')) LIKE ANY($1::text[])
         )
       ORDER BY
         CASE WHEN lower(topic_name) LIKE '%divine nine%' THEN 0 ELSE 1 END,
         length(topic_name)
       LIMIT 1`,
      [searchTerms.map((term) => `%${term}%`)],
    );

    const row = result.rows[0];
    if (!row) return null;

    const sources = Array.isArray(row.trusted_sources) ? row.trusted_sources : [];
    const trustedSources = sources
      .map((s: any) => ({ title: String(s?.title ?? s?.name ?? "Source"), url: String(s?.url ?? "") }))
      .filter((s) => /^https?:\/\//i.test(s.url));

    return {
      id: row.id,
      topicName: row.topic_name,
      category: row.category,
      description: row.description,
      keywords: Array.isArray(row.keywords) ? row.keywords.map(String) : [],
      trustedSources,
    };
  } catch (err) {
    // Library grounding is enrichment. It must never convert a valid chat into HTTP 500.
    console.warn("[kinfolk-library-grounding-failed]", {
      code: (err as any)?.code ?? "unknown",
      message: err instanceof Error ? err.message.slice(0, 240) : String(err).slice(0, 240),
    });
    return null;
  }
}

function buildLibraryGroundingBlock(topic: LibraryGrounding | null): string {
  if (!topic) return "";
  const sourceLines = topic.trustedSources.length
    ? topic.trustedSources.map((s) => `- ${s.title}: ${s.url}`).join("\n")
    : "No verified source URL is attached to this topic; do not invent one.";

  return [
    "LIBRARY_TOPIC_GROUNDING — SERVER CONTROLLED",
    `Topic: ${topic.topicName}`,
    `Category: ${topic.category ?? "general"}`,
    `Description: ${topic.description ?? "No description is available in the Library."}`,
    `Keywords: ${topic.keywords.join(", ") || "none"}`,
    "Sources:",
    sourceLines,
    "Rules: Use the topic name exactly. Distinguish database facts from general background knowledge. Do not invent source URLs, dates, founders, organizations, or quotations.",
  ].join("\n");
}

function buildLibraryFallbackReply(topic: LibraryGrounding | null): string {
  if (!topic) {
    return "I can help you explore that Library topic, but I could not load its Library card right now. Please try again, or open the Library and search for the topic directly.";
  }
  return `The Library topic **${topic.topicName}** is a place to learn through the topic description and related community knowledge. ${topic.description ?? "The topic is currently available in the Library for further exploration."} Open the Library card to continue learning and follow it for future updates.`;
}

/*
 * INSERTION A — immediately after message validation, before quota/provider work:
 */
const libraryTopic = await loadLibraryGrounding(pool, message);
const libraryGroundingBlock = buildLibraryGroundingBlock(libraryTopic);

/*
 * INSERTION B — append to systemPrompt after tourSiteBlock/resolvedContextConstraint:
 */
const systemPromptWithLibrary = systemPrompt + (libraryGroundingBlock ? `\n\n${libraryGroundingBlock}` : "");

/*
 * Replace the aiMessages construction to use systemPromptWithLibrary:
 */
const aiMessages = [
  { role: "system" as const, content: systemPromptWithLibrary },
  ...historyMessages,
  { role: "user" as const, content: `${message}${vibes.length ? `\n\n[My vibes for this trip: ${vibes.join(", ")}]` : ""}` },
];

/*
 * INSERTION C — replace the provider call block with this guarded form.
 * If the exact Library question hits a transient provider failure, return a
 * useful deterministic 200 response instead of the generic 500.
 */
let completion: any;
try {
  completion = await kinfolkQueue.run(
    req.user?.id ?? "anon",
    estimatedTotal,
    () => { chatStage = "provider_call"; return callOpenAIWithRetry(aiMessages, AbortSignal.timeout(25000), resolverTemperature); },
  );
} catch (providerError) {
  const status = (providerError as any)?.status ?? (providerError as any)?.statusCode;
  const retryable = [429, 500, 502, 503, 504].includes(Number(status));
  if (libraryTopic && retryable) {
    const fallbackReply = buildLibraryFallbackReply(libraryTopic);
    const fallbackSources = libraryTopic.trustedSources.map((s) => ({ id: s.url, label: "library_topic", title: s.title, url: s.url }));
    res.status(200).json({
      sessionId,
      reply: fallbackReply,
      recommendations: null,
      followUpSuggestions: ["Open this topic in the Library", "Follow this topic for updates"],
      smartPromotion: null,
      taskAction: null,
      libraryAction: { type: "open_topic", topicId: libraryTopic.id, topicName: libraryTopic.topicName },
      intentClass,
      sources: fallbackSources,
      resolution: { state: "resolved", preferencesUsed: [] },
      depth: "standard",
      canShowMore: false,
      canShowLess: false,
      answerPlanId: null,
      degraded: true,
      degradedReason: "provider_transient_error_library_fallback",
    });
    return;
  }
  throw providerError;
}

/*
 * INSERTION D — replace the existing Library matching call at lines 3451–3453:
 */
let existingLibraryMatch: Record<string, unknown> | null = null;
try {
  const libraryActionCategories = INTENT_TO_CATEGORY_MAP[intentClass] ?? null;
  existingLibraryMatch = libraryActionCategories
    ? await findMatchingPublishedLibraryNode(libraryActionCategories, destination ?? null, message)
    : null;
} catch (libraryError) {
  console.warn("[kinfolk-library-action-failed]", {
    code: (libraryError as any)?.code ?? "unknown",
    message: libraryError instanceof Error ? libraryError.message.slice(0, 240) : String(libraryError).slice(0, 240),
  });
  existingLibraryMatch = libraryTopic
    ? { type: "open_topic", topicId: libraryTopic.id, topicName: libraryTopic.topicName }
    : null;
}

/*
 * INSERTION E — add library grounding to the final response sources:
 */
const librarySources = libraryTopic
  ? libraryTopic.trustedSources.map((s) => ({ id: s.url, label: "library_topic", title: s.title, url: s.url }))
  : [];
// In res.json sources:
sources: [
  ...contextResolution.sources.map((s) => ({ id: s.url, label: s.tier, title: s.title, url: s.url })),
  ...healthRetrievalSources.map((s) => ({ id: s.url, label: s.source, title: s.title, url: s.url })),
  ...librarySources,
],
