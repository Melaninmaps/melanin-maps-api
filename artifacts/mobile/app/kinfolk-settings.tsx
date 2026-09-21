import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { OWNERSHIP_FILTER_OPTIONS } from "@workspace/constants";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getAuthToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}

interface BehaviorSettings {
  kinfolkMemoryEnabled: boolean;
  personalisedSuggestions: boolean;
}

interface VoicePrefs {
  personalityMode: string;
  communicationStyle: string;
  emojiLevel: string;
  humorLevel: string;
}

const BEHAVIOR_DEFAULTS: BehaviorSettings = {
  kinfolkMemoryEnabled: true,
  personalisedSuggestions: true,
};

const VOICE_DEFAULTS: VoicePrefs = {
  personalityMode: "community",
  communicationStyle: "friendly",
  emojiLevel: "some",
  humorLevel: "light",
};

const CAPABILITIES = [
  { icon: "map-pin" as const, label: "Local Discovery", desc: "Finds minority-owned businesses, events, and community spots tailored to your vibe" },
  { icon: "shield" as const, label: "Safety Intel", desc: "Summarises community safety reports so you can travel and move with confidence" },
  { icon: "navigation" as const, label: "Trip Planning", desc: "Builds personalised itineraries with culturally relevant stops and insider recommendations" },
  { icon: "users" as const, label: "Community Connections", desc: "Surfaces people, circles, and events aligned with your interests and lifestyle" },
];

const VOICE_MODES: { value: string; label: string; desc: string; icon: "zap" | "briefcase" | "book-open" | "heart" }[] = [
  { value: "community", label: "Just Big Cousin", desc: "Warm, grounded, conversational, and direct", icon: "zap" },
  { value: "professor", label: "Professor", desc: "Clear teaching, context, and the why behind it", icon: "book-open" },
  { value: "business_manager", label: "Business Manager", desc: "Priorities, risks, decisions, and next actions", icon: "briefcase" },
  { value: "best_friend", label: "Best Friend", desc: "Supportive, candid, natural, and honest", icon: "heart" },
];

const COMM_STYLES: { value: string; label: string }[] = [
  { value: "friendly", label: "Friendly" },
  { value: "conversational", label: "Casual" },
  { value: "concise", label: "Direct" },
  { value: "professional", label: "Formal" },
];

const EMOJI_LEVELS: { value: string; label: string }[] = [
  { value: "none", label: "None" },
  { value: "some", label: "Some" },
  { value: "lots", label: "Many" },
];

const HUMOR_LEVELS: { value: string; label: string }[] = [
  { value: "none", label: "None" },
  { value: "light", label: "Light" },
  { value: "playful", label: "Witty" },
];

function normalizeVoicePrefs(raw: Partial<VoicePrefs>): VoicePrefs {
  const personalityMode = VOICE_MODES.some((mode) => mode.value === raw.personalityMode)
    ? raw.personalityMode!
    : VOICE_DEFAULTS.personalityMode;
  const communicationStyle = raw.communicationStyle === "casual"
    ? "conversational"
    : raw.communicationStyle === "direct"
      ? "concise"
      : raw.communicationStyle === "formal"
        ? "professional"
        : COMM_STYLES.some((style) => style.value === raw.communicationStyle)
          ? raw.communicationStyle!
          : VOICE_DEFAULTS.communicationStyle;
  const emojiLevel = raw.emojiLevel === "many"
    ? "lots"
    : EMOJI_LEVELS.some((level) => level.value === raw.emojiLevel)
      ? raw.emojiLevel!
      : VOICE_DEFAULTS.emojiLevel;
  const humorLevel = raw.humorLevel === "witty"
    ? "playful"
    : HUMOR_LEVELS.some((level) => level.value === raw.humorLevel)
      ? raw.humorLevel!
      : VOICE_DEFAULTS.humorLevel;

  return { personalityMode, communicationStyle, emojiLevel, humorLevel };
}

export default function KinfolkSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [behavior, setBehavior] = useState<BehaviorSettings>(BEHAVIOR_DEFAULTS);
  const [voice, setVoice] = useState<VoicePrefs>(VOICE_DEFAULTS);
  const [supportLens, setSupportLens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const behaviorSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const loadSettings = async () => {
    try {
      const token = await getAuthToken();
      const base = getApiBase();
      if (!token || !base) { setLoading(false); return; }

      const [settingsRes, prefsRes] = await Promise.all([
        fetch(`${base}/api/users/settings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${base}/api/kinfolk/preferences`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json() as Partial<BehaviorSettings>;
        setBehavior({ ...BEHAVIOR_DEFAULTS, ...data });
      }
      if (prefsRes.ok) {
        const data = await prefsRes.json() as {
          preferences?: Partial<VoicePrefs> & { ownershipTypes?: string[] };
        };
        if (data.preferences) {
          setVoice(normalizeVoicePrefs(data.preferences));
          setSupportLens(Array.isArray(data.preferences.ownershipTypes) ? data.preferences.ownershipTypes : []);
        }
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { queueMicrotask(() => { void loadSettings(); }); }, []);

  const saveBehavior = (next: BehaviorSettings) => {
    if (behaviorSaveTimer.current) clearTimeout(behaviorSaveTimer.current);
    behaviorSaveTimer.current = setTimeout(async () => {
      try {
        const token = await getAuthToken();
        const base = getApiBase();
        if (!token || !base) return;
        await fetch(`${base}/api/users/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(next),
        });
      } catch {}
    }, 600);
  };

  const saveVoice = (next: VoicePrefs) => {
    if (voiceSaveTimer.current) clearTimeout(voiceSaveTimer.current);
    voiceSaveTimer.current = setTimeout(async () => {
      try {
        const token = await getAuthToken();
        const base = getApiBase();
        if (!token || !base) return;
        await fetch(`${base}/api/kinfolk/preferences`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(next),
        });
      } catch {}
    }, 600);
  };

  const updateBehavior = (patch: Partial<BehaviorSettings>) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setBehavior((prev) => {
      const next = { ...prev, ...patch };
      saveBehavior(next);
      return next;
    });
  };

  const updateVoice = (patch: Partial<VoicePrefs>) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setVoice((prev) => {
      const next = { ...prev, ...patch };
      saveVoice(next);
      return next;
    });
  };

  const saveSupportLens = async (next: string[]) => {
    setSupportLens(next);
    try {
      const token = await getAuthToken();
      const base = getApiBase();
      if (!token || !base) return;
      await fetch(`${base}/api/kinfolk/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          preferredOwnershipTypes: next,
          supportLensMode: next.length > 0 ? "strict_documented_designations" : "all_businesses",
        }),
      });
    } catch {}
  };

  const resetKinfolk = () => {
    Alert.alert(
      "Start Kinfolk fresh?",
      "This permanently clears your Kinfolk chats, private Kinfolk memories, feedback, and Kinfolk-only preferences. It does not delete your account, password, profile, Community posts, DMs, circles, saved places, memberships, or other Mapping With Melanin data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start fresh",
          style: "destructive",
          onPress: () => { void confirmKinfolkReset(); },
        },
      ],
    );
  };

  const confirmKinfolkReset = async () => {
    setResetting(true);
    try {
      const token = await getAuthToken();
      const base = getApiBase();
      if (!token || !base) throw new Error("Please sign in again before resetting Kinfolk.");
      const response = await fetch(`${base}/api/kinfolk/reset`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ confirmation: true }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kinfolk could not reset. Please try again.");
      setBehavior({ kinfolkMemoryEnabled: false, personalisedSuggestions: false });
      setVoice(VOICE_DEFAULTS);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Kinfolk is fresh", "Memory and personalised suggestions are off until you choose to turn them back on.");
    } catch (cause) {
      Alert.alert("Kinfolk could not reset", cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/privacy" as never)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>KinfolkAI™</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/privacy" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>KinfolkAI™</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
            <Feather name="zap" size={24} color="#fff" />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Meet KinfolkAI™</Text>
          <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>
            Your personal AI guide built for the community — helping you discover, travel, and connect with confidence.
          </Text>
        </View>

        {/* What it does */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>WHAT KINFOLKAI™ DOES</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {CAPABILITIES.map((cap, i) => (
            <React.Fragment key={cap.label}>
              <View style={styles.capRow}>
                <View style={[styles.capIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={cap.icon} size={16} color={colors.primary} />
                </View>
                <View style={styles.capContent}>
                  <Text style={[styles.capLabel, { color: colors.foreground }]}>{cap.label}</Text>
                  <Text style={[styles.capDesc, { color: colors.mutedForeground }]}>{cap.desc}</Text>
                </View>
              </View>
              {i < CAPABILITIES.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Voice Mode */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>VOICE MODE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {VOICE_MODES.map((vm, i) => {
            const selected = voice.personalityMode === vm.value;
            return (
              <React.Fragment key={vm.value}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.optionRow}
                  onPress={() => updateVoice({ personalityMode: vm.value })}
                >
                  <View style={[styles.rowIcon, { backgroundColor: selected ? colors.primary + "20" : colors.secondary }]}>
                    <Feather name={vm.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowLabel, { color: colors.foreground }]}>{vm.label}</Text>
                    <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{vm.desc}</Text>
                  </View>
                  <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
                    {selected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>
                </TouchableOpacity>
                {i < VOICE_MODES.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* Communication Style */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>COMMUNICATION STYLE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chipRowWrap}>
            {COMM_STYLES.map((s) => {
              const selected = voice.communicationStyle === s.value;
              return (
                <TouchableOpacity
                  key={s.value}
                  activeOpacity={0.8}
                  style={[styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + "15" : "transparent" }]}
                  onPress={() => updateVoice({ communicationStyle: s.value })}
                >
                  <Text style={[styles.chipText, { color: selected ? colors.primary : colors.mutedForeground }]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Emoji & Humor */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PERSONALITY DETAILS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Emoji level */}
          <View style={styles.detailRow}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="smile" size={16} color={colors.mutedForeground} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Emoji usage</Text>
            </View>
            <View style={styles.segmentRow}>
              {EMOJI_LEVELS.map((e) => {
                const selected = voice.emojiLevel === e.value;
                return (
                  <TouchableOpacity
                    key={e.value}
                    activeOpacity={0.8}
                    style={[styles.segBtn, { backgroundColor: selected ? colors.primary : colors.secondary, borderColor: selected ? colors.primary : colors.border }]}
                    onPress={() => updateVoice({ emojiLevel: e.value })}
                  >
                    <Text style={[styles.segText, { color: selected ? "#fff" : colors.mutedForeground }]}>{e.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />

          {/* Humor level */}
          <View style={styles.detailRow}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="sun" size={16} color={colors.mutedForeground} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Humor level</Text>
            </View>
            <View style={styles.segmentRow}>
              {HUMOR_LEVELS.map((h) => {
                const selected = voice.humorLevel === h.value;
                return (
                  <TouchableOpacity
                    key={h.value}
                    activeOpacity={0.8}
                    style={[styles.segBtn, { backgroundColor: selected ? colors.primary : colors.secondary, borderColor: selected ? colors.primary : colors.border }]}
                    onPress={() => updateVoice({ humorLevel: h.value })}
                  >
                    <Text style={[styles.segText, { color: selected ? "#fff" : colors.mutedForeground }]}>{h.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>COMMUNITY LANGUAGE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            accessibilityLabel="Suggest a local word or phrase"
            activeOpacity={0.8}
            style={styles.optionRow}
            onPress={() => router.push("/community-language" as never)}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="message-circle" size={16} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Suggest a local word or phrase</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Help Kinfolk understand local context. Suggestions are reviewed before they help anyone else.</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Data & Privacy */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>YOUR SUPPORT LENS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.capRow}>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Optional and private</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                Shows documented businesses you intentionally want to support. It never says who you are.
              </Text>
            </View>
          </View>
          <View style={styles.supportGrid}>
            {OWNERSHIP_FILTER_OPTIONS.map((option) => {
              const active = supportLens.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => void saveSupportLens(active
                    ? supportLens.filter((id) => id !== option.id)
                    : [...supportLens, option.id])}
                  style={[styles.supportChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.card }]}
                >
                  <Text style={{ color: active ? "#fff" : colors.foreground, fontSize: 12 }}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
            {supportLens.length > 1 ? "Results match every selection." : supportLens.length > 0 ? "Strict documented-designation results are active." : "All documented businesses are available."}
          </Text>
          <TouchableOpacity onPress={() => void saveSupportLens([])} style={styles.clearLens}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Show all businesses equally</Text>
          </TouchableOpacity>
        </View>

        {/* Data & Privacy */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DATA & PRIVACY</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="database" size={16} color={colors.mutedForeground} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Chat Memory</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {behavior.kinfolkMemoryEnabled
                  ? "KinfolkAI™ remembers your conversations to give better advice"
                  : "Conversations are not saved — each chat starts fresh"}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={() => updateBehavior({ kinfolkMemoryEnabled: !behavior.kinfolkMemoryEnabled })}>
              <View style={[styles.sw, { backgroundColor: behavior.kinfolkMemoryEnabled ? colors.primary : colors.border }]}>
                <View style={[styles.swThumb, { transform: [{ translateX: behavior.kinfolkMemoryEnabled ? 20 : 2 }] }]} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />

          <View style={styles.toggleRow}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="cpu" size={16} color={colors.mutedForeground} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Personalised Suggestions</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {behavior.personalisedSuggestions
                  ? "KinfolkAI™ uses your interests to tailor recommendations"
                  : "Receive general recommendations not tied to your profile"}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={() => updateBehavior({ personalisedSuggestions: !behavior.personalisedSuggestions })}>
              <View style={[styles.sw, { backgroundColor: behavior.personalisedSuggestions ? colors.primary : colors.border }]}>
                <View style={[styles.swThumb, { transform: [{ translateX: behavior.personalisedSuggestions ? 20 : 2 }] }]} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />

          <View style={styles.resetRow}>
            <View style={[styles.rowIcon, { backgroundColor: "#FEF2F2" }]}>
              <Feather name="rotate-ccw" size={16} color="#B91C1C" />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Reset Kinfolk</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Clear chats, private Kinfolk memories, feedback, and Kinfolk-only preferences. Your account and other app data stay untouched.</Text>
              <TouchableOpacity accessibilityLabel="Reset Kinfolk" disabled={resetting} activeOpacity={0.85} style={[styles.resetButton, { borderColor: "#FCA5A5", backgroundColor: "#FFF" }]} onPress={resetKinfolk}>
                {resetting ? <ActivityIndicator size="small" color="#B91C1C" /> : <Text style={styles.resetButtonText}>Start Kinfolk fresh</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Reassurance note */}
        <View style={[styles.note, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="lock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.noteTxt, { color: colors.mutedForeground }]}>
            Your conversations with KinfolkAI™ are never sold or shared with third parties. You can disable memory or delete your data at any time from Settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20 },
  hero: {
    alignItems: "center", padding: 24, borderRadius: 20, borderWidth: 1,
    marginBottom: 28, gap: 12,
  },
  heroIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, textAlign: "center" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 24 },
  sep: { height: 1 },
  capRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  capIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 1 },
  capContent: { flex: 1 },
  capLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  capDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  optionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  chipRowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 14 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  supportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 14 },
  supportChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  clearLens: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4 },
  detailRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  segmentRow: { flexDirection: "row", gap: 4 },
  segBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  segText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  resetRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  resetButton: { alignSelf: "flex-start", marginTop: 10, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, minWidth: 132, alignItems: "center" },
  resetButtonText: { color: "#B91C1C", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  sw: { width: 46, height: 26, borderRadius: 13, justifyContent: "center" },
  swThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFF", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  note: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  noteTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
