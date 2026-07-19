import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { usePathname, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useAudioRecorder, useAudioPlayer, requestRecordingPermissionsAsync, RecordingPresets } from "expo-audio";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
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

interface Message {
  id: string;
  text: string;
  fromUser: boolean;
  ts: number;
  taskCreated?: { listName?: string; taskCount?: number; taskTitle?: string };
}

interface TaskActionPayload {
  type: "create_list" | "create_task" | "add_tasks";
  list?: { name: string; icon?: string };
  tasks?: Array<{ title: string; notes?: string | null; dueTimeLabel?: string | null; category?: string }>;
  task?: { title: string; notes?: string | null; dueTimeLabel?: string | null; category?: string };
}

const AUTH_TOKEN_KEY = "auth_session_token";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(AUTH_TOKEN_KEY); }
  catch { return null; }
}

const GREETING = "Kinfolk's here. Let's explore what's possible.";

const SIGNATURE_PHRASE = "Kinfolk's here.";
const VOICE_PREF_KEY = "@kinfolk_voice_pref";
const SIGNATURE_DATE_KEY = "@kinfolk_sig_date";
const AAVE_LEVEL_KEY = "@kinfolk_aave_level";

const AAVE_OPTIONS = [
  { level: 0, label: "Off",       desc: "Standard Kinfolk voice" },
  { level: 1, label: "Subtle",    desc: "Cultural knowledge, local terms, always clean" },
  { level: 2, label: "Authentic", desc: "AAVE rhythm & expressions, no profanity" },
  { level: 3, label: "Full",      desc: "Complete AAVE including profanity", locked: true },
] as const;

const VOICE_OPTIONS = [
  { id: "onyx",    label: "Onyx",    desc: "Deep, warm, grounded — Kinfolk default" },
  { id: "echo",    label: "Echo",    desc: "Medium tone, conversational, clear" },
  { id: "fable",   label: "Fable",   desc: "Rich, warm, storyteller quality" },
  { id: "alloy",   label: "Alloy",   desc: "Neutral, balanced, versatile" },
  { id: "nova",    label: "Nova",    desc: "Warm, expressive, energetic" },
  { id: "shimmer", label: "Shimmer", desc: "Clear, gentle, approachable" },
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

async function sendToKinfolk(message: string, token: string | null): Promise<{
  reply: string;
  taskAction?: TaskActionPayload | null;
  followUpSuggestions: string[];
}> {
  const base = getApiBase();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const voiceMode = await getVoiceMode(token);

  const res = await fetch(`${base}/api/kinfolk/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, sessionId, voiceMode }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json() as {
    reply?: string;
    taskAction?: TaskActionPayload | null;
    sessionId?: string;
    followUpSuggestions?: string[];
  };
  if (data.sessionId) sessionId = data.sessionId;
  return {
    reply: data.reply ?? "Sorry, something went sideways on my end.",
    taskAction: data.taskAction,
    followUpSuggestions: data.followUpSuggestions ?? [],
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
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", text: GREETING, fromUser: false, ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [listenUri, setListenUri] = useState<string | undefined>(undefined);
  const [voiceUsage, setVoiceUsage] = useState<{ used: number; limit: number; percent: number; tierName: string } | null>(null);
  const [voicePref, setVoicePref] = useState<string>("onyx");
  const [voiceSheet, setVoiceSheet] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [aaveLevel, setAaveLevel] = useState<number>(0);
  const [aaveSaving, setAaveSaving] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(listenUri);
  const listRef = useRef<FlatList>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const fabTranslateY = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;

  const suppressed = ["/onboarding", "/login", "/signup"].some((r) => pathname.startsWith(r));

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  React.useEffect(() => { if (!suppressed && !dismissed) startPulse(); }, [suppressed, dismissed]);

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

  const fabPanResponder = useRef(
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
  ).current;

  const restorePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 20) restorePill();
      },
    })
  ).current;

  const startVoice = async () => {
    if (Platform.OS === "web") return;
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return;
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { setIsRecording(false); }
  };

  const stopVoice = async () => {
    if (!recorder.isRecording) return;
    setIsRecording(false);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        const base = getApiBase();
        const token = await getToken();
        const ext = uri.split(".").pop() ?? "m4a";
        const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const r = await fetch(`${base}/api/kinfolk/transcribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ audio: fileContent, format: ext }),
        });
        if (r.ok) {
          const { text } = await r.json() as { text?: string };
          if (text) setInput(text);
        }
      }
    } catch { /* non-critical */ }
  };

  // ── Load saved voice + AAVE preferences on mount ─────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(VOICE_PREF_KEY).then((v) => { if (v) setVoicePref(v); }).catch(() => {});
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

  // ── Play audio when listenUri + player are ready ──────────────────────────
  useEffect(() => {
    if (listenUri && player.isLoaded) {
      player.play();
    }
  }, [listenUri, player.isLoaded]);

  // ── Clear playingId when audio finishes ───────────────────────────────────
  useEffect(() => {
    if (playingId && !player.playing && player.isLoaded) {
      setPlayingId(null);
    }
  }, [player.playing]);

  // ── Fetch voice usage + play daily signature when chat opens ─────────────
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const base = getApiBase();
        const token = await getToken();
        if (!token) return;

        // Load voice preference (in case updated elsewhere)
        const savedPref = await AsyncStorage.getItem(VOICE_PREF_KEY).catch(() => null);
        const currentVoice = savedPref ?? voicePref;
        if (savedPref && savedPref !== voicePref) setVoicePref(savedPref);

        // Fetch voice usage
        const usageReq = fetch(`${base}/api/kinfolk/voice-usage`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Daily audio signature — play once per calendar day
        const today = new Date().toISOString().slice(0, 10);
        const lastSig = await AsyncStorage.getItem(SIGNATURE_DATE_KEY).catch(() => null);
        if (lastSig !== today && Platform.OS !== "web") {
          await AsyncStorage.setItem(SIGNATURE_DATE_KEY, today).catch(() => {});
          try {
            const sigRes = await fetch(`${base}/api/kinfolk/speak`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ text: SIGNATURE_PHRASE, voice: currentVoice }),
            });
            if (sigRes.ok) {
              const { audio, format } = await sigRes.json() as { audio: string; format: string };
              const sigUri = `${FileSystem.cacheDirectory}kinfolk_sig.${format}`;
              await FileSystem.writeAsStringAsync(sigUri, audio, { encoding: FileSystem.EncodingType.Base64 });
              setPlayingId("__signature__");
              setListenUri(sigUri);
            }
          } catch { /* non-critical */ }
        }

        // Resolve usage
        const usageRes = await usageReq;
        if (usageRes.ok) {
          const data = await usageRes.json() as {
            charsUsed: number; charsLimit: number;
            tierName: string; percentRemaining: number;
          };
          setVoiceUsage({
            used: data.charsUsed,
            limit: data.charsLimit,
            percent: data.percentRemaining,
            tierName: data.tierName,
          });
        }
      } catch { /* non-critical */ }
    })();
  }, [open]);

  const speakMessage = async (msgId: string, text: string) => {
    if (Platform.OS === "web") return;
    if (playingId === msgId) {
      player.pause();
      setPlayingId(null);
      return;
    }
    try {
      const base = getApiBase();
      const token = await getToken();
      const r = await fetch(`${base}/api/kinfolk/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, voice: voicePref }),
      });
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
      if (!r.ok) return;
      const { audio, format, charsUsed, charsLimit, percentRemaining, tierName } = await r.json() as {
        audio: string; format: string; charsUsed: number;
        charsLimit: number; percentRemaining: number; tierName: string;
      };
      setVoiceUsage({ used: charsUsed, limit: charsLimit, percent: percentRemaining, tierName });
      const tempUri = `${FileSystem.cacheDirectory}kinfolk_${msgId}.${format}`;
      await FileSystem.writeAsStringAsync(tempUri, audio, { encoding: FileSystem.EncodingType.Base64 });
      setPlayingId(msgId);
      setListenUri(tempUri);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { /* non-critical */ }
  };

  const previewVoice = async (voiceId: string) => {
    if (Platform.OS === "web" || previewingVoice !== null) return;
    setPreviewingVoice(voiceId);
    try {
      const base = getApiBase();
      const token = await getToken();
      const r = await fetch(`${base}/api/kinfolk/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: SIGNATURE_PHRASE, voice: voiceId }),
      });
      if (r.ok) {
        const { audio, format } = await r.json() as { audio: string; format: string };
        const uri = `${FileSystem.cacheDirectory}kinfolk_preview_${voiceId}.${format}`;
        await FileSystem.writeAsStringAsync(uri, audio, { encoding: FileSystem.EncodingType.Base64 });
        setPlayingId(`__preview_${voiceId}__`);
        setListenUri(uri);
      }
    } catch { /* non-critical */ }
    finally { setPreviewingVoice(null); }
  };

  if (suppressed) return null;

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = { id: String(Date.now()), text, fromUser: true, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSuggestions([]);
    setTyping(true);

    try {
      const token = await getToken();
      const { reply, taskAction, followUpSuggestions } = await sendToKinfolk(text, token);

      let taskCreated: Message["taskCreated"] | undefined;
      if (taskAction && token) {
        try {
          taskCreated = await handleTaskAction(taskAction, token);
        } catch {
          // task creation failed silently — reply still shows
        }
      }

      const aiMsg: Message = { id: String(Date.now() + 1), text: reply, fromUser: false, ts: Date.now(), taskCreated };
      setMessages((m) => [...m, aiMsg]);
      setSuggestions(followUpSuggestions);
    } catch {
      const errMsg: Message = {
        id: String(Date.now() + 1),
        text: "I'm having trouble connecting right now. Check your connection and try again.",
        fromUser: false,
        ts: Date.now(),
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setTyping(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const goToTasks = () => {
    setOpen(false);
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
              setOpen(true);
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

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={[styles.modal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === "web" ? 24 : insets.top + 12, borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.avatarDot, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarTxt}>KA</Text>
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>KinfolkAI™</Text>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Ask me anything · Create lists & reminders</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={goToTasks} style={[styles.tasksBtn, { borderColor: colors.border }]}>
                <Feather name="check-square" size={14} color={colors.primary} />
                <Text style={[styles.tasksBtnTxt, { color: colors.primary }]}>My Lists</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setVoiceSheet(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.minimizeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <Feather name="volume-2" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setOpen(false); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
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
                {voiceUsage.tierName} — {voiceUsage.percent}% remaining
              </Text>
            </View>
          )}

          <FlatList
            keyboardDismissMode="on-drag"
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={[styles.msgList, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
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
                      {item.text}
                    </Text>
                  </View>
                </View>
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

          <View style={[styles.inputRow, { borderTopColor: colors.border, paddingBottom: bottomPad + 8, backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[styles.micBtn, { backgroundColor: isRecording ? "#DC2626" : colors.muted }]}
              onPress={() => isRecording ? void stopVoice() : void startVoice()}
              activeOpacity={0.8}
            >
              <Feather name={isRecording ? "mic-off" : "mic"} size={18} color={isRecording ? "#FFF" : colors.mutedForeground} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: isRecording ? "#DC262640" : colors.border, color: colors.foreground }]}
              placeholder={isRecording ? "Recording… tap mic to stop" : "Ask me anything…"}
              placeholderTextColor={isRecording ? "#DC2626" : colors.mutedForeground}
              value={input}
              onChangeText={setInput}
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

          {/* ── Voice picker sheet ─────────────────────────────────────────── */}
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
                      <Text style={[styles.voiceSheetTitle, { color: colors.foreground }]}>Kinfolk's Voice</Text>
                      <Text style={[styles.voiceSheetSub, { color: colors.mutedForeground }]}>Tap Preview to hear each option</Text>
                    </View>
                    <TouchableOpacity onPress={() => setVoiceSheet(false)}>
                      <Feather name="x" size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  {VOICE_OPTIONS.map((v) => (
                    <View key={v.id} style={[styles.voiceRow, { borderBottomColor: colors.border }]}>
                      <TouchableOpacity
                        style={styles.voiceRowMain}
                        onPress={() => {
                          setVoicePref(v.id);
                          AsyncStorage.setItem(VOICE_PREF_KEY, v.id).catch(() => {});
                          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <View style={[styles.voiceRadio, { borderColor: colors.primary }]}>
                          {voicePref === v.id && (
                            <View style={[styles.voiceRadioFill, { backgroundColor: colors.primary }]} />
                          )}
                        </View>
                        <View style={styles.voiceRowText}>
                          <Text style={[styles.voiceRowLabel, { color: colors.foreground }]}>{v.label}</Text>
                          <Text style={[styles.voiceRowDesc, { color: colors.mutedForeground }]}>{v.desc}</Text>
                        </View>
                      </TouchableOpacity>
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
                    Current beta voice. A signature Kinfolk voice is in development.
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
  listenBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, paddingLeft: 2, alignSelf: "flex-start" },
  listenTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  voiceMeter: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1 },
  voiceMeterTrack: { height: 3, borderRadius: 2, overflow: "hidden", marginBottom: 5 },
  voiceMeterFill: { height: "100%", borderRadius: 2 },
  voiceMeterTxt: { fontSize: 10, fontFamily: "Inter_400Regular" },
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
