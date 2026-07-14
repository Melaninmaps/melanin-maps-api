import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { useAuth } from "@/lib/auth";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    return await SecureStore.getItemAsync("auth_session_token");
  } catch { return null; }
}

type Business = {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  verified: boolean;
  blackOwned: boolean;
  confidenceScore?: number;
  phone?: string | null;
  website?: string | null;
  hours?: string | null;
  description?: string;
};

type AdminSection = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub: string;
  color: string;
  route?: string;
  onPress?: () => void;
  badge?: string;
};

export default function BusinessOwnerHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ views: 0, saves: 0, reviews: 0 });
  const [clicks, setClicks] = useState<{ tiktok: number; instagram: number; youtube: number; facebook: number; pinterest: number; website: number; phoneCalls: number; directions: number } | null>(null);
  const [analyticsLocked, setAnalyticsLocked] = useState(false);
  const [skipInsights, setSkipInsights] = useState<string[]>([]);
  const [skipExpanded, setSkipExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/api/businesses/mine`, { headers });
      if (res.ok) {
        const data = await res.json() as { business: Business | null };
        setBusiness(data.business);
        if (data.business) {
          const aRes = await fetch(`${getApiBase()}/api/businesses/mine/analytics`, { headers });
          if (aRes.ok) {
            const aData = await aRes.json() as { metrics?: { views30d?: number; saves?: number; reviews?: number }; clicks30d?: { tiktok: number; instagram: number; youtube: number; facebook: number; pinterest: number; website: number; phoneCalls: number; directions: number } };
            const m = aData.metrics;
            if (m) setStats({ views: m.views30d ?? 0, saves: m.saves ?? 0, reviews: m.reviews ?? 0 });
            if (aData.clicks30d) setClicks(aData.clicks30d);
          } else if (aRes.status === 403) {
            setAnalyticsLocked(true);
          }
          const sRes = await fetch(`${getApiBase()}/api/kinfolk/skip-feedback`, { headers });
          if (sRes.ok) {
            const sData = await sRes.json() as { messages?: string[] };
            setSkipInsights(sData.messages ?? []);
          }
        }
      }
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void load();
    else setLoading(false);
  }, [isAuthenticated, load]);

  const sections: AdminSection[] = [
    {
      id: "identity",
      icon: "user",
      label: "Business Identity",
      sub: "Your story, values, vibe, accessibility & growth goals",
      color: "#5B2D8E",
      route: "/business-owner/identity",
    },
    {
      id: "broadcasts",
      icon: "send",
      label: "Send Broadcast",
      sub: "Notify followers — events, offers, updates & emergency alerts",
      color: "#1A6B4A",
      route: "/business-owner/broadcasts",
    },
    {
      id: "edit",
      icon: "edit-2",
      label: "Edit Business Profile",
      sub: "Update name, category, description, contact info",
      color: "#C9922B",
      route: "/business-owner/edit-profile",
    },
    {
      id: "hours",
      icon: "clock",
      label: "Hours & Availability",
      sub: "Set your open hours and availability windows",
      color: "#2D7A4F",
      route: "/business-owner/edit-profile",
    },
    {
      id: "reviews",
      icon: "star",
      label: "Reviews",
      sub: `${stats.reviews} total review${stats.reviews !== 1 ? "s" : ""} from the community`,
      color: "#3A6BB5",
      route: "/business-dashboard",
    },
    {
      id: "pinned",
      icon: "bookmark",
      label: "Pinned Highlights",
      sub: "Feature your best reviews for 90 days",
      color: "#C9922B",
      route: "/business-owner/pinned-highlights",
    },
    {
      id: "analytics",
      icon: "bar-chart-2",
      label: "Analytics & Insights",
      sub: `${stats.views} profile views · ${stats.saves} saves this month`,
      color: "#5B2D2D",
      route: "/business-dashboard",
    },
    {
      id: "challenges",
      icon: "award",
      label: "Community Challenges",
      sub: "Register your business for Restaurant Week and more",
      color: "#1A2F5E",
      route: "/challenges",
    },
    {
      id: "grow",
      icon: "trending-up",
      label: "Growth Tools",
      sub: "Promotions, deals, and marketing options",
      color: "#CA922B",
      route: "/business-dashboard",
    },
    {
      id: "verify",
      icon: "shield",
      label: "Verification & Trust",
      sub: business?.verified ? "Your business is verified ✓" : "Get verified to build community trust",
      color: "#2D7A4F",
      route: business?.verified ? undefined : "/business-verify",
    },
    {
      id: "view",
      icon: "eye",
      label: "Preview My Listing",
      sub: "See exactly how customers see your business",
      color: "#CA922B",
      route: "/business-owner/preview",
    },
    {
      id: "featured-video",
      icon: "video",
      label: "Featured Video",
      sub: "Pin one video from YouTube, TikTok, Instagram, or Facebook",
      color: "#FF4500",
      route: "/business-owner/featured-video",
    },
    {
      id: "global",
      icon: "globe",
      label: "Share Global Recommendations",
      sub: "Recommend places you know and trust around the world",
      color: "#2D7A4F",
      route: "/global-recommendations/add",
    },
  ];

  if (!isAuthenticated) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Business Admin</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🔐</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in required</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Log in to manage your business listing.</Text>
          <TouchableOpacity activeOpacity={0.85} style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/login" as never)}>
            <Text style={styles.loginBtnTxt}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Business Admin</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : !business ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🏪</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No business listed yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              List your minority-owned business to get discovered by the community, collect reviews, and access growth tools.
            </Text>
            <TouchableOpacity activeOpacity={0.85}
              style={[styles.listBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/list-business" as never)}
            >
              <Feather name="plus" size={16} color="#FFF" />
              <Text style={styles.listBtnTxt}>List My Business</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Business card */}
            <View style={[styles.bizCard, { backgroundColor: "#CA922B" }]}>
              <View style={styles.bizCardTop}>
                <View style={styles.bizAvatar}>
                  <Text style={styles.bizAvatarEmoji}>🏪</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.bizName} numberOfLines={1}>{business.name}</Text>
                  <View style={[styles.categoryChip, { backgroundColor: "rgba(201,146,43,0.25)" }]}>
                    <Text style={styles.categoryChipTxt}>{business.category}</Text>
                  </View>
                  <Text style={styles.bizLocation}>{business.city}, {business.state}</Text>
                </View>
                {business.verified && (
                  <View style={styles.verifiedBadge}>
                    <Feather name="check-circle" size={13} color="#C9922B" />
                    <Text style={styles.verifiedTxt}>Verified</Text>
                  </View>
                )}
              </View>

              {/* Quick stats */}
              {analyticsLocked ? (
                <TouchableOpacity
                  style={styles.lockedStats}
                  activeOpacity={0.8}
                  onPress={() => router.push("/upgrade" as never)}
                >
                  <Feather name="lock" size={13} color="rgba(201,146,43,0.8)" />
                  <Text style={styles.lockedStatsTxt}>Upgrade to Navigator to see views, saves & reviews</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.statsRow}>
                    {[
                      { label: "Views", value: String(stats.views), icon: "eye" as const },
                      { label: "Saves", value: String(stats.saves), icon: "bookmark" as const },
                      { label: "Reviews", value: String(stats.reviews), icon: "star" as const },
                    ].map((s) => (
                      <View key={s.label} style={styles.statCell}>
                        <Feather name={s.icon} size={13} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.statNum}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                  {clicks && (clicks.tiktok + clicks.instagram + clicks.youtube + clicks.facebook + clicks.pinterest + clicks.website + clicks.phoneCalls + clicks.directions) > 0 && (
                    <View style={styles.trafficSection}>
                      <Text style={styles.trafficLabel}>Support at the Source — This Month</Text>
                      <View style={styles.trafficRow}>
                        {[
                          { label: "TikTok", value: clicks.tiktok, icon: "♪" },
                          { label: "Instagram", value: clicks.instagram, icon: "◈" },
                          { label: "YouTube", value: clicks.youtube, icon: "▶" },
                          { label: "Site", value: clicks.website, icon: "🌐" },
                          { label: "Calls", value: clicks.phoneCalls, icon: "📞" },
                          { label: "Directions", value: clicks.directions, icon: "🗺" },
                        ].filter((t) => t.value > 0).map((t) => (
                          <View key={t.label} style={styles.trafficCell}>
                            <Text style={styles.trafficIcon}>{t.icon}</Text>
                            <Text style={styles.trafficNum}>{t.value}</Text>
                            <Text style={styles.trafficCellLabel}>{t.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Sections */}
            <View style={[styles.sectionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {sections.map((s, i) => (
                <React.Fragment key={s.id}>
                  <TouchableOpacity
                    style={styles.sectionRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (!s.route) return;
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      router.push(s.route as never);
                    }}
                    disabled={!s.route}
                  >
                    <View style={[styles.sectionIcon, { backgroundColor: s.color + "18" }]}>
                      <Feather name={s.icon} size={18} color={s.color} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.sectionLabel, { color: !s.route ? colors.mutedForeground : colors.foreground }]}>{s.label}</Text>
                      <Text style={[styles.sectionSub, { color: colors.mutedForeground }]} numberOfLines={1}>{s.sub}</Text>
                    </View>
                    {s.route && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
                    {!s.route && <Feather name="lock" size={14} color={colors.mutedForeground} />}
                  </TouchableOpacity>
                  {i < sections.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                </React.Fragment>
              ))}
            </View>

            {skipInsights.length > 0 && (
              <TouchableOpacity
                style={[styles.skipCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.85}
                onPress={() => setSkipExpanded((v) => !v)}
              >
                <View style={styles.skipHeader}>
                  <View style={styles.skipHeaderLeft}>
                    <View style={[styles.skipIcon, { backgroundColor: "#F59E0B18" }]}>
                      <Feather name="eye-off" size={15} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.skipTitle, { color: colors.foreground }]}>Community Skip Insights</Text>
                      <Text style={[styles.skipSub, { color: colors.mutedForeground }]}>
                        {skipInsights.length} reason{skipInsights.length !== 1 ? "s" : ""} community members passed — private to you
                      </Text>
                    </View>
                  </View>
                  <Feather name={skipExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                </View>
                {skipExpanded && (
                  <View style={[styles.skipBody, { borderTopColor: colors.border }]}>
                    {skipInsights.slice(0, 10).map((msg, i) => (
                      <View key={i} style={styles.skipRow}>
                        <Feather name="message-square" size={12} color={colors.mutedForeground} style={{ marginTop: 2 }} />
                        <Text style={[styles.skipMsg, { color: colors.foreground }]}>{msg}</Text>
                      </View>
                    ))}
                    {skipInsights.length > 10 && (
                      <Text style={[styles.skipMore, { color: colors.mutedForeground }]}>
                        +{skipInsights.length - 10} more · Use KinfolkAI → Action Plan for full analysis
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity activeOpacity={0.85}
              style={[styles.listAnotherBtn, { borderColor: colors.border }]}
              onPress={() => router.push("/list-business" as never)}
            >
              <Feather name="plus-circle" size={15} color={colors.mutedForeground} />
              <Text style={[styles.listAnotherTxt, { color: colors.mutedForeground }]}>List another business</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  scroll: { padding: 16, gap: 14 },
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  loginBtn: { paddingVertical: 13, paddingHorizontal: 32, borderRadius: 14, marginTop: 8 },
  loginBtnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  listBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 13, paddingHorizontal: 24, borderRadius: 14, marginTop: 8 },
  listBtnTxt: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  bizCard: { borderRadius: 18, padding: 16, gap: 14 },
  bizCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  bizAvatar: { width: 52, height: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  bizAvatarEmoji: { fontSize: 26 },
  bizName: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#FFF" },
  categoryChip: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryChipTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#C9922B" },
  bizLocation: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "rgba(201,146,43,0.2)", borderRadius: 10 },
  verifiedTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#C9922B" },
  statsRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 12 },
  statCell: { flex: 1, alignItems: "center", gap: 3 },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFF" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)" },
  lockedStats: { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 12, paddingHorizontal: 4 },
  trafficSection: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 12, marginTop: 10 },
  trafficLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "rgba(201,146,43,0.9)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" },
  trafficRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  trafficCell: { alignItems: "center", minWidth: 52, gap: 2 },
  trafficIcon: { fontSize: 16 },
  trafficNum: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#FFF" },
  trafficCellLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)" },
  lockedStatsTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(201,146,43,0.9)" },
  sectionsCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  sectionIcon: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginLeft: 70 },
  listAnotherBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 12, borderStyle: "dashed" },
  listAnotherTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
  skipCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginTop: 12 },
  skipHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 14 },
  skipHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  skipIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  skipTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  skipSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  skipBody: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  skipRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  skipMsg: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 18 },
  skipMore: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", paddingTop: 4 },
});
