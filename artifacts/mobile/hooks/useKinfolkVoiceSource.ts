import * as FileSystem from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { AppState, Linking, Platform } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getApiBase } from "@/lib/api";
import {
  KINFOLK_VOICE_MAX_DURATION_MS,
  classifyKinfolkVoiceUploadFailure,
  inspectKinfolkVoiceSource,
  kinfolkVoiceSourceFailureMessage,
  type KinfolkVoiceSourceFailure,
  type KinfolkVoiceSourcePhase,
} from "@/lib/kinfolkVoiceSourceContract";

const AUTH_TOKEN_KEY = "auth_session_token";
const START_CONFIRMATION_DELAY_MS = 80;
const INTERRUPTION_GRACE_MS = 350;

export type KinfolkVoiceSourceState = Readonly<{
  phase: KinfolkVoiceSourcePhase;
  /** Safe status text only: never an exception, server payload, or transcript. */
  message: string | null;
  failure: KinfolkVoiceSourceFailure | null;
  /** Present only while the member reviews it. It is never submitted automatically. */
  transcript: string;
  durationMs: number;
}>;

export type UseKinfolkVoiceSourceOptions = Readonly<{
  isAuthenticated: boolean;
  /** Kept compatible with the existing Kinfolk transcription request. */
  regionalFlavor?: string;
  /** Injectable only for a native host that uses a different authenticated API origin. */
  apiBase?: string;
  tokenProvider?: () => Promise<string | null>;
}>;

export type KinfolkVoiceSourceController = Readonly<{
  state: KinfolkVoiceSourceState;
  elapsedSeconds: number;
  isNative: boolean;
  canStart: boolean;
  canStop: boolean;
  canCancel: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => Promise<void>;
  clearTranscript: () => void;
  updateTranscript: (value: string) => void;
  openMicrophoneSettings: () => Promise<void>;
}>;

const INITIAL_STATE: KinfolkVoiceSourceState = {
  phase: "idle",
  message: null,
  failure: null,
  transcript: "",
  durationMs: 0,
};

function isNativeVoicePlatform(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

function isCancellation(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Owns only the microphone-to-transcript lifecycle. It deliberately does not
 * send a chat turn: callers must present and explicitly submit the transcript.
 */
export function useKinfolkVoiceSource(options: UseKinfolkVoiceSourceOptions): KinfolkVoiceSourceController {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [state, setState] = useState<KinfolkVoiceSourceState>(INITIAL_STATE);
  const phaseRef = useRef<KinfolkVoiceSourcePhase>("idle");
  const startedAtRef = useRef<number | null>(null);
  const operationRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const transition = useCallback((next: KinfolkVoiceSourceState) => {
    phaseRef.current = next.phase;
    setState(next);
  }, []);

  const fail = useCallback((failure: KinfolkVoiceSourceFailure, durationMs = 0) => {
    transition({
      phase: "error",
      message: kinfolkVoiceSourceFailureMessage(failure),
      failure,
      transcript: "",
      durationMs,
    });
  }, [transition]);

  const clearTemporaryFile = useCallback((uri: string | null | undefined) => {
    if (!uri) return;
    try {
      const file = new FileSystem.File(uri);
      if (file.exists) file.delete();
    } catch {
      // Raw audio is in a cache location; deletion is best effort even when the
      // operating system has already removed it.
    }
  }, []);

  const restoreNonRecordingAudioMode = useCallback(async () => {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => undefined);
  }, []);

  const stop = useCallback(async () => {
    const phase = phaseRef.current;
    if (phase !== "recording" && phase !== "starting") return;

    const operation = operationRef.current;
    const startedAt = startedAtRef.current;
    const elapsedMs = startedAt === null ? recorderState.durationMillis : Math.max(0, Date.now() - startedAt);
    // The timer can wake a few milliseconds late. Cap the declared duration at
    // the stated limit; server-side byte inspection remains authoritative.
    const durationMs = Math.min(elapsedMs, KINFOLK_VOICE_MAX_DURATION_MS);
    startedAtRef.current = null;
    transition({ phase: "stopping", message: "Finishing your recording…", failure: null, transcript: "", durationMs });

    let uri: string | null = null;
    try {
      if (recorder.isRecording) await recorder.stop();
      if (operation !== operationRef.current) return;
      uri = recorder.uri;
      if (!uri) {
        fail("recording_missing", durationMs);
        return;
      }

      const file = new FileSystem.File(uri);
      const sizeBytes = file.size ?? file.info().size ?? 0;
      const inspection = inspectKinfolkVoiceSource({ durationMs, sizeBytes, uri });
      if (!inspection.ok || !inspection.mimeType) {
        fail(inspection.failure ?? "recording_missing", durationMs);
        return;
      }

      const tokenProvider = options.tokenProvider ?? (() => SecureStore.getItemAsync(AUTH_TOKEN_KEY));
      const token = await tokenProvider();
      if (operation !== operationRef.current) return;
      if (!token) {
        fail("authentication_required", durationMs);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      transition({
        phase: "uploading",
        message: "Sending temporary audio for transcription…",
        failure: null,
        transcript: "",
        durationMs,
      });
      const form = new FormData();
      form.append("audio", file);
      form.append("durationMs", String(durationMs));
      form.append("mimeType", inspection.mimeType);
      form.append("regionalFlavor", options.regionalFlavor ?? "off");

      const response = await fetch(`${options.apiBase ?? getApiBase()}/api/kinfolk/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null) as {
        text?: string;
        transcript?: string;
        code?: string;
      } | null;
      if (operation !== operationRef.current) return;
      if (!response.ok) {
        fail(classifyKinfolkVoiceUploadFailure({ status: response.status, code: payload?.code }), durationMs);
        return;
      }
      const transcript = payload?.text?.trim() || payload?.transcript?.trim() || "";
      if (!transcript) {
        fail("transcription_empty", durationMs);
        return;
      }
      transition({
        phase: "review",
        message: "Review your transcription before sending. It is not sent automatically.",
        failure: null,
        transcript,
        durationMs,
      });
    } catch (error) {
      if (operation === operationRef.current && !isCancellation(error)) {
        fail("upload_failed", durationMs);
      }
    } finally {
      abortControllerRef.current = null;
      clearTemporaryFile(uri);
      await restoreNonRecordingAudioMode();
    }
  }, [clearTemporaryFile, fail, options.apiBase, options.regionalFlavor, options.tokenProvider, recorder, recorderState.durationMillis, restoreNonRecordingAudioMode, transition]);

  const cancel = useCallback(async () => {
    const phase = phaseRef.current;
    if (phase !== "requesting_permission" && phase !== "starting" && phase !== "recording" && phase !== "stopping" && phase !== "uploading") return;

    // Invalidate every in-flight continuation before stopping the recorder so a
    // stop completion can never proceed to FormData or fetch after cancellation.
    operationRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    startedAtRef.current = null;
    transition({
      phase: "idle",
      message: phase === "uploading"
        ? "Voice request canceled. Temporary local audio was deleted."
        : "Recording canceled. Nothing was uploaded.",
      failure: null,
      transcript: "",
      durationMs: 0,
    });
    try {
      if (recorder.isRecording) await recorder.stop();
      clearTemporaryFile(recorder.uri);
    } catch {
      // Cancellation must be quiet and must never turn into an upload path.
    } finally {
      await restoreNonRecordingAudioMode();
    }
  }, [clearTemporaryFile, recorder, restoreNonRecordingAudioMode, transition]);

  const start = useCallback(async () => {
    if (!isNativeVoicePlatform()) {
      fail("unsupported_platform");
      return;
    }
    if (!options.isAuthenticated) {
      fail("authentication_required");
      return;
    }
    if (phaseRef.current === "requesting_permission" || phaseRef.current === "starting" || phaseRef.current === "recording" || phaseRef.current === "stopping" || phaseRef.current === "uploading") return;

    const operation = operationRef.current + 1;
    operationRef.current = operation;
    startedAtRef.current = null;
    transition({ phase: "requesting_permission", message: "Checking microphone permission…", failure: null, transcript: "", durationMs: 0 });
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (operation !== operationRef.current) return;
      if (!permission.granted) {
        fail(permission.canAskAgain ? "permission_denied" : "permission_unavailable");
        return;
      }

      transition({ phase: "starting", message: "Preparing your microphone…", failure: null, transcript: "", durationMs: 0 });
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: "doNotMix",
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      if (operation !== operationRef.current) return;
      await recorder.prepareToRecordAsync();
      if (operation !== operationRef.current) return;
      if (!recorder.getStatus().canRecord) throw new Error("recorder unavailable");
      recorder.record();
      await new Promise<void>((resolve) => setTimeout(resolve, START_CONFIRMATION_DELAY_MS));
      if (operation !== operationRef.current) return;
      if (!recorder.getStatus().isRecording) throw new Error("recorder did not start");
      startedAtRef.current = Date.now();
      transition({
        phase: "recording",
        message: "Recording… up to 60 seconds. Nothing is sent until you stop.",
        failure: null,
        transcript: "",
        durationMs: 0,
      });
    } catch {
      if (operation === operationRef.current) fail("recording_start_failed");
      await restoreNonRecordingAudioMode();
    }
  }, [fail, options.isAuthenticated, recorder, restoreNonRecordingAudioMode, transition]);

  useEffect(() => {
    if (phaseRef.current !== "recording" || startedAtRef.current === null) return;
    const remainingMs = Math.max(0, KINFOLK_VOICE_MAX_DURATION_MS - (Date.now() - startedAtRef.current));
    const timer = setTimeout(() => { void stop(); }, remainingMs);
    return () => clearTimeout(timer);
  }, [state.phase, stop]);

  useEffect(() => {
    if (state.phase !== "recording" || recorderState.isRecording) return;
    const timer = setTimeout(() => {
      if (!recorder.getStatus().isRecording) void stop();
    }, INTERRUPTION_GRACE_MS);
    return () => clearTimeout(timer);
  }, [recorder, recorderState.isRecording, state.phase, stop]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") void cancel();
    });
    return () => subscription.remove();
  }, [cancel]);

  useEffect(() => () => {
    operationRef.current += 1;
    abortControllerRef.current?.abort();
    if (recorder.isRecording) {
      void recorder.stop().finally(() => clearTemporaryFile(recorder.uri));
    } else {
      clearTemporaryFile(recorder.uri);
    }
    void restoreNonRecordingAudioMode();
  }, [clearTemporaryFile, recorder, restoreNonRecordingAudioMode]);

  const clearTranscript = useCallback(() => {
    if (phaseRef.current !== "review") return;
    transition({ ...INITIAL_STATE, message: "Transcript discarded. Nothing was sent." });
  }, [transition]);

  const updateTranscript = useCallback((value: string) => {
    if (phaseRef.current !== "review") return;
    setState((current) => ({ ...current, transcript: value }));
  }, []);

  const openMicrophoneSettings = useCallback(async () => {
    if (!isNativeVoicePlatform()) return;
    await Linking.openSettings().catch(() => undefined);
  }, []);

  return useMemo(() => ({
    state,
    elapsedSeconds: state.phase === "recording"
      ? Math.min(60, Math.floor(Math.max(0, recorderState.durationMillis) / 1000))
      : 0,
    isNative: isNativeVoicePlatform(),
    canStart: state.phase === "idle" || state.phase === "error" || state.phase === "review",
    canStop: state.phase === "recording" || state.phase === "starting",
    canCancel: state.phase === "requesting_permission" || state.phase === "starting" || state.phase === "recording" || state.phase === "stopping",
    start,
    stop,
    cancel,
    clearTranscript,
    updateTranscript,
    openMicrophoneSettings,
  }), [cancel, clearTranscript, openMicrophoneSettings, recorderState.durationMillis, start, state, stop, updateTranscript]);
}
