import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

async function getAuthToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); }
  catch { return null; }
}

interface KinfolkSettings {
  kinfolkMemoryEnabled: boolean;
  personalisedSuggestions: boolean;
}

const DEFAULTS: KinfolkSettings = {
  kinfolkMemoryEnabled: true,
  personalisedSuggestions: true,
};

const CAPABILITIES = [
  { icon: "map-pin" as const, label: "Local Discovery", desc: "Finds Black-owned businesses, events, and community spots tailored to your vibe" },
  { icon: "shield" as const, label: "Safety Intel", desc: "Summarises community safety reports so you can travel and move with confidence" },
  { icon: "navigation" as const, label: "Trip Planning", desc: "Builds personalised itineraries with culturally relevant stops and insider recommendations" },
  { icon: "users" as const, label: "Community Connections", desc: "Surfaces people, circles, and events aligned with your interests and lifestyle" },
];

export default function KinfolkSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [settings, setSettings] = useState<KinfolkSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => { void loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const token = await getAuthToken();
      const base = getApiBase();
      if (!token || !base) { setLoading(false); return; }
      const res = await fetch(`${base}/api/users/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as Partial<KinfolkSettings>;
        setSettings({ ...DEFAULTS, ...data });
      }
    } catch {}
    finally { setLoading(false); }
  };

  const saveSettings = (next: KinfolkSettings) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
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

  const update = (patch: Partial<KinfolkSettings>) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
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

        {/* Data & Privacy */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DATA & PRIVACY</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Chat Memory toggle */}
          <View style={styles.toggleRow}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="database" size={16} color={colors.mutedForeground} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Chat Memory</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {settings.kinfolkMemoryEnabled
                  ? "KinfolkAI™ remembers your conversations to give better advice"
                  : "Conversations are not saved — each chat starts fresh"}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={() => update({ kinfolkMemoryEnabled: !settings.kinfolkMemoryEnabled })}>
              <View style={[styles.sw, { backgroundColor: settings.kinfolkMemoryEnabled ? colors.primary : colors.border }]}>
                <View style={[styles.swThumb, { transform: [{ translateX: settings.kinfolkMemoryEnabled ? 20 : 2 }] }]} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />

          {/* Personalised Suggestions toggle */}
          <View style={styles.toggleRow}>
            <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="cpu" size={16} color={colors.mutedForeground} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Personalised Suggestions</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {settings.personalisedSuggestions
                  ? "KinfolkAI™ uses your interests to tailor recommendations"
                  : "Receive general recommendations not tied to your profile"}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={() => update({ personalisedSuggestions: !settings.personalisedSuggestions })}>
              <View style={[styles.sw, { backgroundColor: settings.personalisedSuggestions ? colors.primary : colors.border }]}>
                <View style={[styles.swThumb, { transform: [{ translateX: settings.personalisedSuggestions ? 20 : 2 }] }]} />
              </View>
            </TouchableOpacity>
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
  toggleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sw: { width: 46, height: 26, borderRadius: 13, justifyContent: "center" },
  swThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFF", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  note: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  noteTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
