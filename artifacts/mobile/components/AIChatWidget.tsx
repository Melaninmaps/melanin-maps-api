import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { usePathname, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  useAudioRecorder,
  useAudioPlayer,
  useAudioPlayerStatus,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from "expo-audio";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent ,
  Alert,
  Animated,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/lib/api";
import { parseSafeSourceLink } from "@/lib/sourceLinks";
import { createVoicePlaybackGuard, type VoicePlaybackRequest } from "@/lib/voicePlaybackGuard";
import {
  KinfolkBusinessRecommendationSheet,
  type KinfolkBusinessRecommendation,
} from "@/components/KinfolkBusinessRecommendationSheet";
import {
  KinfolkCompanionMemoryOfferCard,
  type KinfolkCompanionMemoryOffer,
} from "@/components/KinfolkCompanionMemoryOffer";

interface Message {
  id: string;
  text: string;
  fromUser: boolean;
  ts: number;
  taskCreated?: { listName?: string; taskCount?: number; taskTitle?: string };
  location?: { city: string; state: string | null; source: string } | null;
  locationSource?: string | null;
  sourceNote?: string | null;
  sources?: Array<{ title: string; url: string }>;
  libraryAction?: { type: "open_library_node"; topicId: string; focus: "evidence"; label: string } | null;
  recommendations?: KinfolkBusinessRecommendation[];
  intentClass?: string | null;
  companionMemoryOffer?: KinfolkCompanionMemoryOffer | null;
}

interface TaskActionPayload {
  type: "create_list" | "create_task" | "add_tasks";
  list?: { name: string; icon?: string };
  tasks?: { title: string; notes?: string | null; dueTimeLabel?: string | null; category?: string }[];
  task?: { title: string; notes?: string | null; dueTimeLabel?: string | null; category?: string };
}

const AUTH_TOKEN_KEY = "auth_session_token";

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

const GREETING = "Kinfolk's here. Let's map it out.";
const AAVE_LEVEL_KEY = "@kinfolk_aave_level";
const KINFOLK_PREVIEW_TEXT = "Kinfolk is here. I will give you the direct answer, explain what matters, and help you decide what comes next.";

function renderKinfolkMessageText(text: string, color: string, linkColor: string): React.ReactNode[] {
  const tokens = text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*)/g);
  return tokens.filter(Boolean).map((token, index) => {
    const markdownLink = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (markdownLink) {
      const safe = parseSafeSourceLink({ title: markdownLink[1], url: markdownLink[2] });
      return safe ? (
        <Text
          key={`${safe.url}-${index}`}
          style={{ color: linkColor, textDecorationLine: "underline", fontFamily: "Inter_600SemiBold" }}
          accessibilityRole="link"
          onPress={() => void Linking.openURL(safe.url).catch(() => undefined)}
        >
          {safe.title}
        </Text>
      ) : <Text key={index} style={{ color }}>{markdownLink[1]}</Text>;
    }
    const bold = token.match(/^\*\*([^*]+)\*\*$/);
    return bold ? (
      <Text key={index} style={{ color, fontFamily: "Inter_700Bold" }}>{bold[1]}</Text>
    ) : <Text key={index} style={{ color }}>{token}</Text>;
  });
}

const AAVE_OPTIONS = [
  { level: 0, label: "Off",       desc: "Standard Kinfolk voice" },
  { level: 1, label: "Subtle",    desc: "Cultural knowledge, local terms, always clean" },
  { level: 2, label: "Authentic", desc: "AAVE rhythm & expressions, no profanity" },
  { level: 3, label: "Full",      desc: "Complete AAVE including profanity", locked: true },
] as const;

const VOICE_MODE_OPTIONS = [
  { id: "community", label: "Just Big Cousin", desc: "Warm, grounded, conversational, and direct" },
  { id: "professor", label: "Professor", desc: "Clear teaching, context, and the why behind it" },
  { id: "business_manager", label: "Business Manager", desc: "Priorities, risks, decisions, and next actions" },
  { id: "best_friend", label: "Best Friend", desc: "Supportive, candid, natural, and honest" },
] as const;

let sessionId: string | undefined;

let cachedVoiceMode: string | null = null;

async function getVoiceMode(token: string | null): Promise<string> {
  if (cachedVoiceMode) return cachedVoiceMode;
  if (!token) return "community";
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/kinfolk/preferences`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json() as { preferences?: { personalityMode?: string | null } };
      const mode = data.preferences?.personalityMode ?? "community";
      cachedVoiceMode = mode;
      return mode;
    }
  } catch { /* ignore */ }
  return "community";
}

async function nearbyCityHint(message: string): Promise<string | undefined> {
  // Ask only when the member explicitly says "near me" or "nearby". The exact
  // device coordinates are never included in the Kinfolk API request.
  if (!/\b(?:near me|nearby|closest)\b/i.test(message) || Platform.OS === "web") return undefined;
  try {
    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== "granted") permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") return undefined;
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const [place] = await Location.reverseGeocodeAsync(position.coords);
    const city = place?.city?.trim();
    const region = place?.region?.trim();
    return city && region ? `${city}, ${region}` : undefined;
  } catch {
    return undefined;
  }
}

async function sendToKinfolk(message: string, token: string | null, cityHint?: string): Promise<{
  reply: string;
  taskAction?: TaskActionPayload | null;
  followUpSuggestions: string[];
  location?: { city: string; state: string | null; source: string } | null;
  locationSource?: string | null;
  sourceNote?: string | null;
  sources: Array<{ title: string; url: string }>;
  libraryAction?: { type: "open_library_node"; topicId: string; focus: "evidence"; label: string } | null;
  recommendations: KinfolkBusinessRecommendation[];
  intentClass?: string | null;
  companionMemoryOffer?: KinfolkCompanionMemoryOffer | null;
}> {
  const base = getApiBase();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const voiceMode = await getVoiceMode(token);

  const res = await fetch(`${base}/api/kinfolk/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, sessionId, voiceMode, cityHint }),
  });
  if (!res.ok) {
    // Extract server error message so the catch block can surface it to the user
    // rather than showing a generic "trouble connecting" for actionable errors
    // (e.g. 429 rate limit, 503 AI key missing, 401 session expired).
    let serverMsg: string | undefined;
    try { serverMsg = ((await res.json()) as { error?: string }).error; } catch { /* ignore */ }
    const err = new Error(serverMsg ?? `API error ${res.status}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  const data = await res.json() as {
    reply?: string;
    taskAction?: TaskActionPayload | null;
    sessionId?: string;
    followUpSuggestions?: string[];
    location?: { city: string; state: string | null; source: string } | null;
    locationSource?: string | null;
    sourceNote?: string | null;
    sources?: Array<{ title: string; url: string }> | null;
    libraryAction?: { type: "open_library_node"; topicId: string; focus: "evidence"; label: string } | null;
    recommendations?: { businesses?: KinfolkBusinessRecommendation[] } | null;
    intentClass?: string | null;
    companionMemoryOffer?: KinfolkCompanionMemoryOffer | null;
  };
  if (data.sessionId) sessionId = data.sessionId;
  return {
    reply: data.reply ?? "Sorry, something went sideways on my end.",
    taskAction: data.taskAction,
    followUpSuggestions: data.followUpSuggestions ?? [],
    location: data.location ?? null,
    locationSource: data.locationSource ?? null,
    sourceNote: data.sourceNote ?? null,
    sources: (data.sources ?? []).flatMap((source) => {
      const safe = parseSafeSourceLink(source);
      return safe ? [safe] : [];
    }),
    libraryAction: data.libraryAction ?? null,
    intentClass: data.intentClass ?? null,
    companionMemoryOffer: data.companionMemoryOffer ?? null,
    recommendations: Array.isArray(data.recommendations?.businesses)
      ? data.recommendations.businesses
        .filter((business) => Boolean(business?.id && business?.name))
        .slice(0, 6)
      : [],
  };
}

async function handleTaskAction(action: TaskActionPayload, token: string | null): Promise<{ listName?: string; taskCount?: number; taskTitle?: string }> {
  const base = getApiBase();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (action.type === "create_list" && action.list) {
    const listRes = await fetch(`${base}/api/kinfolk/lists`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: action.list.name, icon: action.list.icon ?? "📋" }),
    });
    if (listRes.ok) {
      const { list } = await listRes.json() as { list: { id: string } };
      const tasks = action.tasks ?? [];
      if (tasks.length > 0 && list?.id) {
        await fetch(`${base}/api/kinfolk/tasks/bulk`, {
          method: "POST",
          headers,
          body: JSON.stringify({ listId: list.id, tasks }),
        });
      }
      return { listName: action.list.name, taskCount: tasks.length };
    }
  } else if ((action.type === "create_task" || action.type === "add_tasks") && action.tasks?.length) {
    for (const t of action.tasks) {
      await fetch(`${base}/api/kinfolk/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title: t.title, notes: t.notes, dueTimeLabel: t.dueTimeLabel, category: t.category }),
      });
    }
    return { taskCount: action.tasks.length, taskTitle: action.tasks[0]?.title };
  } else if (action.type === "create_task" && action.task) {
    await fetch(`${base}/api/kinfolk/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title: action.task.title, notes: action.task.notes, dueTimeLabel: action.task.dueTimeLabel, category: action.task.category }),
    });
    return { taskTitle: action.task.title };
  }
  return {};
}

export function AIChatWidget() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: "0", text: GREETING, fromUser: false, ts: Date.now() },
  ]);
  const [responseFeedback, setResponseFeedback] = useState<Record<string, "helpful" | "not_helpful">>({});
  const [responseFeedbackNotes, setResponseFeedbackNotes] = useState<Record<string, string>>({});
  const [feedbackSavingId, setFeedbackSavingId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isStartingVoice, setIsStartingVoice] = useState(false);
  const [voiceInputStatus, setVoiceInputStatus] = useState<string | null>(null);
  const [voiceOutputStatus, setVoiceOutputStatus] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [listenUri, setListenUri] = useState<string | undefined>(undefined);
  const [voiceUsage, setVoiceUsage] = useState<{ used: number; limit: number; percent: number; tierName: string } | null>(null);
  const [voiceSheet, setVoiceSheet] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<KinfolkBusinessRecommendation | null>(null);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [aaveLevel, setAaveLevel] = useState<number>(0);
  const [aaveSaving, setAaveSaving] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(listenUri);
  const playerStatus = useAudioPlayerStatus(player);
  const recordingStartedAtRef = useRef<number | null>(null);
  const listRef = useRef<FlatList>(null);
  const openRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const queuedPlaybackRequestRef = useRef<VoicePlaybackRequest | null>(null);
  const voiceGuardRef = useRef(createVoicePlaybackGuard(
    // Factory stores this predicate and invokes it only from effects/events.
    // eslint-disable-next-line react-hooks/refs
    () => openRef.current && appStateRef.current === "active",
  ));
  // Scroll state — mirrors useKinfolkChatScroll for the widget's own FlatList
  const [widgetAtBottom, setWidgetAtBottom] = useState(true);
  const NEAR_BOTTOM_PX = 120;
  const onWidgetScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const dist = contentSize.height - layoutMeasurement.height - contentOffset.y;
    setWidgetAtBottom(dist <= NEAR_BOTTOM_PX);
  }, []);
  const onWidgetContentSizeChange = useCallback(() => {
    if (widgetAtBottom) listRef.current?.scrollToEnd({ animated: false });
  }, [widgetAtBottom]);
  const [pulse] = useState(() => new Animated.Value(1));
  const [fabTranslateY] = useState(() => new Animated.Value(0));
  const [fabOpacity] = useState(() => new Animated.Value(1));

  const suppressed = ["/onboarding", "/login", "/signup"].some((r) => pathname.startsWith(r));

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  React.useEffect(() => { if (!suppressed && !dismissed) startPulse(); }, [suppressed, dismissed, startPulse]);

  const dismissPill = () => {
    pulse.stopAnimation();
    Animated.parallel([
      Animated.timing(fabTranslateY, { toValue: 120, duration: 280, useNativeDriver: true }),
      Animated.timing(fabOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setDismissed(true);
      fabTranslateY.setValue(0);
      fabOpacity.setValue(1);
    });
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const restorePill = () => {
    setDismissed(false);
    fabTranslateY.setValue(80);
    fabOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(fabTranslateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
      Animated.timing(fabOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => startPulse());
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const [fabPanResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          fabTranslateY.setValue(g.dy);
          fabOpacity.setValue(Math.max(0, 1 - g.dy / 80));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 40) {
          dismissPill();
        } else {
          Animated.parallel([
            Animated.spring(fabTranslateY, { toValue: 0, useNativeDriver: true }),
            Animated.timing(fabOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]).start(() => startPulse());
        }
      },
    })
  );

  const [restorePanResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 20) restorePill();
      },
    })
  );

  const startVoice = async () => {
    if (Platform.OS === "web" || isStartingVoice || recorder.isRecording) return;
    setIsStartingVoice(true);
    try {
      const permission = await requestRecordingPermissionsAsync();
      const { granted } = permission;
      if (!granted) {
        setVoiceInputStatus(null);
        Alert.alert(
          "Microphone access is off",
          permission.canAskAgain
            ? "Please allow microphone access, then try Kinfolk Voice again. You can also type your question."
            : "Allow microphone access for Mapping With Melanin in your phone Settings, then try Kinfolk Voice again.",
        );
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingStartedAtRef.current = Date.now();
      setIsRecording(true);
      setVoiceInputStatus("Listening… tap the microphone again when you’re finished.");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      recordingStartedAtRef.current = null;
      setIsRecording(false);
      setVoiceInputStatus(null);
      const detail = error instanceof Error ? error.message : "Unable to start recording.";
      console.warn("[Kinfolk Voice] recording start failed", detail);
      Alert.alert("Kinfolk Voice could not start", "Check microphone permission and try again, or type your question.");
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    } finally {
      setIsStartingVoice(false);
    }
  };

  const stopVoice = async () => {
    if (!recorder.isRecording) return;
    setIsRecording(false);
    setVoiceInputStatus("Turning your words into text…");
    try {
      const durationMs = recordingStartedAtRef.current === null
        ? 0
        : Math.max(0, Date.now() - recordingStartedAtRef.current);
      recordingStartedAtRef.current = null;
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setVoiceInputStatus(null);
        Alert.alert("Voice Input", "No recording was captured. Please try again or type your question.");
        return;
      }

      const base = getApiBase();
      const token = await getToken();
      const ext = (uri.split(".").pop() ?? "m4a").toLowerCase();
      const mimeType = ({
        m4a: "audio/mp4",
        mp4: "audio/mp4",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        webm: "audio/webm",
      } as const)[ext as "m4a" | "mp4" | "mp3" | "wav" | "webm"];
      if (!mimeType) {
        Alert.alert("Voice Input", "This recording format is not supported. Please try again or type your question.");
        return;
      }
      const form = new FormData();
      form.append("audio", { uri, name: `kinfolk-recording.${ext}`, type: mimeType } as unknown as Blob);
      form.append("durationMs", String(durationMs));
      form.append("mimeType", mimeType);

      const r = await fetch(`${base}/api/kinfolk/transcribe`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      if (r.ok) {
        const { text } = await r.json() as { text?: string };
        if (text) {
          setInput(text);
          setVoiceInputStatus("Your words are ready to review. Tap Send when you’re ready.");
        } else {
          setVoiceInputStatus(null);
          Alert.alert("Voice Input", "I couldn't hear that clearly — please try again or type your question.");
        }
      } else {
        // Surface the server's error message so the founder can see exactly what failed
        let serverMessage = "Voice transcription failed — please try again or type your question.";
        try {
          const errBody = await r.json() as { message?: string; error?: string };
          if (errBody.message) serverMessage = errBody.message;
        } catch { /* ignore parse error */ }
        setVoiceInputStatus(null);
        Alert.alert("Voice Input", serverMessage);
      }
    } catch (err) {
      recordingStartedAtRef.current = null;
      setVoiceInputStatus(null);
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Voice Input", `Recording error: ${msg}. Please try again.`);
    } finally {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    }
  };

  const discardVoiceRecording = async () => {
    if (!recorder.isRecording) return;
    setIsRecording(false);
    setVoiceInputStatus(null);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        const file = new FileSystem.File(uri);
        try { file.delete(); } catch { /* cache cleanup best effort */ }
      }
    } catch { /* discard is intentionally quiet */ }
    finally {
      recordingStartedAtRef.current = null;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    }
  };

  // ── Load saved AAVE preference on mount ──────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(AAVE_LEVEL_KEY).then((v) => { if (v) setAaveLevel(Number(v)); }).catch(() => {});
  }, []);

  // ── Save AAVE level — local + backend ────────────────────────────────────
  const saveAaveLevel = async (level: number) => {
    setAaveLevel(level);
    AsyncStorage.setItem(AAVE_LEVEL_KEY, String(level)).catch(() => {});
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const token = await getToken().catch(() => null);
    if (!token) return;
    setAaveSaving(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/kinfolk/aave-level`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ level }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string; code?: string };
        if (err.code === "UPGRADE_REQUIRED") {
          setAaveLevel(aaveLevel);
          AsyncStorage.setItem(AAVE_LEVEL_KEY, String(aaveLevel)).catch(() => {});
          Alert.alert("Upgrade Required", "Full AAVE voice (Level 3) requires Navigator or Trailblazer membership.", [{ text: "OK" }]);
        }
      }
    } catch { /* ignore — local pref still saved */ }
    finally { setAaveSaving(false); }
  };

  const stopPlayback = useCallback((reason: string) => {
    voiceGuardRef.current.invalidate(reason);
    queuedPlaybackRequestRef.current = null;
    if (player.playing || player.isLoaded) player.pause();
    setListenUri(undefined);
    setPlayingId(null);
    setPreviewingVoice(null);
    setVoiceOutputStatus(null);
  }, [player]);

  const setWidgetOpen = useCallback((nextOpen: boolean) => {
    openRef.current = nextOpen;
    setOpen(nextOpen);
    if (!nextOpen) stopPlayback("widget_closed");
  }, [stopPlayback]);

  const openRecommendationBusiness = useCallback((businessId: string) => {
    // A Kinfolk pick is a Mapping with Melanin listing, so its primary tap
    // should take the member directly to that listing rather than making them
    // discover a second action in a sheet.
    setSelectedRecommendation(null);
    setWidgetOpen(false);
    router.push({ pathname: "/business/[id]", params: { id: businessId } } as never);
  }, [router, setWidgetOpen]);

  // ── Play audio only while the app is active and the widget remains open ──
  // The player status is reactive. Calling play() before the local WAV has
  // loaded was the silent-failure path seen on physical devices.
  useEffect(() => {
    const request = queuedPlaybackRequestRef.current;
    if (!listenUri || !playerStatus.isLoaded || !request) return;
    if (!voiceGuardRef.current.canPlay(request) || appStateRef.current !== "active" || !openRef.current) {
      stopPlayback("playback_not_allowed");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        // Reset the recording session before TTS playback and explicitly allow
        // speaker output even when the phone's mute switch is on.
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          interruptionMode: "duckOthers",
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
        });
        if (cancelled || !voiceGuardRef.current.canPlay(request)) return;
        player.volume = 1;
        player.play();
        voiceGuardRef.current.finish(request);
        queuedPlaybackRequestRef.current = null;
      } catch (error) {
        if (cancelled) return;
        const detail = error instanceof Error ? error.message : "The audio player could not start.";
        console.warn("[Kinfolk Voice] playback start failed", detail);
        setVoiceOutputStatus("Kinfolk created audio but your device could not play it. Check volume and try Listen again.");
        stopPlayback("playback_start_failed");
      }
    })();
    return () => { cancelled = true; };
  }, [listenUri, player, playerStatus.isLoaded, stopPlayback]);

  useEffect(() => {
    if (!playerStatus.error || !playingId) return;
    console.warn("[Kinfolk Voice] playback failed", playerStatus.error);
    setVoiceOutputStatus("Kinfolk audio could not play on this device. Check volume and try again.");
    stopPlayback("playback_error");
  }, [playerStatus.error, playingId, stopPlayback]);

  // ── Clear playingId when audio finishes ───────────────────────────────────
  useEffect(() => {
    if (playingId && !player.playing && player.isLoaded) {
      const timer = setTimeout(() => setPlayingId(null), 0);
      return () => clearTimeout(timer);
    }
  }, [player, player.playing, player.isLoaded, playingId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      appStateRef.current = state;
      if (state !== "active") stopPlayback("app_background");
    });
    return () => {
      subscription.remove();
      openRef.current = false;
      appStateRef.current = "background";
      stopPlayback("unmount");
    };
  }, [stopPlayback]);

  // ── Fetch the member-visible voice allowance when chat opens ──────────────
  useEffect(() => {
    if (!open || !openRef.current || appStateRef.current !== "active") return;
    void (async () => {
      try {
        const base = getApiBase();
        const token = await getToken();
        if (!token || !openRef.current || appStateRef.current !== "active") return;
        const usageRes = await fetch(`${base}/api/kinfolk/voice-usage`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usageRes.ok && openRef.current && appStateRef.current === "active") {
          const data = await usageRes.json() as {
            charsUsed: number; charsLimit: number;
            tierName: string; percentRemaining: number;
          };
          if (openRef.current && appStateRef.current === "active") {
            setVoiceUsage({
              used: data.charsUsed,
              limit: data.charsLimit,
              percent: data.percentRemaining,
              tierName: data.tierName,
            });
          }
        }
      } catch { /* non-critical */ }
    })();
  }, [open]);

  const speakMessage = async (msgId: string, text: string) => {
    if (Platform.OS === "web" || !openRef.current || appStateRef.current !== "active") return;
    if (playingId === msgId) {
      stopPlayback("manual_stop");
      return;
    }
    setVoiceOutputStatus(null);
    const request = voiceGuardRef.current.begin();
    let queued = false;
    try {
      const base = getApiBase();
      const token = await getToken();
      if (!voiceGuardRef.current.canPlay(request)) return;
      const r = await fetch(`${base}/api/kinfolk/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, mode: await getVoiceMode(token), requestId: msgId }),
        signal: request.signal,
      });
      if (!voiceGuardRef.current.canPlay(request)) return;
      if (r.status === 429) {
        Alert.alert(
          "Voice Time Used",
          "You've used your Kinfolk Voice allowance for this month. Text responses continue as normal — your allowance resets next month.",
          [{ text: "OK" }]
        );
        return;
      }
      if (r.status === 401) {
        Alert.alert("Sign In Required", "Sign in to use voice responses.", [{ text: "OK" }]);
        return;
      }
      if (!r.ok) {
        let serverMessage = "Kinfolk could not create audio right now. Please try again or read the text.";
        try {
          const payload = await r.json() as { message?: string };
          if (payload.message) serverMessage = payload.message;
        } catch { /* use the safe fallback above */ }
        setVoiceOutputStatus(serverMessage);
        Alert.alert("Kinfolk Voice", serverMessage);
        return;
      }
      const { audio, format, charsUsed, charsLimit, percentRemaining, tierName } = await r.json() as {
        audio: string; format: string; charsUsed: number;
        charsLimit: number; percentRemaining: number; tierName: string;
      };
      if (!audio || !format) {
        setVoiceOutputStatus("Kinfolk did not return playable audio. Please try Listen again.");
        return;
      }
      if (!voiceGuardRef.current.canPlay(request)) return;
      setVoiceUsage({ used: charsUsed, limit: charsLimit, percent: percentRemaining, tierName });
      const tempFile = new FileSystem.File(FileSystem.Paths.cache, `kinfolk_${msgId}.${format}`);
      tempFile.write(audio, { encoding: FileSystem.EncodingType.Base64 });
      if (!voiceGuardRef.current.canPlay(request)) return;
      queuedPlaybackRequestRef.current = request;
      setPlayingId(msgId);
      setListenUri(tempFile.uri);
      queued = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Kinfolk audio request failed.";
      console.warn("[Kinfolk Voice] speak request failed", detail);
      setVoiceOutputStatus("Kinfolk could not request audio. Check your connection and try Listen again.");
    }
    finally {
      if (!queued) voiceGuardRef.current.finish(request);
    }
  };

  const previewVoice = async (mode: string) => {
    if (Platform.OS === "web" || previewingVoice !== null || !openRef.current || appStateRef.current !== "active") return;
    const request = voiceGuardRef.current.begin();
    let queued = false;
    setPreviewingVoice(mode);
    setVoiceOutputStatus(null);
    try {
      const base = getApiBase();
      const token = await getToken();
      if (!voiceGuardRef.current.canPlay(request)) return;
      const r = await fetch(`${base}/api/kinfolk/voice-preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: KINFOLK_PREVIEW_TEXT, mode, requestId: `preview-${mode}` }),
        signal: request.signal,
      });
      if (!r.ok) {
        let serverMessage = "Kinfolk could not create a voice preview right now. Please try again.";
        try {
          const payload = await r.json() as { message?: string };
          if (payload.message) serverMessage = payload.message;
        } catch { /* use the safe fallback above */ }
        setVoiceOutputStatus(serverMessage);
        Alert.alert("Kinfolk Voice Preview", serverMessage);
        return;
      }
      if (voiceGuardRef.current.canPlay(request)) {
        const { audio, format } = await r.json() as { audio: string; format: string };
        if (!audio || !format) {
          setVoiceOutputStatus("Kinfolk did not return playable preview audio. Please try again.");
          return;
        }
        if (!voiceGuardRef.current.canPlay(request)) return;
        const file = new FileSystem.File(FileSystem.Paths.cache, `kinfolk_preview_${mode}.${format}`);
        file.write(audio, { encoding: FileSystem.EncodingType.Base64 });
        if (!voiceGuardRef.current.canPlay(request)) return;
        queuedPlaybackRequestRef.current = request;
        setPlayingId(`__preview_${mode}__`);
        setListenUri(file.uri);
        queued = true;
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Kinfolk preview request failed.";
      console.warn("[Kinfolk Voice] preview request failed", detail);
      setVoiceOutputStatus("Kinfolk could not request a voice preview. Check your connection and try again.");
    }
    finally {
      if (voiceGuardRef.current.isCurrent(request)) setPreviewingVoice(null);
      if (!queued) voiceGuardRef.current.finish(request);
    }
  };

  if (suppressed) return null;

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = { id: String(Date.now()), text, fromUser: true, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setVoiceInputStatus(null);
    setSuggestions([]);
    setTyping(true);

    try {
      const token = await getToken();
      const {
        reply,
        taskAction,
        followUpSuggestions,
        location,
        locationSource,
        sourceNote,
        sources,
        libraryAction,
        recommendations,
        intentClass,
        companionMemoryOffer,
      } = await sendToKinfolk(text, token, await nearbyCityHint(text));

      let taskCreated: Message["taskCreated"] | undefined;
      if (taskAction && token) {
        try {
          taskCreated = await handleTaskAction(taskAction, token);
        } catch {
          // task creation failed silently — reply still shows
        }
      }

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        text: reply,
        fromUser: false,
        ts: Date.now(),
        taskCreated,
        location,
        locationSource,
        sourceNote,
        sources,
        libraryAction,
        recommendations,
        intentClass,
        companionMemoryOffer,
      };
      setMessages((m) => [...m, aiMsg]);
      setSuggestions(followUpSuggestions);
    } catch (err) {
      // Prefer the server's error message (rate limit, session expired, etc.)
      // over a generic "trouble connecting" — helps the user take the right action.
      const status = (err as { status?: number }).status;
      const serverText = err instanceof Error ? err.message : null;
      const text =
        status === 429 && serverText
          ? serverText                                // e.g. "You've used your 10 free queries…"
          : status === 401
            ? "Please sign in again to use KinfolkAI."
            : status === 503
              ? "KinfolkAI is temporarily unavailable. Please try again in a moment."
              : "I'm having trouble connecting right now. Check your connection and try again.";
      const errMsg: Message = {
        id: String(Date.now() + 1),
        text,
        fromUser: false,
        ts: Date.now(),
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setTyping(false);
      setWidgetAtBottom(true);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const send = () => void sendMessage(input);

  const submitResponseFeedback = async (
    message: Message,
    reaction: "helpful" | "not_helpful",
    includeNote = false,
  ) => {
    const token = await getToken();
    if (!token) {
      Alert.alert("Sign in to share feedback", "Please sign in so Kinfolk can apply your feedback to future answers.");
      return;
    }

    const previous = responseFeedback[message.id];
    setResponseFeedback((current) => ({ ...current, [message.id]: reaction }));
    setFeedbackSavingId(message.id);
    try {
      const response = await fetch(`${getApiBase()}/api/kinfolk/response-feedback`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sessionId,
          messageId: message.id,
          reaction,
          note: includeNote ? responseFeedbackNotes[message.id]?.trim() || null : null,
          intentClass: message.intentClass ?? null,
        }),
      });
      if (!response.ok) throw new Error("Feedback was not saved");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setResponseFeedback((current) => {
        const next = { ...current };
        if (previous) next[message.id] = previous;
        else delete next[message.id];
        return next;
      });
      Alert.alert("Feedback not saved", "Please check your connection and try again.");
    } finally {
      setFeedbackSavingId(null);
    }
  };

  const goToTasks = () => {
    setWidgetOpen(false);
    router.push("/kinfolk-tasks");
  };

  return (
    <>
      {dismissed ? (
        <View
          style={[styles.restoreTab, { bottom: bottomPad + 90, backgroundColor: colors.primary }]}
          {...restorePanResponder.panHandlers}
        >
          <TouchableOpacity onPress={restorePill} style={styles.restoreTabInner} activeOpacity={0.85}>
            <Text style={styles.restoreTabIcon}>✦</Text>
            <Text style={styles.restoreTabTxt}>KA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View
          style={[
            styles.fab,
            {
              bottom: bottomPad + 96,
              transform: [{ scale: pulse }, { translateY: fabTranslateY }],
              opacity: fabOpacity,
            },
          ]}
          {...fabPanResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.fabPill}
            onPress={() => {
              setWidgetOpen(true);
              pulse.stopAnimation();
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            activeOpacity={0.88}
          >
            <View style={[styles.fabIconWrap, { backgroundColor: colors.primary }]}>
              <Text style={styles.fabIconTxt}>✦</Text>
            </View>
            <View style={styles.fabTextWrap}>
              <Text style={styles.fabTitle}>KinfolkAI™</Text>
              <Text style={styles.fabSub}>Ask me anything ✨</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setWidgetOpen(false)}>
        <KeyboardAvoidingView
          style={[styles.modal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === "web" ? 24 : insets.top + 12, borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.avatarDot, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarTxt}>KA</Text>
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>KinfolkAI™</Text>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Helping you navigate what matters most.</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={goToTasks} style={[styles.tasksBtn, { borderColor: colors.border }]}>
                <Feather name="check-square" size={14} color={colors.primary} />
                <Text style={[styles.tasksBtnTxt, { color: colors.primary }]}>My Lists</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setVoiceSheet(true)}
                accessibilityRole="button"
                accessibilityLabel="Preview Kinfolk voice modes"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.minimizeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <Feather name="volume-2" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setWidgetOpen(false);
                  router.push("/kinfolk-settings" as never);
                }}
                accessibilityRole="button"
                accessibilityLabel="Tune Kinfolk voice and personality"
                accessibilityHint="Choose Big Cousin, Professor, and other Kinfolk preferences"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.minimizeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <Feather name="sliders" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setWidgetOpen(false); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[styles.minimizeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <Feather name="chevron-down" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          {voiceUsage && voiceUsage.limit !== -1 && (
            <View style={[styles.voiceMeter, { borderBottomColor: colors.border }]}>
              <View style={[styles.voiceMeterTrack, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.voiceMeterFill,
                    {
                      width: `${voiceUsage.percent}%` as `${number}%`,
                      backgroundColor: voiceUsage.percent > 20 ? colors.primary : "#DC2626",
                    },
                  ]}
                />
              </View>
              <Text style={[styles.voiceMeterTxt, { color: colors.mutedForeground }]}>
                Kinfolk Voice is ready — {voiceUsage.percent}% of this month&apos;s voice time remains
              </Text>
            </View>
          )}
          {voiceOutputStatus ? (
            <View accessibilityRole="alert" style={styles.voiceOutputAlert}>
              <Feather name="volume-x" size={15} color="#8A2424" />
              <Text style={styles.voiceOutputAlertText}>{voiceOutputStatus}</Text>
            </View>
          ) : null}

          <FlatList
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={[styles.msgList, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
            onScroll={onWidgetScroll}
            scrollEventThrottle={16}
            onContentSizeChange={onWidgetContentSizeChange}
            renderItem={({ item }) => (
              <View>
                <View style={[styles.msgRow, item.fromUser && styles.msgRowUser]}>
                  {!item.fromUser && (
                    <View style={[styles.msgAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.msgAvatarTxt}>KA</Text>
                    </View>
                  )}
                  <View style={[
                    styles.bubble,
                    item.fromUser
                      ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                      : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
                  ]}>
                    <Text style={[styles.bubbleTxt, { color: item.fromUser ? "#FFF" : colors.foreground }]}>
                      {renderKinfolkMessageText(
                        item.text,
                        item.fromUser ? "#FFF" : colors.foreground,
                        item.fromUser ? "#FFF" : colors.primary,
                      )}
                    </Text>
                  </View>
                </View>
                {/* Location resolution pill — shows which city Kinfolk resolved */}
                {!item.fromUser && item.location?.city && (
                  <View style={[styles.locationPill, { marginLeft: 42 }]}>
                    <Feather name="map-pin" size={10} color={colors.primary} />
                    <Text style={[styles.locationPillTxt, { color: colors.primary }]}>
                      Searching {item.location.city}{item.location.state ? `, ${item.location.state}` : ""}
                    </Text>
                  </View>
                )}
                {!item.fromUser && (
                  <TouchableOpacity
                    onPress={() => void speakMessage(item.id, item.text)}
                    style={[styles.listenBtn, { marginLeft: 42 }]}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={playingId === item.id ? "volume-x" : "volume-2"}
                      size={13}
                      color={playingId === item.id ? colors.primary : colors.mutedForeground}
                    />
                    <Text style={[styles.listenTxt, { color: playingId === item.id ? colors.primary : colors.mutedForeground }]}>
                      {playingId === item.id ? "Stop" : "Listen"}
                    </Text>
                  </TouchableOpacity>
                )}
                {!item.fromUser && item.id !== "0" && (
                  <View style={[styles.responseFeedback, { marginLeft: 42 }]}>
                    <Text style={[styles.responseFeedbackQuestion, { color: colors.mutedForeground }]}>Was this helpful?</Text>
                    <View style={styles.responseFeedbackActions}>
                      <TouchableOpacity
                        onPress={() => void submitResponseFeedback(item, "helpful")}
                        disabled={feedbackSavingId === item.id}
                        style={[styles.responseFeedbackButton, { borderColor: responseFeedback[item.id] === "helpful" ? colors.primary : colors.border, backgroundColor: responseFeedback[item.id] === "helpful" ? `${colors.primary}18` : colors.card }]}
                        accessibilityLabel="Mark this Kinfolk answer helpful"
                      >
                        <Feather name="thumbs-up" size={12} color={responseFeedback[item.id] === "helpful" ? colors.primary : colors.mutedForeground} />
                        <Text style={[styles.responseFeedbackButtonText, { color: responseFeedback[item.id] === "helpful" ? colors.primary : colors.mutedForeground }]}>Helpful</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => void submitResponseFeedback(item, "not_helpful")}
                        disabled={feedbackSavingId === item.id}
                        style={[styles.responseFeedbackButton, { borderColor: responseFeedback[item.id] === "not_helpful" ? colors.primary : colors.border, backgroundColor: responseFeedback[item.id] === "not_helpful" ? `${colors.primary}18` : colors.card }]}
                        accessibilityLabel="Mark this Kinfolk answer not helpful"
                      >
                        <Feather name="thumbs-down" size={12} color={responseFeedback[item.id] === "not_helpful" ? colors.primary : colors.mutedForeground} />
                        <Text style={[styles.responseFeedbackButtonText, { color: responseFeedback[item.id] === "not_helpful" ? colors.primary : colors.mutedForeground }]}>Not helpful</Text>
                      </TouchableOpacity>
                    </View>
                    {responseFeedback[item.id] === "not_helpful" && (
                      <View style={styles.responseFeedbackNoteRow}>
                        <TextInput
                          value={responseFeedbackNotes[item.id] ?? ""}
                          onChangeText={(value) => setResponseFeedbackNotes((current) => ({ ...current, [item.id]: value }))}
                          placeholder="What should Kinfolk do better? (optional)"
                          placeholderTextColor={colors.mutedForeground}
                          style={[styles.responseFeedbackInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                          maxLength={240}
                        />
                        <TouchableOpacity
                          onPress={() => void submitResponseFeedback(item, "not_helpful", true)}
                          disabled={feedbackSavingId === item.id}
                          style={[styles.responseFeedbackSend, { backgroundColor: colors.primary, opacity: feedbackSavingId === item.id ? 0.6 : 1 }]}
                          accessibilityLabel="Send optional Kinfolk feedback note"
                        >
                          <Feather name="send" size={12} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                    {responseFeedback[item.id] && (
                      <Text style={[styles.responseFeedbackThanks, { color: colors.mutedForeground }]}>Thanks — this helps Kinfolk tailor future answers for you.</Text>
                    )}
                  </View>
                )}
                {item.taskCreated && (
                  <TouchableOpacity onPress={goToTasks} style={[styles.taskCreatedBadge, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                    <Feather name="check-square" size={13} color={colors.primary} />
                    <Text style={[styles.taskCreatedTxt, { color: colors.primary }]}>
                      {item.taskCreated.listName
                        ? `✓ Created "${item.taskCreated.listName}" with ${item.taskCreated.taskCount ?? 0} items — tap to view`
                        : item.taskCreated.taskTitle
                        ? `✓ Saved "${item.taskCreated.taskTitle}" — tap to view`
                        : `✓ ${item.taskCreated.taskCount} tasks saved — tap to view`}
                    </Text>
                  </TouchableOpacity>
                )}
                {!item.fromUser && item.recommendations?.length ? (
                  <View style={[styles.recommendationList, { marginLeft: 42 }]}>
                    <Text style={[styles.recommendationHeading, { color: colors.mutedForeground }]}>KINFOLK PICKS</Text>
                    {item.recommendations.map((recommendation: KinfolkBusinessRecommendation) => (
                      <View
                        key={recommendation.id}
                        style={[styles.recommendationCard, { backgroundColor: colors.card, borderColor: "#CA922B66" }]}
                      >
                        <TouchableOpacity
                          onPress={() => openRecommendationBusiness(recommendation.id)}
                          style={styles.recommendationPrimaryHit}
                          activeOpacity={0.82}
                          accessibilityRole="link"
                          accessibilityLabel={`Open ${recommendation.name} on Mapping with Melanin`}
                          accessibilityHint="Opens this business's Mapping with Melanin listing page"
                        >
                          <View style={[styles.recommendationIcon, { backgroundColor: "#CA922B1A" }]}>
                            <Feather name="briefcase" size={16} color={colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.recommendationName, { color: colors.foreground }]} numberOfLines={1}>{recommendation.name}</Text>
                            <Text style={[styles.recommendationMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                              {[recommendation.category, recommendation.city, recommendation.state].filter(Boolean).join(" · ")}
                            </Text>
                            {recommendation.recommendationReason ? (
                              <Text style={[styles.recommendationReason, { color: colors.mutedForeground }]} numberOfLines={2}>
                                {recommendation.recommendationReason}
                              </Text>
                            ) : null}
                          </View>
                          <Feather name="chevron-right" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setSelectedRecommendation(recommendation)}
                          style={styles.recommendationOptions}
                          activeOpacity={0.82}
                          accessibilityRole="button"
                          accessibilityLabel={`More options for ${recommendation.name}`}
                          accessibilityHint="Shows directions, website, phone, and listing options"
                        >
                          <Feather name="more-horizontal" size={19} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : null}
                {!item.fromUser && item.companionMemoryOffer ? (
                  <KinfolkCompanionMemoryOfferCard
                    offer={item.companionMemoryOffer}
                    sessionId={sessionId}
                  />
                ) : null}
                {!item.fromUser && item.sourceNote ? (
                  <Text style={[styles.sourceNote, { color: colors.mutedForeground, borderTopColor: colors.border }]}>
                    {item.sourceNote}
                  </Text>
                ) : null}
                {!item.fromUser && item.sources?.length ? (
                  <View style={[styles.sourceLinks, { marginLeft: 42 }]}>
                    {item.sources.map((source: { title: string; url: string }) => (
                      <View key={`${source.url}-${source.title}`} style={styles.sourceActionRow}>
                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() => void Linking.openURL(source.url)}
                          accessibilityRole="link"
                          accessibilityLabel={`Open source: ${source.title}`}
                        >
                          <Text style={[styles.sourceLink, { color: colors.primary }]} numberOfLines={2}>
                            {source.title}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => void sendMessage(`Summarize the linked article “${source.title}” accurately, using this exact source: ${source.url}`)}
                          accessibilityRole="button"
                          accessibilityLabel={`Ask Kinfolk to summarize ${source.title}`}
                          style={[styles.sourceSummaryButton, { borderColor: colors.primary }]}
                        >
                          <Text style={[styles.sourceSummaryText, { color: colors.primary }]}>Summarize</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : null}
                {!item.fromUser && item.libraryAction ? (
                  <TouchableOpacity
                    onPress={() => {
                      setWidgetOpen(false);
                      router.push({
                        pathname: "/library-topic",
                        params: { topicId: item.libraryAction!.topicId, focus: "evidence" },
                      } as never);
                    }}
                    style={[styles.libraryAction, { marginLeft: 42, borderColor: colors.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel={item.libraryAction.label}
                  >
                    <Feather name="book-open" size={13} color={colors.primary} />
                    <Text style={[styles.libraryActionText, { color: colors.primary }]}>
                      {item.libraryAction.label}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
            ListFooterComponent={typing ? (
              <View style={[styles.msgRow]}>
                <View style={[styles.msgAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.msgAvatarTxt}>KA</Text>
                </View>
                <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }]}>
                  <Text style={[styles.typingDots, { color: colors.mutedForeground }]}>●  ●  ●</Text>
                </View>
              </View>
            ) : null}
          />

          {/* Jump to latest — appears when user has scrolled up-thread */}
          {!widgetAtBottom && messages.length > 0 && (
            <TouchableOpacity
              onPress={() => { setWidgetAtBottom(true); listRef.current?.scrollToEnd({ animated: true }); }}
              style={[wStyles.jumpBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={wStyles.jumpTxt}>↓ Jump to latest</Text>
            </TouchableOpacity>
          )}

          {/* Quick-reply suggestion chips */}
          {suggestions.length > 0 && !typing && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.chipsScroll, { borderTopColor: colors.border }]}
              contentContainerStyle={styles.chipsRow}
              keyboardDismissMode="on-drag"
            >
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.primary + "55" }]}
                  onPress={() => {
                    setSuggestions([]);
                    setInput(s);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipTxt, { color: colors.primary }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {messages.length === 1 && !typing && (
            <View style={[styles.trustWrap, { borderTopColor: colors.border }]}>
              <Text style={[styles.trustTxt, { color: colors.mutedForeground }]}>
                Ask me anything. I&apos;ll always be honest about what I know—and what I don&apos;t.
              </Text>
            </View>
          )}

          {voiceInputStatus ? (
            <View style={[styles.voiceInputStatus, { backgroundColor: isRecording ? "#FEF2F2" : colors.muted }]}>
              <Feather name={isRecording ? "mic" : "message-circle"} size={14} color={isRecording ? "#B91C1C" : colors.mutedForeground} />
              <Text style={[styles.voiceInputStatusText, { color: isRecording ? "#B91C1C" : colors.mutedForeground }]}>{voiceInputStatus}</Text>
              {isRecording ? (
                <TouchableOpacity
                  accessibilityLabel="Cancel and discard Kinfolk Voice recording"
                  onPress={() => void discardVoiceRecording()}
                  style={styles.discardVoiceBtn}
                >
                  <Text style={styles.discardVoiceText}>Discard</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={[styles.inputRow, { borderTopColor: colors.border, paddingBottom: bottomPad + 8, backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[styles.micBtn, { backgroundColor: isRecording ? "#DC2626" : colors.muted, opacity: isStartingVoice ? 0.6 : 1 }]}
              onPress={() => isRecording ? void stopVoice() : void startVoice()}
              disabled={isStartingVoice}
              accessibilityLabel={isRecording ? "Stop Kinfolk Voice recording" : isStartingVoice ? "Starting Kinfolk Voice recording" : "Start Kinfolk Voice recording"}
              activeOpacity={0.8}
            >
              <Feather name={isRecording ? "mic-off" : "mic"} size={18} color={isRecording ? "#FFF" : colors.mutedForeground} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: isRecording ? "#DC262640" : colors.border, color: colors.foreground }]}
              placeholder={isRecording ? "Recording… tap mic to stop" : "What's on your mind today?"}
              placeholderTextColor={isRecording ? "#DC2626" : colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              onFocus={() => {
                setWidgetAtBottom(true);
                requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
              }}
              onSubmitEditing={send}
              returnKeyType="send"
              multiline={false}
              editable={!isRecording}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.muted }]}
              onPress={send}
              disabled={!input.trim() || isRecording}
              activeOpacity={0.8}
            >
              <Feather name="send" size={18} color={input.trim() ? "#FFF" : colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* ── Kinfolk delivery preview sheet ─────────────────────────────── */}
          {voiceSheet && (
            <TouchableOpacity
              style={styles.voiceSheetOverlay}
              activeOpacity={1}
              onPress={() => setVoiceSheet(false)}
            >
              <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                <View style={[styles.voiceSheetPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.voiceSheetHeader}>
                    <View>
                      <Text style={[styles.voiceSheetTitle, { color: colors.foreground }]}>Kinfolk&apos;s Voice</Text>
                      <Text style={[styles.voiceSheetSub, { color: colors.mutedForeground }]}>One Kinfolk voice, delivered four ways. Tap Preview to hear each mode.</Text>
                    </View>
                    <TouchableOpacity onPress={() => setVoiceSheet(false)}>
                      <Feather name="x" size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  {VOICE_MODE_OPTIONS.map((v) => (
                    <View key={v.id} style={[styles.voiceRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.voiceRowMain}>
                        <View style={[styles.voiceRadio, { borderColor: colors.primary }]}>
                          <View style={[styles.voiceRadioFill, { backgroundColor: colors.primary }]} />
                        </View>
                        <View style={styles.voiceRowText}>
                          <Text style={[styles.voiceRowLabel, { color: colors.foreground }]}>{v.label}</Text>
                          <Text style={[styles.voiceRowDesc, { color: colors.mutedForeground }]}>{v.desc}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.previewBtn, { borderColor: colors.primary + "66", opacity: previewingVoice === v.id ? 0.5 : 1 }]}
                        disabled={previewingVoice !== null}
                        onPress={() => void previewVoice(v.id)}
                      >
                        <Feather
                          name={previewingVoice === v.id ? "loader" : "play"}
                          size={12}
                          color={colors.primary}
                        />
                        <Text style={[styles.previewBtnTxt, { color: colors.primary }]}>
                          {previewingVoice === v.id ? "Playing…" : "Preview"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <Text style={[styles.voiceSheetNote, { color: colors.mutedForeground }]}>
                    Kinfolk&apos;s base voice is selected and protected by Mapping With Melanin. Your mode changes delivery, never the facts, citations, or safety standards.
                  </Text>

                  {/* ── AAVE Cultural Voice Style ─────────────────────────── */}
                  <View style={[styles.aaveDivider, { borderTopColor: colors.border }]} />
                  <View style={styles.aaveHeader}>
                    <Text style={[styles.aaveTitle, { color: colors.foreground }]}>Cultural Voice Style</Text>
                    <Text style={[styles.aaveSub, { color: colors.mutedForeground }]}>How Kinfolk speaks to you</Text>
                  </View>

                  {AAVE_OPTIONS.map((opt) => {
                    const isLocked = opt.level === 3 && !(voiceUsage?.tierName === "Navigator" || voiceUsage?.tierName === "Trailblazer");
                    const isSelected = aaveLevel === opt.level;
                    return (
                      <TouchableOpacity
                        key={opt.level}
                        style={[styles.aaveRow, { borderBottomColor: colors.border, opacity: isLocked ? 0.55 : 1 }]}
                        onPress={() => {
                          if (isLocked || aaveSaving) return;
                          if (opt.level === 3) {
                            Alert.alert(
                              "Full AAVE Voice",
                              'Level 3 includes casual profanity — words like "dead ass", "that\'s the shit", "on God". It\'s cookout-level casual, not explicit.\n\nEnable it?',
                              [
                                { text: "Cancel", style: "cancel" },
                                { text: "Enable", onPress: () => void saveAaveLevel(3) },
                              ]
                            );
                          } else {
                            void saveAaveLevel(opt.level);
                          }
                        }}
                        disabled={isLocked || aaveSaving}
                      >
                        <View style={[styles.voiceRadio, { borderColor: colors.primary }]}>
                          {isSelected && <View style={[styles.voiceRadioFill, { backgroundColor: colors.primary }]} />}
                        </View>
                        <View style={styles.aaveRowText}>
                          <View style={styles.aaveRowLabelRow}>
                            <Text style={[styles.voiceRowLabel, { color: colors.foreground }]}>{opt.label}</Text>
                            {isLocked && (
                              <View style={[styles.aaveLockBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
                                <Feather name="lock" size={9} color={colors.primary} />
                                <Text style={[styles.aaveLockTxt, { color: colors.primary }]}>Navigator+</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.voiceRowDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {aaveLevel > 0 && (
                    <Text style={[styles.aaveNote, { color: colors.mutedForeground }]}>
                      {aaveLevel === 1 && "Kinfolk will drop real cultural knowledge and local terms naturally."}
                      {aaveLevel === 2 && "Kinfolk speaks with genuine AAVE rhythm. Always clean."}
                      {aaveLevel === 3 && "Full cultural voice. Kinfolk keeps it real — including language."}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </Modal>
      <KinfolkBusinessRecommendationSheet
        recommendation={selectedRecommendation}
        visible={selectedRecommendation !== null}
        onClose={() => setSelectedRecommendation(null)}
        onViewBusiness={openRecommendationBusiness}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: "absolute", right: 16, zIndex: 999 },
  fabPill: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FAF1E4",
    borderRadius: 50,
    paddingVertical: 10, paddingHorizontal: 14,
    shadowColor: "#3B1F0E", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 8,
    borderWidth: 1, borderColor: "#E8D9C4",
  },
  fabIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  fabIconTxt: { fontSize: 15, color: "#FAF1E4" },
  fabTextWrap: { gap: 1 },
  fabTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#3B1F0E" },
  fabSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#8B6F4E" },
  restoreTab: {
    position: "absolute", right: 0, zIndex: 999,
    borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
    shadowColor: "#000", shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 8,
  },
  restoreTabInner: {
    paddingVertical: 12, paddingHorizontal: 10,
    alignItems: "center", justifyContent: "center", gap: 2,
  },
  restoreTabIcon: { fontSize: 14, color: "#FAF1E4" },
  restoreTabTxt: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#FAF1E4", letterSpacing: 0.5 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  modalHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  tasksBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  tasksBtnTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  avatarDot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#FFF" },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  msgList: { padding: 16, gap: 12 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowUser: { justifyContent: "flex-end" },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  msgAvatarTxt: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#FFF" },
  bubble: { maxWidth: "78%", padding: 12, borderRadius: 16 },
  bubbleTxt: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  typingDots: { fontSize: 10, letterSpacing: 4 },
  taskCreatedBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 6, marginLeft: 36,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1, borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  taskCreatedTxt: { fontSize: 12, fontFamily: "Inter_500Medium", flexShrink: 1 },
  recommendationList: { marginTop: 10, gap: 7, maxWidth: "86%" },
  recommendationHeading: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.9, marginBottom: 1 },
  recommendationCard: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  recommendationPrimaryHit: { flex: 1, flexDirection: "row", alignItems: "center", gap: 9, padding: 10 },
  recommendationOptions: { alignSelf: "stretch", minWidth: 42, alignItems: "center", justifyContent: "center", borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: "#CA922B66" },
  recommendationIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  recommendationName: { fontSize: 13, fontFamily: "Inter_700Bold" },
  recommendationMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  recommendationReason: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15, marginTop: 4 },
  sourceNote: { alignSelf: "flex-start", maxWidth: "78%", marginLeft: 42, marginTop: 8, borderTopWidth: 1, paddingTop: 7, fontSize: 10, fontFamily: "Inter_400Regular", fontStyle: "italic", lineHeight: 14 },
  sourceLinks: { maxWidth: "78%", marginTop: 7, gap: 5 },
  sourceActionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sourceLink: { fontSize: 11, fontFamily: "Inter_500Medium", lineHeight: 16, textDecorationLine: "underline" },
  sourceSummaryButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  sourceSummaryText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  libraryAction: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, marginTop: 8, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
  libraryActionText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  trustWrap: { borderTopWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
  trustTxt: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, textAlign: "center", fontStyle: "italic" },
  voiceInputStatus: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 },
  voiceInputStatusText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 17 },
  chipsScroll: { borderTopWidth: 1, maxHeight: 56 },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: "center" },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    flexShrink: 0,
  },
  chipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 24, paddingHorizontal: 14,
    paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular",
  },
  micBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  minimizeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  locationPill: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3, marginBottom: 1, alignSelf: "flex-start" },
  locationPillTxt: { fontSize: 10, fontFamily: "Inter_500Medium", opacity: 0.75 },
  listenBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, paddingLeft: 2, alignSelf: "flex-start" },
  listenTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  responseFeedback: { marginTop: 7, alignSelf: "flex-start" },
  responseFeedbackQuestion: { fontSize: 10, fontFamily: "Inter_400Regular", marginBottom: 5 },
  responseFeedbackActions: { flexDirection: "row", gap: 6 },
  responseFeedbackButton: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 14, paddingVertical: 5, paddingHorizontal: 8 },
  responseFeedbackButtonText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  responseFeedbackNoteRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 7, maxWidth: "78%" },
  responseFeedbackInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7, fontSize: 11, fontFamily: "Inter_400Regular" },
  responseFeedbackSend: { width: 31, height: 31, borderRadius: 15.5, alignItems: "center", justifyContent: "center" },
  responseFeedbackThanks: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 5, fontStyle: "italic" },
  voiceMeter: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1 },
  voiceMeterTrack: { height: 3, borderRadius: 2, overflow: "hidden", marginBottom: 5 },
  voiceMeterFill: { height: "100%", borderRadius: 2 },
  voiceMeterTxt: { fontSize: 10, fontFamily: "Inter_400Regular" },
  voiceOutputAlert: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginHorizontal: 16, marginTop: 8, padding: 10, borderWidth: 1, borderColor: "#D59A9A", borderRadius: 10, backgroundColor: "#FFF1EF" },
  voiceOutputAlertText: { flex: 1, color: "#8A2424", fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 17 },
  voiceSheetOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end", zIndex: 100,
  },
  voiceSheetPanel: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    paddingHorizontal: 20, paddingBottom: 32, paddingTop: 20,
  },
  voiceSheetHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  voiceSheetTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  voiceSheetSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  voiceRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  voiceRowMain: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  voiceRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  voiceRadioFill: { width: 9, height: 9, borderRadius: 5 },
  voiceRowText: { flex: 1 },
  voiceRowLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  voiceRowDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  previewBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, marginLeft: 8,
  },
  previewBtnTxt: { fontSize: 11, fontFamily: "Inter_500Medium" },
  voiceSheetNote: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 14, textAlign: "center", fontStyle: "italic" },
  discardVoiceBtn: { marginLeft: "auto", borderWidth: 1, borderColor: "#FCA5A5", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
  discardVoiceText: { color: "#B91C1C", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  aaveDivider: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 22, marginBottom: 18 },
  aaveHeader: { marginBottom: 10 },
  aaveTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  aaveSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  aaveRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aaveRowText: { flex: 1 },
  aaveRowLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  aaveLockBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1,
  },
  aaveLockTxt: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  aaveNote: { fontSize: 10, fontFamily: "Inter_400Regular", fontStyle: "italic", marginTop: 12, textAlign: "center" },
});

const wStyles = StyleSheet.create({
  jumpBtn: { alignSelf: "center", flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginVertical: 4 },
  jumpTxt: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" },
});
