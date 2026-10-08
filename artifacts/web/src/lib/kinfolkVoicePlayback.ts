export type KinfolkVoiceAudioClip = Readonly<{
  audio: string;
  spokenText: string;
}>;

export type KinfolkVoicePlaybackPayload = Readonly<{
  spokenText: string;
  clips: readonly KinfolkVoiceAudioClip[];
}>;

export type KinfolkVoicePlaybackPhase = "idle" | "playing" | "paused" | "finished" | "failed" | "interrupted";

export interface KinfolkVoicePlaybackQueue {
  start: () => number;
  pause: () => boolean;
  resume: () => number | null;
  advance: () => number | null;
  fail: () => void;
  interrupt: () => void;
  replay: () => number;
  currentIndex: () => number;
  phase: () => KinfolkVoicePlaybackPhase;
  currentClip: () => KinfolkVoiceAudioClip | null;
  unreadText: () => string;
}

/**
 * Rejects malformed or incomplete multi-clip payloads before a browser can
 * speak them. The complete returned spoken text must be byte-for-byte identical
 * to the ordered clip text so the member-visible and spoken response stay in sync.
 */
export function normalizeKinfolkVoicePlaybackPayload(value: unknown): KinfolkVoicePlaybackPayload {
  if (!value || typeof value !== "object") throw new Error("Kinfolk voice response was unavailable.");
  const payload = value as { audio?: unknown; spokenText?: unknown; clips?: unknown };
  if (typeof payload.spokenText !== "string" || !payload.spokenText.trim()) {
    throw new Error("Kinfolk voice response did not include spoken text.");
  }

  const rawClips = Array.isArray(payload.clips) && payload.clips.length > 0
    ? payload.clips
    : [{ audio: payload.audio, spokenText: payload.spokenText }];
  const clips = rawClips.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Kinfolk voice response included an invalid clip.");
    const clip = value as { audio?: unknown; spokenText?: unknown };
    if (typeof clip.audio !== "string" || !clip.audio || typeof clip.spokenText !== "string" || !clip.spokenText) {
      throw new Error("Kinfolk voice response included an incomplete clip.");
    }
    return { audio: clip.audio, spokenText: clip.spokenText } as KinfolkVoiceAudioClip;
  });

  if (clips.map((clip) => clip.spokenText).join("") !== payload.spokenText) {
    throw new Error("Kinfolk voice response did not cover the full visible answer.");
  }
  return { spokenText: payload.spokenText, clips };
}

/** State-only queue used by the browser playback layer and unit tests. */
export function createKinfolkVoicePlaybackQueue(
  clips: readonly KinfolkVoiceAudioClip[],
): KinfolkVoicePlaybackQueue {
  if (clips.length === 0) throw new Error("Kinfolk voice playback needs at least one clip.");
  let index = 0;
  let currentPhase: KinfolkVoicePlaybackPhase = "idle";

  return {
    start() {
      index = 0;
      currentPhase = "playing";
      return index;
    },
    pause() {
      if (currentPhase !== "playing") return false;
      currentPhase = "paused";
      return true;
    },
    resume() {
      if (currentPhase !== "paused") return null;
      currentPhase = "playing";
      return index;
    },
    advance() {
      if (currentPhase !== "playing") return null;
      if (index + 1 >= clips.length) {
        currentPhase = "finished";
        return null;
      }
      index += 1;
      return index;
    },
    fail() {
      currentPhase = "failed";
    },
    interrupt() {
      currentPhase = "interrupted";
    },
    replay() {
      index = 0;
      currentPhase = "playing";
      return index;
    },
    currentIndex: () => index,
    phase: () => currentPhase,
    currentClip: () => clips[index] ?? null,
    unreadText: () => clips.slice(index).map((clip) => clip.spokenText).join(""),
  };
}
