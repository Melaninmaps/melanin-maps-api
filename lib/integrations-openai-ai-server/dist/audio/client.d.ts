import OpenAI from "openai";
import type { SpeechCreateParams } from "openai/resources/audio/speech";
import { Buffer } from "node:buffer";
export declare function resolveAudioOpenAIConfiguration(environment?: NodeJS.ProcessEnv): Readonly<{
    apiKey: string;
    baseURL: string;
}>;
/**
 * Node 18 exposes Blob but not a global File constructor. OpenAI's SDK checks
 * for that global before it accepts an upload, so install Node's compatible
 * implementation only on runtimes that do not already provide one.
 */
export declare function ensureAudioFileSupport(): void;
export declare function createAudioUploadFile(audio: Buffer | Uint8Array, filename: string, mimeType: string): Promise<File>;
export declare const openai: OpenAI;
export declare const audioOpenai: OpenAI;
export type AudioFormat = "wav" | "mp3" | "webm" | "mp4" | "ogg" | "unknown";
export declare function detectAudioFormat(buffer: Buffer): AudioFormat;
export declare function convertToWav(audioBuffer: Buffer): Promise<Buffer>;
export declare function ensureCompatibleFormat(audioBuffer: Buffer): Promise<{
    buffer: Buffer;
    format: "wav" | "mp3";
}>;
export declare function voiceChat(audioBuffer: Buffer, voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer", inputFormat?: "wav" | "mp3", outputFormat?: "wav" | "mp3"): Promise<{
    transcript: string;
    audioResponse: Buffer;
}>;
export declare function voiceChatStream(audioBuffer: Buffer, voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer", inputFormat?: "wav" | "mp3"): Promise<AsyncIterable<{
    type: "transcript" | "audio";
    data: string;
}>>;
type SpeechResponseFormat = "wav" | "mp3" | "flac" | "opus" | "pcm16";
type OpenAiSpeechVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
type PreferredSpeechModel = "gpt-4o-mini-tts" | "gpt-audio";
declare const OPENAI_TRANSCRIPTION_MODEL_FALLBACK: "whisper-1";
type OpenAITranscriptionModel = "gpt-4o-mini-transcribe" | typeof OPENAI_TRANSCRIPTION_MODEL_FALLBACK;
/**
 * The compact audio models are preferred for quality. Older or restricted
 * OpenAI projects can expose the documented legacy audio models instead. Only
 * retry definitive model/access compatibility responses; never mask rate
 * limits, credentials, network failures, or provider outages with a second
 * request.
 */
export declare function shouldTryOpenAIAudioModelFallback(error: unknown): boolean;
export declare function createOpenAISpeechRequest(input: {
    text: string;
    voice: OpenAiSpeechVoice;
    format?: SpeechResponseFormat;
    model?: PreferredSpeechModel;
    styleInstruction?: string;
}): SpeechCreateParams;
export declare function textToSpeech(text: string, voice?: OpenAiSpeechVoice, format?: SpeechResponseFormat): Promise<Buffer>;
/**
 * Server-side TTS control for a named product voice. The delivery instruction
 * is never supplied by an end-user client; callers own the selected base voice
 * and the instruction. The script remains after the colon so the provider has
 * a clear boundary between direction and spoken text.
 */
export declare function textToSpeechWithStyle(input: {
    text: string;
    voice: OpenAiSpeechVoice;
    format?: SpeechResponseFormat;
    model?: "gpt-4o-mini-tts" | "gpt-audio";
    styleInstruction: string;
}): Promise<Buffer>;
export declare function textToSpeechStream(text: string, voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"): Promise<AsyncIterable<string>>;
export declare function speechToText(audioBuffer: Buffer, format?: "wav" | "mp3" | "webm" | "m4a", options?: {
    model?: OpenAITranscriptionModel;
    signal?: AbortSignal;
}): Promise<string>;
export declare function speechToTextStream(audioBuffer: Buffer, format?: "wav" | "mp3" | "webm"): Promise<AsyncIterable<string>>;
export {};
//# sourceMappingURL=client.d.ts.map