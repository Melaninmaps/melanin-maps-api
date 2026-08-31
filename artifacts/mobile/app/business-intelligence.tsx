import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
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

interface AnalyticsData {
  metrics: { saves: number; reviews: number; avgRating: number; views30d: number; skipFeedbackCount: number };
  benchmarks: { peerCount: number; categoryAvgSaves: number; categoryAvgReviews: number; categoryAvgRating: number; categoryAvgViews30d: number };
  insights: string[];
  reviewsVsPeersPct: number;
  viewsVsPeersPct: number;
}
interface ReviewRow {
  id: string; rating: number; content: string | null; createdAt: string;
  authorFirstName?: string | null; authorLastName?: string | null;
}
interface GrowthTool { id: string; type: string; status: string; impressionCount: number; clickCount: number; }

function computeSentiment(reviews: ReviewRow[]) {
  let positive = 0, neutral = 0, negative = 0;
  const positiveWords = ["great", "excellent", "amazing", "love", "best", "wonderful", "fantastic", "perfect", "outstanding", "incredible", "helpful", "friendly", "recommend", "beautiful", "delicious", "clean", "professional"];
  const negativeWords = ["bad", "terrible", "awful", "disappointing", "worst", "poor", "rude", "slow", "dirty", "overpriced", "unprofessional", "horrible", "disgusting", "never", "avoid", "waste"];
  for (const r of reviews) {
    if (r.rating >= 4) positive++;
    else if (r.rating === 3) neutral++;
    else negative++;
    const text = (r.content ?? "").toLowerCase();
    const posHits = positiveWords.filter((w) => text.includes(w)).length;
    const negHits = negativeWords.filter((w) => text.includes(w)).length;
    if (posHits > negHits && r.rating >= 3) positive = Math.min(positive + 0.3, reviews.length);
    if (negHits > posHits && r.rating <= 3) negative = Math.min(negative + 0.3, reviews.length);
  }
  return { positive: Math.round(positive), neutral: Math.round(neutral), negative: Math.round(negative) };
}

function PctBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
        <Text style={{ fontSize: 12, color: "#6B7280" }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: "700", color }}>{value}</Text>
      </View>
      <View style={{ height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
        <View style={{ height: 8, width: `${pct}%`, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

function StatCompare({ label, mine, peers, unit, icon, color }: { label: string; mine: number; peers: number; unit: string; icon: string; color: string }) {
  const colors2 = useColors();
  const delta = peers > 0 ? Math.round(((mine - peers) / peers) * 100) : 0;
  const isAhead = mine >= peers;
  return (
    <View style={[statS.card, { backgroundColor: colors2.card, borderColor: colors2.border }]}>
      <View style={statS.row}>
        <View style={[statS.iconWrap, { backgroundColor: color + "18" }]}>
          <Feather name={icon as "star"} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[statS.label, { color: colors2.mutedForeground }]}>{label}</Text>
          <Text style={[statS.value, { color: colors2.foreground }]}>{mine.toLocaleString()}{unit}</Text>
        </View>
        <View style={[statS.badge, { backgroundColor: isAhead ? "#2D7A4F18" : "#DC262618" }]}>
          <Feather name={isAhead ? "trending-up" : "trending-down"} size={12} color={isAhead ? "#2D7A4F" : "#DC2626"} />
          <Text style={[statS.badgeTxt, { color: isAhead ? "#2D7A4F" : "#DC2626" }]}>
            {delta > 0 ? "+" : ""}{delta}% vs peers
          </Text>
        </View>
      </View>
      <View style={statS.peerRow}>
        <Text style={[statS.peerLabel, { color: colors2.mutedForeground }]}>Peer avg</Text>
        <View style={[statS.bar, { backgroundColor: colors2.secondary }]}>
          <View style={[statS.barFill, { width: `${Math.min((peers / Math.max(mine, peers)) * 100, 100)}%`, backgroundColor: colors2.secondary }]} />
        </View>
        <View style={[statS.bar, { backgroundColor: colors2.secondary }]}>
          <View style={[statS.barFill, { width: `${Math.min((mine / Math.max(mine, peers)) * 100, 100)}%`, backgroundColor: color }]} />
        </View>
        <Text style={[statS.peerLabel, { color: colors2.mutedForeground }]}>You</Text>
      </View>
    </View>
  );
}

const statS = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  value: { fontSize: 22, fontWeight: "700", marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeTxt: { fontSize: 11, fontWeight: "700" },
  peerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  peerLabel: { fontSize: 10, width: 36 },
  bar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
});

export default function BusinessIntelligenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [growth, setGrowth] = useState<GrowthTool[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paywalled, setPaywalled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      if (!token) { setLoading(false); return; }
      const base = getApiBase();
      const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const bizRes = await fetch(`${base}/api/businesses/mine`, { headers: h });
      if (!bizRes.ok) { setLoading(false); return; }
      const bizData = await bizRes.json() as { business?: { id: string; name: string } };
      const bid = bizData.business?.id;
      const bname = bizData.business?.name ?? null;
      if (!bid) { setLoading(false); return; }
      setBusinessId(bid);
      setBusinessName(bname);

      const [analyticsRes, reviewsRes, growthRes] = await Promise.allSettled([
        fetch(`${base}/api/businesses/mine/analytics`, { headers: h }),
        fetch(`${base}/api/reviews?businessId=${bid}&limit=50`, { headers: h }),
        fetch(`${base}/api/businesses/mine/growth-tools`, { headers: h }),
      ]);

      if (analyticsRes.status === "fulfilled") {
        if (analyticsRes.value.status === 403) { setPaywalled(true); }
        else if (analyticsRes.value.ok) setAnalytics(await analyticsRes.value.json() as AnalyticsData);
      }
      if (reviewsRes.status === "fulfilled" && reviewsRes.value.ok) {
        const d = await reviewsRes.value.json() as { reviews?: ReviewRow[] };
        setReviews(d.reviews ?? []);
      }
      if (growthRes.status === "fulfilled" && growthRes.value.ok) {
        const d = await growthRes.value.json() as { promotions?: GrowthTool[] };
        setGrowth((d.promotions ?? []).filter((p) => p.status === "active"));
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  const sentiment = computeSentiment(reviews);
  const totalReviews = sentiment.positive + sentiment.neutral + sentiment.negative;
  const activePromos = growth.filter((g) => g.status === "active");
  const totalImpressions = activePromos.reduce((s, p) => s + (p.impressionCount ?? 0), 0);
  const totalClicks = activePromos.reduce((s, p) => s + (p.clickCount ?? 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: "#CA922B", borderBottomColor: "#CA922B" }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: "#fff" }]}>Business Intelligence</Text>
        </View>
        <View style={s.center}><ActivityIndicator size="large" color="#CA922B" /></View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 6, backgroundColor: "#CA922B", borderBottomColor: "#CA922B" }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: "#fff" }]}>Business Intelligence</Text>
          {businessName && <Text style={[s.headerSub, { color: "rgba(255,255,255,0.8)" }]}>{businessName}</Text>}
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={load} activeOpacity={0.8}>
          <Feather name="refresh-cw" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {paywalled && (
        <View style={[s.paywallBanner, { backgroundColor: "#CA922B15", borderColor: "#CA922B30" }]}>
          <Feather name="lock" size={14} color="#CA922B" />
          <Text style={[s.paywallTxt, { color: "#CA922B" }]}>Full analytics require Navigator or Trailblazer membership.</Text>
          <TouchableOpacity onPress={() => router.push("/membership" as never)} activeOpacity={0.8}>
            <Text style={[s.paywallLink, { color: "#CA922B" }]}>Upgrade →</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: insets.bottom + 48 }}>

        {/* ─── Performance vs Peers ─── */}
        {analytics && (
          <>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Performance vs. Peers</Text>
            <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>Compared to {analytics.benchmarks.peerCount} similar businesses</Text>
            <View style={{ marginTop: 12 }}>
              <StatCompare label="Monthly Views" mine={analytics.metrics.views30d} peers={Math.round(analytics.benchmarks.categoryAvgViews30d)} unit="" icon="eye" color="#1D4ED8" />
              <StatCompare label="Total Saves" mine={analytics.metrics.saves} peers={Math.round(analytics.benchmarks.categoryAvgSaves)} unit="" icon="bookmark" color="#7C3AED" />
              <StatCompare label="Reviews" mine={analytics.metrics.reviews} peers={Math.round(analytics.benchmarks.categoryAvgReviews)} unit="" icon="message-square" color="#2D7A4F" />
              <StatCompare label="Avg Rating" mine={Number(analytics.metrics.avgRating.toFixed(1))} peers={Number(analytics.benchmarks.categoryAvgRating.toFixed(1))} unit="★" icon="star" color="#CA922B" />
            </View>
          </>
        )}

        {/* ─── Review Sentiment ─── */}
        {reviews.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Review Sentiment</Text>
            <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}</Text>
            <View style={[s.sentimentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.sentimentRow}>
                {[
                  { label: "Positive", count: sentiment.positive, color: "#2D7A4F", emoji: "😊" },
                  { label: "Neutral", count: sentiment.neutral, color: "#CA922B", emoji: "😐" },
                  { label: "Negative", count: sentiment.negative, color: "#DC2626", emoji: "😞" },
                ].map((seg) => (
                  <View key={seg.label} style={s.sentimentSeg}>
                    <Text style={{ fontSize: 24 }}>{seg.emoji}</Text>
                    <Text style={[s.sentimentCount, { color: seg.color }]}>{seg.count}</Text>
                    <Text style={[s.sentimentLabel, { color: colors.mutedForeground }]}>{seg.label}</Text>
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 14 }}>
                <PctBar label="Positive" value={sentiment.positive} max={totalReviews} color="#2D7A4F" />
                <PctBar label="Neutral" value={sentiment.neutral} max={totalReviews} color="#CA922B" />
                <PctBar label="Negative" value={sentiment.negative} max={totalReviews} color="#DC2626" />
              </View>
            </View>
          </View>
        )}

        {/* ─── Promotion Performance ─── */}
        <View style={{ marginTop: 24 }}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Promotion Performance</Text>
          <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>{activePromos.length} active promotion{activePromos.length !== 1 ? "s" : ""}</Text>
          {activePromos.length === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 32, marginBottom: 10 }}>📣</Text>
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No active promotions</Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Boost visibility with sponsored placements in search, map, and discovery feeds.</Text>
              <TouchableOpacity style={[s.emptyBtn, { backgroundColor: "#CA922B" }]} onPress={() => router.push("/business-dashboard" as never)} activeOpacity={0.8}>
                <Text style={s.emptyBtnTxt}>Go to Grow Tab</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[s.promoSummaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.promoMetricRow}>
                {[
                  { label: "Impressions", value: totalImpressions.toLocaleString(), icon: "eye", color: "#1D4ED8" },
                  { label: "Clicks", value: totalClicks.toLocaleString(), icon: "mouse-pointer", color: "#7C3AED" },
                  { label: "CTR", value: `${ctr}%`, icon: "trending-up", color: "#2D7A4F" },
                ].map((m) => (
                  <View key={m.label} style={s.promoMetric}>
                    <Feather name={m.icon as "eye"} size={16} color={m.color} />
                    <Text style={[s.promoMetricVal, { color: colors.foreground }]}>{m.value}</Text>
                    <Text style={[s.promoMetricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                  </View>
                ))}
              </View>
              {activePromos.map((p) => (
                <View key={p.id} style={[s.promoRow, { borderTopColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.promoType, { color: colors.foreground }]}>{p.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Text>
                    <Text style={[s.promoStats, { color: colors.mutedForeground }]}>{(p.impressionCount ?? 0).toLocaleString()} impressions · {(p.clickCount ?? 0).toLocaleString()} clicks</Text>
                  </View>
                  <View style={[s.activeChip, { backgroundColor: "#2D7A4F18" }]}>
                    <Text style={[s.activeChipTxt, { color: "#2D7A4F" }]}>Active</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── AI Insights ─── */}
        {analytics?.insights && analytics.insights.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>AI Insights</Text>
            <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>Personalized recommendations from KinfolkAI</Text>
            <View style={{ marginTop: 12 }}>
              {analytics.insights.map((insight, i) => (
                <View key={i} style={[s.insightRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.insightDot, { backgroundColor: "#CA922B" }]} />
                  <Text style={[s.insightTxt, { color: colors.foreground }]}>{insight}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Back to Dashboard */}
        <TouchableOpacity
          style={[s.dashBtn, { borderColor: colors.border }]}
          onPress={() => router.push("/business-dashboard" as never)}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
          <Text style={[s.dashBtnTxt, { color: colors.mutedForeground }]}>Back to Dashboard</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6, marginLeft: -6 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { fontSize: 11, marginTop: 1 },
  refreshBtn: { padding: 6 },
  paywallBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderBottomWidth: 1, flexWrap: "wrap" },
  paywallTxt: { fontSize: 13, flex: 1 },
  paywallLink: { fontSize: 13, fontWeight: "700" },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionSub: { fontSize: 12, marginTop: 3 },
  sentimentCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 12 },
  sentimentRow: { flexDirection: "row", justifyContent: "space-around" },
  sentimentSeg: { alignItems: "center", gap: 4 },
  sentimentCount: { fontSize: 22, fontWeight: "700" },
  sentimentLabel: { fontSize: 11 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: "center", marginTop: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptySub: { fontSize: 13, lineHeight: 18, textAlign: "center", marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 22 },
  emptyBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  promoSummaryCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 12 },
  promoMetricRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  promoMetric: { alignItems: "center", gap: 4 },
  promoMetricVal: { fontSize: 20, fontWeight: "700" },
  promoMetricLabel: { fontSize: 10 },
  promoRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, paddingTop: 10, marginTop: 6 },
  promoType: { fontSize: 13, fontWeight: "600" },
  promoStats: { fontSize: 11, marginTop: 2 },
  activeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeChipTxt: { fontSize: 11, fontWeight: "700" },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  insightTxt: { fontSize: 13, lineHeight: 19, flex: 1 },
  dashBtn: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 32, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  dashBtnTxt: { fontSize: 13, fontWeight: "600" },
});
