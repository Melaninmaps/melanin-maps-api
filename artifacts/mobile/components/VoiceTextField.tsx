/**
 * VoiceTextField — textarea with optional native voice-to-text input.
 *
 * Rules (from brief):
 *  - Mic button inside the field, 44pt touch target, equal visual weight
 *  - Auto-saves draft text to AsyncStorage every 2 seconds
 *  - Full screen reader labels
 *  - Haptic feedback on mic press
 *  - Native voice input is explicit, 60 seconds maximum, and never auto-submits
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/lib/api";

const AUTH_TOKEN_KEY = "auth_session_token";
const MAX_VOICE_RECORDING_MS = 60_000;

type VoiceMimeType = "audio/mp4" | "audio/mpeg" | "audio/wav" | "audio/webm";

function inferVoiceMimeType(uri: string): VoiceMimeType | null {
  const extension = uri.split("?")[0]?.split(".").pop()?.toLowerCase();
  const mimeByExtension: Record<string, VoiceMimeType> = {
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    webm: "audio/webm",
  };
  return extension ? (mimeByExtension[extension] ?? null) : null;
}

function deleteTemporaryRecording(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    new FileSystem.File(uri).delete();
  } catch {
    // Temporary recordings are best-effort cleanup only. They are never uploaded on cancel.
  }
}

interface VoiceTextFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** AsyncStorage key for auto-saving draft — omit to disable */
  draftKey?: string;
  style?: ViewStyle;
  /** Max height before scrolling; default 160 */
  maxHeight?: number;
  accessibilityLabel?: string;
  onClearDraftReady?: (clearDraft: () => void) => void;
}

export function VoiceTextField({
  value,
  onChangeText,
  placeholder = "Only if you want to. Even a few words help.",
  draftKey,
  style,
  maxHeight = 160,
  accessibilityLabel = "Text field with voice option",
  onClearDraftReady,
}: VoiceTextFieldProps) {
  const colors = useColors();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [recordingElapsedSeconds, setRecordingElapsedSeconds] = useState(0);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestValue = useRef(value);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recorderConfirmedRef = useRef(false);
  const recordingStopInProgressRef = useRef(false);
  const activeRecordingUriRef = useRef<string | null>(null);
  const transcriptionAbortRef = useRef<AbortController | null>(null);
  const componentMountedRef = useRef(true);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  useEffect(() => {
    componentMountedRef.current = true;
    return () => {
      componentMountedRef.current = false;
    };
  }, []);

  const handleTextChange = useCallback(
    (nextValue: string) => {
      // Update synchronously so a completed transcript can never overwrite
      // text the member entered while a recording was being transcribed.
      latestValue.current = nextValue;
      onChangeText(nextValue);
    },
    [onChangeText],
  );

  // ── Restore draft on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!draftKey) return;
    AsyncStorage.getItem(draftKey).then((saved) => {
      if (saved && !value) handleTextChange(saved);
    });
  }, [draftKey, handleTextChange, value]);

  // ── Auto-save draft every 2 s ─────────────────────────────────────────────
  useEffect(() => {
    if (!draftKey) return;
    autoSaveTimer.current = setInterval(() => {
      if (latestValue.current) {
        AsyncStorage.setItem(draftKey, latestValue.current).catch(() => {});
      }
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [draftKey]);

  const resetAudioMode = useCallback(async () => {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    }).catch(() => undefined);
  }, []);

  const stopVoiceRecording = useCallback(async () => {
    if (recordingStopInProgressRef.current) return;
    if (!recorder.isRecording && !isRecording) return;
    recordingStopInProgressRef.current = true;

    setIsRecording(false);
    setIsTranscribing(true);
    setVoiceStatus("Turning your words into text…");
    let recordingUri: string | null = null;
    let transcriptionAbort: AbortController | null = null;

    try {
      const durationMs =
        recordingStartedAtRef.current === null
          ? 0
          : Math.min(
              MAX_VOICE_RECORDING_MS,
              Math.max(0, Date.now() - recordingStartedAtRef.current),
            );
      recordingStartedAtRef.current = null;

      if (recorder.isRecording) await recorder.stop();
      recordingUri = recorder.uri;
      if (!componentMountedRef.current) {
        deleteTemporaryRecording(recordingUri);
        return;
      }
      if (!recordingUri) {
        throw new Error(
          "No recording was captured. Please try again or type your response.",
        );
      }
      activeRecordingUriRef.current = recordingUri;

      const mimeType = inferVoiceMimeType(recordingUri);
      if (!mimeType) {
        throw new Error(
          "This recording format is not supported. Please try again or type your response.",
        );
      }

      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error(
          "Your sign-in expired before transcription. Your typed response is still here; sign in and try again.",
        );
      }

      const form = new FormData();
      // Expo's Blob-compatible File reaches the existing route as a normal
      // multipart attachment on current native runtimes.
      form.append("audio", new FileSystem.File(recordingUri));
      form.append("durationMs", String(durationMs));
      form.append("mimeType", mimeType);
      transcriptionAbort = new AbortController();
      transcriptionAbortRef.current = transcriptionAbort;
      if (!componentMountedRef.current) {
        transcriptionAbort.abort();
        return;
      }

      const response = await fetch(`${getApiBase()}/api/kinfolk/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        signal: transcriptionAbort.signal,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        text?: unknown;
        error?: unknown;
        message?: unknown;
      };

      if (!response.ok) {
        const serverMessage =
          typeof payload.message === "string"
            ? payload.message
            : typeof payload.error === "string"
              ? payload.error
              : "Voice transcription failed. Please try again or type your response.";
        throw new Error(serverMessage);
      }

      const transcript =
        typeof payload.text === "string" ? payload.text.trim() : "";
      if (!transcript) {
        throw new Error(
          "Kinfolk could not hear that clearly. Please try again or type your response.",
        );
      }
      if (!componentMountedRef.current) return;

      // Preserve existing typed content and add only the server's raw transcript.
      // The caller remains responsible for reviewing and submitting the form.
      const draft = latestValue.current;
      const separator = draft && !/\s$/.test(draft) ? " " : "";
      onChangeText(`${draft}${separator}${transcript}`);
      setVoiceStatus("Your words were added. Review them before submitting.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Voice recording failed. You can keep typing your response.";
      setVoiceStatus(message);
    } finally {
      if (transcriptionAbortRef.current === transcriptionAbort) {
        transcriptionAbortRef.current = null;
      }
      deleteTemporaryRecording(recordingUri);
      if (activeRecordingUriRef.current === recordingUri) {
        activeRecordingUriRef.current = null;
      }
      recordingStartedAtRef.current = null;
      recorderConfirmedRef.current = false;
      recordingStopInProgressRef.current = false;
      setRecordingElapsedSeconds(0);
      setIsTranscribing(false);
      await resetAudioMode();
    }
  }, [isRecording, onChangeText, recorder, resetAudioMode]);

  const startVoiceRecording = useCallback(async () => {
    if (Platform.OS === "web") {
      setVoiceStatus(
        "Voice recording is available in the Mapping With Melanin mobile app. You can type here.",
      );
      return;
    }
    if (recorder.isRecording || isRecording || isTranscribing) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (!token) {
        setVoiceStatus(
          "Sign in to use voice input. Your typed response remains available.",
        );
        return;
      }

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setVoiceStatus(
          permission.canAskAgain
            ? "Allow microphone access, then tap the mic again."
            : "Microphone access is off. Enable it for Mapping With Melanin in your phone Settings, then try again.",
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: "doNotMix",
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      await recorder.prepareToRecordAsync();
      if (!recorder.getStatus().canRecord) {
        throw new Error(
          "Your phone could not prepare its microphone. Check microphone access and try again.",
        );
      }

      // forDuration is enforced by the native recorder, rather than relying on
      // JavaScript timer precision for the 60-second server limit.
      recordingStartedAtRef.current = Date.now();
      recorderConfirmedRef.current = false;
      recorder.record({ forDuration: MAX_VOICE_RECORDING_MS / 1000 });
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (!recorder.getStatus().isRecording) {
        throw new Error(
          "Your phone did not begin recording. Check microphone access and try again.",
        );
      }

      recorderConfirmedRef.current = true;
      setRecordingElapsedSeconds(0);
      setIsRecording(true);
      setVoiceStatus("Recording… Tap stop when you are finished.");
    } catch (error) {
      recordingStartedAtRef.current = null;
      recorderConfirmedRef.current = false;
      setIsRecording(false);
      const message =
        error instanceof Error
          ? error.message
          : "Voice recording could not start. You can type your response.";
      setVoiceStatus(message);
      await resetAudioMode();
    }
  }, [isRecording, isTranscribing, recorder, resetAudioMode]);

  const discardVoiceRecording = useCallback(async () => {
    if (recordingStopInProgressRef.current) return;
    if (!recorder.isRecording && !isRecording) return;
    recordingStopInProgressRef.current = true;

    setIsRecording(false);
    let recordingUri: string | null = null;
    try {
      if (recorder.isRecording) await recorder.stop();
      recordingUri = recorder.uri;
      setVoiceStatus(
        latestValue.current
          ? "Recording canceled. Your typed response is still here."
          : "Recording canceled. Nothing was uploaded.",
      );
    } catch {
      setVoiceStatus("Recording canceled. Nothing was uploaded.");
    } finally {
      deleteTemporaryRecording(recordingUri);
      recordingStartedAtRef.current = null;
      recorderConfirmedRef.current = false;
      recordingStopInProgressRef.current = false;
      setRecordingElapsedSeconds(0);
      await resetAudioMode();
    }
  }, [isRecording, recorder, resetAudioMode]);

  useEffect(() => {
    if (!isRecording || recordingStartedAtRef.current === null) return;

    const updateElapsed = () => {
      const elapsedMs = Math.max(
        0,
        Date.now() - (recordingStartedAtRef.current ?? Date.now()),
      );
      setRecordingElapsedSeconds(Math.min(60, Math.floor(elapsedMs / 1000)));
    };
    updateElapsed();
    const ticker = setInterval(updateElapsed, 250);

    return () => {
      clearInterval(ticker);
    };
  }, [isRecording, stopVoiceRecording]);

  useEffect(() => {
    if (
      !isRecording ||
      !recorderConfirmedRef.current ||
      recorderState.isRecording ||
      recordingStopInProgressRef.current
    ) {
      return;
    }

    // The native forDuration cap sets the recorder state to stopped. Allow a
    // brief status-poll buffer before beginning normal transcription handling.
    const completionTimer = setTimeout(() => {
      if (!recorder.getStatus().isRecording) void stopVoiceRecording();
    }, 350);
    return () => clearTimeout(completionTimer);
  }, [isRecording, recorder, recorderState.isRecording, stopVoiceRecording]);

  useEffect(() => {
    return () => {
      void (async () => {
        transcriptionAbortRef.current?.abort();
        const capturedRecordingUri = activeRecordingUriRef.current;
        if (capturedRecordingUri) {
          deleteTemporaryRecording(capturedRecordingUri);
          activeRecordingUriRef.current = null;
        }

        if (recordingStopInProgressRef.current) {
          await resetAudioMode();
          return;
        }
        recordingStopInProgressRef.current = true;
        let recordingUri = recorder.uri;
        try {
          if (recorder.isRecording) await recorder.stop();
          recordingUri = recorder.uri;
        } catch {
          // Navigation must never turn an abandoned recording into an upload.
        } finally {
          deleteTemporaryRecording(recordingUri);
          if (activeRecordingUriRef.current === recordingUri) {
            activeRecordingUriRef.current = null;
          }
          recordingStartedAtRef.current = null;
          recorderConfirmedRef.current = false;
          await resetAudioMode();
        }
      })();
    };
  }, [recorder, resetAudioMode]);

  const clearDraft = useCallback(() => {
    if (draftKey) AsyncStorage.removeItem(draftKey).catch(() => {});
  }, [draftKey]);

  useEffect(() => {
    onClearDraftReady?.(clearDraft);
  }, [clearDraft, onClearDraftReady]);

  const micAccessibilityLabel =
    Platform.OS === "web"
      ? "Voice recording is available in the mobile app; type your response here"
      : isRecording
        ? "Stop voice recording and turn it into text"
        : isTranscribing
          ? "Turning your voice recording into text"
          : "Start voice recording, 60 second maximum";

  return (
    <View
      style={[
        styles.wrapper,
        { borderColor: colors.border, backgroundColor: colors.card },
        style,
      ]}
    >
      <View style={styles.inputArea}>
        <TextInput
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[
            styles.input,
            {
              color: colors.foreground,
              maxHeight,
              paddingRight: 62,
            },
          ]}
          textAlignVertical="top"
          accessibilityLabel={accessibilityLabel}
          returnKeyType="default"
        />

        <TouchableOpacity
          onPress={() =>
            void (isRecording ? stopVoiceRecording() : startVoiceRecording())
          }
          disabled={isTranscribing}
          style={[
            styles.micButton,
            { backgroundColor: isRecording ? "#DC2626" : colors.muted },
            isTranscribing ? styles.micButtonDisabled : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={micAccessibilityLabel}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Feather
            name={isRecording ? "square" : "mic"}
            size={19}
            color={isRecording ? "#FFFFFF" : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {voiceStatus ? (
        <View
          style={[
            styles.voiceStatus,
            {
              borderTopColor: colors.border,
              backgroundColor: isRecording ? "#FEF2F2" : colors.muted,
            },
          ]}
        >
          <Text
            style={[
              styles.voiceStatusText,
              { color: isRecording ? "#B91C1C" : colors.mutedForeground },
            ]}
          >
            {isRecording
              ? `${voiceStatus} ${recordingElapsedSeconds}s / 60s`
              : voiceStatus}
          </Text>
          {isRecording ? (
            <TouchableOpacity
              onPress={() => void discardVoiceRecording()}
              style={styles.discardButton}
              accessibilityRole="button"
              accessibilityLabel="Cancel and discard this voice recording"
            >
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1.5,
    borderRadius: 12,
    minHeight: 100,
    overflow: "hidden",
  },
  inputArea: {
    minHeight: 100,
    position: "relative",
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    padding: 14,
    paddingTop: Platform.OS === "ios" ? 14 : 10,
  },
  micButton: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonDisabled: {
    opacity: 0.55,
  },
  voiceStatus: {
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceStatusText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  discardButton: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  discardButtonText: {
    color: "#B91C1C",
    fontSize: 11,
    fontWeight: "700",
  },
});
