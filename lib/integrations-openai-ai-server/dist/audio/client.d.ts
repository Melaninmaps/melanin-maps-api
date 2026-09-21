import OpenAI from "openai";
import { Buffer } from "node:buffer";
export declare const openai: OpenAI;
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
export declare function textToSpeech(text: string, voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer", format?: "wav" | "mp3" | "flac" | "opus" | "pcm16"): Promise<Buffer>;
/**
 * Server-side TTS control for a named product voice. The delivery instruction
 * is never supplied by an end-user client; callers own the selected base voice
 * and the instruction. The script remains after the colon so the provider has
 * a clear boundary between direction and spoken text.
 */
export declare function textToSpeechWithStyle(input: {
    text: string;
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
    format?: "wav" | "mp3" | "flac" | "opus" | "pcm16";
    model?: "gpt-audio";
    styleInstruction: string;
}): Promise<Buffer>;
export declare function textToSpeechStream(text: string, voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"): Promise<AsyncIterable<string>>;
export declare function speechToText(audioBuffer: Buffer, format?: "wav" | "mp3" | "webm"): Promise<string>;
export declare function speechToTextStream(audioBuffer: Buffer, format?: "wav" | "mp3" | "webm"): Promise<AsyncIterable<string>>;
//# sourceMappingURL=client.d.ts.map