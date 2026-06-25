import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useOwnerListings, LISTING_TYPES, type Listing, type ListingType } from "@/hooks/useListings";
import { SellerAgreementModal } from "@/components/SellerAgreementModal";

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
  sellerAgreementAcceptedAt?: string | null;
  phone?: string | null;
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

interface PostNudgeData {
  peakHours: number[];
  peakDays: string[];
  isNearPeak: boolean;
  bestTimeLabel: string;
  topDayLabel: string;
  nudgeMessage: string;
  suggestedCaption: string;
  viewsThisMonth: number;
  hasSufficientData: boolean;
}

interface AnalyticsTrend {
  day: string;
  count: number;
}

interface ActionItem {
  issue: string;
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  actions: string[];
  estimatedCost: string;
  estimatedTimeline: string;
  resources?: string[];
}

interface ActionPlanData {
  summary: string;
  actionItems: ActionItem[];
}

interface ExpansionOpportunity {
  city: string;
  state: string;
  opportunity: string;
  marketSignal: string;
  estimatedDemand: string;
  actionSteps: string[];
}

interface ExpansionData {
  summary: string;
  opportunities: ExpansionOpportunity[];
  insights: string[];
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
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "insights" | "products">("overview");
  const { business, reviews, loading } = useMyBusiness();
  const [feedbackOptIn, setFeedbackOptIn] = useState<boolean>(false);
  const [togglingFeedback, setTogglingFeedback] = useState(false);
  const [addrExpanded, setAddrExpanded] = useState(false);
  const [addrAddress, setAddrAddress] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrResult, setAddrResult] = useState<"success" | "error" | null>(null);
  const [policyExpanded, setPolicyExpanded] = useState(false);
  const [returnPolicy, setReturnPolicy] = useState("");
  const [policySaving, setPolicySaving] = useState(false);
  const [policyResult, setPolicyResult] = useState<"success" | "error" | null>(null);
  const [sellerAgreementAccepted, setSellerAgreementAccepted] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<"paywall" | "error" | null>(null);
  const [nudge, setNudge] = useState<PostNudgeData | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [actionPlan, setActionPlan] = useState<ActionPlanData | null>(null);
  const [actionPlanLoading, setActionPlanLoading] = useState(false);
  const [expansionData, setExpansionData] = useState<ExpansionData | null>(null);
  const [expansionLoading, setExpansionLoading] = useState(false);

  const { listings, connectStatus, loading: listingsLoading, startOnboarding, createListing, toggleActive, deleteListing } =
    useOwnerListings(business?.id ?? "");
  const [showNewListing, setShowNewListing] = useState(false);
  const [newListingType, setNewListingType] = useState<ListingType | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [savingListing, setSavingListing] = useState(false);
  const [onboarding, setOnboarding] = useState(false);

  React.useEffect(() => {
    if (business?.feedbackOptIn !== undefined) setFeedbackOptIn(business.feedbackOptIn);
  }, [business?.feedbackOptIn]);

  React.useEffect(() => {
    if ((business as any)?.returnPolicy != null) setReturnPolicy((business as any).returnPolicy as string);
  }, [(business as any)?.returnPolicy]);

  React.useEffect(() => {
    if (business?.sellerAgreementAcceptedAt) setSellerAgreementAccepted(true);
  }, [business?.sellerAgreementAcceptedAt]);

  React.useEffect(() => {
    if (business && !addrExpanded) {
      setAddrAddress((business as any).address ?? "");
      setAddrCity(business.city ?? "");
      setAddrState(business.state ?? "");
    }
  }, [business?.id]);

  React.useEffect(() => {
    if (!business) return;
    void (async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_session_token");
        const base = getApiBase();
        if (!token || !base) return;
        const res = await fetch(`${base}/api/businesses/mine/post-nudge`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setNudge(await res.json() as PostNudgeData);
      } catch {}
    })();
  }, [business?.id]);

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

  async function generateActionPlan() {
    if (!business || actionPlanLoading) return;
    setActionPlanLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      if (!token || !base) return;
      const res = await fetch(`${base}/api/kinfolk/business-action-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessName: business.name,
          businessCategory: business.category,
          businessCity: business.city,
          reviews: reviews.map((r) => ({ rating: r.rating, content: r.content })),
        }),
      });
      if (res.ok) setActionPlan(await res.json() as ActionPlanData);
    } catch {} finally { setActionPlanLoading(false); }
  }

  async function generateExpansionAnalysis() {
    if (!business || expansionLoading) return;
    setExpansionLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const base = getApiBase();
      if (!token || !base) return;
      const res = await fetch(`${base}/api/kinfolk/expansion-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessName: business.name,
          businessCategory: business.category,
          businessCity: business.city,
          avgRating: analytics?.metrics.avgRating,
          reviewCount: analytics?.metrics.reviews,
          savesCount: analytics?.metrics.saves,
        }),
      });
      if (res.ok) setExpansionData(await res.json() as ExpansionData);
    } catch {} finally { setExpansionLoading(false); }
  }

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
        {(["overview", "reviews", "insights", "products"] as const).map((t) => (
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

            {/* Update Address */}
            <TouchableOpacity
              style={[styles.promoteCard, { backgroundColor: colors.card, borderColor: addrExpanded ? colors.primary + "60" : colors.border }]}
              onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setAddrExpanded(v => !v); setAddrResult(null); }}
              activeOpacity={0.85}
            >
              <View style={[styles.promoteIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="map-pin" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.promoteTitle, { color: colors.foreground }]}>Update Business Address</Text>
                <Text style={[styles.promoteSub, { color: colors.mutedForeground }]}>
                  {addrExpanded ? "Fill in the new address below" : `${business.city}, ${business.state} · tap to update`}
                </Text>
              </View>
              <Feather name={addrExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
            </TouchableOpacity>

            {addrExpanded && (
              <View style={[styles.addrForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.addrLabel, { color: colors.mutedForeground }]}>Street Address</Text>
                <TextInput
                  style={[styles.addrInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                  value={addrAddress}
                  onChangeText={setAddrAddress}
                  placeholder="123 Main Street"
                  placeholderTextColor={colors.mutedForeground}
                />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 2 }}>
                    <Text style={[styles.addrLabel, { color: colors.mutedForeground }]}>City</Text>
                    <TextInput
                      style={[styles.addrInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      value={addrCity}
                      onChangeText={setAddrCity}
                      placeholder="Atlanta"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addrLabel, { color: colors.mutedForeground }]}>State</Text>
                    <TextInput
                      style={[styles.addrInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      value={addrState}
                      onChangeText={setAddrState}
                      placeholder="GA"
                      placeholderTextColor={colors.mutedForeground}
                      maxLength={2}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.addrLabel, { color: colors.mutedForeground }]}>ZIP</Text>
                    <TextInput
                      style={[styles.addrInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                      value={addrZip}
                      onChangeText={setAddrZip}
                      placeholder="30301"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                </View>

                {addrResult === "success" && (
                  <View style={[styles.addrAlert, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F40" }]}>
                    <Feather name="check-circle" size={14} color="#2D7A4F" />
                    <Text style={[styles.addrAlertText, { color: "#2D7A4F" }]}>Address updated! Savers and recent visitors have been notified.</Text>
                  </View>
                )}
                {addrResult === "error" && (
                  <View style={[styles.addrAlert, { backgroundColor: "#DC262618", borderColor: "#DC262640" }]}>
                    <Feather name="alert-circle" size={14} color="#DC2626" />
                    <Text style={[styles.addrAlertText, { color: "#DC2626" }]}>Failed to update address. Please try again.</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.addrSaveBtn, { backgroundColor: colors.primary, opacity: addrSaving ? 0.6 : 1 }]}
                  disabled={addrSaving}
                  onPress={async () => {
                    if (!addrAddress.trim() || !addrCity.trim() || !addrState.trim()) {
                      setAddrResult("error"); return;
                    }
                    setAddrSaving(true);
                    setAddrResult(null);
                    try {
                      const token = await SecureStore.getItemAsync("auth_session_token");
                      const base = getApiBase();
                      const res = await fetch(`${base}/api/businesses/${business.id}/address`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
                        body: JSON.stringify({ address: addrAddress.trim(), city: addrCity.trim(), state: addrState.trim(), zip: addrZip.trim() }),
                      });
                      setAddrResult(res.ok ? "success" : "error");
                      if (res.ok) setAddrExpanded(false);
                    } catch { setAddrResult("error"); }
                    finally { setAddrSaving(false); }
                  }}
                >
                  {addrSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.addrSaveBtnText}>Save & Notify</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Return & Refund Policy */}
            <TouchableOpacity
              style={[styles.promoteCard, { backgroundColor: colors.card, borderColor: policyExpanded ? colors.primary + "60" : colors.border }]}
              onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setPolicyExpanded(v => !v); setPolicyResult(null); }}
              activeOpacity={0.85}
            >
              <View style={[styles.promoteIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="refresh-ccw" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.promoteTitle, { color: colors.foreground }]}>Return & Refund Policy</Text>
                <Text style={[styles.promoteSub, { color: colors.mutedForeground }]}>
                  {policyExpanded ? "Set your policy — buyers see this before checkout" : (returnPolicy || "Not set · tap to add")}
                </Text>
              </View>
              <Feather name={policyExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
            </TouchableOpacity>

            {policyExpanded && (
              <View style={[styles.addrForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.addrLabel, { color: colors.mutedForeground }]}>
                  Describe your return/refund policy for buyers. E.g. "All sales final" or "Returns accepted within 14 days".
                </Text>
                <TextInput
                  style={[styles.addrInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, minHeight: 64, textAlignVertical: "top" }]}
                  value={returnPolicy}
                  onChangeText={setReturnPolicy}
                  placeholder="e.g. All sales final. For digital products, no refunds after download."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                />

                {policyResult === "success" && (
                  <View style={[styles.addrAlert, { backgroundColor: "#2D7A4F18", borderColor: "#2D7A4F40" }]}>
                    <Feather name="check-circle" size={14} color="#2D7A4F" />
                    <Text style={[styles.addrAlertText, { color: "#2D7A4F" }]}>Policy saved. Buyers will see this before checkout.</Text>
                  </View>
                )}
                {policyResult === "error" && (
                  <View style={[styles.addrAlert, { backgroundColor: "#DC262618", borderColor: "#DC262640" }]}>
                    <Feather name="alert-circle" size={14} color="#DC2626" />
                    <Text style={[styles.addrAlertText, { color: "#DC2626" }]}>Failed to save. Please try again.</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.addrSaveBtn, { backgroundColor: colors.primary, opacity: policySaving ? 0.6 : 1 }]}
                  disabled={policySaving}
                  onPress={async () => {
                    setPolicySaving(true);
                    setPolicyResult(null);
                    try {
                      const token = await SecureStore.getItemAsync("auth_session_token");
                      const base = getApiBase();
                      const res = await fetch(`${base}/api/businesses/${business.id}/policy`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
                        body: JSON.stringify({ returnPolicy: returnPolicy.trim() }),
                      });
                      setPolicyResult(res.ok ? "success" : "error");
                      if (res.ok) setPolicyExpanded(false);
                    } catch { setPolicyResult("error"); }
                    finally { setPolicySaving(false); }
                  }}
                >
                  {policySaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.addrSaveBtnText}>Save Policy</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Promoted listing CTA */}
            <TouchableOpacity
              style={[styles.promoteCard, { backgroundColor: "#1A2E1A", borderColor: "#2D7A4F50" }]}
              onPress={async () => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                try {
                  const token = await SecureStore.getItemAsync("auth_session_token");
                  const base = getApiBase();
                  const res = await fetch(`${base}/api/businesses/mine/promote`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token ?? ""}` },
                  });
                  const data = await res.json() as { checkoutUrl?: string; alreadyPromoted?: boolean; promotedUntil?: string; code?: string; message?: string; error?: string };
                  if (data.alreadyPromoted) {
                    alert(`Your listing is already promoted until ${data.promotedUntil ? new Date(data.promotedUntil).toLocaleDateString() : "soon"}.`);
                  } else if (data.code === "NOT_CONFIGURED") {
                    alert("Promoted listings are coming soon. Check back shortly!");
                  } else if (data.checkoutUrl) {
                    router.push(data.checkoutUrl as never);
                  }
                } catch { alert("Could not start promotion checkout. Try again."); }
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.promoteIcon, { backgroundColor: "#2D7A4F20" }]}>
                <Feather name="trending-up" size={20} color="#2D7A4F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.promoteTitle, { color: "#FFF" }]}>Promote My Listing</Text>
                <Text style={[styles.promoteSub, { color: "rgba(255,255,255,0.55)" }]}>
                  Get featured placement in search results and the map for 30 days — paid add-on.
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#2D7A4F" />
            </TouchableOpacity>

            {/* KinfolkAI post nudge */}
            {nudge && !nudgeDismissed && (
              <View style={[styles.nudgeCard, {
                backgroundColor: nudge.isNearPeak ? "#0F1F0F" : colors.card,
                borderColor: nudge.isNearPeak ? "#2D7A4F" : colors.border,
              }]}>
                <View style={styles.nudgeTop}>
                  <View style={[styles.nudgeBadge, { backgroundColor: nudge.isNearPeak ? "#2D7A4F" : "#CA922B" }]}>
                    <Feather name="zap" size={11} color="#FFF" />
                    <Text style={styles.nudgeBadgeText}>KinfolkAI™</Text>
                  </View>
                  <TouchableOpacity onPress={() => setNudgeDismissed(true)} hitSlop={8}>
                    <Feather name="x" size={16} color={nudge.isNearPeak ? "rgba(255,255,255,0.4)" : colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.nudgeHeadline, { color: nudge.isNearPeak ? "#FFF" : colors.foreground }]}>
                  {nudge.isNearPeak
                    ? "Your customers are active right now"
                    : `Peak time: ${nudge.bestTimeLabel}`}
                </Text>
                <Text style={[styles.nudgeBody, { color: nudge.isNearPeak ? "rgba(255,255,255,0.65)" : colors.mutedForeground }]}>
                  {nudge.hasSufficientData
                    ? nudge.nudgeMessage
                    : `Most of your customers engage on ${nudge.topDayLabel}. Post regularly to build your audience.`}
                </Text>

                {nudge.suggestedCaption.length > 0 && (
                  <View style={[styles.nudgeCaption, {
                    backgroundColor: nudge.isNearPeak ? "rgba(45,122,79,0.15)" : colors.background,
                    borderColor: nudge.isNearPeak ? "#2D7A4F40" : colors.border,
                  }]}>
                    <Text style={[styles.nudgeCaptionLabel, { color: nudge.isNearPeak ? "#2D7A4F" : "#CA922B" }]}>Suggested caption</Text>
                    <Text style={[styles.nudgeCaptionText, { color: nudge.isNearPeak ? "rgba(255,255,255,0.8)" : colors.foreground }]}>
                      {nudge.suggestedCaption}
                    </Text>
                  </View>
                )}

                <View style={styles.nudgeActions}>
                  <TouchableOpacity
                    style={[styles.nudgePostBtn, { backgroundColor: nudge.isNearPeak ? "#2D7A4F" : colors.primary }]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push(`/(tabs)/community?compose=true&caption=${encodeURIComponent(nudge.suggestedCaption)}` as never);
                    }}
                    activeOpacity={0.85}
                  >
                    <Feather name="edit-3" size={14} color="#FFF" />
                    <Text style={styles.nudgePostBtnText}>Post Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nudgeNotifyBtn, { borderColor: nudge.isNearPeak ? "#2D7A4F50" : colors.border }]}
                    onPress={async () => {
                      try {
                        const token = await SecureStore.getItemAsync("auth_session_token");
                        const base = getApiBase();
                        await fetch(`${base}/api/businesses/mine/post-nudge/notify`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token ?? ""}` },
                        });
                      } catch {}
                    }}
                    activeOpacity={0.8}
                  >
                    <Feather name="bell" size={14} color={nudge.isNearPeak ? "#2D7A4F" : colors.mutedForeground} />
                    <Text style={[styles.nudgeNotifyText, { color: nudge.isNearPeak ? "#2D7A4F" : colors.mutedForeground }]}>
                      Remind me at peak time
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

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
          <>
            {/* Tagline */}
            <View style={[styles.taglineBanner, { backgroundColor: colors.primary + "0D", borderColor: colors.primary + "20" }]}>
              <Feather name="shield" size={14} color={colors.primary} style={{ marginTop: 1, flexShrink: 0 }} />
              <Text style={[styles.taglineText, { color: colors.primary }]}>
                Every business has the right to respond. Every customer has the right to be heard. Every concern deserves the opportunity for resolution.
              </Text>
            </View>

            {/* Reviews list */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Community Reviews</Text>
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
                        <Feather key={s} name="star" size={12} color={s <= r.rating ? colors.primary : colors.border} />
                      ))}
                    </View>
                  </View>
                </View>
                {r.content ? (
                  <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>{r.content}</Text>
                ) : null}
              </View>
            ))}

            {/* KinfolkAI Action Plan */}
            <View style={[styles.aiPlanCard, { backgroundColor: "#3A1F0E", borderColor: "#CA922B30" }]}>
              <View style={styles.aiPlanHeader}>
                <View style={styles.aiPlanBadge}>
                  <Feather name="zap" size={11} color="#FFF" />
                  <Text style={styles.aiPlanBadgeText}>KinfolkAI™</Text>
                </View>
                <Text style={[styles.aiPlanTitle, { color: "#FFF" }]}>Business Improvement Plan</Text>
                <Text style={[styles.aiPlanSub, { color: "rgba(255,255,255,0.55)" }]}>
                  Analyze your community feedback and get a tailored action plan with budget estimates and timelines.
                </Text>
              </View>

              {!actionPlan && !actionPlanLoading && (
                <TouchableOpacity
                  style={[styles.aiPlanBtn, { backgroundColor: "#CA922B" }]}
                  onPress={() => { void generateActionPlan(); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                  activeOpacity={0.85}
                >
                  <Feather name="cpu" size={15} color="#FFF" />
                  <Text style={styles.aiPlanBtnText}>Generate Action Plan</Text>
                </TouchableOpacity>
              )}

              {actionPlanLoading && (
                <View style={styles.aiPlanLoading}>
                  <ActivityIndicator color="#CA922B" />
                  <Text style={[styles.aiPlanLoadingText, { color: "rgba(255,255,255,0.6)" }]}>Analyzing feedback…</Text>
                </View>
              )}

              {actionPlan && (
                <View style={styles.aiPlanResults}>
                  <Text style={[styles.aiPlanSummary, { color: "rgba(255,255,255,0.8)" }]}>{actionPlan.summary}</Text>
                  {actionPlan.actionItems.map((item, idx) => {
                    const priorityColor: Record<string, string> = { critical: "#DC2626", high: "#CA922B", medium: "#2D7A4F", low: "#6B7280" };
                    const pc = priorityColor[item.priority] ?? "#CA922B";
                    return (
                      <View key={idx} style={[styles.aiPlanItem, { borderLeftColor: pc, backgroundColor: "rgba(255,255,255,0.04)" }]}>
                        <View style={styles.aiPlanItemTop}>
                          <Text style={[styles.aiPlanIssue, { color: "#FFF" }]}>{item.issue}</Text>
                          <View style={[styles.aiPlanPriority, { backgroundColor: pc + "25" }]}>
                            <Text style={[styles.aiPlanPriorityText, { color: pc }]}>{item.priority}</Text>
                          </View>
                        </View>
                        <Text style={[styles.aiPlanCategory, { color: "#CA922B" }]}>{item.category}</Text>
                        {item.actions.map((a, ai) => (
                          <View key={ai} style={styles.aiPlanStep}>
                            <Text style={[styles.aiPlanStepDot, { color: "rgba(255,255,255,0.4)" }]}>•</Text>
                            <Text style={[styles.aiPlanStepText, { color: "rgba(255,255,255,0.75)" }]}>{a}</Text>
                          </View>
                        ))}
                        <View style={styles.aiPlanMeta}>
                          <View style={styles.aiPlanMetaItem}>
                            <Feather name="dollar-sign" size={11} color="rgba(255,255,255,0.4)" />
                            <Text style={[styles.aiPlanMetaText, { color: "rgba(255,255,255,0.55)" }]}>{item.estimatedCost}</Text>
                          </View>
                          <View style={styles.aiPlanMetaItem}>
                            <Feather name="clock" size={11} color="rgba(255,255,255,0.4)" />
                            <Text style={[styles.aiPlanMetaText, { color: "rgba(255,255,255,0.55)" }]}>{item.estimatedTimeline}</Text>
                          </View>
                        </View>
                        {item.resources && item.resources.length > 0 && (
                          <Text style={[styles.aiPlanResource, { color: "#CA922B" }]}>
                            Resources: {item.resources.join(", ")}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.aiPlanRefresh, { borderColor: "rgba(202,146,43,0.3)" }]}
                    onPress={() => { setActionPlan(null); void generateActionPlan(); }}
                    activeOpacity={0.7}
                  >
                    <Feather name="refresh-cw" size={13} color="#CA922B" />
                    <Text style={[styles.aiPlanRefreshText, { color: "#CA922B" }]}>Refresh Plan</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {activeTab === "products" && (
          <>
            {/* Seller setup requirements checklist — shown until fully set up */}
            {(!business?.verified || !sellerAgreementAccepted || !connectStatus?.onboarded) && (
              <View style={[styles.addrForm, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
                <Text style={[styles.formLabel, { color: colors.foreground, marginTop: 0, marginBottom: 10, fontSize: 14 }]}>
                  Seller Setup Requirements
                </Text>
                {([
                  {
                    done: !!business?.verified,
                    label: "Identity & Business Verified",
                    sub: "Submit verification documents for review",
                  },
                  {
                    done: sellerAgreementAccepted,
                    label: "Seller Agreement Accepted",
                    sub: "Read and accept the Marketplace Seller Agreement",
                  },
                  {
                    done: !!connectStatus?.onboarded,
                    label: "Payment Account Connected",
                    sub: "Link your bank account via Stripe Connect",
                  },
                  {
                    done: !!connectStatus?.onboarded,
                    label: "Tax & Banking Verified",
                    sub: "Completed automatically during Stripe setup",
                  },
                ] as const).map((step, i) => (
                  <View key={i} style={[styles.requirementRow, { borderColor: colors.border }]}>
                    <View style={[
                      styles.requirementDot,
                      { backgroundColor: step.done ? "#2D7A4F" : colors.muted, borderColor: step.done ? "#2D7A4F" : colors.border },
                    ]}>
                      {step.done
                        ? <Feather name="check" size={11} color="#FFF" />
                        : <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: colors.mutedForeground }}>{i + 1}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.requirementLabel, { color: step.done ? "#2D7A4F" : colors.foreground }]}>{step.label}</Text>
                      <Text style={[styles.requirementSub, { color: colors.mutedForeground }]}>{step.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!business?.verified ? (
              <View style={[styles.paywallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.paywallIcon, { backgroundColor: "#C9922B18" }]}>
                  <Feather name="shield" size={32} color="#C9922B" />
                </View>
                <Text style={[styles.paywallTitle, { color: colors.foreground }]}>Verification Required</Text>
                <Text style={[styles.paywallBody, { color: colors.mutedForeground }]}>
                  Only verified Black-owned businesses can sell directly on Mapping With Melanin. Complete your verification to unlock in-app selling.
                </Text>
                <TouchableOpacity
                  style={[styles.paywallBtn, { backgroundColor: "#C9922B" }]}
                  activeOpacity={0.85}
                  onPress={() => router.push("/business-verify" as any)}
                >
                  <Feather name="shield" size={15} color="#FFF" />
                  <Text style={styles.paywallBtnTxt}>Get Verified</Text>
                </TouchableOpacity>
              </View>
            ) : !sellerAgreementAccepted ? (
              <View style={[styles.paywallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.paywallIcon, { backgroundColor: "#3B1F0E18" }]}>
                  <Feather name="file-text" size={32} color="#3B1F0E" />
                </View>
                <Text style={[styles.paywallTitle, { color: colors.foreground }]}>Accept Seller Agreement</Text>
                <Text style={[styles.paywallBody, { color: colors.mutedForeground }]}>
                  Before listing products, review and accept the Marketplace Seller Agreement. It covers your responsibilities for product quality, fulfillment, taxes, and customer service.
                </Text>
                <TouchableOpacity
                  style={[styles.paywallBtn, { backgroundColor: "#3B1F0E" }]}
                  activeOpacity={0.85}
                  onPress={() => setShowAgreementModal(true)}
                >
                  <Feather name="file-text" size={15} color="#FFF" />
                  <Text style={styles.paywallBtnTxt}>Review & Accept Agreement</Text>
                </TouchableOpacity>
              </View>
            ) : !connectStatus?.onboarded ? (
              <View style={[styles.paywallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.paywallIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="shopping-bag" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.paywallTitle, { color: colors.foreground }]}>Start Selling In-App</Text>
                <Text style={[styles.paywallBody, { color: colors.mutedForeground }]}>
                  Connect your Stripe account to list products and services. Stripe will verify your identity, bank account, and tax information. Funds are deposited directly to your bank.
                </Text>
                <TouchableOpacity
                  style={[styles.paywallBtn, { backgroundColor: colors.primary }, onboarding && { opacity: 0.6 }]}
                  disabled={onboarding}
                  activeOpacity={0.85}
                  onPress={async () => {
                    setOnboarding(true);
                    try {
                      const url = await startOnboarding();
                      if (url) await Linking.openURL(url);
                      else Alert.alert("Error", "Could not start onboarding. Please try again.");
                    } finally { setOnboarding(false); }
                  }}
                >
                  {onboarding ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="arrow-right" size={15} color="#FFF" />}
                  <Text style={styles.paywallBtnTxt}>{onboarding ? "Opening…" : "Connect with Stripe"}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Seller obligations card */}
                <View style={[styles.addrForm, { backgroundColor: "#0F1F0F", borderColor: "#2D7A4F40", marginBottom: 8 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Feather name="shield" size={16} color="#2D7A4F" />
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFF" }}>Your Seller Responsibilities</Text>
                  </View>
                  {[
                    "Fulfill orders promptly and as described",
                    "Honor your stated return & refund policy",
                    "Respond to buyer disputes within 48 hours",
                    "Accurate listing descriptions — no misrepresentation",
                    "Repeated violations may result in account removal",
                  ].map((item) => (
                    <View key={item} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                      <Feather name="check" size={12} color="#2D7A4F" style={{ marginTop: 3 }} />
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)", flex: 1, lineHeight: 18 }}>{item}</Text>
                    </View>
                  ))}
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6, lineHeight: 16 }}>
                    Mapping With Melanin™ is a marketplace. You are the seller of record and responsible for your products and customers.
                  </Text>
                </View>

                {/* Seller program phases */}
                <View style={[styles.addrForm, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 8 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Feather name="layers" size={16} color={colors.primary} />
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: colors.foreground }}>Seller Program</Text>
                    <View style={{ marginLeft: "auto", backgroundColor: colors.primary + "18", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, color: colors.primary }}>PHASE 1 ACTIVE</Text>
                    </View>
                  </View>

                  {/* Phase 1 */}
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Feather name="check" size={13} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.foreground, marginBottom: 2 }}>Phase 1 — Verified Sellers Only</Text>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, lineHeight: 17 }}>
                        Products, services, and event tickets from MWM-verified Black-owned businesses. You're here.
                      </Text>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 2, marginBottom: 10 }} />

                  {/* Phase 2 */}
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 10, opacity: 0.5 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.mutedForeground, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: colors.mutedForeground }}>2</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.foreground }}>Phase 2 — Open Applications</Text>
                        <View style={{ backgroundColor: colors.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 10, color: colors.mutedForeground }}>COMING SOON</Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, lineHeight: 17 }}>
                        More businesses apply after completing identity, tax, and banking verification. Seller ratings and performance metrics launch.
                      </Text>
                    </View>
                  </View>

                  {/* Phase 3 */}
                  <View style={{ flexDirection: "row", gap: 10, opacity: 0.4 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.mutedForeground, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: colors.mutedForeground }}>3</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.foreground }}>Phase 3 — Top Performer Benefits</Text>
                        <View style={{ backgroundColor: colors.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 10, color: colors.mutedForeground }}>FUTURE</Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground, lineHeight: 17 }}>
                        Top-rated sellers unlock lower marketplace fees, priority placement, and exclusive promotional opportunities.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Listings</Text>
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setShowNewListing((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <Feather name={showNewListing ? "x" : "plus"} size={14} color="#FFF" />
                    <Text style={styles.addBtnTxt}>{showNewListing ? "Cancel" : "Add Listing"}</Text>
                  </TouchableOpacity>
                </View>

                {showNewListing && (
                  <View style={[styles.newListingForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>Listing Type <Text style={{ color: "#C9922B" }}>*</Text></Text>
                    <View style={styles.typeChips}>
                      {LISTING_TYPES.map((t) => {
                        const selected = newListingType === t.value;
                        return (
                          <TouchableOpacity
                            key={t.value}
                            style={[styles.typeChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + "15" : colors.background }]}
                            onPress={() => setNewListingType(t.value)}
                            activeOpacity={0.75}
                          >
                            <Feather name={t.icon as any} size={13} color={selected ? colors.primary : colors.mutedForeground} />
                            <Text style={[styles.typeChipTxt, { color: selected ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>Product / Service Name</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="e.g. Braids Appointment"
                      placeholderTextColor={colors.mutedForeground}
                    />
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>Description (optional)</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={newDesc}
                      onChangeText={setNewDesc}
                      placeholder="Brief description…"
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      numberOfLines={3}
                    />
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>Category (optional)</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={newCategory}
                      onChangeText={setNewCategory}
                      placeholder="e.g. Hair, Food, Apparel"
                      placeholderTextColor={colors.mutedForeground}
                    />
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>Price (USD)</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={newPrice}
                      onChangeText={setNewPrice}
                      placeholder="e.g. 45.00"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: colors.primary }, (savingListing || !newListingType) && { opacity: 0.6 }]}
                      disabled={savingListing || !newName.trim() || !newPrice.trim() || !newListingType}
                      onPress={async () => {
                        if (!newListingType) { Alert.alert("Select a listing type before saving."); return; }
                        const cents = Math.round(parseFloat(newPrice) * 100);
                        if (isNaN(cents) || cents <= 0) { Alert.alert("Invalid price"); return; }
                        setSavingListing(true);
                        const result = await createListing({
                          name: newName.trim(),
                          description: newDesc.trim() || undefined,
                          priceInCents: cents,
                          category: newCategory.trim() || undefined,
                          listingType: newListingType,
                        });
                        setSavingListing(false);
                        if (result) {
                          setShowNewListing(false);
                          setNewListingType(null); setNewName(""); setNewDesc(""); setNewPrice(""); setNewCategory("");
                        } else {
                          Alert.alert("Error", "Failed to create listing. Please try again.");
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      {savingListing ? <ActivityIndicator size="small" color="#fff" /> : null}
                      <Text style={styles.saveBtnTxt}>{savingListing ? "Saving…" : "Save Listing"}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {listingsLoading ? (
                  <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : listings.length === 0 ? (
                  <View style={[styles.noReviews, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="shopping-bag" size={24} color={colors.muted} />
                    <Text style={[styles.noReviewsTxt, { color: colors.mutedForeground }]}>
                      No listings yet. Tap "Add Listing" to create your first product or service.
                    </Text>
                  </View>
                ) : listings.map((l: Listing) => (
                  <View key={l.id} style={[styles.listingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listingName, { color: colors.foreground }]}>{l.name}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        {l.listingType ? (() => {
                          const t = LISTING_TYPES.find((x) => x.value === l.listingType);
                          return t ? (
                            <View style={[styles.typeTag, { backgroundColor: colors.primary + "12" }]}>
                              <Feather name={t.icon as any} size={10} color={colors.primary} />
                              <Text style={[styles.typeTagTxt, { color: colors.primary }]}>{t.label}</Text>
                            </View>
                          ) : null;
                        })() : null}
                        {l.category ? <Text style={[styles.listingCat, { color: colors.mutedForeground }]}>{l.category}</Text> : null}
                      </View>
                      <Text style={[styles.listingPrice, { color: colors.primary }]}>
                        ${(l.priceInCents / 100).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.listingActions}>
                      <TouchableOpacity
                        style={[styles.toggleBtn, { backgroundColor: l.active ? "#2D7A4F18" : colors.muted + "30" }]}
                        onPress={() => void toggleActive(l.id, !l.active)}
                      >
                        <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: l.active ? "#2D7A4F" : colors.mutedForeground }}>
                          {l.active ? "Active" : "Hidden"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert("Delete listing?", `"${l.name}" will be removed.`, [
                            { text: "Cancel", style: "cancel" },
                            { text: "Delete", style: "destructive", onPress: () => void deleteListing(l.id) },
                          ]);
                        }}
                      >
                        <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
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

                  {/* Expansion Analysis */}
                  <View style={[styles.expansionCard, { backgroundColor: "#0E1F0E", borderColor: "#2D7A4F30" }]}>
                    <View style={styles.expansionHeader}>
                      <View style={styles.expansionBadge}>
                        <Feather name="trending-up" size={11} color="#FFF" />
                        <Text style={styles.expansionBadgeText}>KinfolkAI™ Expansion</Text>
                      </View>
                      <Text style={[styles.expansionTitle, { color: "#FFF" }]}>Growth & Expansion Vision</Text>
                      <Text style={[styles.expansionSub, { color: "rgba(255,255,255,0.5)" }]}>
                        AI analysis of community demand, market gaps, and strategic expansion opportunities for your business.
                      </Text>
                    </View>

                    {!expansionData && !expansionLoading && (
                      <TouchableOpacity
                        style={[styles.expansionBtn, { backgroundColor: "#2D7A4F" }]}
                        onPress={() => { void generateExpansionAnalysis(); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                        activeOpacity={0.85}
                      >
                        <Feather name="map" size={15} color="#FFF" />
                        <Text style={styles.expansionBtnText}>Analyze Expansion Opportunities</Text>
                      </TouchableOpacity>
                    )}

                    {expansionLoading && (
                      <View style={styles.expansionLoading}>
                        <ActivityIndicator color="#2D7A4F" />
                        <Text style={[styles.expansionLoadingText, { color: "rgba(255,255,255,0.6)" }]}>Analyzing market data…</Text>
                      </View>
                    )}

                    {expansionData && (
                      <View style={styles.expansionResults}>
                        <Text style={[styles.expansionSummary, { color: "rgba(255,255,255,0.8)" }]}>{expansionData.summary}</Text>

                        {expansionData.opportunities.map((opp, idx) => (
                          <View key={idx} style={[styles.expansionOpp, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "#2D7A4F30" }]}>
                            <View style={styles.expansionOppHeader}>
                              <Text style={[styles.expansionCity, { color: "#FFF" }]}>{opp.city}, {opp.state}</Text>
                              <View style={[styles.demandBadge, { backgroundColor: "#2D7A4F30" }]}>
                                <Text style={[styles.demandText, { color: "#2D7A4F" }]}>High Demand</Text>
                              </View>
                            </View>
                            <Text style={[styles.expansionOppTitle, { color: "#4ADE80" }]}>{opp.opportunity}</Text>
                            <Text style={[styles.expansionMarket, { color: "rgba(255,255,255,0.55)" }]}>{opp.marketSignal}</Text>
                            <Text style={[styles.expansionDemand, { color: "rgba(255,255,255,0.4)" }]}>{opp.estimatedDemand}</Text>
                            <View style={styles.expansionSteps}>
                              {opp.actionSteps.map((step, si) => (
                                <View key={si} style={styles.expansionStep}>
                                  <Text style={[styles.expansionStepNum, { color: "#2D7A4F" }]}>{si + 1}</Text>
                                  <Text style={[styles.expansionStepText, { color: "rgba(255,255,255,0.7)" }]}>{step}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}

                        {expansionData.insights.length > 0 && (
                          <>
                            <Text style={[styles.expansionInsightsTitle, { color: "rgba(255,255,255,0.5)" }]}>STRATEGIC INSIGHTS</Text>
                            {expansionData.insights.map((insight, i) => (
                              <View key={i} style={styles.expansionInsightRow}>
                                <Feather name="zap" size={13} color="#2D7A4F" style={{ marginTop: 1 }} />
                                <Text style={[styles.expansionInsightText, { color: "rgba(255,255,255,0.7)" }]}>{insight}</Text>
                              </View>
                            ))}
                          </>
                        )}

                        <TouchableOpacity
                          style={[styles.expansionRefresh, { borderColor: "rgba(45,122,79,0.3)" }]}
                          onPress={() => { setExpansionData(null); void generateExpansionAnalysis(); }}
                          activeOpacity={0.7}
                        >
                          <Feather name="refresh-cw" size={13} color="#2D7A4F" />
                          <Text style={[styles.expansionRefreshText, { color: "#2D7A4F" }]}>Refresh Analysis</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              );
            })()}
          </>
        )}
      </ScrollView>

      {business && (
        <SellerAgreementModal
          visible={showAgreementModal}
          businessId={business.id}
          businessName={business.name}
          onAccepted={() => {
            setSellerAgreementAccepted(true);
            setShowAgreementModal(false);
          }}
          onClose={() => setShowAgreementModal(false)}
        />
      )}
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
  promoteCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  promoteIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  promoteTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  promoteSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  nudgeCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 10 },
  nudgeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nudgeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  nudgeBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FFF", letterSpacing: 0.4 },
  nudgeHeadline: { fontSize: 15, fontFamily: "Inter_700Bold", lineHeight: 21 },
  nudgeBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  nudgeCaption: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 4 },
  nudgeCaptionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase" },
  nudgeCaptionText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  nudgeActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  nudgePostBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  nudgePostBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  nudgeNotifyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  nudgeNotifyText: { fontSize: 12, fontFamily: "Inter_500Medium" },
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

  taglineBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 18 },
  taglineText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, fontStyle: "italic" },

  aiPlanCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, marginTop: 20 },
  aiPlanHeader: { gap: 6 },
  aiPlanBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#CA922B", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  aiPlanBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FFF", letterSpacing: 0.4 },
  aiPlanTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  aiPlanSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  aiPlanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12 },
  aiPlanBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  aiPlanLoading: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  aiPlanLoadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  aiPlanResults: { gap: 12 },
  aiPlanSummary: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  aiPlanItem: { borderLeftWidth: 3, borderRadius: 10, padding: 12, gap: 8 },
  aiPlanItemTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  aiPlanIssue: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  aiPlanPriority: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  aiPlanPriorityText: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  aiPlanCategory: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase" },
  aiPlanStep: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  aiPlanStepDot: { fontSize: 14, lineHeight: 20 },
  aiPlanStepText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, flex: 1 },
  aiPlanMeta: { flexDirection: "row", gap: 14, marginTop: 4 },
  aiPlanMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  aiPlanMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  aiPlanResource: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17 },
  aiPlanRefresh: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  aiPlanRefreshText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  expansionCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, marginTop: 16 },
  expansionHeader: { gap: 6 },
  expansionBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#2D7A4F", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  expansionBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FFF", letterSpacing: 0.4 },
  expansionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  expansionSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  expansionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12 },
  expansionBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  expansionLoading: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  expansionLoadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  expansionResults: { gap: 12 },
  expansionSummary: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  expansionOpp: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  expansionOppHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  expansionCity: { fontSize: 15, fontFamily: "Inter_700Bold" },
  demandBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  demandText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  expansionOppTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  expansionMarket: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  expansionDemand: { fontSize: 11, fontFamily: "Inter_400Regular" },
  expansionSteps: { gap: 6, marginTop: 4 },
  expansionStep: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  expansionStepNum: { fontSize: 12, fontFamily: "Inter_700Bold", width: 16 },
  expansionStepText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, flex: 1 },
  expansionInsightsTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginTop: 4 },
  expansionInsightRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  expansionInsightText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, flex: 1 },
  expansionRefresh: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  expansionRefreshText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  addrForm: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12, gap: 6 },
  addrLabel: { fontFamily: "Inter_500Medium", fontSize: 11, marginBottom: 2 },
  addrInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 4 },
  addrAlert: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 4 },
  addrAlertText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 17 },
  addrSaveBtn: { borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 8 },
  addrSaveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  addBtnTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  newListingForm: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16, gap: 4 },
  typeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4, marginTop: 4 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  typeChipTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },
  typeTag: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typeTagTxt: { fontSize: 10, fontFamily: "Inter_500Medium" },
  formLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 4, marginTop: 8 },
  formInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 14 },
  formTextArea: { minHeight: 72, textAlignVertical: "top" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 13, marginTop: 8 },
  saveBtnTxt: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFF" },
  listingRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  listingName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  listingCat: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  listingPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  listingActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  requirementRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 8, borderBottomWidth: 1 },
  requirementDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  requirementLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 2 },
  requirementSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
});
