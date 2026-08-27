import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
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

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}
async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

type BroadcastType = "event" | "offer" | "product" | "update" | "community" | "emergency";
type Frequency = "immediate" | "daily_digest" | "weekly_digest" | "never";

const TYPE_OPTIONS: { id: BroadcastType; emoji: string; label: string }[] = [
  { id: "event", emoji: "🎉", label: "Events" },
  { id: "offer", emoji: "💲", label: "Sales & Promotions" },
  { id: "product", emoji: "🆕", label: "New Products & Services" },
  { id: "update", emoji: "📣", label: "Business Updates" },
  { id: "community", emoji: "❤️", label: "Community Announcements" },
  { id: "emergency", emoji: "🚨", label: "Emergency Alerts" },
];

const FREQUENCY_OPTIONS: { id: Frequency; label: string; sub: string }[] = [
  { id: "immediate", label: "Immediate", sub: "Notifications as they happen" },
  { id: "daily_digest", label: "Daily Digest", sub: "One combined notification each day" },
  { id: "weekly_digest", label: "Weekly Digest", sub: "One summary per week" },
  { id: "never", label: "Never", sub: "No notifications from this business" },
];

const PAUSE_OPTIONS = [
  { label: "1 week", days: 7 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
];

type Prefs = {
  enabledTypes: BroadcastType[];
  frequency: Frequency;
  pausedUntil: string | null;
};

export default function NotificationPrefsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { businessId, businessName } = useLocalSearchParams<{ businessId: string; businessName: string }>();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    enabledTypes: ["event", "offer", "community", "emergency"],
    frequency: "immediate",
    pausedUntil: null,
  });

  const load = useCallback(async () => {
    if (!businessId) return;
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/businesses/${businessId}/notification-prefs`, { headers });
      if (res.ok) {
        const data = await res.json() as { prefs: Prefs };
        setPrefs(data.prefs);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { queueMicrotask(() => { load(); }); }, [load]);

  const toggleType = (t: BroadcastType) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setPrefs(prev => ({
      ...prev,
      enabledTypes: prev.enabledTypes.includes(t)
        ? prev.enabledTypes.filter(x => x !== t)
        : [...prev.enabledTypes, t],
    }));
  };

  const setFrequency = (f: Frequency) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setPrefs(prev => ({ ...prev, frequency: f }));
  };

  const pauseFor = (days: number) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    setPrefs(prev => ({ ...prev, pausedUntil: until.toISOString() }));
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const clearPause = () => setPrefs(prev => ({ ...prev, pausedUntil: null }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/businesses/${businessId}/notification-prefs`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.canGoBack() ? router.back() : router.replace("/(tabs)" as never);
      } else {
        Alert.alert("Error", "Could not save preferences. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const isPaused = prefs.pausedUntil && new Date(prefs.pausedUntil) > new Date();
  const pausedUntilFormatted = prefs.pausedUntil
    ? new Date(prefs.pausedUntil).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {businessName ? `${businessName} Alerts` : "Notification Preferences"}
        </Text>
        <TouchableOpacity activeOpacity={0.85} style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving || loading}>
          <Text style={styles.saveBtnTxt}>{saving ? "Saving…" : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>

        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          Saving a business doesn&apos;t automatically subscribe you to everything. Choose exactly what you want to hear about.
        </Text>

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>What would you like to hear about?</Text>
        {TYPE_OPTIONS.map(opt => {
          const active = prefs.enabledTypes.includes(opt.id);
          const isEmergency = opt.id === "emergency";
          return (
            <TouchableOpacity activeOpacity={0.85}
              key={opt.id}
              style={[styles.optRow, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => { if (isEmergency && active) return; toggleType(opt.id); }}
            >
              <Text style={styles.optEmoji}>{opt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optLabel, { color: colors.foreground }]}>{opt.label}</Text>
                {isEmergency && <Text style={[styles.optHint, { color: colors.mutedForeground }]}>Always on — can&apos;t be disabled</Text>}
              </View>
              <View style={[styles.checkbox, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : "transparent" }]}>
                {active && <Feather name="check" size={13} color="#FFF" />}
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionLabel, { color: colors.foreground, marginTop: 24 }]}>How often?</Text>
        {FREQUENCY_OPTIONS.map(opt => (
          <TouchableOpacity activeOpacity={0.85}
            key={opt.id}
            style={[styles.freqRow, { borderColor: prefs.frequency === opt.id ? colors.primary : colors.border, backgroundColor: prefs.frequency === opt.id ? colors.primary + "12" : colors.card }]}
            onPress={() => setFrequency(opt.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.freqLabel, { color: colors.foreground }]}>{opt.label}</Text>
              <Text style={[styles.freqSub, { color: colors.mutedForeground }]}>{opt.sub}</Text>
            </View>
            {prefs.frequency === opt.id && <Feather name="check-circle" size={18} color={colors.primary} />}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.foreground, marginTop: 24 }]}>
          {isPaused ? `⏸ Paused until ${pausedUntilFormatted}` : "Pause notifications"}
        </Text>
        {isPaused ? (
          <TouchableOpacity activeOpacity={0.85} style={[styles.pauseBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={clearPause}>
            <Feather name="bell" size={16} color={colors.primary} />
            <Text style={[styles.pauseBtnTxt, { color: colors.primary }]}>Resume notifications now</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.pauseOptions}>
            {PAUSE_OPTIONS.map(p => (
              <TouchableOpacity activeOpacity={0.85} key={p.label} style={[styles.pauseChip, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => pauseFor(p.days)}>
                <Feather name="pause-circle" size={14} color={colors.mutedForeground} />
                <Text style={[styles.pauseChipTxt, { color: colors.foreground }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={[styles.pauseNote, { color: colors.mutedForeground }]}>
          Pausing keeps you following without receiving notifications. Emergency alerts always come through.
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 6 },
  intro: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  sectionLabel: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  optRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  optEmoji: { fontSize: 20 },
  optLabel: { fontSize: 14, fontWeight: "600" },
  optHint: { fontSize: 12, marginTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  freqRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 4 },
  freqLabel: { fontSize: 14, fontWeight: "600" },
  freqSub: { fontSize: 12, marginTop: 2 },
  pauseOptions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pauseChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  pauseChipTxt: { fontSize: 13, fontWeight: "500" },
  pauseBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  pauseBtnTxt: { fontSize: 14, fontWeight: "600" },
  pauseNote: { fontSize: 12, lineHeight: 18, marginTop: 8 },
});
