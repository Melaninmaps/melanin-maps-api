import React, { useEffect, useState } from "react";
import { Animated, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

type Recommendation = {
  id: number;
  resourceType: "business" | "event" | "external_opportunity";
  resource: { id: string; title: string; category: string | null; city: string | null; state: string | null; detailPath: string; startsOn?: string; sourceUrl?: string; verificationState?: "source_confirmed" };
  interestLabel: string;
  reason: string;
  source: "interest" | "circle";
  actions: Array<"save" | "share" | "not_interested" | "circle" | "more_like_this" | "wrong_assumption" | "hide_category" | "stop_recommending_topic">;
};

const CATEGORY_COLORS: Record<string, string> = { business: "#2D7A4F", event: "#7B2D8B" };

export function ForYouCard() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!user) return;
    let active = true;
    void SecureStore.getItemAsync("auth_session_token").then(async (token) => {
      setLoading(true);
      if (!token) { setLoading(false); return; }
      try {
        const response = await fetch(`${getApiBase()}/api/kinfolk/interest-intelligence`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = (response.ok ? await response.json() : { recommendations: [] }) as { recommendations?: Recommendation[]; externalOpportunities?: Recommendation[] };
        const merged = [...(data.recommendations ?? []), ...(data.externalOpportunities ?? [])];
        if (active && merged.length) {
          setRecommendations(merged);
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
      } catch {
        // For You is supplementary. Discovery remains usable if this request fails.
      } finally { if (active) setLoading(false); }
    });
    return () => { active = false; };
  }, [user, fadeAnim]);

  const feedback = async (recommendation: Recommendation, type: "interested" | "not_interested" | "hide") => {
    setRecommendations((current) => current.filter((item) => item.id !== recommendation.id));
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) return;
      await fetch(`${getApiBase()}/api/kinfolk/interest-intelligence/recommendations/${recommendation.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ feedback: type }),
      });
    } catch {
      // The local card can be dismissed without blocking the member's discovery session.
    }
  };

  const save = async (recommendation: Recommendation) => {
    if (recommendation.resourceType !== "business") return;
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) return;
      const result = await fetch(`${getApiBase()}/api/saved-places`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessId: recommendation.resource.id }),
      });
      if (result.ok) await feedback(recommendation, "interested");
    } catch { /* preserve the card if saving is unavailable */ }
  };

  const open = (recommendation: Recommendation) => {
    if (recommendation.resourceType === "business") router.push(`/business/${recommendation.resource.id}` as never);
    else if (recommendation.resourceType === "event") router.push(`/event/${recommendation.resource.id}` as never);
    else void Linking.openURL(recommendation.resource.detailPath).catch(() => undefined);
  };

  const share = async (recommendation: Recommendation) => {
    const location = [recommendation.resource.city, recommendation.resource.state].filter(Boolean).join(", ");
    await Share.share({ message: `${recommendation.resource.title}${location ? ` — ${location}` : ""}\n${recommendation.reason}` }).catch(() => undefined);
  };

  if (!user || dismissed || loading || !recommendations.length) return null;
  return <Animated.View style={[styles.wrap, { opacity: fadeAnim }]}>
    <View style={styles.header}><View style={styles.headerLeft}><Text style={styles.headerIcon}>✦</Text><Text style={[styles.headerTitle, { color: colors.foreground }]}>Just for You</Text><View style={[styles.aiBadge, { backgroundColor: colors.primary + "15" }]}><Text style={[styles.aiBadgeText, { color: colors.primary }]}>KinfolkAI</Text></View></View><TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Hide For You cards"><Feather name="x" size={16} color={colors.mutedForeground} /></TouchableOpacity></View>
    <Text style={[styles.disclosure, { color: colors.mutedForeground }]}>From interests you confirmed or explicitly saved—never raw chat or search text. External cards are source-confirmed, not MWM-verified.</Text>
    <ScrollView keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>{recommendations.map((recommendation) => {
      const accent = CATEGORY_COLORS[recommendation.resourceType] ?? colors.primary;
      return <View key={recommendation.id} style={[styles.card, { backgroundColor: colors.card, borderColor: accent + "30" }]}><View style={[styles.cardIconWrap, { backgroundColor: accent + "15" }]}><Text style={styles.cardIcon}>{recommendation.resourceType === "event" ? "📅" : "✦"}</Text></View><Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{recommendation.resource.title}</Text><Text style={[styles.cardMeta, { color: colors.mutedForeground }]} numberOfLines={1}>{[recommendation.resource.category, recommendation.resource.city, recommendation.resource.state].filter(Boolean).join(" · ")}</Text><Text style={[styles.cardInsight, { color: colors.mutedForeground }]} numberOfLines={3}>{recommendation.reason}</Text><View style={styles.actions}><TouchableOpacity style={[styles.cardAction, { borderColor: accent + "40", backgroundColor: accent + "10" }]} onPress={() => open(recommendation)} activeOpacity={0.8}><Text style={[styles.cardActionText, { color: accent }]}>View</Text><Feather name="arrow-right" size={12} color={accent} /></TouchableOpacity>{recommendation.actions.includes("save") ? <TouchableOpacity onPress={() => void save(recommendation)} accessibilityLabel={`Save ${recommendation.resource.title}`}><Feather name="bookmark" size={15} color={accent} /></TouchableOpacity> : null}<TouchableOpacity onPress={() => void share(recommendation)} accessibilityLabel={`Share ${recommendation.resource.title}`}><Feather name="share-2" size={15} color={accent} /></TouchableOpacity><TouchableOpacity onPress={() => void feedback(recommendation, "not_interested")} accessibilityLabel={`Not interested in ${recommendation.resource.title}`}><Feather name="thumbs-down" size={15} color={colors.mutedForeground} /></TouchableOpacity></View></View>;
    })}</ScrollView>
  </Animated.View>;
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 7 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }, headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 }, headerIcon: { fontSize: 14, color: "#CA922B" }, headerTitle: { fontFamily: "Inter_700Bold", fontSize: 15 }, aiBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }, aiBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 }, disclosure: { fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 14, marginBottom: 8 }, cards: { gap: 10, paddingRight: 4 }, card: { width: 235, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 }, cardIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 }, cardIcon: { fontSize: 18 }, cardTitle: { fontFamily: "Inter_700Bold", fontSize: 13, lineHeight: 18 }, cardMeta: { fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 14 }, cardInsight: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 }, actions: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 3 }, cardAction: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 }, cardActionText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
});
