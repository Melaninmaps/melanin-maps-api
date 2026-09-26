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
 * Some valid, uncompressed recordings do not carry enough optional metadata
 * for music-metadata to calculate duration. Expo and test recorders may emit
 * this small PCM WAV shape, so read the canonical RIFF chunks as a narrowly
 * scoped fallback. It does not accept arbitrary bytes: all required chunk
 * bounds and linear-PCM fields must be present.
 */
function inspectLinearPcmWavDuration(audio: Uint8Array): VoiceAudioInspection | null {
  const bytes = Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength);
  if (bytes.length < 44 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") return null;

  let offset = 12;
  let channels: number | null = null;
  let sampleRate: number | null = null;
  let bitsPerSample: number | null = null;
  let dataLength: number | null = null;

  while (offset + 8 <= bytes.length) {
    const chunkId = bytes.toString("ascii", offset, offset + 4);
    const chunkLength = bytes.readUInt32LE(offset + 4);
    const bodyStart = offset + 8;
    const bodyEnd = bodyStart + chunkLength;
    if (bodyEnd > bytes.length) return null;

    if (chunkId === "fmt " && chunkLength >= 16) {
      const audioFormat = bytes.readUInt16LE(bodyStart);
      if (audioFormat !== 1) return null;
      channels = bytes.readUInt16LE(bodyStart + 2);
      sampleRate = bytes.readUInt32LE(bodyStart + 4);
      bitsPerSample = bytes.readUInt16LE(bodyStart + 14);
    } else if (chunkId === "data") {
      dataLength = chunkLength;
      break;
    }

    offset = bodyEnd + (chunkLength % 2);
  }

  if (!channels || !sampleRate || !bitsPerSample || dataLength === null || bitsPerSample % 8 !== 0) return null;
  const bytesPerFrame = channels * (bitsPerSample / 8);
  if (!Number.isSafeInteger(bytesPerFrame) || bytesPerFrame <= 0 || dataLength % bytesPerFrame !== 0) return null;
  const durationMs = Math.ceil((dataLength / bytesPerFrame / sampleRate) * 1_000);
  return Number.isFinite(durationMs) && durationMs > 0 ? { durationMs, container: "WAVE" } : null;
}

type IsoBox = Readonly<{
  type: string;
  payloadStart: number;
  end: number;
}>;

function readUInt32(bytes: Buffer, offset: number): number | null {
  return offset >= 0 && offset + 4 <= bytes.length ? bytes.readUInt32BE(offset) : null;
}

function readIsoBoxes(bytes: Buffer, start: number, end: number): IsoBox[] | null {
  const boxes: IsoBox[] = [];
  let offset = start;
  while (offset < end) {
    if (offset + 8 > end) return null;
    let size = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    let headerLength = 8;
    if (size === 1) {
      // Extended atom lengths beyond 32 bits are unnecessary for a 4 MB voice
      // upload and are rejected rather than partially parsing an unsafe value.
      const high = readUInt32(bytes, offset + 8);
      const low = readUInt32(bytes, offset + 12);
      if (high === null || low === null || high !== 0) return null;
      size = low;
      headerLength = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < headerLength || offset + size > end) return null;
    boxes.push({ type, payloadStart: offset + headerLength, end: offset + size });
    offset += size;
  }
  return offset === end ? boxes : null;
}

function childBoxes(bytes: Buffer, box: IsoBox): IsoBox[] | null {
  return readIsoBoxes(bytes, box.payloadStart, box.end);
}

function fullBoxFlags(bytes: Buffer, box: IsoBox): number | null {
  if (box.payloadStart + 4 > box.end) return null;
  return (bytes[box.payloadStart + 1]! << 16) | (bytes[box.payloadStart + 2]! << 8) | bytes[box.payloadStart + 3]!;
}

function audioTrackTimescales(bytes: Buffer, moov: IsoBox): Map<number, number> | null {
  const moovChildren = childBoxes(bytes, moov);
  if (!moovChildren) return null;
  const result = new Map<number, number>();
  for (const trak of moovChildren.filter((box) => box.type === "trak")) {
    const trakChildren = childBoxes(bytes, trak);
    const tkhd = trakChildren?.find((box) => box.type === "tkhd");
    const mdia = trakChildren?.find((box) => box.type === "mdia");
    if (!tkhd || !mdia || tkhd.payloadStart + 4 > tkhd.end) continue;
    const tkhdVersion = bytes[tkhd.payloadStart]!;
    const trackIdOffset = tkhd.payloadStart + (tkhdVersion === 1 ? 20 : 12);
    const trackId = readUInt32(bytes, trackIdOffset);
    const mdiaChildren = childBoxes(bytes, mdia);
    const hdlr = mdiaChildren?.find((box) => box.type === "hdlr");
    const mdhd = mdiaChildren?.find((box) => box.type === "mdhd");
    if (!hdlr || !mdhd || trackId === null || hdlr.payloadStart + 12 > hdlr.end || mdhd.payloadStart + 4 > mdhd.end) continue;
    const handler = bytes.toString("ascii", hdlr.payloadStart + 8, hdlr.payloadStart + 12);
    if (handler !== "soun") continue;
    const mdhdVersion = bytes[mdhd.payloadStart]!;
    const timescaleOffset = mdhd.payloadStart + (mdhdVersion === 1 ? 20 : 12);
    const timescale = readUInt32(bytes, timescaleOffset);
    if (timescale && Number.isSafeInteger(timescale)) result.set(trackId, timescale);
  }
  return result.size > 0 ? result : null;
}

function trexDefaultDurations(bytes: Buffer, moov: IsoBox): Map<number, number> | null {
  const mvex = childBoxes(bytes, moov)?.find((box) => box.type === "mvex");
  const trexBoxes = mvex ? childBoxes(bytes, mvex)?.filter((box) => box.type === "trex") : undefined;
  if (!trexBoxes) return null;
  const result = new Map<number, number>();
  for (const trex of trexBoxes) {
    const trackId = readUInt32(bytes, trex.payloadStart + 4);
    const defaultDuration = readUInt32(bytes, trex.payloadStart + 12);
    if (trackId !== null && defaultDuration && Number.isSafeInteger(defaultDuration)) result.set(trackId, defaultDuration);
  }
  return result;
}

function trafDuration(
  bytes: Buffer,
  traf: IsoBox,
  defaults: Map<number, number>,
): Readonly<{ trackId: number; durationUnits: number }> | null {
  const boxes = childBoxes(bytes, traf);
  const tfhd = boxes?.find((box) => box.type === "tfhd");
  const truns = boxes?.filter((box) => box.type === "trun");
  if (!tfhd || !truns?.length) return null;
  const tfhdFlags = fullBoxFlags(bytes, tfhd);
  const trackId = readUInt32(bytes, tfhd.payloadStart + 4);
  if (tfhdFlags === null || trackId === null) return null;
  let tfhdOffset = tfhd.payloadStart + 8;
  if (tfhdFlags & 0x000001) tfhdOffset += 8; // base-data-offset-present
  if (tfhdFlags & 0x000002) tfhdOffset += 4; // sample-description-index-present
  let defaultDuration = defaults.get(trackId) ?? null;
  if (tfhdFlags & 0x000008) {
    defaultDuration = readUInt32(bytes, tfhdOffset);
    tfhdOffset += 4;
  }
  if (tfhdFlags & 0x000010) tfhdOffset += 4;
  if (tfhdFlags & 0x000020) tfhdOffset += 4;
  if (tfhdOffset > tfhd.end) return null;

  let durationUnits = 0;
  for (const trun of truns) {
    const flags = fullBoxFlags(bytes, trun);
    const sampleCount = readUInt32(bytes, trun.payloadStart + 4);
    if (flags === null || sampleCount === null || sampleCount === 0 || sampleCount > 100_000) return null;
    let offset = trun.payloadStart + 8;
    if (flags & 0x000001) offset += 4; // data-offset-present
    if (flags & 0x000004) offset += 4; // first-sample-flags-present
    if (offset > trun.end) return null;
    for (let sample = 0; sample < sampleCount; sample++) {
      const sampleDuration = flags & 0x000100 ? readUInt32(bytes, offset) : defaultDuration;
      if (!sampleDuration || !Number.isSafeInteger(sampleDuration)) return null;
      if (flags & 0x000100) offset += 4;
      if (flags & 0x000200) offset += 4;
      if (flags & 0x000400) offset += 4;
      if (flags & 0x000800) offset += 4;
      if (offset > trun.end || durationUnits > Number.MAX_SAFE_INTEGER - sampleDuration) return null;
      durationUnits += sampleDuration;
    }
  }
  return durationUnits > 0 ? { trackId, durationUnits } : null;
}

/**
 * Safari/Chrome MediaRecorder can produce fragmented MP4 audio with a valid
 * AAC stream but zero movie-header duration. `music-metadata` cannot always
 * measure that shape. This narrowly calculates duration from trusted ISO BMFF
 * audio fragments; it is not a general MP4 parser and rejects malformed boxes.
 */
export function inspectFragmentedMp4Duration(audio: Uint8Array): VoiceAudioInspection | null {
  const bytes = Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength);
  const root = readIsoBoxes(bytes, 0, bytes.length);
  const moov = root?.find((box) => box.type === "moov");
  const moofs = root?.filter((box) => box.type === "moof") ?? [];
  const hasMediaData = root?.some((box) => box.type === "mdat" && box.payloadStart < box.end) ?? false;
  if (!moov || !moofs.length || !hasMediaData) return null;
  const timescales = audioTrackTimescales(bytes, moov);
  const defaults = trexDefaultDurations(bytes, moov);
  if (!timescales || !defaults) return null;

  const durationUnitsByTrack = new Map<number, number>();
  for (const moof of moofs) {
    const trafs = childBoxes(bytes, moof)?.filter((box) => box.type === "traf") ?? [];
    for (const traf of trafs) {
      const parsed = trafDuration(bytes, traf, defaults);
      if (!parsed || !timescales.has(parsed.trackId)) continue;
      const current = durationUnitsByTrack.get(parsed.trackId) ?? 0;
      if (current > Number.MAX_SAFE_INTEGER - parsed.durationUnits) return null;
      durationUnitsByTrack.set(parsed.trackId, current + parsed.durationUnits);
    }
  }

  let longestDurationMs = 0;
  for (const [trackId, durationUnits] of durationUnitsByTrack) {
    const timescale = timescales.get(trackId);
    if (!timescale) continue;
    const durationMs = Math.ceil((durationUnits / timescale) * 1_000);
    if (!Number.isFinite(durationMs) || durationMs <= 0) continue;
    longestDurationMs = Math.max(longestDurationMs, durationMs);
  }
  return longestDurationMs > 0 ? { durationMs: longestDurationMs, container: "M4A fragmented MP4" } : null;
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
    if (error instanceof VoiceAudioInspectionError && error.code !== "AUDIO_UNREADABLE") throw error;
    if (declaredMimeType === "audio/mp4") {
      const fallback = inspectFragmentedMp4Duration(audio);
      if (fallback) {
        if (fallback.durationMs > maxDurationMs) {
          throw new VoiceAudioInspectionError("AUDIO_DURATION_EXCEEDED", "The recording exceeds the maximum duration.");
        }
        return fallback;
      }
    }
    if (declaredMimeType === "audio/wav") {
      const fallback = inspectLinearPcmWavDuration(audio);
      if (fallback) {
        if (fallback.durationMs > maxDurationMs) {
          throw new VoiceAudioInspectionError("AUDIO_DURATION_EXCEEDED", "The recording exceeds the maximum duration.");
        }
        return fallback;
      }
    }
    if (error instanceof VoiceAudioInspectionError) throw error;
    throw new VoiceAudioInspectionError("AUDIO_UNREADABLE", "The recording container could not be parsed.");
  }
}
