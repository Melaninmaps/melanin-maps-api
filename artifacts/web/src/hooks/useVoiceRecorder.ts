import { useCallback, useRef, useState } from "react";

const BASE = import.meta.env.BASE_URL;

export type VoiceFailureCode =
  | "insecure_context"
  | "media_unsupported"
  | "permission_denied"
  | "no_audio_track"
  | "recorder_unsupported"
  | "recorder_error"
  | "empty_recording"
  | "upload_failed"
  | "transcription_failed";

type VoiceState = "idle" | "requesting_permission" | "recording" | "uploading" | "complete" | "error";

export type VoiceDiagnostic = {
  code: VoiceFailureCode;
  message: string;
  technicalDetail: string;
};

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
] as const;

function supportedMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return MIME_CANDIDATES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? null;
}

function diagnostic(code: VoiceFailureCode, message: string, technicalDetail: string): VoiceDiagnostic {
  return { code, message, technicalDetail };
}

/**
 * There is deliberately no blanket recording-duration message. The hook records
 * until the member presses stop and surfaces the precise permission, capture,
 * upload, or transcription error if any stage fails.
 */
export function useVoiceRecorder(onTranscript: (transcript: string) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const [voiceDiagnostic, setVoiceDiagnostic] = useState<VoiceDiagnostic | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    setVoiceDiagnostic(null);

    if (!window.isSecureContext) {
      setState("error");
      setVoiceDiagnostic(diagnostic(
        "insecure_context",
        "Voice recording needs a secure HTTPS connection.",
        "window.isSecureContext is false; microphone capture is blocked outside HTTPS or localhost.",
      ));
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setVoiceDiagnostic(diagnostic(
        "media_unsupported",
        "This browser does not support microphone recording for Kinfolk.",
        "navigator.mediaDevices.getUserMedia is unavailable.",
      ));
      return;
    }

    const mimeType = supportedMimeType();
    if (!mimeType) {
      setState("error");
      setVoiceDiagnostic(diagnostic(
        "recorder_unsupported",
        "This browser cannot create a supported audio recording format.",
        "No supported MediaRecorder MIME type was found.",
      ));
      return;
    }

    try {
      setState("requesting_permission");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack || audioTrack.readyState !== "live") {
        releaseStream();
        setState("error");
        setVoiceDiagnostic(diagnostic(
          "no_audio_track",
          "Kinfolk could not detect a live microphone track.",
          "getUserMedia resolved without a live audio track.",
        ));
        return;
      }

      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 96_000 });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setState("error");
        setVoiceDiagnostic(diagnostic(
          "recorder_error",
          "Kinfolk could not continue the voice recording.",
          "MediaRecorder error event fired.",
        ));
        releaseStream();
      };
      recorder.onstart = () => setState("recording");
      recorder.start(1_000); // emits chunks regularly; not a time limit
    } catch (caught: unknown) {
      const name = (caught as { name?: string }).name ?? "unknown";
      setState("error");
      setVoiceDiagnostic(
        diagnostic(
          name === "NotAllowedError" ? "permission_denied" : "media_unsupported",
          name === "NotAllowedError"
            ? "Microphone permission was not granted. You can enable it in your browser settings and try again."
            : "Kinfolk could not start the microphone.",
          `getUserMedia failed with ${name}.`,
        ),
      );
      releaseStream();
    }
  }, [releaseStream]);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setState("uploading");
    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const audio = new Blob(chunksRef.current, { type: mimeType });
      recorderRef.current = null;
      releaseStream();

      if (audio.size < 1_000) {
        setState("error");
        setVoiceDiagnostic(diagnostic(
          "empty_recording",
          "Kinfolk did not receive enough audio to transcribe. Please check your microphone input and try again.",
          `Captured audio blob size: ${audio.size} bytes.`,
        ));
        return;
      }

      try {
        const form = new FormData();
        form.append("audio", audio, `kinfolk-recording.${mimeType.includes("mp4") ? "m4a" : "webm"}`);
        form.append("mimeType", mimeType);
        const response = await fetch(`${BASE}api/kinfolk/transcribe`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const payload = (await response.json()) as {
          transcript?: string;
          error?: string;
          code?: string;
          detail?: string;
        };
        if (!response.ok) {
          setState("error");
          setVoiceDiagnostic(diagnostic(
            payload.code === "TRANSCRIPTION_UNSUPPORTED" ? "transcription_failed" : "upload_failed",
            payload.error || "Kinfolk could not transcribe that recording.",
            payload.detail || `Transcription endpoint returned HTTP ${response.status}.`,
          ));
          return;
        }
        if (payload.transcript) onTranscript(payload.transcript);
        setState("complete");
      } catch (caught: unknown) {
        setState("error");
        setVoiceDiagnostic(diagnostic(
          "upload_failed",
          "Kinfolk could not send the recording for transcription.",
          `Voice upload failed: ${(caught as Error).message || "network error"}.`,
        ));
      }
    };
    recorder.stop();
  }, [onTranscript, releaseStream]);

  return {
    state,
    voiceDiagnostic,
    startRecording,
    stopRecording,
    clearDiagnostic: () => setVoiceDiagnostic(null),
  };
}
