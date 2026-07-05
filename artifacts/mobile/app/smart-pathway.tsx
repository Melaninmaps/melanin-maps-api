import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import { UpgradeModal } from "@/components/UpgradeModal";
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

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }
async function authHeaders(): Promise<Record<string, string>> {
  try {
    if (Platform.OS === "web") return {};
    const token = await SecureStore.getItemAsync("auth_session_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}
function formatRating(r: any) { return r ? Number(r).toFixed(1) : "—"; }

type Business = {
  id: string; name: string; category?: string; city: string; state: string;
  rating?: number | string; reviewCount?: number; verified?: boolean;
  latitude?: number; longitude?: number;
};
type Event = {
  id: string; title: string; date: string; city?: string; state?: string;
};
type SafetySection = {
  score: number | null; surveyCount: number; wouldReturnPercent: number | null; hasData: boolean;
};
type IntentConfig = {
  id: string; label: string; emoji: string; color: string; description: string;
  nextActions: string[]; kinfolkPrompts: string[];
};
type PinData = {
  id: string; label: string; city?: string; state?: string; intentId?: string;
};
type PathwayData = {
  pin: PinData;
  intent: IntentConfig;
  sections: {
    nextActions: string[];
    businessesNearby: Business[];
    businessesByCategory: Array<{ category: string; businesses: Business[] }>;
    safety: SafetySection;
    events: Event[];
    kinfolkPrompts: string[];
  };
  stats: { totalNearby: number; verifiedNearby: number; categories: string[] };
};

export default function SmartPathwayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pinId } = useLocalSearchParams<{ pinId: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [pathway, setPathway] = useState<PathwayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState<PinData[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const loadPathway = useCallback(async () => {
    if (!pinId) return;
    setLoading(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/smart-pathways/pins/${pinId}/pathway`, { headers: h });
      if (res.status === 403) { setShowUpgrade(true); return; }
      if (res.ok) setPathway(await res.json() as PathwayData);
    } catch { /**/ } finally { setLoading(false); }
  }, [pinId]);

  const loadPins = useCallback(async () => {
    try {
      const h = await authHeaders();
      const res = await fetch(`${getApiBase()}/api/smart-pathways/pins`, { headers: h });
      if (res.ok) setPins((await res.json() as { pins: PinData[] }).pins);
    } catch { /**/ }
  }, []);

  useEffect(() => { loadPathway(); loadPins(); }, [loadPathway]);

  const handleDelete = () => {
    Alert.alert("Remove pin?", "This will delete this neighborhood pin.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          try {
            const h = await authHeaders();
            await fetch(`${getApiBase()}/api/smart-pathways/pins/${pinId}`, { method: "DELETE", headers: h });
            router.canGoBack() ? router.back() : router.replace("/(tabs)/map" as never);
          } catch { Alert.alert("Error", "Could not remove pin."); }
        },
      },
    ]);
  };

  const openKinfolk = (prompt: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/(tabs)/travel", params: { kinfolkPrompt: prompt } } as never);
  };

  const otherPins = pins.filter(p => p.id !== pinId);

  if (loading) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingTxt, { color: colors.mutedForeground }]}>Building your pathway…</Text>
      </View>
    );
  }

  if (!pathway) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 40 }}>📍</Text>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Pathway not found</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={[styles.backBtnLarge, { borderColor: colors.border }]}>
          <Text style={[{ color: colors.primary, fontWeight: "700" }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { pin, intent, sections, stats } = pathway;
  const iColor = intent.color;

  return (
    <>
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: iColor + "12", borderBottomColor: iColor + "30" }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/map" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.intentRow}>
            <Text style={styles.intentEmoji}>{intent.emoji}</Text>
            <View style={[styles.intentBadge, { backgroundColor: iColor }]}>
              <Text style={styles.intentBadgeTxt}>Smart Pathway™</Text>
            </View>
          </View>
          <Text style={[styles.pathwayTitle, { color: colors.foreground }]} numberOfLines={1}>
            {pin.label}{pin.city && pin.city !== pin.label ? `, ${pin.city}` : ""}
          </Text>
          <Text style={[styles.pathwaySub, { color: iColor }]}>{intent.label}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="trash-2" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 40 }}>

        {/* Stats bar */}
        <View style={[styles.statsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {[
            { label: "Nearby", value: String(stats.totalNearby), icon: "map-pin" as const },
            { label: "Verified", value: String(stats.verifiedNearby), icon: "shield" as const },
            { label: "Categories", value: String(stats.categories.length), icon: "grid" as const },
            ...(sections.safety.hasData
              ? [{ label: "Safety", value: sections.safety.score ? `${sections.safety.score}/10` : "–", icon: "heart" as const }]
              : []),
          ].map(stat => (
            <View key={stat.label} style={styles.statItem}>
              <Feather name={stat.icon} size={14} color={iColor} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Next Steps ──────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: iColor + "15" }]}>
              <Feather name="check-square" size={16} color={iColor} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Next Steps</Text>
          </View>
          <View style={styles.nextActionsWrap}>
            {sections.nextActions.map((action, idx) => (
              <View key={idx} style={[styles.nextAction, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.nextActionNum, { backgroundColor: iColor }]}>
                  <Text style={styles.nextActionNumTxt}>{idx + 1}</Text>
                </View>
                <Text style={[styles.nextActionTxt, { color: colors.foreground }]}>{action}</Text>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </View>
            ))}
          </View>
        </View>

        {/* ── Businesses By Category ──────────────────────────────────────────── */}
        {sections.businessesByCategory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: iColor + "15" }]}>
                <Feather name="map-pin" size={16} color={iColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nearby Resources</Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  {stats.totalNearby} minority-owned businesses within 50 miles
                </Text>
              </View>
            </View>
            {sections.businessesByCategory.map(({ category, businesses }) => (
              <View key={category} style={styles.categoryBlock}>
                <Text style={[styles.categoryLabel, { color: colors.foreground }]}>{category}</Text>
                {businesses.map(b => (
                  <TouchableOpacity activeOpacity={0.85}
                    key={b.id}
                    style={[styles.bizCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); router.push({ pathname: "/business/[id]", params: { id: b.id } } as never); }}
                  >
                    <View style={[styles.bizAvatar, { backgroundColor: iColor + "15" }]}>
                      <Feather name="briefcase" size={14} color={iColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={1}>{b.name}</Text>
                      <Text style={[styles.bizLocation, { color: colors.mutedForeground }]}>{b.city}, {b.state}</Text>
                    </View>
                    <View style={styles.bizRight}>
                      {b.verified && (
                        <View style={[styles.verBadge, { backgroundColor: "#0891B2" + "15" }]}>
                          <Feather name="shield" size={10} color="#0891B2" />
                        </View>
                      )}
                      <Text style={[styles.bizRating, { color: colors.mutedForeground }]}>
                        ⭐ {formatRating(b.rating)}
                      </Text>
                      <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── Safety Overview ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: "#7C3AED15" }]}>
              <Feather name="shield" size={16} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Safety Overview</Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Community-powered safety data</Text>
            </View>
          </View>
          {sections.safety.hasData ? (
            <View style={[styles.safetyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.safetyRow}>
                <View style={styles.safetyMetric}>
                  <Text style={[styles.safetyScore, { color: "#7C3AED" }]}>
                    {sections.safety.score ?? "–"}<Text style={styles.safetyScoreMax}>/10</Text>
                  </Text>
                  <Text style={[styles.safetyMetricLabel, { color: colors.mutedForeground }]}>Safety Score</Text>
                </View>
                {sections.safety.wouldReturnPercent !== null && (
                  <View style={styles.safetyMetric}>
                    <Text style={[styles.safetyScore, { color: "#16A34A" }]}>
                      {sections.safety.wouldReturnPercent}<Text style={styles.safetyScoreMax}>%</Text>
                    </Text>
                    <Text style={[styles.safetyMetricLabel, { color: colors.mutedForeground }]}>Would Return Alone</Text>
                  </View>
                )}
                <View style={styles.safetyMetric}>
                  <Text style={[styles.safetyScore, { color: colors.foreground }]}>
                    {sections.safety.surveyCount}
                  </Text>
                  <Text style={[styles.safetyMetricLabel, { color: colors.mutedForeground }]}>Community Reports</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.85}
                style={[styles.safetyLink, { borderTopColor: colors.border }]}
                onPress={() => openKinfolk(`What do locals say about safety in ${pin.label}?`)}
              >
                <Feather name="cpu" size={13} color="#7C3AED" />
                <Text style={[styles.safetyLinkTxt, { color: "#7C3AED" }]}>Ask KinfolkAI about safety here</Text>
                <Feather name="arrow-right" size={13} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.emptySafety, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 28 }}>🛡️</Text>
              <Text style={[styles.emptySafetyTxt, { color: colors.mutedForeground }]}>
                No safety surveys yet for this area. Be the first to submit one.
              </Text>
              <TouchableOpacity activeOpacity={0.85}
                style={[styles.surveyCta, { borderColor: "#7C3AED" }]}
                onPress={() => router.push("/safety-survey" as never)}
              >
                <Text style={[styles.surveyCtaTxt, { color: "#7C3AED" }]}>Submit a safety report →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Nearby Events ───────────────────────────────────────────────────── */}
        {sections.events.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: "#DC262615" }]}>
                <Feather name="calendar" size={16} color="#DC2626" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Events Nearby</Text>
            </View>
            {sections.events.map(event => (
              <View key={event.id} style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.eventDot, { backgroundColor: "#DC2626" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>{event.title}</Text>
                  {event.city && (
                    <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>
                      {event.city}{event.state ? `, ${event.state}` : ""}
                    </Text>
                  )}
                </View>
                <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>
                  {event.date?.slice(0, 10) ?? ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Ask KinfolkAI ───────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="cpu" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ask KinfolkAI</Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Personalized answers about {pin.label}</Text>
            </View>
          </View>
          <View style={styles.promptsWrap}>
            {sections.kinfolkPrompts.map((prompt, idx) => (
              <TouchableOpacity activeOpacity={0.85}
                key={idx}
                style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openKinfolk(prompt)}
              >
                <Text style={styles.promptQuote}>"</Text>
                <Text style={[styles.promptTxt, { color: colors.foreground }]} numberOfLines={2}>{prompt}</Text>
                <Feather name="arrow-right" size={14} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Compare Neighborhoods ───────────────────────────────────────────── */}
        {otherPins.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: "#6B728015" }]}>
                <Feather name="bar-chart-2" size={16} color="#6B7280" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Compare Neighborhoods</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
              {otherPins.map(other => (
                <TouchableOpacity activeOpacity={0.85}
                  key={other.id}
                  style={[styles.comparePill, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    router.push({ pathname: "/compare-neighborhoods", params: { pin1: pinId, pin2: other.id } } as never);
                  }}
                >
                  <Feather name="map-pin" size={13} color={colors.primary} />
                  <Text style={[styles.comparePillTxt, { color: colors.foreground }]} numberOfLines={1}>
                    vs {other.label}
                  </Text>
                  <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Change Intent ────────────────────────────────────────────────────── */}
        <View style={[styles.changeIntent, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16 }]}>
          <Text style={{ fontSize: 22 }}>{intent.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.changeIntentTitle, { color: colors.foreground }]}>Wrong pathway?</Text>
            <Text style={[styles.changeIntentSub, { color: colors.mutedForeground }]}>You can re-pin this area with a different goal.</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={[styles.changeIntentBtn, { borderColor: colors.border }]}>
            <Text style={[styles.changeIntentBtnTxt, { color: colors.foreground }]}>Change</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>

    <UpgradeModal
      visible={showUpgrade}
      onClose={() => { setShowUpgrade(false); router.canGoBack() ? router.back() : router.replace("/(tabs)/map" as never); }}
      feature="Smart Pathways™"
      reason="Smart Pathways™ builds personalized relocation, travel, and safety plans on your behalf — that's premium intelligence."
    />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", gap: 12 },
  loadingTxt: { fontSize: 14, marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  backBtnLarge: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },

  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  intentRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  intentEmoji: { fontSize: 20 },
  intentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  intentBadgeTxt: { color: "#FFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  pathwayTitle: { fontSize: 19, fontWeight: "800" },
  pathwaySub: { fontSize: 13, fontWeight: "600", marginTop: 1 },

  statsBar: { flexDirection: "row", paddingVertical: 14, borderBottomWidth: 1 },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 17, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "600" },

  section: { paddingHorizontal: 16, paddingTop: 22, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  sectionSub: { fontSize: 12, marginTop: 1 },

  nextActionsWrap: { gap: 8 },
  nextAction: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  nextActionNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  nextActionNumTxt: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  nextActionTxt: { flex: 1, fontSize: 14, fontWeight: "600" },

  categoryBlock: { gap: 8 },
  categoryLabel: { fontSize: 13, fontWeight: "700", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  bizCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  bizAvatar: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bizName: { fontSize: 13, fontWeight: "700" },
  bizLocation: { fontSize: 11, marginTop: 1 },
  bizRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  verBadge: { width: 20, height: 20, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  bizRating: { fontSize: 11 },

  safetyCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  safetyRow: { flexDirection: "row", padding: 16, gap: 8 },
  safetyMetric: { flex: 1, alignItems: "center", gap: 4 },
  safetyScore: { fontSize: 26, fontWeight: "900" },
  safetyScoreMax: { fontSize: 14, fontWeight: "600" },
  safetyMetricLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  safetyLink: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderTopWidth: 1 },
  safetyLinkTxt: { flex: 1, fontSize: 13, fontWeight: "600" },
  emptySafety: { alignItems: "center", gap: 8, padding: 20, borderRadius: 14, borderWidth: 1 },
  emptySafetyTxt: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  surveyCta: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  surveyCtaTxt: { fontSize: 13, fontWeight: "600" },

  eventCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventTitle: { fontSize: 13, fontWeight: "700" },
  eventMeta: { fontSize: 11, marginTop: 2 },
  eventDate: { fontSize: 11 },

  promptsWrap: { gap: 8 },
  promptCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  promptQuote: { fontSize: 22, color: "#D1D5DB", lineHeight: 24 },
  promptTxt: { flex: 1, fontSize: 13, lineHeight: 18, fontStyle: "italic" },

  comparePill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  comparePillTxt: { fontSize: 13, fontWeight: "600", maxWidth: 140 },

  changeIntent: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 20, marginBottom: 8 },
  changeIntentTitle: { fontSize: 14, fontWeight: "700" },
  changeIntentSub: { fontSize: 12, marginTop: 2 },
  changeIntentBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  changeIntentBtnTxt: { fontSize: 13, fontWeight: "600" },
});
