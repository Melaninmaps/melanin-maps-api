import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

interface MyBusiness {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  verified?: boolean;
  blackOwned?: boolean;
  confidenceScore?: number;
  feedbackOptIn?: boolean;
}

interface ReviewRow {
  id: string;
  rating: number;
  content: string | null;
  createdAt: string;
  userId: string;
}

interface AnalyticsSuggestion {
  priority: "high" | "medium" | "low";
  icon: string;
  title: string;
  body: string;
}

interface AnalyticsTrend {
  day: string;
  count: number;
}

interface AnalyticsData {
  tier: "navigator" | "trailblazer";
  metrics: { saves: number; reviews: number; avgRating: number; views30d: number; skipFeedbackCount: number };
  benchmarks: { peerCount: number; categoryAvgSaves: number; categoryAvgReviews: number; categoryAvgRating: number; categoryAvgViews30d: number };
  suggestions: AnalyticsSuggestion[];
  engagementScore: number;
  trend?: AnalyticsTrend[];
  savesVsPeersPct: number;
  reviewsVsPeersPct: number;
  ratingVsPeersPct: number;
  viewsVsPeersPct: number;
}

function useMyBusiness() {
  const [business, setBusiness] = useState<MyBusiness | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const base = getApiBase();
        if (!token || !base) { setLoading(false); return; }
        const res = await fetch(`${base}/api/businesses/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json() as { business: MyBusiness | null };
          if (data.business) {
            setBusiness(data.business);
            const rRes = await fetch(
              `${base}/api/reviews?businessId=${data.business.id}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (rRes.ok) {
              const rData = await rRes.json() as { reviews: ReviewRow[] };
              setReviews((rData.reviews ?? []).slice(0, 3));
            }
          }
        }
      } catch {}
      finally { setLoading(false); }
    };
    void load();
  }, []);

  return { business, reviews, loading };
}

const ACTIONS = [
  { id: "edit", icon: "edit-2" as const, label: "Edit Listing", color: "#442A19", route: "/list-business" },
  { id: "hours", icon: "clock" as const, label: "Manage Hours", color: "#CA922B", route: null },
  { id: "reviews", icon: "star" as const, label: "All Reviews", color: "#2D7A4F", route: null },
  { id: "messages", icon: "message-circle" as const, label: "Messages", color: "#7B4F2E", route: "/messages" },
  { id: "verify", icon: "shield" as const, label: "Get Verified", color: "#442A19", route: "/business-verify" },
  { id: "analytics", icon: "bar-chart-2" as const, label: "Analytics", color: "#3A1F0E", route: null },
];

export default function BusinessDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "insights">("overview");
  const { business, reviews, loading } = useMyBusiness();
  const [feedbackOptIn, setFeedbackOptIn] = useState<boolean>(false);
  const [togglingFeedback, setTogglingFeedback] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<"paywall" | "error" | null>(null);

  React.useEffect(() => {
    if (business?.feedbackOptIn !== undefined) setFeedbackOptIn(business.feedbackOptIn);
  }, [business?.feedbackOptIn]);

  const loadAnalytics = useCallback(async () => {
    if (analyticsLoading || analytics) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      if (!token || !base) { setAnalyticsError("error"); return; }
      const res = await fetch(`${base}/api/businesses/mine/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) { setAnalyticsError("paywall"); return; }
      if (!res.ok) { setAnalyticsError("error"); return; }
      const data = await res.json() as AnalyticsData;
      setAnalytics(data);
    } catch { setAnalyticsError("error"); }
    finally { setAnalyticsLoading(false); }
  }, [analyticsLoading, analytics]);

  useEffect(() => {
    if (activeTab === "insights") void loadAnalytics();
  }, [activeTab]);

  async function toggleFeedbackOptIn() {
    if (togglingFeedback) return;
    setTogglingFeedback(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      if (!token || !base) return;
      const next = !feedbackOptIn;
      const res = await fetch(`${base}/api/businesses/mine/feedback-opt-in`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: next }),
      });
      if (res.ok) setFeedbackOptIn(next);
    } catch {}
    finally { setTogglingFeedback(false); }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
          >
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerBiz}>Business Dashboard</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
          >
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerBiz}>Business Dashboard</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.emptyState, { paddingBottom: bottomPad + 24 }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="briefcase" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Business Listed Yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            List your Black-owned business to access your dashboard, manage reviews, and connect with customers.
          </Text>
          <TouchableOpacity
            style={[styles.listBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/list-business")}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={18} color="#FFF" />
            <Text style={styles.listBtnText}>List Your Business</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.verifyBtn, { borderColor: colors.border }]}
            onPress={() => router.push("/business-verify")}
            activeOpacity={0.8}
          >
            <Feather name="shield" size={16} color={colors.primary} />
            <Text style={[styles.verifyBtnText, { color: colors.primary }]}>Claim an Existing Listing</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statCards = [
    { label: "Profile Views", value: "—", change: "Data available after approval", icon: "eye" as const, color: "#442A19" },
    { label: "Saved", value: "—", change: "Data available after launch", icon: "bookmark" as const, color: "#CA922B" },
    { label: "Avg Rating", value: reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) + "★" : "—", change: `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`, icon: "star" as const, color: "#2D7A4F" },
    { label: "Messages", value: "—", change: "In development", icon: "message-circle" as const, color: "#7B4F2E" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
        >
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerBiz}>{business.name}</Text>
          {business.verified && (
            <View style={styles.verifyBadge}>
              <Feather name="shield" size={11} color="#FFF" />
              <Text style={styles.verifyTxt}>Verified Business</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push("/settings")}>
          <Feather name="settings" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["overview", "reviews", "insights"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => {
              setActiveTab(t);
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.tabTxt, { color: activeTab === t ? colors.primary : colors.mutedForeground }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && (
          <>
            <View style={styles.statsGrid}>
              {statCards.map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: s.color + "18" }]}>
                    <Feather name={s.icon} size={18} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                  <Text style={[styles.statChange, { color: s.color }]}>{s.change}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {ACTIONS.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    if (a.route) router.push(a.route as never);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: a.color + "15" }]}>
                    <Feather name={a.icon} size={20} color={a.color} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Direct feedback opt-in toggle */}
            <TouchableOpacity
              style={[styles.feedbackToggleCard, { backgroundColor: colors.card, borderColor: feedbackOptIn ? "#CA922B" : colors.border }]}
              onPress={toggleFeedbackOptIn}
              activeOpacity={0.85}
            >
              <View style={[styles.feedbackToggleIcon, { backgroundColor: "#CA922B18" }]}>
                <Feather name="message-circle" size={20} color="#CA922B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackToggleTitle, { color: colors.foreground }]}>Direct Skip Feedback</Text>
                <Text style={[styles.feedbackToggleSub, { color: colors.mutedForeground }]}>
                  {feedbackOptIn
                    ? "On — users who skip your listing can send you a private, constructive note."
                    : "Off — enable to receive private notes from users who skip your listing."}
                </Text>
              </View>
              {togglingFeedback ? (
                <ActivityIndicator size="small" color="#CA922B" />
              ) : (
                <View style={[styles.togglePill, { backgroundColor: feedbackOptIn ? "#CA922B" : colors.border }]}>
                  <View style={[styles.toggleDot, { transform: [{ translateX: feedbackOptIn ? 14 : 0 }] }]} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Reviews</Text>
            </View>

            {reviews.length === 0 ? (
              <View style={[styles.noReviews, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="star" size={24} color={colors.muted} />
                <Text style={[styles.noReviewsTxt, { color: colors.mutedForeground }]}>
                  No reviews yet. Once customers leave reviews they'll appear here.
                </Text>
              </View>
            ) : reviews.map((r, i) => (
              <View key={r.id ?? i} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.reviewTop}>
                  <View style={[styles.reviewAvatar, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name="user" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewName, { color: colors.foreground }]}>Community Member</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Feather
                          key={s}
                          name="star"
                          size={12}
                          color={s <= r.rating ? colors.primary : colors.border}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                {r.content ? (
                  <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>{r.content}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}

        {activeTab === "reviews" && (
          <View style={styles.comingSoon}>
            <View style={[styles.comingSoonIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="star" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.comingSoonTxt, { color: colors.foreground }]}>Review Management</Text>
            <Text style={[styles.comingSoonSub, { color: colors.mutedForeground }]}>
              Respond to reviews and track your rating over time. This feature is in active development.
            </Text>
          </View>
        )}

        {activeTab === "insights" && (
          <>
            {analyticsLoading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.analyticsLoadingTxt, { color: colors.mutedForeground }]}>Loading your analytics…</Text>
              </View>
            )}

            {!analyticsLoading && analyticsError === "paywall" && (
              <View style={[styles.paywallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.paywallIcon, { backgroundColor: "#CA922B18" }]}>
                  <Feather name="bar-chart-2" size={32} color="#CA922B" />
                </View>
                <Text style={[styles.paywallTitle, { color: colors.foreground }]}>Unlock Business Analytics</Text>
                <Text style={[styles.paywallBody, { color: colors.mutedForeground }]}>
                  Navigator and Trailblazer members get profile views, saves data, peer benchmarks, and personalised growth suggestions. Trailblazer unlocks 7-day view trends and a full suggestion suite.
                </Text>
                <TouchableOpacity
                  style={[styles.paywallBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/membership")}
                  activeOpacity={0.85}
                >
                  <Feather name="zap" size={15} color="#FFF" />
                  <Text style={styles.paywallBtnTxt}>Upgrade Your Membership</Text>
                </TouchableOpacity>
              </View>
            )}

            {!analyticsLoading && analyticsError === "error" && (
              <View style={styles.comingSoon}>
                <Feather name="wifi-off" size={28} color={colors.muted} />
                <Text style={[styles.comingSoonTxt, { color: colors.foreground }]}>Could not load analytics</Text>
                <TouchableOpacity onPress={() => { setAnalyticsError(null); void loadAnalytics(); }}>
                  <Text style={[styles.retryTxt, { color: colors.primary }]}>Tap to retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!analyticsLoading && analytics && (() => {
              const A = analytics;
              const screenW = Dimensions.get("window").width - 40;
              const barMax = screenW - 120;

              const PRIORITY_COLOR: Record<string, string> = { high: "#DC2626", medium: "#CA922B", low: "#2D7A4F" };

              return (
                <>
                  {/* Tier + Engagement Score */}
                  <View style={[styles.scoreCard, { backgroundColor: A.tier === "trailblazer" ? "#3A1F0E" : colors.card, borderColor: A.tier === "trailblazer" ? "#CA922B50" : colors.border }]}>
                    <View style={styles.scoreLeft}>
                      <View style={styles.scoreTierRow}>
                        <Feather name={A.tier === "trailblazer" ? "award" : "bar-chart-2"} size={14} color={A.tier === "trailblazer" ? "#CA922B" : colors.primary} />
                        <Text style={[styles.scoreTierTxt, { color: A.tier === "trailblazer" ? "#CA922B" : colors.primary }]}>
                          {A.tier === "trailblazer" ? "Trailblazer Analytics" : "Navigator Analytics"}
                        </Text>
                      </View>
                      <Text style={[styles.scoreNum, { color: A.tier === "trailblazer" ? "#FFF" : colors.foreground }]}>{A.engagementScore}</Text>
                      <Text style={[styles.scoreLabel, { color: A.tier === "trailblazer" ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>Engagement Score</Text>
                    </View>
                    <View style={styles.scoreRight}>
                      {[
                        { label: "Profile completeness", pct: Math.min(((A.engagementScore / 100) * 1.2), 1) },
                        { label: "vs. category average", pct: Math.min(A.viewsVsPeersPct / 200, 1) },
                      ].map((r) => (
                        <View key={r.label} style={styles.scoreMiniRow}>
                          <View style={[styles.scoreMiniBar, { backgroundColor: A.tier === "trailblazer" ? "rgba(255,255,255,0.15)" : colors.border }]}>
                            <View style={[styles.scoreMiniBarFill, { width: `${Math.round(r.pct * 100)}%`, backgroundColor: A.tier === "trailblazer" ? "#CA922B" : colors.primary }]} />
                          </View>
                          <Text style={[styles.scoreMiniLabel, { color: A.tier === "trailblazer" ? "rgba(255,255,255,0.5)" : colors.mutedForeground }]}>{r.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Core metrics grid */}
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Last 30 Days</Text>
                  <View style={styles.metricsGrid}>
                    {[
                      { label: "Profile Views", value: A.metrics.views30d, icon: "eye", color: "#2563EB" },
                      { label: "Saves", value: A.metrics.saves, icon: "bookmark", color: "#CA922B" },
                      { label: "Reviews", value: A.metrics.reviews, icon: "star", color: "#2D7A4F" },
                      { label: "Avg Rating", value: A.metrics.avgRating > 0 ? A.metrics.avgRating.toFixed(1) + "★" : "—", icon: "award", color: "#7C3AED" },
                    ].map((m) => (
                      <View key={m.label} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.metricIcon, { backgroundColor: m.color + "18" }]}>
                          <Feather name={m.icon as never} size={16} color={m.color} />
                        </View>
                        <Text style={[styles.metricValue, { color: colors.foreground }]}>{m.value}</Text>
                        <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Peer comparison */}
                  {A.benchmarks.peerCount > 0 && (
                    <>
                      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>
                        How You Compare
                        <Text style={[styles.peerNote, { color: colors.mutedForeground }]}> · {A.benchmarks.peerCount} similar {A.benchmarks.peerCount === 1 ? "business" : "businesses"}</Text>
                      </Text>
                      <View style={[styles.compareCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {[
                          { label: "Profile Views", pct: A.viewsVsPeersPct, color: "#2563EB" },
                          { label: "Saves", pct: A.savesVsPeersPct, color: "#CA922B" },
                          { label: "Reviews", pct: A.reviewsVsPeersPct, color: "#2D7A4F" },
                          { label: "Rating", pct: A.ratingVsPeersPct, color: "#7C3AED" },
                        ].map((row) => (
                          <View key={row.label} style={styles.compareRow}>
                            <Text style={[styles.compareRowLabel, { color: colors.foreground }]}>{row.label}</Text>
                            <View style={[styles.compareBarBg, { backgroundColor: colors.border, width: barMax }]}>
                              <View style={[styles.compareBarFill, {
                                width: Math.min((row.pct / 200) * barMax, barMax),
                                backgroundColor: row.pct >= 100 ? row.color : "#6B728080",
                              }]} />
                              <View style={[styles.compareMidLine, { left: barMax / 2 }]} />
                            </View>
                            <Text style={[styles.compareRowPct, { color: row.pct >= 100 ? row.color : colors.mutedForeground }]}>
                              {row.pct}%
                            </Text>
                          </View>
                        ))}
                        <Text style={[styles.compareKey, { color: colors.mutedForeground }]}>
                          100% = category average · bars over halfway beat the average
                        </Text>
                      </View>
                    </>
                  )}

                  {/* 7-day trend (Trailblazer only) */}
                  {A.tier === "trailblazer" && A.trend && A.trend.length > 0 && (
                    <>
                      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>7-Day View Trend</Text>
                      <View style={[styles.trendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {(() => {
                          const maxCount = Math.max(...A.trend.map((t) => t.count), 1);
                          return (
                            <View style={styles.trendBars}>
                              {A.trend.map((t) => {
                                const dayLabel = new Date(t.day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
                                const barH = Math.max((t.count / maxCount) * 80, 4);
                                return (
                                  <View key={t.day} style={styles.trendBarCol}>
                                    <Text style={[styles.trendCount, { color: colors.mutedForeground }]}>{t.count > 0 ? t.count : ""}</Text>
                                    <View style={[styles.trendBar, { height: barH, backgroundColor: colors.primary }]} />
                                    <Text style={[styles.trendDay, { color: colors.mutedForeground }]}>{dayLabel}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          );
                        })()}
                      </View>
                    </>
                  )}

                  {/* Growth suggestions */}
                  {A.suggestions.length > 0 && (
                    <>
                      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>
                        Suggested Growth Areas
                      </Text>
                      {A.suggestions.map((s, i) => (
                        <View key={i} style={[styles.suggCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: PRIORITY_COLOR[s.priority] }]}>
                          <View style={[styles.suggIcon, { backgroundColor: PRIORITY_COLOR[s.priority] + "18" }]}>
                            <Feather name={s.icon as never} size={16} color={PRIORITY_COLOR[s.priority]} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.suggTitleRow}>
                              <Text style={[styles.suggTitle, { color: colors.foreground }]}>{s.title}</Text>
                              <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLOR[s.priority] + "20" }]}>
                                <Text style={[styles.priorityTxt, { color: PRIORITY_COLOR[s.priority] }]}>{s.priority}</Text>
                              </View>
                            </View>
                            <Text style={[styles.suggBody, { color: colors.mutedForeground }]}>{s.body}</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}

                  {A.tier === "navigator" && (
                    <TouchableOpacity
                      style={[styles.upgradeStrip, { backgroundColor: "#3A1F0E" }]}
                      onPress={() => router.push("/membership")}
                      activeOpacity={0.85}
                    >
                      <Feather name="award" size={16} color="#CA922B" />
                      <Text style={styles.upgradeStripTxt}>Trailblazer unlocks view trends, full suggestions &amp; engagement insights</Text>
                      <Feather name="chevron-right" size={14} color="#CA922B" />
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 18,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerBiz: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF" },
  verifyBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 4,
  },
  verifyTxt: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#FFF" },
  settingsBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 16,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23, marginBottom: 8 },
  listBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 28, paddingVertical: 15, borderRadius: 14, width: "100%",
    justifyContent: "center",
  },
  listBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF" },
  verifyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14, width: "100%",
    justifyContent: "center", borderWidth: 1,
  },
  verifyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 20, gap: 0 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statCard: {
    width: "47%", borderRadius: 16, padding: 16, gap: 4, borderWidth: 1,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statChange: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  feedbackToggleCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 24 },
  feedbackToggleIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  feedbackToggleTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  feedbackToggleSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  togglePill: { width: 36, height: 22, borderRadius: 11, justifyContent: "center", paddingHorizontal: 3 },
  toggleDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff" },
  actionCard: {
    width: "30%", borderRadius: 14, padding: 14, alignItems: "center",
    gap: 8, borderWidth: 1,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  noReviews: {
    borderRadius: 14, padding: 24, gap: 10, borderWidth: 1,
    alignItems: "center", marginBottom: 12,
  },
  noReviewsTxt: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  reviewCard: { borderRadius: 14, padding: 16, marginBottom: 12, gap: 10, borderWidth: 1 },
  reviewTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reviewName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reviewStars: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  reviewText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  comingSoon: { alignItems: "center", gap: 12, paddingTop: 60, paddingHorizontal: 32 },
  comingSoonIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  comingSoonTxt: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  comingSoonSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },

  analyticsLoadingTxt: { marginTop: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  retryTxt: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 8 },

  paywallCard: { margin: 20, padding: 24, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 12 },
  paywallIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  paywallTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  paywallBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  paywallBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  paywallBtnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },

  peerNote: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "none", letterSpacing: 0 },

  scoreCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", gap: 16 },
  scoreLeft: { flex: 0.45 },
  scoreTierRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  scoreTierTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  scoreNum: { fontSize: 48, fontFamily: "Inter_700Bold", lineHeight: 52 },
  scoreLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  scoreRight: { flex: 0.55, justifyContent: "center", gap: 10 },
  scoreMiniRow: { gap: 4 },
  scoreMiniBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  scoreMiniBarFill: { height: "100%", borderRadius: 3 },
  scoreMiniLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },

  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 20, marginBottom: 8 },
  metricCard: { flex: 1, minWidth: "44%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  metricIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 4 },
  metricLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },

  compareCard: { marginHorizontal: 20, marginBottom: 8, borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  compareRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  compareRowLabel: { width: 60, fontSize: 12, fontFamily: "Inter_500Medium" },
  compareBarBg: { height: 8, borderRadius: 4, overflow: "hidden", flex: 1, position: "relative" },
  compareBarFill: { height: "100%", borderRadius: 4 },
  compareMidLine: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: "rgba(255,255,255,0.3)" },
  compareRowPct: { width: 44, fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  compareKey: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 },

  trendCard: { marginHorizontal: 20, marginBottom: 8, borderRadius: 14, borderWidth: 1, padding: 16 },
  trendBars: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 110 },
  trendBarCol: { flex: 1, alignItems: "center", gap: 4, justifyContent: "flex-end" },
  trendCount: { fontSize: 10, fontFamily: "Inter_400Regular", height: 14 },
  trendBar: { width: "80%", borderRadius: 4, minHeight: 4 },
  trendDay: { fontSize: 10, fontFamily: "Inter_400Regular" },

  suggCard: { marginHorizontal: 20, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderLeftWidth: 3, padding: 14, flexDirection: "row", gap: 12 },
  suggIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  suggTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 },
  suggTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  suggBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  priorityTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase" },

  upgradeStrip: { margin: 20, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  upgradeStripTxt: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: "#CA922B", lineHeight: 18 },
});
