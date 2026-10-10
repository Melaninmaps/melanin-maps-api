export type KinfolkVoiceMimeType =
  | "audio/mp4"
  | "audio/mpeg"
  | "audio/wav"
  | "audio/webm";

export type AndroidVoiceUploadPlan = Readonly<{
  mimeType: KinfolkVoiceMimeType;
  filename: string;
  requiresTypedBlob: boolean;
}>;

const MIME_BY_EXTENSION: Readonly<
  Record<string, KinfolkVoiceMimeType | undefined>
> = {
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  webm: "audio/webm",
};

const EXTENSION_BY_MIME: Readonly<Record<KinfolkVoiceMimeType, string>> = {
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/webm": "webm",
};

function normalizedMimeType(value: string | null | undefined): string {
  return value?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

export function hasIsoBmffHeader(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70 // p
  );
}

export function inferKinfolkVoiceMimeType(
  uri: string,
): KinfolkVoiceMimeType | null {
  const withoutQuery = uri.split(/[?#]/, 1)[0] ?? uri;
  const extension = (withoutQuery.split(".").pop() ?? "").toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? null;
}

/**
 * The native recorder is deliberately locked to M4A/AAC on Android. A valid
 * ISO-BMFF header is a small, local preflight only; the API still validates the
 * complete audio track, duration, and container before provider handoff.
 */
export function createAndroidVoiceUploadPlan(
  uri: string,
  sourceMimeType: string | null | undefined,
  header: Uint8Array,
): AndroidVoiceUploadPlan {
  const mimeType = inferKinfolkVoiceMimeType(uri);
  if (mimeType !== "audio/mp4") {
    throw new Error(
      "Android Kinfolk Voice must record M4A audio. Please record again or type your question.",
    );
  }
  if (!hasIsoBmffHeader(header)) {
    throw new Error(
      "This recording was not a supported M4A audio file. Please record again or type your question.",
    );
  }
  // Android's File/Blob bridge has returned an inconsistent MIME for a valid
  // recorder output. Build a standard Blob with the canonical M4A type and an
  // explicit filename. This changes only multipart metadata; it never relabels
  // bytes that failed the local ISO-BMFF guard or the server's full inspection.
  const normalizedSourceMime = normalizedMimeType(sourceMimeType);
  return {
    mimeType,
    filename: `kinfolk-voice.${EXTENSION_BY_MIME[mimeType]}`,
    requiresTypedBlob: normalizedSourceMime !== "audio/mp4",
  };
}
