import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { getApiBase } from "@/lib/api";
import { createVoiceRecordingControl } from "@/lib/voiceRecordingControl";
import { useColors } from "@/hooks/useColors";
import {
  createVoicePreflightStages,
  formatVoicePreflightLog,
  inferVoicePreflightMimeType,
  type VoicePreflightAttempt,
  type VoicePreflightRoute,
  type VoicePreflightStageId,
  updateVoicePreflightStage,
  VOICE_PREFLIGHT_PROMPT,
  voicePreflightFailure,
} from "@/lib/voicePreflight";

const AUTH_TOKEN_KEY = "auth_session_token";
const ROUTES: ReadonlyArray<{ id: VoicePreflightRoute; label: string; detail: string }> = [
  { id: "phone_speaker", label: "Phone speaker", detail: "Device speaker" },
  { id: "wired_headphones", label: "Wired headphones", detail: "Physical wired route" },
  { id: "bluetooth", label: "Bluetooth", detail: "Paired Bluetooth headphones/speaker" },
  { id: "car_audio", label: "Car audio", detail: "Paired vehicle route" },
];

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function nextAttemptId(): string {
  return `voice-${Date.now().toString(36)}`;
}

function isKnownRoute(route: VoicePreflightRoute): boolean {
  return route !== "unconfirmed";
}

function stageGlyph(state: VoicePreflightAttempt["stages"][number]["state"]): keyof typeof Feather.glyphMap {
  if (state === "passed") return "check-circle";
  if (state === "failed") return "alert-circle";
  if (state === "running") return "loader";
  if (state === "needs_tester_confirmation") return "user-check";
  return "circle";
}

function stageColor(state: VoicePreflightAttempt["stages"][number]["state"], primary: string): string {
  if (state === "passed") return "#15803D";
  if (state === "failed") return "#B91C1C";
  if (state === "running") return primary;
  if (state === "needs_tester_confirmation") return "#A16207";
  return "#6B7280";
}

export default function KinfolkVoicePreflightScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [route, setRoute] = useState<VoicePreflightRoute>("unconfirmed");
  const [attempts, setAttempts] = useState<VoicePreflightAttempt[]>([]);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPreparingSpeech, setIsPreparingSpeech] = useState(false);
  const [playRequested, setPlayRequested] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedDurationMs, setRecordedDurationMs] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [playbackUri, setPlaybackUri] = useState<string | undefined>();
  const playbackFileRef = useRef<FileSystem.File | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const activeAttemptRef = useRef<string | null>(null);
  const recordingControlRef = useRef(createVoiceRecordingControl());
  const recordingSessionRef = useRef<number | null>(null);
  const recordingStartGenerationRef = useRef(0);
  const player = useAudioPlayer(playbackUri);
  const playerStatus = useAudioPlayerStatus(player);

  const activeAttempt = useMemo(
    () => attempts.find((attempt) => attempt.id === activeAttemptId) ?? null,
    [attempts, activeAttemptId],
  );
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const updateStage = useCallback((id: VoicePreflightStageId, state: VoicePreflightAttempt["stages"][number]["state"], detail: string) => {
    const attemptId = activeAttemptRef.current;
    if (!attemptId) return;
    setAttempts((current) => current.map((attempt) => attempt.id === attemptId
      ? { ...attempt, stages: updateVoicePreflightStage(attempt.stages, id, state, detail) }
      : attempt));
  }, []);

  const cleanPlaybackFile = useCallback(() => {
    const file = playbackFileRef.current;
    playbackFileRef.current = null;
    setPlaybackUri(undefined);
    if (file?.exists) {
      try { file.delete(); } catch { /* temporary synthesis cache cleanup */ }
    }
  }, []);

  const cleanRecordedFile = useCallback((uri: string | null) => {
    if (!uri) return;
    try {
      const file = new FileSystem.File(uri);
      if (file.exists) file.delete();
    } catch { /* local raw recording cleanup is best effort */ }
  }, []);

  const resetForNewAttempt = useCallback(() => {
    cleanRecordedFile(recordedUri);
    cleanPlaybackFile();
    setRecordedUri(null);
    setRecordedDurationMs(0);
    setTranscript("");
    setReply("");
    setPlayRequested(false);
  }, [cleanPlaybackFile, cleanRecordedFile, recordedUri]);

  const abortPreflightRecording = useCallback(async (
    detail: string,
    updateAttempt = true,
  ) => {
    recordingStartGenerationRef.current += 1;
    const hadActiveRecording = recorder.isRecording
      || recordingStartedAtRef.current !== null
      || recordingSessionRef.current !== null;
    recordingControlRef.current.cancel();
    recordingSessionRef.current = null;
    recordingStartedAtRef.current = null;
    const uriBeforeStop = recorder.uri;
    try {
      if (recorder.isRecording) await recorder.stop();
    } catch {
      // An interruption cleanup must continue even if the native recorder has
      // already been stopped by the operating system.
    } finally {
      cleanRecordedFile(recorder.uri ?? uriBeforeStop);
      setRecordedUri(null);
      setRecordedDurationMs(0);
      setIsStopping(false);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    }
    if (hadActiveRecording && updateAttempt) {
      updateStage("recording_started", "failed", detail);
    }
  }, [cleanRecordedFile, recorder, updateStage]);

  const startPreflight = async () => {
    if (Platform.OS === "web" || isStarting || isStopping || recorder.isRecording) return;
    if (!isAuthenticated || authLoading) {
      Alert.alert("Sign in required", "Sign in before running Kinfolk Voice Preflight. No recording is made until you start a test.", [
        { text: "Not now", style: "cancel" },
        { text: "Sign in", onPress: () => router.push("/login" as never) },
      ]);
      return;
    }
    const startGeneration = recordingStartGenerationRef.current + 1;
    recordingStartGenerationRef.current = startGeneration;
    const startStillAllowed = () => startGeneration === recordingStartGenerationRef.current
      && AppState.currentState === "active";
    resetForNewAttempt();
    const attemptId = nextAttemptId();
    const now = new Date().toISOString();
    const stages = createVoicePreflightStages();
    const initialAttempt: VoicePreflightAttempt = {
      id: attemptId,
      startedAt: now,
      platform: Platform.OS,
      route,
      stages: updateVoicePreflightStage(
        stages,
        "audio_route",
        isKnownRoute(route) ? "passed" : "failed",
        isKnownRoute(route)
          ? `Tester selected ${ROUTES.find((item) => item.id === route)?.detail ?? route}.`
          : voicePreflightFailure("audio_route"),
      ),
    };
    activeAttemptRef.current = attemptId;
    setActiveAttemptId(attemptId);
    setAttempts((current) => [initialAttempt, ...current].slice(0, 8));

    if (!isKnownRoute(route)) {
      Alert.alert("Choose an audio route", "Select the speaker, wired, Bluetooth, or car route you are physically testing before recording.");
      return;
    }

    setIsStarting(true);
    updateStage("permission", "running", "Checking microphone permission.");
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!startStillAllowed()) return;
      if (!permission.granted) {
        updateStage("permission", "failed", voicePreflightFailure("permission"));
        updateStage("recording_started", "failed", "Recording cannot start until microphone permission is granted.");
        Alert.alert("Microphone permission is off", permission.canAskAgain
          ? "Allow microphone access, then retry the Voice Preflight."
          : "Open phone Settings, enable Mapping With Melanin microphone access, then retry.");
        return;
      }
      updateStage("permission", "passed", "Microphone permission granted.");
      updateStage("recording_started", "running", "Preparing device recorder.");
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldRouteThroughEarpiece: false });
      if (!startStillAllowed()) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
        return;
      }
      await recorder.prepareToRecordAsync();
      if (!startStillAllowed()) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
        return;
      }
      recorder.record();
      await new Promise<void>((resolve) => setTimeout(resolve, 80));
      if (!startStillAllowed()) {
        if (recorder.isRecording) await recorder.stop();
        cleanRecordedFile(recorder.uri);
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
        return;
      }
      if (!recorder.getStatus().isRecording) {
        throw new Error("Your phone did not begin recording. Check microphone access and try again.");
      }
      recordingSessionRef.current = recordingControlRef.current.begin();
      recordingStartedAtRef.current = Date.now();
      updateStage("recording_started", "passed", "Recording started. Speak the preflight sentence, then tap Stop.");
    } catch (error) {
      if (!startStillAllowed()) return;
      recordingControlRef.current.cancel();
      recordingSessionRef.current = null;
      const message = error instanceof Error ? error.message : "Unable to start the recorder.";
      updateStage("recording_started", "failed", voicePreflightFailure("recording_started", `Recording did not start: ${message}`));
      Alert.alert("Recording did not start", "Check microphone permission and retry the Voice Preflight.");
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    } finally {
      setIsStarting(false);
    }
  };

  const stopAndTranscribe = async () => {
    if (!recorderState.isRecording || isStopping) return;
    const recordingSession = recordingSessionRef.current;
    setIsStopping(true);
    updateStage("recording_captured", "running", "Stopping recorder and reading technical metadata.");
    let temporaryRecordingUri: string | null = null;
    try {
      const durationMs = recordingStartedAtRef.current === null
        ? recorderState.durationMillis
        : Math.max(0, Date.now() - recordingStartedAtRef.current);
      recordingStartedAtRef.current = null;
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        updateStage("recording_captured", "failed", voicePreflightFailure("recording_captured"));
        return;
      }
      const mimeType = inferVoicePreflightMimeType(uri);
      const file = new FileSystem.File(uri);
      const fileSize = file.size ?? file.info().size ?? 0;
      if (!mimeType || fileSize < 100) {
        updateStage("recording_captured", "failed", voicePreflightFailure(
          "recording_captured",
          !mimeType
            ? "Recording did not produce a supported file type. Try again."
            : "Recording did not produce usable audio bytes. Try again.",
        ));
        cleanRecordedFile(uri);
        return;
      }
      setRecordedUri(uri);
      temporaryRecordingUri = uri;
      setRecordedDurationMs(durationMs);
      if (!recordingControlRef.current.permitsTranscription(recordingSession)) {
        updateStage("recording_captured", "failed", "Recording was interrupted or canceled. The raw file was deleted and was not uploaded.");
        return;
      }
      updateStage("recording_captured", "passed", `${durationMs} ms · ${fileSize} bytes · declared ${mimeType}. Raw audio remains only in temporary device cache.`);
      updateStage("transcription_upload", "running", "Uploading temporary recording to Kinfolk transcription.");

      const token = await getToken();
      if (!token) {
        updateStage("transcription_upload", "failed", "Upload could not start because the signed-in session expired. Sign in again and retry.");
        return;
      }
      const form = new FormData();
      form.append("audio", file);
      form.append("durationMs", String(durationMs));
      form.append("mimeType", mimeType);
      if (!recordingControlRef.current.permitsTranscription(recordingSession)) {
        updateStage("transcription_upload", "failed", "Recording was interrupted or canceled. The raw file was deleted and was not uploaded.");
        return;
      }
      const transcriptionAbortController = recordingControlRef.current.beginTranscription(recordingSession);
      if (!transcriptionAbortController) {
        updateStage("transcription_upload", "failed", "Recording was interrupted or canceled. The raw file was deleted and was not uploaded.");
        return;
      }
      const response = await fetch(`${getApiBase()}/api/kinfolk/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        signal: transcriptionAbortController.signal,
      });
      if (!recordingControlRef.current.permitsTranscription(recordingSession)) return;
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
        if (!recordingControlRef.current.permitsTranscription(recordingSession)) return;
        const message = payload.message?.trim() || `Upload failed with HTTP ${response.status}. Try again.`;
        updateStage("transcription_upload", "failed", voicePreflightFailure("transcription_upload", message));
        return;
      }
      updateStage("transcription_upload", "passed", "Upload reached /kinfolk/transcribe and returned successfully.");
      const payload = await response.json() as { text?: string };
      if (!recordingControlRef.current.permitsTranscription(recordingSession)) return;
      if (!payload.text?.trim()) {
        updateStage("transcript_inserted", "failed", voicePreflightFailure("transcript_inserted"));
        return;
      }
      setTranscript(payload.text.trim());
      updateStage("transcript_inserted", "passed", "Transcript returned and inserted for review. The text is not copied into the technical log.");
    } catch (error) {
      if (!recordingControlRef.current.permitsTranscription(recordingSession)) return;
      const message = error instanceof Error ? error.message : "Unknown recording error.";
      updateStage("transcription_upload", "failed", voicePreflightFailure("transcription_upload", `Upload failed—try again. ${message}`));
    } finally {
      const ownsActiveSession = recordingSessionRef.current === recordingSession;
      if (ownsActiveSession) {
        recordingControlRef.current.finish(recordingSession);
        recordingSessionRef.current = null;
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
      }
      cleanRecordedFile(temporaryRecordingUri);
      if (ownsActiveSession) {
        setRecordedUri(null);
        setIsStopping(false);
      }
    }
  };

  const sendTranscript = async () => {
    const message = transcript.trim();
    if (!message || isSending) return;
    setIsSending(true);
    updateStage("chat_reply", "running", "Sending reviewed transcript to Kinfolk.");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your signed-in session expired.");
      const response = await fetch(`${getApiBase()}/api/kinfolk/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message,
          sessionId: activeAttemptRef.current ? `voice-preflight-${activeAttemptRef.current}` : undefined,
          voiceMode: "community",
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string; message?: string };
        throw new Error(payload.message?.trim() || payload.error?.trim() || `HTTP ${response.status}`);
      }
      const payload = await response.json() as { reply?: string };
      if (!payload.reply?.trim()) throw new Error("Kinfolk returned no text reply.");
      setReply(payload.reply.trim());
      updateStage("chat_reply", "passed", "Message sent and Kinfolk returned a text reply. Reply text is not copied into the technical log.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown chat error.";
      updateStage("chat_reply", "failed", voicePreflightFailure("chat_reply", `Kinfolk did not return a text reply: ${message}`));
    } finally {
      setIsSending(false);
    }
  };

  const prepareSpeech = async () => {
    if (!reply || isPreparingSpeech) return;
    setIsPreparingSpeech(true);
    cleanPlaybackFile();
    updateStage("speech_created", "running", "Requesting playable Kinfolk speech audio.");
    try {
      const token = await getToken();
      if (!token) throw new Error("Your signed-in session expired.");
      const response = await fetch(`${getApiBase()}/api/kinfolk/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: reply, mode: "community", requestId: activeAttemptRef.current ?? "voice-preflight" }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
        throw new Error(payload.message?.trim() || payload.error?.trim() || `HTTP ${response.status}`);
      }
      const payload = await response.json() as {
        audio?: string;
        format?: string;
        speakerProfile?: "standard" | "female";
        speakerLabel?: string;
      };
      if (!payload.audio || !payload.format) throw new Error("Kinfolk returned no playable audio payload.");
      const file = new FileSystem.File(FileSystem.Paths.cache, `kinfolk-voice-preflight-${Date.now()}.${payload.format}`);
      file.write(payload.audio, { encoding: FileSystem.EncodingType.Base64 });
      playbackFileRef.current = file;
      setPlaybackUri(file.uri);
      const speakerLabel = payload.speakerProfile === "female"
        ? "Female Voice"
        : payload.speakerProfile === "standard"
          ? "Standard Kinfolk Voice"
          : "the saved Kinfolk Voice";
      updateStage("speech_created", "passed", `Kinfolk returned ${speakerLabel} speech audio and the temporary playback file was prepared.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown speech error.";
      updateStage("speech_created", "failed", voicePreflightFailure("speech_created", `Kinfolk could not create speech audio: ${message}`));
    } finally {
      setIsPreparingSpeech(false);
    }
  };

  const playSpeech = async () => {
    if (!playbackUri || !playerStatus.isLoaded) {
      updateStage("playback_started", "failed", voicePreflightFailure("playback_started", "Speech playback could not start because audio has not finished loading. Tap Play again in a moment."));
      return;
    }
    updateStage("playback_started", "running", "Starting playback on the selected route.");
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: "duckOthers",
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      player.volume = 1;
      player.play();
      setPlayRequested(true);
      updateStage("playback_started", "passed", "Playback started. Confirm you can hear it on the selected physical route.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown player error.";
      updateStage("playback_started", "failed", voicePreflightFailure("playback_started", `Speech playback could not start: ${message}`));
    }
  };

  useEffect(() => {
    if (!playerStatus.error) return;
    updateStage("playback_started", "failed", voicePreflightFailure("playback_started", `Speech playback could not start: ${playerStatus.error}`));
    cleanPlaybackFile();
  }, [cleanPlaybackFile, playerStatus.error, updateStage]);

  useEffect(() => {
    if (!playRequested || !playerStatus.didJustFinish) return;
    updateStage("playback_completed", "passed", "Playback completed on the selected route.");
    setPlayRequested(false);
    cleanPlaybackFile();
  }, [cleanPlaybackFile, playerStatus.didJustFinish, playRequested, updateStage]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") return;
      if (player.playing) player.pause();
      void abortPreflightRecording("Recording was interrupted because the app left the foreground. The raw file was deleted and was not uploaded.");
    });
    return () => subscription.remove();
  }, [abortPreflightRecording, player]);

  useEffect(() => () => {
    void abortPreflightRecording("Voice Preflight closed before recording completed.", false);
    cleanPlaybackFile();
  }, [abortPreflightRecording, cleanPlaybackFile]);

  const copyLog = async () => {
    await Clipboard.setStringAsync(formatVoicePreflightLog(attempts));
    Alert.alert("Technical log copied", "The copied log contains stages and technical metadata only—never recording contents, transcript text, tokens, or raw audio.");
  };

  const retry = () => {
    void (async () => {
      await abortPreflightRecording("Recording was canceled before retry. The raw file was deleted and was not uploaded.", false);
      resetForNewAttempt();
      await startPreflight();
    })();
  };

  const canStop = recorderState.isRecording && !isStopping;
  const canSend = Boolean(transcript.trim()) && !isSending;
  const canPrepareSpeech = Boolean(reply) && !isPreparingSpeech;
  const canPlay = Boolean(playbackUri) && playerStatus.isLoaded && !playerStatus.playing;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityLabel="Back to Kinfolk settings">
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Voice Preflight</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Technical check before a device-test build</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 36 }]} keyboardShouldPersistTaps="handled">
        <View style={[styles.notice, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "35" }]}>
          <Feather name="shield" size={18} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.foreground }]}>This screen records technical status only. It never saves raw audio, transcript text, account tokens, or recording files. Temporary audio is deleted after the attempt or when this screen closes.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SELECT THE PHYSICAL ROUTE TO TEST</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>Your device, not the app, determines the active hardware route. Select the route you are physically using so the log stays honest.</Text>
          <View style={styles.routeGrid}>
            {ROUTES.map((option) => {
              const selected = route === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setRoute(option.id)}
                  style={[styles.routeButton, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + "16" : colors.background }]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Test ${option.label}`}
                >
                  <Feather name={option.id === "bluetooth" ? "bluetooth" : option.id === "wired_headphones" ? "headphones" : option.id === "car_audio" ? "truck" : "volume-2"} size={17} color={selected ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.routeLabel, { color: selected ? colors.primary : colors.foreground }]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RUN ONE VOICE ATTEMPT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.preflightPrompt, { color: colors.foreground }]}>Say this after recording starts:</Text>
          <Text style={[styles.promptQuote, { color: colors.primary }]}>{VOICE_PREFLIGHT_PROMPT}</Text>
          <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>Your saved Kinfolk Settings Voice controls the speaker for this test. Record, stop, review the transcript, send, prepare Kinfolk speech, and tap Play. Repeat with Standard Kinfolk Voice and Female Voice on each route, then complete five consecutive normal voice turns.</Text>
          {!recorderState.isRecording ? (
            <TouchableOpacity
              onPress={() => void startPreflight()}
              disabled={isStarting || isStopping || authLoading}
              style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: isStarting || isStopping || authLoading ? 0.65 : 1 }]}
              accessibilityLabel="Start Kinfolk Voice Preflight recording"
            >
              {isStarting ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="mic" size={17} color={colors.primaryForeground} />}
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Start recording</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => void stopAndTranscribe()} disabled={!canStop} style={[styles.stopButton, { borderColor: "#DC2626", opacity: canStop ? 1 : 0.65 }]} accessibilityLabel="Stop Voice Preflight recording">
              <Feather name="square" size={16} color="#B91C1C" />
              <Text style={styles.stopButtonText}>Stop recording · {Math.ceil(recorderState.durationMillis / 1000)}s</Text>
            </TouchableOpacity>
          )}
        </View>

        {transcript ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Review transcript before sending</Text>
            <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>This editable text stays only in this screen. It is intentionally excluded from the technical log.</Text>
            <TextInput
              value={transcript}
              onChangeText={setTranscript}
              multiline
              accessibilityLabel="Voice Preflight transcript review"
              style={[styles.transcriptInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            />
            <TouchableOpacity onPress={() => void sendTranscript()} disabled={!canSend} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: canSend ? 1 : 0.65 }]} accessibilityLabel="Send reviewed voice transcript to Kinfolk">
              {isSending ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="send" size={16} color={colors.primaryForeground} />}
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Send transcript</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {reply ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Kinfolk text reply</Text>
            <Text selectable style={[styles.replyText, { color: colors.foreground }]}>{reply}</Text>
            <TouchableOpacity onPress={() => void prepareSpeech()} disabled={!canPrepareSpeech} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: canPrepareSpeech ? 1 : 0.65 }]} accessibilityLabel="Prepare Kinfolk spoken response">
              {isPreparingSpeech ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="volume-2" size={16} color={colors.primaryForeground} />}
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Prepare spoken reply</Text>
            </TouchableOpacity>
            {playbackUri ? (
              <TouchableOpacity onPress={() => void playSpeech()} disabled={!canPlay} style={[styles.playButton, { borderColor: colors.primary, opacity: canPlay ? 1 : 0.65 }]} accessibilityLabel="Play Kinfolk voice preflight reply">
                <Feather name={playerStatus.playing ? "volume-2" : "play"} size={16} color={colors.primary} />
                <Text style={[styles.playButtonText, { color: colors.primary }]}>{playerStatus.playing ? "Playing…" : "Play spoken reply"}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ATTEMPT LOG</Text>
        {activeAttempt ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.attemptHeader}>
              <View>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>Current attempt</Text>
                <Text style={[styles.attemptMeta, { color: colors.mutedForeground }]}>{activeAttempt.id} · {activeAttempt.platform} · {recordedDurationMs ? `${recordedDurationMs} ms captured` : "awaiting recording"}</Text>
              </View>
              <TouchableOpacity onPress={retry} style={[styles.retryButton, { borderColor: colors.primary }]} accessibilityLabel="Retry Voice Preflight">
                <Feather name="rotate-ccw" size={14} color={colors.primary} />
                <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
              </TouchableOpacity>
            </View>
            {activeAttempt.stages.map((stage) => (
              <View key={stage.id} style={[styles.stageRow, { borderTopColor: colors.border }]}>
                <Feather name={stageGlyph(stage.state)} size={16} color={stageColor(stage.state, colors.primary)} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stageLabel, { color: colors.foreground }]}>{stage.label}</Text>
                  <Text style={[styles.stageDetail, { color: colors.mutedForeground }]}>{stage.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyLog, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>Start a recording to create the first technical attempt log.</Text>
          </View>
        )}

        <TouchableOpacity onPress={() => void copyLog()} disabled={attempts.length === 0} style={[styles.copyLogButton, { borderColor: colors.border, opacity: attempts.length ? 1 : 0.55 }]} accessibilityLabel="Copy redacted Voice Preflight technical log">
          <Feather name="copy" size={15} color={colors.foreground} />
          <Text style={[styles.copyLogText, { color: colors.foreground }]}>Copy redacted technical log</Text>
        </TouchableOpacity>

        <View style={[styles.manualCard, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
          <Feather name="clipboard" size={17} color="#A16207" />
          <View style={{ flex: 1 }}>
            <Text style={styles.manualTitle}>Required device gate</Text>
            <Text style={styles.manualText}>Run and retain a successful Standard Kinfolk Voice and Female Voice attempt on phone speaker, wired headphones, and Bluetooth/car audio. Then test permission denied → Settings enabled, weak network → retry, background during playback → return, cancel recording, and five consecutive normal voice turns. This screen logs stages; a human tester must confirm that sound was actually heard on each physical route.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingBottom: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  scroll: { padding: 20, gap: 10 },
  notice: { flexDirection: "row", gap: 10, padding: 13, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 11, letterSpacing: 0.8, fontFamily: "Inter_600SemiBold", marginTop: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 11 },
  cardHint: { fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" },
  routeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  routeButton: { minWidth: "46%", flexGrow: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 11 },
  routeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  preflightPrompt: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  promptQuote: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 19, fontStyle: "italic" },
  primaryButton: { minHeight: 45, borderRadius: 10, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryButtonText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  stopButton: { minHeight: 45, borderRadius: 10, borderWidth: 1, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FEF2F2" },
  stopButtonText: { color: "#B91C1C", fontFamily: "Inter_700Bold", fontSize: 13 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  transcriptInput: { minHeight: 94, borderRadius: 10, borderWidth: 1, padding: 11, textAlignVertical: "top", fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  replyText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  playButton: { minHeight: 43, borderRadius: 10, borderWidth: 1, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  playButtonText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  attemptHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10, paddingBottom: 3 },
  attemptMeta: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 3 },
  retryButton: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 6 },
  retryText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  stageRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  stageLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  stageDetail: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 2 },
  emptyLog: { padding: 14, borderRadius: 14, borderWidth: 1 },
  copyLogButton: { minHeight: 43, borderRadius: 10, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 3 },
  copyLogText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  manualCard: { flexDirection: "row", gap: 10, padding: 13, borderRadius: 12, borderWidth: 1, marginTop: 12 },
  manualTitle: { color: "#854D0E", fontFamily: "Inter_700Bold", fontSize: 12, marginBottom: 3 },
  manualText: { color: "#713F12", fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
});
