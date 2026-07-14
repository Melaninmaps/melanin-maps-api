import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
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
  return process.env.EXPO_PUBLIC_API_URL ?? "";
}

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("auth_session_token");
  } catch {
    return null;
  }
}

const VIBE_LIST = [
  { id: "date-night", label: "Date Night", icon: "heart" as const, desc: "Romantic, intimate, couples" },
  { id: "group-hangout", label: "Group Hangout", icon: "users" as const, desc: "Lively, social, great for squads" },
  { id: "solo-vibes", label: "Solo Vibes", icon: "user" as const, desc: "Quiet, chill, recharge energy" },
  { id: "bougie-treat", label: "Bougie Treat", icon: "award" as const, desc: "Upscale, elevated, special occasion" },
  { id: "hood-classic", label: "Hood Classic", icon: "home" as const, desc: "Authentic, local, community staple" },
  { id: "soul-food", label: "Soul Food", icon: "coffee" as const, desc: "Southern comfort, home cooking" },
  { id: "late-night", label: "Late Night", icon: "moon" as const, desc: "After dark, nightlife, good energy" },
  { id: "family-time", label: "Family Time", icon: "smile" as const, desc: "Kid-friendly, wholesome, all ages" },
  { id: "creative-scene", label: "Creative Scene", icon: "music" as const, desc: "Art, music, culture, expression" },
  { id: "wellness", label: "Wellness", icon: "activity" as const, desc: "Health, spa, spiritual, balance" },
  { id: "work-and-study", label: "Work & Study", icon: "book-open" as const, desc: "Productive, WiFi, focused energy" },
  { id: "adventure", label: "Adventure Ready", icon: "compass" as const, desc: "Active, explorative, outdoors" },
];

export default function OwnerVibeTags() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const mineRes = await fetch(`${getApiBase()}/api/businesses/mine`, { headers });
      if (!mineRes.ok) return;
      const mineData = await mineRes.json() as { business: { id: string; vibes?: string[] } | null };
      if (!mineData.business) return;

      setBusinessId(mineData.business.id);
      setSelected(mineData.business.vibes ?? []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(v => v !== id);
      if (prev.length >= 6) {
        Alert.alert("Max 6 vibes", "Remove one before adding another.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${getApiBase()}/api/vibes/businesses/${businessId}/owner-tags`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ vibes: selected }),
      });

      if (res.ok) {
        Alert.alert("Saved!", "Your vibe search tags have been updated. Customers can now find you in vibe searches.");
      } else {
        const body = await res.json() as { error?: string };
        Alert.alert("Error", body.error ?? "Could not save. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Vibe Search Tags</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="zap" size={18} color="#5B6AF0" />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Select up to 6 vibes that describe your atmosphere. These help customers find you when they search by mood and vibe.
          </Text>
        </View>

        {loading ? (
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading your vibes...</Text>
        ) : !businessId ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="alert-circle" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Business Found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              You need to list a business before setting vibe tags.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {selected.length}/6 selected
            </Text>
            <View style={styles.grid}>
              {VIBE_LIST.map((vibe) => {
                const active = selected.includes(vibe.id);
                return (
                  <TouchableOpacity
                    key={vibe.id}
                    activeOpacity={0.8}
                    onPress={() => toggle(vibe.id)}
                    style={[
                      styles.vibeCard,
                      {
                        backgroundColor: active ? "#5B6AF015" : colors.secondary,
                        borderColor: active ? "#5B6AF0" : colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.vibeIconWrap, { backgroundColor: active ? "#5B6AF020" : colors.background }]}>
                      <Feather name={vibe.icon} size={20} color={active ? "#5B6AF0" : colors.mutedForeground} />
                    </View>
                    <Text style={[styles.vibeLabel, { color: active ? "#5B6AF0" : colors.foreground }]}>
                      {vibe.label}
                    </Text>
                    <Text style={[styles.vibeDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {vibe.desc}
                    </Text>
                    {active && (
                      <View style={styles.checkBadge}>
                        <Feather name="check" size={11} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => void handleSave()}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: saving ? colors.mutedForeground : "#5B6AF0" }]}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Vibe Tags"}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  infoText: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  loadingText: { fontSize: 14, textAlign: "center", marginTop: 40 },
  emptyCard: {
    alignItems: "center",
    gap: 10,
    padding: 28,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyText: { fontSize: 13.5, textAlign: "center", lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  vibeCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
    position: "relative",
  },
  vibeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  vibeLabel: { fontSize: 14, fontWeight: "700" },
  vibeDesc: { fontSize: 12, lineHeight: 17 },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#5B6AF0",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
