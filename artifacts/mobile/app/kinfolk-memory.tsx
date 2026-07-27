import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
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
async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); } catch { return null; }
}

interface MemoryItem {
  icon: "map-pin" | "tag" | "dollar-sign" | "users" | "coffee" | "globe" | "heart" | "star" | "settings";
  label: string;
  value: string;
  color: string;
}

interface MemorySummary {
  favoriteCities: string[];
  favoriteCategories: string[];
  budgetRange: string | null;
  travelCompanion: string | null;
  tripStyle: string[];
  dietaryNotes: string | null;
  communicationStyle: string | null;
  personalityMode: string | null;
  emojiLevel: string | null;
  humorLevel: string | null;
  culturalInterests: string[];
  diasporaCountries: string[];
  lifestyleServices: string[];
}

const MODE_LABELS: Record<string, string> = {
  community: "Community guide",
  professional: "Professional mode",
  local: "Local insider",
  home: "Home & comfort",
  neighborhood_guide: "Neighborhood guide",
};

const COMPANION_LABELS: Record<string, string> = {
  solo: "Solo explorer",
  partner: "With a partner",
  family: "Family trips",
  group: "Group travels",
  friends: "Friends crew",
};

export default function KinfolkMemoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MemorySummary | null>(null);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => { void load(); }, []);

  const load = async () => {
    try {
      const token = await getToken();
      const base = getApiBase();
      if (!token || !base) { setLoading(false); return; }
      const res = await fetch(`${base}/api/kinfolk/memory-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { summary: MemorySummary };
        setSummary(data.summary);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const buildItems = (s: MemorySummary): MemoryItem[] => {
    const items: MemoryItem[] = [];
    if (s.favoriteCities?.length)
      items.push({ icon: "map-pin", label: "Favorite Cities", value: s.favoriteCities.slice(0, 5).join(", "), color: colors.primary });
    if (s.favoriteCategories?.length)
      items.push({ icon: "tag", label: "Go-To Categories", value: s.favoriteCategories.slice(0, 4).join(", "), color: "#7C3AED" });
    if (s.budgetRange && s.budgetRange !== "any")
      items.push({ icon: "dollar-sign", label: "Budget Style", value: s.budgetRange, color: "#059669" });
    if (s.travelCompanion)
      items.push({ icon: "users", label: "Travel Crew", value: COMPANION_LABELS[s.travelCompanion] ?? s.travelCompanion, color: "#DB2777" });
    if (s.tripStyle?.length)
      items.push({ icon: "star", label: "Trip Vibes", value: s.tripStyle.slice(0, 3).join(", "), color: "#D97706" });
    if (s.dietaryNotes)
      items.push({ icon: "coffee", label: "Dietary Notes", value: s.dietaryNotes, color: "#0891B2" });
    if (s.personalityMode)
      items.push({ icon: "settings", label: "KinfolkAI Voice", value: MODE_LABELS[s.personalityMode] ?? s.personalityMode, color: colors.primary });
    if (s.culturalInterests?.length)
      items.push({ icon: "heart", label: "Cultural Interests", value: s.culturalInterests.slice(0, 4).join(", "), color: "#BE185D" });
    if (s.diasporaCountries?.length)
      items.push({ icon: "globe", label: "Diaspora Connection", value: s.diasporaCountries.slice(0, 4).join(", "), color: "#065F46" });
    if (s.lifestyleServices?.length)
      items.push({ icon: "tag", label: "Lifestyle Services", value: s.lifestyleServices.slice(0, 4).join(", "), color: "#6D28D9" });
    return items;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/kinfolk-settings" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>What KinfolkAI™ Knows</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        >
          {/* Hero explanation */}
          <View style={[styles.hero, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
              <Feather name="cpu" size={22} color="#fff" />
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Your KinfolkAI™ Profile</Text>
            <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>
              This is what KinfolkAI™ knows about you right now. The more you share, the more tailored and powerful your recommendations become.
            </Text>
          </View>

          {!summary || buildItems(summary).length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="inbox" size={36} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your profile is empty</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Complete your KinfolkAI™ setup to unlock personalized recommendations, trip briefings, and local intel tailored to you.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/kinfolk-settings" as never);
                }}
              >
                <Text style={[styles.emptyBtnTxt, { color: "#fff" }]}>Set Up My Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>WHAT I KNOW ABOUT YOU</Text>
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {buildItems(summary!).map((item, i, arr) => (
                  <React.Fragment key={item.label}>
                    <View style={styles.itemRow}>
                      <View style={[styles.itemIcon, { backgroundColor: item.color + "18" }]}>
                        <Feather name={item.icon} size={16} color={item.color} />
                      </View>
                      <View style={styles.itemContent}>
                        <Text style={[styles.itemLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                        <Text style={[styles.itemValue, { color: colors.foreground }]}>{item.value}</Text>
                      </View>
                    </View>
                    {i < arr.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />}
                  </React.Fragment>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>WANT TO UPDATE ANYTHING?</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.editBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/kinfolk-settings" as never);
                }}
              >
                <Feather name="edit-2" size={16} color="#fff" />
                <Text style={styles.editBtnTxt}>Edit My KinfolkAI™ Profile</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={[styles.note, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="lock" size={14} color={colors.mutedForeground} />
            <Text style={[styles.noteTxt, { color: colors.mutedForeground }]}>
              This information is stored securely and only used to improve your KinfolkAI™ experience. It is never shared with third parties.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20 },
  hero: { alignItems: "center", padding: 24, borderRadius: 20, borderWidth: 1, marginBottom: 28, gap: 10 },
  heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, textAlign: "center" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 24 },
  sep: { height: 1 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  itemIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  itemContent: { flex: 1 },
  itemLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.3, marginBottom: 2 },
  itemValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: "center", marginBottom: 24 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 10 },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, textAlign: "center", marginBottom: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  emptyBtnTxt: { fontSize: 14, fontFamily: "Inter_700Bold" },
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 24 },
  editBtnTxt: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  noteTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
