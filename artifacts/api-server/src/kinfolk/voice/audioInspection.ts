import { parseBuffer } from "music-metadata";

export type VoiceAudioInspectionCode =
  | "AUDIO_UNREADABLE"
  | "AUDIO_DURATION_EXCEEDED"
  | "AUDIO_MIME_MISMATCH";

export class VoiceAudioInspectionError extends Error {
  constructor(
    readonly code: VoiceAudioInspectionCode,
    message: string,
  ) {
    super(message);
    this.name = "VoiceAudioInspectionError";
  }
}

const CONTAINER_FOR_MIME: Readonly<Record<string, RegExp>> = {
  "audio/wav": /(?:^|\b)(?:wave|wav)(?:\b|$)/i,
  "audio/mpeg": /(?:^|\b)(?:mpeg|mp3)(?:\b|$)/i,
  "audio/mp4": /(?:m4a|mp4|quicktime|isom|iso2)/i,
  "audio/webm": /(?:webm|matroska|ebml)/i,
};

export type VoiceAudioInspection = Readonly<{
  durationMs: number;
  container: string;
}>;

export type CanonicalVoiceFormat = Readonly<{
  safeFormat: "webm" | "m4a" | "wav" | "mp3";
  mimeType: "audio/webm" | "audio/mp4" | "audio/wav" | "audio/mpeg";
}>;

export function canonicalVoiceFormat(value: string): CanonicalVoiceFormat | null {
  const normalized = value.split(";")[0].trim().toLowerCase().replace(/^audio\//, "");
  const safeFormat = ({
    mp4: "m4a", "x-m4a": "m4a", m4a: "m4a",
    mpeg: "mp3", "x-mp3": "mp3", mp3: "mp3",
    wav: "wav", "x-wav": "wav", wave: "wav",
    webm: "webm",
  } as const)[normalized as "mp4" | "x-m4a" | "m4a" | "mpeg" | "x-mp3" | "mp3" | "wav" | "x-wav" | "wave" | "webm"];
  if (!safeFormat) return null;
  return {
    safeFormat,
    mimeType: safeFormat === "m4a" ? "audio/mp4"
      : safeFormat === "mp3" ? "audio/mpeg"
        : safeFormat === "wav" ? "audio/wav"
          : "audio/webm",
  };
}

function detectedMimeType(audio: Uint8Array): CanonicalVoiceFormat["mimeType"] | null {
  const bytes = Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength);
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WAVE") return "audio/wav";
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "audio/webm";
  if (bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp") return "audio/mp4";
  if (bytes.length >= 3 && bytes.toString("ascii", 0, 3) === "ID3") return "audio/mpeg";
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return "audio/mpeg";
  return null;
}

/**
 * Parse the actual in-memory audio bytes. The declared MIME may choose the
 * parser, but it cannot override the detected container or measured duration.
 */
export async function inspectVoiceAudio(
  audio: Uint8Array,
  declaredMimeType: string,
  maxDurationMs: number,
): Promise<VoiceAudioInspection> {
  const expectedContainer = CONTAINER_FOR_MIME[declaredMimeType];
  if (!expectedContainer) {
    throw new VoiceAudioInspectionError("AUDIO_MIME_MISMATCH", "Unsupported declared audio type.");
  }
  if (detectedMimeType(audio) !== declaredMimeType) {
    throw new VoiceAudioInspectionError("AUDIO_MIME_MISMATCH", "The audio bytes do not match the declared recording type.");
  }

  // ISO BMFF audio files use a `soun` handler. A `vide` handler means the
  // upload contains a video track even when an audio parser can read its AAC.
  if (declaredMimeType === "audio/mp4" && Buffer.from(audio).includes(Buffer.from("vide"))) {
    throw new VoiceAudioInspectionError("AUDIO_MIME_MISMATCH", "Video-bearing MP4 files are not accepted as voice recordings.");
  }

  try {
    const metadata = await parseBuffer(audio, declaredMimeType, {
      duration: true,
      skipCovers: true,
    });
    const container = metadata.format.container?.trim() ?? "";
    const durationSeconds = metadata.format.duration;
    const hasVideoTrack = metadata.format.trackInfo.some((track) => track.video !== undefined);
    if (!container || !expectedContainer.test(container) || hasVideoTrack) {
      throw new VoiceAudioInspectionError("AUDIO_MIME_MISMATCH", "The audio bytes do not match the declared recording type.");
    }
    if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new VoiceAudioInspectionError("AUDIO_UNREADABLE", "The recording duration could not be measured.");
    }
    const durationMs = Math.ceil(durationSeconds * 1_000);
    if (durationMs > maxDurationMs) {
      throw new VoiceAudioInspectionError("AUDIO_DURATION_EXCEEDED", "The recording exceeds the maximum duration.");
    }
    return { durationMs, container };
  } catch (error) {
    if (error instanceof VoiceAudioInspectionError) throw error;
    throw new VoiceAudioInspectionError("AUDIO_UNREADABLE", "The recording container could not be parsed.");
  }
}
