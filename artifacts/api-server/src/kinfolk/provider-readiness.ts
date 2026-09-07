import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";
import { buildKinfolkChatCompletionRequest } from "./staff-demo-policy";
import { kinfolkModel } from "./model-config";

export type ProviderReadinessCategory = "ok" | "missing_configuration" | "connection_failure";
export type ProviderReadinessRow = Readonly<{
  capability: "staff_demo_chat" | "fallback_chat" | "web_search" | "transcription" | "tts";
  status: "PASS" | "FAIL";
  category: ProviderReadinessCategory;
}>;

type ReadinessDependencies = Readonly<{
  chatCreate: (body: unknown) => Promise<unknown>;
  responsesCreate: (body: unknown) => Promise<unknown>;
  transcriptionCreate: (body: unknown) => Promise<unknown>;
  textToSpeech: typeof textToSpeech;
  readFixture: (path: string) => Promise<Buffer>;
}>;

const fixturePath = fileURLToPath(new URL("./__tests__/fixtures/voice.wav", import.meta.url));
function timeout<T>(work: Promise<T>, milliseconds = 30_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("READINESS_TIMEOUT")), milliseconds);
    void work.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

function hasSafeUrlCitation(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasSafeUrlCitation);
  const row = value as Record<string, unknown>;
  if (row.type === "url_citation" && typeof row.url === "string") {
    try {
      return new URL(row.url).protocol === "https:";
    } catch {
      return false;
    }
  }
  return Object.values(row).some(hasSafeUrlCitation);
}

async function chatProbe(
  dependencies: ReadinessDependencies,
  model: string,
): Promise<boolean> {
  const completion = await timeout(dependencies.chatCreate(
    buildKinfolkChatCompletionRequest({
      model,
      // GPT-5 can consume part of this budget internally before returning text.
      maxOutputTokens: 1024,
      messages: [{ role: "user", content: "Return only the JSON object {\"ok\":true}." }],
      temperature: 0,
    }),
  ));
  return Boolean((completion as { choices?: Array<{ message?: { content?: string | null } }> })
    .choices?.[0]?.message?.content?.trim());
}

/**
 * Executes small, real provider calls and deliberately returns no provider
 * body, model identifier, URL, credential, audio, transcript, or prompt.
 */
export async function probeKinfolkProviderReadiness(
  environment: NodeJS.ProcessEnv = process.env,
  injected?: Partial<ReadinessDependencies>,
): Promise<ProviderReadinessRow[]> {
  const dependencies: ReadinessDependencies = {
    // Keep the SDK method receiver intact. Capturing these methods directly
    // loses their internal client context and makes healthy providers look
    // unavailable.
    chatCreate: (body) => openai.chat.completions.create(body as never),
    responsesCreate: (body) => openai.responses.create(body as never),
    transcriptionCreate: (body) => openai.audio.transcriptions.create(body as never),
    textToSpeech,
    readFixture: readFile,
    ...injected,
  };
  const configured = Boolean(
    environment.AI_INTEGRATIONS_OPENAI_API_KEY?.trim()
    && environment.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim(),
  );
  const fail = (capability: ProviderReadinessRow["capability"], category: ProviderReadinessCategory): ProviderReadinessRow =>
    ({ capability, status: "FAIL", category });
  if (!configured) {
    return ["staff_demo_chat", "fallback_chat", "web_search", "transcription", "tts"]
      .map((capability) => fail(capability as ProviderReadinessRow["capability"], "missing_configuration"));
  }
  const run = async (
    capability: ProviderReadinessRow["capability"],
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
  const wav = async () => new File(
    [new Uint8Array(await dependencies.readFixture(fixturePath))],
    "voice.wav",
    { type: "audio/wav" },
  );
  // Run sequentially. The managed provider applies shared burst limits, and
  // parallel probes can manufacture false negatives in an otherwise healthy
  // development integration.
  const rows: ProviderReadinessRow[] = [];
  rows.push(await run("staff_demo_chat", () =>
    chatProbe(dependencies, kinfolkModel("staffDemo", environment))));
  rows.push(await run("fallback_chat", () =>
    chatProbe(dependencies, kinfolkModel("fallback", environment))));
  rows.push(await run("web_search", async () => {
      const response = await timeout(dependencies.responsesCreate({
        model: kinfolkModel("webSearch", environment),
        tools: [{ type: "web_search" }],
        input: "Use web search to answer this time-sensitive question: what is today's date in New York City? Include at least one inline citation to a current authoritative web source.",
        max_output_tokens: 4_000,
        reasoning: { effort: "low" },
      } as never));
      return hasSafeUrlCitation(response);
    }));
  rows.push(await run("transcription", async () => {
      const response = await timeout(dependencies.transcriptionCreate({
        file: await wav(),
        model: kinfolkModel("transcription", environment),
      }));
      return Boolean((response as { text?: string }).text?.trim());
    }));
  rows.push(await run("tts", async () => {
      const audio = await timeout(dependencies.textToSpeech("Kinfolk readiness check.", "alloy", "wav"));
      return Buffer.isBuffer(audio) && audio.length > 0;
    }));
  return rows;
}