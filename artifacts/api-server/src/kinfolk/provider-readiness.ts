import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";
import { canonicalizeContextualUrl } from "./contextual-url";
import { inspectVoiceAudio } from "./voice/audioInspection";
import { buildKinfolkChatCompletionRequest } from "./staff-demo-policy";
import { createKinfolkEmbedding } from "./embedding-provider";
import { kinfolkEmbeddingConfig, kinfolkModel } from "./model-config";
import { kinfolkTavilyApiKey } from "./provider-config";

export type ProviderReadinessCategory = "ok" | "missing_configuration" | "connection_failure";
export type ProviderReadinessCapability =
  | "staff_demo_chat"
  | "fallback_chat"
  | "web_search"
  | "tavily_fallback"
  | "library_research"
  | "transcription"
  | "tts"
  | "embedding";
export type ProviderReadinessRow = Readonly<{
  capability: ProviderReadinessCapability;
  status: "PASS" | "FAIL";
  category: ProviderReadinessCategory;
}>;

type ReadinessDependencies = Readonly<{
  chatCreate: (body: unknown) => Promise<unknown>;
  responsesCreate: (body: unknown) => Promise<unknown>;
  transcriptionCreate: (body: unknown) => Promise<unknown>;
  embeddingsCreate?: (body: unknown) => Promise<unknown>;
  tavilySearch: (url: string, init: RequestInit) => Promise<Response>;
  tavilyTimeoutMilliseconds: number;
  textToSpeech: typeof textToSpeech;
  readFixture: (path: string) => Promise<Buffer>;
}>;

export const KINFOLK_READINESS_FIXTURE_RELATIVE_PATH = "assets/readiness/kinfolk-readiness-voice.wav";
const fixtureCandidates = [
  // Source execution (Vitest/tsx): src/kinfolk -> src/assets/readiness.
  fileURLToPath(new URL(`../${KINFOLK_READINESS_FIXTURE_RELATIVE_PATH}`, import.meta.url)),
  // Bundled execution: dist/index.mjs -> dist/assets/readiness.
  fileURLToPath(new URL(KINFOLK_READINESS_FIXTURE_RELATIVE_PATH, import.meta.url)),
];
// Real speech-to-text providers can omit a leading modifier while still
// transcribing the fixture correctly. These three distinctive terms bind the
// result to the checked-in readiness fixture without requiring a verbatim
// transcript or accepting an arbitrary non-empty response.
const REQUIRED_TRANSCRIPT_TERMS = ["readiness", "voice", "transcription"] as const;
const AUTHORITATIVE_WEB_HOSTS = new Set([
  "nist.gov",
  "time.gov",
  "usa.gov",
  "congress.gov",
  "loc.gov",
  "archives.gov",
]);

function timeout<T>(work: Promise<T>, milliseconds = 30_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("READINESS_TIMEOUT")), milliseconds);
    void work.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

function normalizeMeaning(value: string): string[] {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function expectedTranscriptMeaning(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const terms = new Set(normalizeMeaning(value));
  return REQUIRED_TRANSCRIPT_TERMS.every((term) => terms.has(term));
}

function parseStructuredChat(value: unknown): boolean {
  const text = (value as { choices?: Array<{ message?: { content?: unknown } }> })
    ?.choices?.[0]?.message?.content;
  if (typeof text !== "string") return false;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return parsed.ok === true && Object.keys(parsed).length === 1;
  } catch {
    return false;
  }
}

type CitationEvidence = Readonly<{ url: string; text: string }>;

function responseText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const outputText = typeof record.output_text === "string" ? record.output_text : "";
  const output = Array.isArray(record.output) ? record.output : [];
  const parts = output.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) return [];
    return content.flatMap((part) => part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string"
      ? [String((part as Record<string, unknown>).text)]
      : []);
  });
  return [outputText, ...parts].filter(Boolean).join(" ");
}

function citationEvidence(value: unknown, answerText: string): CitationEvidence[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((entry) => citationEvidence(entry, answerText));
  const row = value as Record<string, unknown>;
  const currentText = typeof row.text === "string" ? row.text : answerText;
  const own = row.type === "url_citation" && typeof row.url === "string"
    ? [{ url: row.url, text: currentText }]
    : [];
  return [...own, ...Object.values(row).flatMap((entry) => citationEvidence(entry, currentText))];
}

function isAuthoritativeWebCitation(value: unknown): boolean {
  const answer = responseText(value);
  const meaning = normalizeMeaning(answer);
  const relevant = meaning.includes("coordinated") && meaning.includes("universal") && meaning.includes("time");
  if (!relevant) return false;
  return citationEvidence(value, answer).some((citation) => {
    const safeUrl = canonicalizeContextualUrl(citation.url);
    if (!safeUrl) return false;
    const hostname = new URL(safeUrl).hostname.replace(/^www\./, "").toLowerCase();
    const authoritative = AUTHORITATIVE_WEB_HOSTS.has(hostname) || hostname.endsWith(".gov");
    const support = normalizeMeaning(citation.text);
    return authoritative && support.includes("coordinated") && support.includes("universal") && support.includes("time");
  });
}

function isAuthoritativeTavilyResult(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const results = (value as Record<string, unknown>).results;
  if (!Array.isArray(results) || results.length === 0) return false;
  return results.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const result = entry as Record<string, unknown>;
    if (typeof result.url !== "string") return false;
    const safeUrl = canonicalizeContextualUrl(result.url);
    if (!safeUrl) return false;
    const hostname = new URL(safeUrl).hostname.replace(/^www\./, "").toLowerCase();
    if (hostname !== "nist.gov" && !hostname.endsWith(".nist.gov")) return false;
    const evidence = [result.title, result.content]
      .filter((part): part is string => typeof part === "string")
      .join(" ");
    const meaning = normalizeMeaning(evidence);
    return meaning.includes("coordinated") && meaning.includes("universal") && meaning.includes("time");
  });
}

async function tavilyProbe(
  dependencies: ReadinessDependencies,
  apiKey: string,
): Promise<boolean> {
  const response = await timeout(dependencies.tavilySearch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: "Coordinated Universal Time NIST definition",
      topic: "general",
      search_depth: "basic",
      max_results: 1,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
      include_domains: ["nist.gov"],
      safe_search: true,
    }),
    signal: AbortSignal.timeout(dependencies.tavilyTimeoutMilliseconds),
  }), dependencies.tavilyTimeoutMilliseconds);
  if (!response.ok) return false;
  return isAuthoritativeTavilyResult(
    await timeout(response.json(), dependencies.tavilyTimeoutMilliseconds),
  );
}

async function chatProbe(
  dependencies: ReadinessDependencies,
  model: string,
  responseFormat: "json_object" | "json_schema" = "json_object",
): Promise<boolean> {
  const request = buildKinfolkChatCompletionRequest({
    model,
    maxOutputTokens: 1024,
    messages: [{ role: "user", content: "Return only the JSON object {\"ok\":true}." }],
    temperature: 0,
  });
  const body = responseFormat === "json_schema"
    ? buildKinfolkChatCompletionRequest({
        model,
        maxOutputTokens: 1024,
        messages: [{ role: "user", content: "Return only the JSON object {\"ok\":true}." }],
        temperature: 0,
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "kinfolk_readiness",
            strict: true,
            schema: {
              type: "object",
              properties: { ok: { type: "boolean", const: true } },
              required: ["ok"],
              additionalProperties: false,
            },
          },
        },
      })
    : request;
  return parseStructuredChat(await timeout(dependencies.chatCreate(body)));
}

export function summarizeKinfolkProviderReadiness(
  capabilities: readonly ProviderReadinessRow[],
): { ok: true } | { ok: false; reason: Exclude<ProviderReadinessCategory, "ok"> } {
  const failed = capabilities.find((capability) => capability.status === "FAIL");
  return failed
    ? { ok: false, reason: failed.category === "ok" ? "connection_failure" : failed.category }
    : { ok: true };
}

export function kinfolkProviderReadinessHttpResult(
  capabilities: readonly ProviderReadinessRow[],
): Readonly<{ status: 200 | 503; body: ReturnType<typeof summarizeKinfolkProviderReadiness> }> {
  const body = summarizeKinfolkProviderReadiness(capabilities);
  return { status: body.ok ? 200 : 503, body };
}

function requiredCapabilities(input: {
  tavilyConfigured: boolean;
  embeddingConfigured: boolean;
}): ProviderReadinessCapability[] {
  return [
    "staff_demo_chat",
    "fallback_chat",
    "web_search",
    ...(input.tavilyConfigured ? ["tavily_fallback" as const] : []),
    "library_research",
    "transcription",
    "tts",
    ...(input.embeddingConfigured ? ["embedding" as const] : []),
  ];
}

/**
 * Executes small, real provider calls sequentially and deliberately returns no
 * provider body, model identifier, URL, credential, audio, transcript, prompt,
 * or raw error. All failures collapse into stable server-owned categories.
 */
export async function probeKinfolkProviderReadiness(
  environment: NodeJS.ProcessEnv = process.env,
  injected?: Partial<ReadinessDependencies>,
): Promise<ProviderReadinessRow[]> {
  const dependencies: ReadinessDependencies = {
    // Preserve SDK receivers. Capturing these methods directly loses client context.
    chatCreate: (body) => openai.chat.completions.create(body as never),
    responsesCreate: (body) => openai.responses.create(body as never),
    transcriptionCreate: (body) => openai.audio.transcriptions.create(body as never),
    tavilySearch: (url, init) => fetch(url, init),
    tavilyTimeoutMilliseconds: 6_000,
    textToSpeech,
    readFixture: readFile,
    ...injected,
  };
  const embeddingConfig = kinfolkEmbeddingConfig(environment);
  const tavilyApiKey = kinfolkTavilyApiKey(environment);
  const capabilities = requiredCapabilities({
    tavilyConfigured: Boolean(tavilyApiKey),
    embeddingConfigured: Boolean(embeddingConfig),
  });
  const openAiConfigured = Boolean(
    environment.AI_INTEGRATIONS_OPENAI_API_KEY?.trim()
    && environment.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim(),
  );
  const fail = (capability: ProviderReadinessCapability, category: ProviderReadinessCategory): ProviderReadinessRow =>
    ({ capability, status: "FAIL", category });
  const run = async (
    capability: ProviderReadinessCapability,
    work: () => Promise<boolean>,
  ): Promise<ProviderReadinessRow> => {
    try {
      return await work()
        ? { capability, status: "PASS", category: "ok" }
        : fail(capability, "connection_failure");
    } catch {
      return fail(capability, "connection_failure");
    }
  };
  const wav = async () => {
    let fixture: Buffer | null = null;
    for (const candidate of fixtureCandidates) {
      try {
        fixture = await dependencies.readFixture(candidate);
        break;
      } catch {
        // Try the source or packaged location; the failure is classified by run().
      }
    }
    if (!fixture) throw new Error("READINESS_FIXTURE_UNAVAILABLE");
    return new File(
      [new Uint8Array(fixture)],
      "kinfolk-readiness-voice.wav",
      { type: "audio/wav" },
    );
  };

  // Sequential by design: provider-wide burst limits otherwise create false negatives.
  const rows: ProviderReadinessRow[] = [];
  const runOpenAi = (
    capability: ProviderReadinessCapability,
    work: () => Promise<boolean>,
  ) => openAiConfigured
    ? run(capability, work)
    : Promise.resolve(fail(capability, "missing_configuration"));
  rows.push(await runOpenAi("staff_demo_chat", () =>
    chatProbe(dependencies, kinfolkModel("staffDemo", environment))));
  rows.push(await runOpenAi("fallback_chat", () =>
    chatProbe(dependencies, kinfolkModel("fallback", environment))));
  rows.push(await runOpenAi("web_search", async () => {
    const response = await timeout(dependencies.responsesCreate({
      model: kinfolkModel("webSearch", environment),
      tools: [{ type: "web_search" }],
      input: "Use web search to define Coordinated Universal Time. Cite an authoritative government source inline.",
      max_output_tokens: 4_000,
      reasoning: { effort: "low" },
    }));
    return isAuthoritativeWebCitation(response);
  }));
  if (tavilyApiKey) {
    rows.push(await run("tavily_fallback", () => tavilyProbe(dependencies, tavilyApiKey)));
  }
  rows.push(await runOpenAi("library_research", () =>
    chatProbe(dependencies, kinfolkModel("libraryResearch", environment), "json_schema")));
  rows.push(await runOpenAi("transcription", async () => {
    const response = await timeout(dependencies.transcriptionCreate({
      file: await wav(),
      model: kinfolkModel("transcription", environment),
    }));
    return expectedTranscriptMeaning((response as { text?: unknown }).text);
  }));
  rows.push(await runOpenAi("tts", async () => {
    const audio = await timeout(dependencies.textToSpeech("Kinfolk readiness check.", "alloy", "wav"));
    if (!Buffer.isBuffer(audio)) return false;
    await inspectVoiceAudio(audio, "audio/wav", 30_000);
    return true;
  }));
  if (embeddingConfig) {
    rows.push(await runOpenAi("embedding", async () => Boolean(await timeout(
      createKinfolkEmbedding("Kinfolk readiness", environment, dependencies.embeddingsCreate),
    ))));
  }
  return rows;
}
