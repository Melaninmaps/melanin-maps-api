import OpenAI, { toFile } from "openai";
import type { SpeechCreateParams } from "openai/resources/audio/speech";
import { Buffer, File as NodeFile } from "node:buffer";
import { spawn } from "child_process";
import { writeFile, unlink, readFile } from "fs/promises";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { join } from "path";
import {
  resolveOpenAIConfiguration,
  STANDARD_OPENAI_BASE_URL,
} from "../client";

export function resolveAudioOpenAIConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const standardApiKey = environment.OPENAI_API_KEY?.trim();
  // Voice requires audio endpoints that a chat-compatible integration proxy
  // may not implement. When a standard OpenAI credential is available, use the
  // documented endpoint for audio only; ordinary Kinfolk chat keeps its own
  // existing provider selection.
  if (standardApiKey) {
    return { apiKey: standardApiKey, baseURL: STANDARD_OPENAI_BASE_URL };
  }
  const configuration = resolveOpenAIConfiguration(environment);
  if (!configuration) {
    throw new Error(
      "OpenAI configuration is required. Set AI_INTEGRATIONS_OPENAI_API_KEY with AI_INTEGRATIONS_OPENAI_BASE_URL, or OPENAI_API_KEY.",
    );
  }
  return configuration;
}

/**
 * Node 18 exposes Blob but not a global File constructor. OpenAI's SDK checks
 * for that global before it accepts an upload, so install Node's compatible
 * implementation only on runtimes that do not already provide one.
 */
export function ensureAudioFileSupport(): void {
  if (typeof globalThis.File !== "undefined") return;
  Object.defineProperty(globalThis, "File", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: NodeFile,
  });
}

export async function createAudioUploadFile(
  audio: Buffer | Uint8Array,
  filename: string,
  mimeType: string,
) {
  ensureAudioFileSupport();
  return toFile(audio, filename, { type: mimeType });
}

function getOpenAI(): OpenAI {
  ensureAudioFileSupport();
  const configuration = resolveAudioOpenAIConfiguration();
  return new OpenAI({
    apiKey: configuration.apiKey,
    baseURL: configuration.baseURL,
    maxRetries: 0,
  });
}

export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as any)[prop];
  },
});

// Named separately from the general chat client so voice routes cannot
// accidentally inherit a text-only provider configuration.
export const audioOpenai = openai;

export type AudioFormat = "wav" | "mp3" | "webm" | "mp4" | "ogg" | "unknown";

export function detectAudioFormat(buffer: Buffer): AudioFormat {
  if (buffer.length < 12) return "unknown";
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return "wav";
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return "webm";
  if (
    (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xfa || buffer[1] === 0xf3)) ||
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33)
  ) return "mp3";
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) return "mp4";
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) return "ogg";
  return "unknown";
}

export async function convertToWav(audioBuffer: Buffer): Promise<Buffer> {
  const inputPath = join(tmpdir(), `input-${randomUUID()}`);
  const outputPath = join(tmpdir(), `output-${randomUUID()}.wav`);
  try {
    await writeFile(inputPath, audioBuffer);
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", ["-i", inputPath, "-vn", "-f", "wav", "-ar", "16000", "-ac", "1", "-acodec", "pcm_s16le", "-y", outputPath]);
      ffmpeg.stderr.on("data", () => {});
      ffmpeg.on("close", (code) => { if (code === 0) resolve(); else reject(new Error(`ffmpeg exited with code ${code}`)); });
      ffmpeg.on("error", reject);
    });
    return await readFile(outputPath);
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

export async function ensureCompatibleFormat(audioBuffer: Buffer): Promise<{ buffer: Buffer; format: "wav" | "mp3" }> {
  const detected = detectAudioFormat(audioBuffer);
  if (detected === "wav") return { buffer: audioBuffer, format: "wav" };
  if (detected === "mp3") return { buffer: audioBuffer, format: "mp3" };
  const wavBuffer = await convertToWav(audioBuffer);
  return { buffer: wavBuffer, format: "wav" };
}

export async function voiceChat(
  audioBuffer: Buffer,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  inputFormat: "wav" | "mp3" = "wav",
  outputFormat: "wav" | "mp3" = "mp3"
): Promise<{ transcript: string; audioResponse: Buffer }> {
  const audioBase64 = audioBuffer.toString("base64");
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-audio", modalities: ["text", "audio"], audio: { voice, format: outputFormat },
    messages: [{ role: "user", content: [{ type: "input_audio", input_audio: { data: audioBase64, format: inputFormat } }] }],
  });
  const message = response.choices[0]?.message as any;
  return { transcript: message?.audio?.transcript || message?.content || "", audioResponse: Buffer.from(message?.audio?.data ?? "", "base64") };
}

export async function voiceChatStream(
  audioBuffer: Buffer,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  inputFormat: "wav" | "mp3" = "wav"
): Promise<AsyncIterable<{ type: "transcript" | "audio"; data: string }>> {
  const audioBase64 = audioBuffer.toString("base64");
  const stream = await getOpenAI().chat.completions.create({
    model: "gpt-audio", modalities: ["text", "audio"], audio: { voice, format: "pcm16" },
    messages: [{ role: "user", content: [{ type: "input_audio", input_audio: { data: audioBase64, format: inputFormat } }] }],
    stream: true,
  });
  return (async function* () {
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta as any;
      if (!delta) continue;
      if (delta?.audio?.transcript) yield { type: "transcript", data: delta.audio.transcript };
      if (delta?.audio?.data) yield { type: "audio", data: delta.audio.data };
    }
  })();
}

type SpeechResponseFormat = "wav" | "mp3" | "flac" | "opus" | "pcm16";
type OpenAiSpeechVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

function normalizeSpeechResponseFormat(
  format: SpeechResponseFormat = "wav",
): NonNullable<SpeechCreateParams["response_format"]> {
  switch (format) {
    case "pcm16":
      return "pcm";
    case "wav":
    case "mp3":
    case "flac":
    case "opus":
      return format;
  }
}

export function createOpenAISpeechRequest(input: {
  text: string;
  voice: OpenAiSpeechVoice;
  format?: SpeechResponseFormat;
  model?: "gpt-4o-mini-tts" | "gpt-audio";
  styleInstruction?: string;
}): SpeechCreateParams {
  // `gpt-audio` was used by the former Chat Completions implementation. Keep
  // that value as a compatibility alias so existing server configuration moves
  // to the documented speech endpoint without a second environment edit.
  const model = input.model === "gpt-audio" || !input.model
    ? "gpt-4o-mini-tts"
    : input.model;
  const responseFormat = normalizeSpeechResponseFormat(input.format);
  const instructions = input.styleInstruction?.trim();

  return {
    model,
    voice: input.voice,
    input: input.text,
    response_format: responseFormat,
    ...(instructions ? { instructions } : {}),
  };
}

export async function textToSpeech(
  text: string,
  voice: OpenAiSpeechVoice = "alloy",
  format: SpeechResponseFormat = "wav"
): Promise<Buffer> {
  const response = await getOpenAI().audio.speech.create(
    createOpenAISpeechRequest({ text, voice, format }),
  );
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Server-side TTS control for a named product voice. The delivery instruction
 * is never supplied by an end-user client; callers own the selected base voice
 * and the instruction. The script remains after the colon so the provider has
 * a clear boundary between direction and spoken text.
 */
export async function textToSpeechWithStyle(input: {
  text: string;
  voice: OpenAiSpeechVoice;
  format?: SpeechResponseFormat;
  model?: "gpt-4o-mini-tts" | "gpt-audio";
  styleInstruction: string;
}): Promise<Buffer> {
  const response = await getOpenAI().audio.speech.create(
    createOpenAISpeechRequest(input),
  );
  return Buffer.from(await response.arrayBuffer());
}

export async function textToSpeechStream(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"
): Promise<AsyncIterable<string>> {
  const stream = await getOpenAI().chat.completions.create({
    model: "gpt-audio", modalities: ["text", "audio"], audio: { voice, format: "pcm16" },
    messages: [{ role: "system", content: "You are an assistant that performs text-to-speech." }, { role: "user", content: `Repeat the following text verbatim: ${text}` }],
    stream: true,
  });
  return (async function* () {
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta as any;
      if (delta?.audio?.data) yield delta.audio.data;
    }
  })();
}

export async function speechToText(audioBuffer: Buffer, format: "wav" | "mp3" | "webm" = "wav"): Promise<string> {
  const file = await toFile(audioBuffer, `audio.${format}`);
  const response = await getOpenAI().audio.transcriptions.create({ file, model: "gpt-4o-mini-transcribe" });
  return response.text;
}

export async function speechToTextStream(audioBuffer: Buffer, format: "wav" | "mp3" | "webm" = "wav"): Promise<AsyncIterable<string>> {
  const file = await toFile(audioBuffer, `audio.${format}`);
  const stream = await getOpenAI().audio.transcriptions.create({ file, model: "gpt-4o-mini-transcribe", stream: true });
  return (async function* () {
    for await (const event of stream) {
      if (event.type === "transcript.text.delta") yield event.delta;
    }
  })();
}
