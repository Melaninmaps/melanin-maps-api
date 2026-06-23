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

  React.useEffect(() => {
    if (business?.feedbackOptIn !== undefined) setFeedbackOptIn(business.feedbackOptIn);
  }, [business?.feedbackOptIn]);

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
          <View style={styles.comingSoon}>
            <View style={[styles.comingSoonIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="bar-chart-2" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.comingSoonTxt, { color: colors.foreground }]}>Analytics Dashboard</Text>
            <Text style={[styles.comingSoonSub, { color: colors.mutedForeground }]}>
              Profile views, search impressions, and customer engagement insights will be available here once your listing is active.
            </Text>
          </View>
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
});
