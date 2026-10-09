export interface VoiceRecordingControl {
  /** Starts a new raw-audio session and returns its non-reusable identifier. */
  begin(): number;
  /** Invalidates the active session before any raw audio can be transcribed. */
  cancel(): void;
  /** Returns true only while this exact member-authorized session may upload. */
  permitsTranscription(sessionId: number | null): boolean;
  /** Creates the one cancellable network request allowed for this session. */
  beginTranscription(sessionId: number | null): AbortController | null;
  /** Marks a completed session ineligible for any later upload attempt. */
  finish(sessionId: number | null): void;
}

/**
 * Coordinates a native recorder's asynchronous stop/cancel races. A recording
 * is uploadable only while the exact session remains member-authorized. A
 * cancel, interruption, route close, or unmount invalidates its session before
 * recorder I/O, so a late stop callback cannot send raw audio to transcription.
 */
export function createVoiceRecordingControl(): VoiceRecordingControl {
  let nextSessionId = 0;
  let activeSessionId: number | null = null;
  let transcriptionAllowed = false;
  let activeTranscriptionAbortController: AbortController | null = null;

  return {
    begin() {
      activeTranscriptionAbortController?.abort();
      activeTranscriptionAbortController = null;
      nextSessionId += 1;
      activeSessionId = nextSessionId;
      transcriptionAllowed = true;
      return nextSessionId;
    },
    cancel() {
      transcriptionAllowed = false;
      activeSessionId = null;
      activeTranscriptionAbortController?.abort();
      activeTranscriptionAbortController = null;
    },
    permitsTranscription(sessionId) {
      return transcriptionAllowed && sessionId !== null && activeSessionId === sessionId;
    },
    beginTranscription(sessionId) {
      if (!transcriptionAllowed || sessionId === null || activeSessionId !== sessionId) return null;
      activeTranscriptionAbortController?.abort();
      const controller = new AbortController();
      activeTranscriptionAbortController = controller;
      return controller;
    },
    finish(sessionId) {
      if (sessionId !== null && activeSessionId === sessionId) {
        transcriptionAllowed = false;
        activeSessionId = null;
        activeTranscriptionAbortController = null;
      }
    },
  };
}
