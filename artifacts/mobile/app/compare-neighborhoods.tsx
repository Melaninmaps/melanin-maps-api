import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { UpgradeModal } from "@/components/UpgradeModal";
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

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function authHeaders(): Promise<Record<string, string>> {
  try {
    if (Platform.OS === "web") return {};
    const token = await SecureStore.getItemAsync("auth_session_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

type PinSummary = {
  id: string; label: string; city?: string; state?: string; intentId?: string;
  intent?: { emoji: string; label: string; color: string };
  stats: { totalNearby: number; verifiedNearby: number; categories: string[] };
  safety: { score: number | null; surveyCount: number; wouldReturnPercent: number | null; hasData: boolean };
};
type Comparison = {
  businessCount: { pin1: number; pin2: number };
  verifiedCount: { pin1: number; pin2: number };
  safetyScore: { pin1: number | null; pin2: number | null };
  wouldReturn: { pin1: number | null; pin2: number | null };
  surveyCount: { pin1: number; pin2: number };
  eventCount: { pin1: number; pin2: number };
  topCategories: { pin1: string[]; pin2: string[] };
};
type CompareData = {
  pin1: PinSummary; pin2: PinSummary;
  comparison: Comparison;
  kinfolkPrompts: string[];
};

function CompareBar({ label, val1, val2, max, color1, color2, suffix = "" }: {
  label: string; val1: number | null; val2: number | null; max: number;
  color1: string; color2: string; suffix?: string;
}) {
  const colors_local = { bar: "#E5E7EB" };
  const v1 = val1 ?? 0;
  const v2 = val2 ?? 0;
  const effectiveMax = max || Math.max(v1, v2, 1);
  return (
    <View style={cStyles.barRow}>
      <Text style={cStyles.barLabel}>{label}</Text>
      <View style={cStyles.barBody}>
        <View style={cStyles.barTrack}>
          <View style={[cStyles.barFill, { width: `${Math.round((v1 / effectiveMax) * 100)}%` as any, backgroundColor: color1 }]} />
        </View>
        <View style={cStyles.barValues}>
          <Text style={[cStyles.barVal, { color: color1 }]}>{val1 !== null ? `${val1}${suffix}` : "–"}</Text>
          <Text style={[cStyles.barVal, { color: color2 }]}>{val2 !== null ? `${val2}${suffix}` : "–"}</Text>
        </View>
        <View style={cStyles.barTrack}>
          <View style={[cStyles.barFill, { width: `${Math.round((v2 / effectiveMax) * 100)}%` as any, backgroundColor: color2 }]} />
        </View>
      </View>
    </View>
  );
}

export default function CompareNeighborhoodsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pin1: pin1Id, pin2: pin2Id } = useLocalSearchParams<{ pin1: string; pin2: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    (async () => {
      if (!pin1Id || !pin2Id) { setLoading(false); return; }
      setLoading(true);
      try {
        const h = await authHeaders();
        const res = await fetch(
          `${getApiBase()}/api/smart-pathways/compare?pin1=${pin1Id}&pin2=${pin2Id}`,
          { headers: h }
        );
        if (res.status === 403) { setShowUpgrade(true); setLoading(false); return; }
        if (res.ok) setData(await res.json() as CompareData);
      } catch { /**/ } finally { setLoading(false); }
    })();
  }, [pin1Id, pin2Id]);

  const openKinfolk = (prompt: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/(tabs)/travel", params: { kinfolkPrompt: prompt } } as never);
  };

  const color1 = data?.pin1?.intent?.color ?? "#2563EB";
  const color2 = data?.pin2?.intent?.color ?? "#DC2626";

  if (loading) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[{ color: colors.mutedForeground, marginTop: 10, fontSize: 14 }]}>Comparing neighborhoods…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 36 }}>⚖️</Text>
        <Text style={[{ color: colors.foreground, fontSize: 18, fontWeight: "700" }]}>Could not load comparison</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { pin1, pin2, comparison, kinfolkPrompts } = data;

  return (
    <>
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/map" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Compare Neighborhoods</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Side-by-side community data</Text>
        </View>
        <View style={[styles.icon, { backgroundColor: "#6B728015" }]}>
          <Text style={{ fontSize: 18 }}>⚖️</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 40 }}>

        {/* Neighborhood name cards */}
        <View style={[styles.nameRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.nameCard, { backgroundColor: color1 + "12", borderColor: color1 + "30" }]}>
            <Text style={{ fontSize: 20 }}>{pin1.intent?.emoji ?? "📍"}</Text>
            <Text style={[styles.nameTxt, { color: colors.foreground }]} numberOfLines={2}>{pin1.label}</Text>
            {pin1.city && <Text style={[styles.nameSub, { color: colors.mutedForeground }]}>{pin1.city}{pin1.state ? `, ${pin1.state}` : ""}</Text>}
            {pin1.intent && (
              <View style={[styles.intentTag, { backgroundColor: color1 }]}>
                <Text style={styles.intentTagTxt}>{pin1.intent.label.replace("I'm ", "")}</Text>
              </View>
            )}
          </View>
          <View style={[styles.vsCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.vsTxt, { color: colors.mutedForeground }]}>VS</Text>
          </View>
          <View style={[styles.nameCard, { backgroundColor: color2 + "12", borderColor: color2 + "30" }]}>
            <Text style={{ fontSize: 20 }}>{pin2.intent?.emoji ?? "📍"}</Text>
            <Text style={[styles.nameTxt, { color: colors.foreground }]} numberOfLines={2}>{pin2.label}</Text>
            {pin2.city && <Text style={[styles.nameSub, { color: colors.mutedForeground }]}>{pin2.city}{pin2.state ? `, ${pin2.state}` : ""}</Text>}
            {pin2.intent && (
              <View style={[styles.intentTag, { backgroundColor: color2 }]}>
                <Text style={styles.intentTagTxt}>{pin2.intent.label.replace("I'm ", "")}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Legend */}
        <View style={[styles.legend, { borderBottomColor: colors.border }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color1 }]} />
            <Text style={[styles.legendTxt, { color: colors.foreground }]} numberOfLines={1}>{pin1.label}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color2 }]} />
            <Text style={[styles.legendTxt, { color: colors.foreground }]} numberOfLines={1}>{pin2.label}</Text>
          </View>
        </View>

        {/* Comparison bars */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Minority-Owned Businesses</Text>
          <CompareBar label="Total nearby" val1={comparison.businessCount.pin1} val2={comparison.businessCount.pin2}
            max={Math.max(comparison.businessCount.pin1, comparison.businessCount.pin2, 1)} color1={color1} color2={color2} />
          <CompareBar label="Verified" val1={comparison.verifiedCount.pin1} val2={comparison.verifiedCount.pin2}
            max={Math.max(comparison.verifiedCount.pin1, comparison.verifiedCount.pin2, 1)} color1={color1} color2={color2} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community Safety</Text>
          <CompareBar label="Safety score" val1={comparison.safetyScore.pin1} val2={comparison.safetyScore.pin2}
            max={10} color1={color1} color2={color2} suffix="/10" />
          <CompareBar label="Would return alone" val1={comparison.wouldReturn.pin1} val2={comparison.wouldReturn.pin2}
            max={100} color1={color1} color2={color2} suffix="%" />
          <CompareBar label="Community reports" val1={comparison.surveyCount.pin1} val2={comparison.surveyCount.pin2}
            max={Math.max(comparison.surveyCount.pin1, comparison.surveyCount.pin2, 1)} color1={color1} color2={color2} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community Activity</Text>
          <CompareBar label="Upcoming events" val1={comparison.eventCount.pin1} val2={comparison.eventCount.pin2}
            max={Math.max(comparison.eventCount.pin1, comparison.eventCount.pin2, 1)} color1={color1} color2={color2} />
        </View>

        {/* Categories */}
        <View style={[styles.catSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Business Categories</Text>
          <View style={styles.catRow}>
            <View style={{ flex: 1, gap: 6 }}>
              {comparison.topCategories.pin1.slice(0, 6).map((cat, i) => (
                <View key={i} style={[styles.catPill, { backgroundColor: color1 + "15", borderColor: color1 + "30" }]}>
                  <Text style={[styles.catPillTxt, { color: color1 }]} numberOfLines={1}>{cat}</Text>
                </View>
              ))}
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              {comparison.topCategories.pin2.slice(0, 6).map((cat, i) => (
                <View key={i} style={[styles.catPill, { backgroundColor: color2 + "15", borderColor: color2 + "30" }]}>
                  <Text style={[styles.catPillTxt, { color: color2 }]} numberOfLines={1}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Ask KinfolkAI */}
        <View style={styles.kinfolkSection}>
          <View style={[styles.kinfolkHeader, { borderColor: colors.border }]}>
            <Feather name="cpu" size={16} color={colors.primary} />
            <Text style={[styles.kinfolkTitle, { color: colors.foreground }]}>Ask KinfolkAI to Compare</Text>
          </View>
          {kinfolkPrompts.map((p, i) => (
            <TouchableOpacity key={i}
              style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openKinfolk(p
                .replace("these two neighborhoods", `${pin1.label} vs ${pin2.label}`)
                .replace("these two", `${pin1.label} and ${pin2.label}`)
              )}
            >
              <Text style={[styles.promptQuote, { color: "#D1D5DB" }]}>"</Text>
              <Text style={[styles.promptTxt, { color: colors.foreground }]} numberOfLines={2}>{p
                .replace("these two neighborhoods", `${pin1.label} vs ${pin2.label}`)
                .replace("these two", `${pin1.label} and ${pin2.label}`)
              }</Text>
              <Feather name="arrow-right" size={14} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>

    <UpgradeModal
      visible={showUpgrade}
      onClose={() => { setShowUpgrade(false); router.canGoBack() ? router.back() : router.replace("/(tabs)/map" as never); }}
      feature="Neighborhood Comparison"
      reason="Side-by-side neighborhood intelligence is a premium feature — it does significant analytical work on your behalf."
    />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center" },
  backBtn: { marginTop: 14, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerBack: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 19, fontWeight: "800" },
  headerSub: { fontSize: 12, marginTop: 2 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 0, padding: 16, borderBottomWidth: 1 },
  nameCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, gap: 5, alignItems: "flex-start" },
  nameTxt: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  nameSub: { fontSize: 11 },
  intentTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 2 },
  intentTagTxt: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  vsCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, marginHorizontal: 8 },
  vsTxt: { fontSize: 10, fontWeight: "800" },
  legend: { flexDirection: "row", gap: 16, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { fontSize: 12, fontWeight: "600" },
  section: { margin: 16, marginBottom: 0, padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  catSection: { margin: 16, marginBottom: 0, padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  catRow: { flexDirection: "row", gap: 10 },
  catPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  catPillTxt: { fontSize: 11, fontWeight: "600" },
  kinfolkSection: { margin: 16, gap: 8 },
  kinfolkHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 8, borderBottomWidth: 1 },
  kinfolkTitle: { fontSize: 15, fontWeight: "800" },
  promptCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  promptQuote: { fontSize: 22, lineHeight: 24 },
  promptTxt: { flex: 1, fontSize: 13, lineHeight: 18, fontStyle: "italic" },
});

const cStyles = StyleSheet.create({
  barRow: { gap: 6 },
  barLabel: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  barBody: { flexDirection: "row", alignItems: "center", gap: 8 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "#F3F4F6", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barValues: { width: 70, flexDirection: "row", justifyContent: "space-between" },
  barVal: { fontSize: 12, fontWeight: "700", width: 30, textAlign: "center" },
});
