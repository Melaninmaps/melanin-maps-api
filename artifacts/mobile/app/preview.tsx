import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────
type Stats = { businesses: number; cities: number; members: number; reviews: number };
type SpotBiz = { id: string; name: string; category: string; city: string; state: string | null; rating: string; confidenceScore: number; imageUrl: string | null; verified: boolean };
type PreviewPost = { id: string; authorName: string; authorInitials: string; authorColor: string; contentPreview: string; contentLength: number; isBlurred: boolean; category: string; topicTag: string | null; locationTag: string | null; upvotes: number; commentsCount: number; createdAt: string };

// ─── Feature tier cards ───────────────────────────────────────────────────────
const MEMBER_FEATURES = [
  { icon: "bookmark" as const, label: "Save Favorite Spots", tier: "free" },
  { icon: "star" as const, label: "Leave Community Reviews", tier: "free" },
  { icon: "message-circle" as const, label: "Join the Community Feed", tier: "free" },
  { icon: "check-circle" as const, label: "Check In & Earn Points", tier: "free" },
  { icon: "users" as const, label: "Create & Join Kinfolk Circles", tier: "navigator" },
  { icon: "navigation" as const, label: "In-App Turn-by-Turn Directions", tier: "navigator" },
  { icon: "award" as const, label: "My Recommended Spots Gallery", tier: "navigator" },
  { icon: "zap" as const, label: "KinfolkAI Travel Intelligence", tier: "trailblazer" },
  { icon: "map" as const, label: "Neighborhood Safety Overlays", tier: "navigator" },
  { icon: "globe" as const, label: "Life Journey Planner", tier: "navigator" },
];

const BIZ_FEATURES = [
  { icon: "briefcase" as const, label: "Free Business Profile Page", tier: "free" },
  { icon: "bar-chart-2" as const, label: "Engagement Analytics Dashboard", tier: "basic" },
  { icon: "zap" as const, label: "Flash Deals & Promotions", tier: "basic" },
  { icon: "eye" as const, label: "Featured Search Placement", tier: "premium" },
  { icon: "file-text" as const, label: "Digital Menus & Price Lists", tier: "basic" },
  { icon: "shield" as const, label: "Verified Owner Badge", tier: "basic" },
];

const TIER_COLOR: Record<string, string> = {
  free: "#2D7A4F",
  navigator: "#CA922B",
  trailblazer: "#7B2D8B",
  basic: "#2D7A4F",
  premium: "#CA922B",
};

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  navigator: "Navigator",
  trailblazer: "Trailblazer",
  basic: "Basic Plan",
  premium: "Premium Plan",
};

// ─── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({ icon, value, label, colors }: { icon: keyof typeof Feather.glyphMap; value: number; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[s.statChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={18} color={colors.primary} />
      <Text style={[s.statValue, { color: colors.foreground }]}>
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
      </Text>
      <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

// ─── Business teaser card ──────────────────────────────────────────────────────
function BusinessTeaserCard({ biz, locked, colors, onUnlock }: { biz: SpotBiz; locked: boolean; colors: ReturnType<typeof useColors>; onUnlock: () => void }) {
  return (
    <TouchableOpacity
      style={[s.bizCard, { backgroundColor: colors.card, borderColor: locked ? colors.border : colors.primary + "40" }]}
      activeOpacity={locked ? 0.9 : 0.75}
      onPress={() => { if (locked) { onUnlock(); } if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
    >
      <View style={[s.bizIconWrap, { backgroundColor: colors.primary + "15" }]}>
        <Feather name="briefcase" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.bizName, { color: locked ? colors.mutedForeground : colors.foreground }]} numberOfLines={1}>
          {locked ? "••••••••••••" : biz.name}
        </Text>
        <Text style={[s.bizMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {locked ? "••• • ••••••••••" : `${biz.category} · ${biz.city}${biz.state ? `, ${biz.state}` : ""}`}
        </Text>
        {!locked && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Feather name="star" size={11} color="#CA922B" />
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: "#CA922B" }}>{parseFloat(biz.rating).toFixed(1)}</Text>
            {biz.verified && (
              <View style={[s.verifiedBadge, { backgroundColor: "#2D7A4F18" }]}>
                <Feather name="check-circle" size={9} color="#2D7A4F" />
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 9, color: "#2D7A4F" }}>Verified</Text>
              </View>
            )}
          </View>
        )}
      </View>
      {locked ? (
        <View style={[s.lockBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
          <Feather name="lock" size={13} color={colors.primary} />
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, color: colors.primary }}>Join</Text>
        </View>
      ) : (
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

// ─── Post teaser card ──────────────────────────────────────────────────────────
function PostTeaserCard({ post, locked, colors, onUnlock }: { post: PreviewPost; locked: boolean; colors: ReturnType<typeof useColors>; onUnlock: () => void }) {
  const initials = post.authorInitials || "?";
  return (
    <TouchableOpacity
      style={[s.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={locked ? 0.9 : 1}
      onPress={() => { if (locked) onUnlock(); }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <View style={[s.avatar, { backgroundColor: post.authorColor || colors.primary }]}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.postAuthor, { color: locked ? colors.mutedForeground : colors.foreground }]}>
            {locked ? "Community Member" : post.authorName}
          </Text>
          {post.topicTag && !locked && (
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground }}>
              {post.topicTag}
            </Text>
          )}
        </View>
        {post.locationTag && !locked && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Feather name="map-pin" size={11} color={colors.mutedForeground} />
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground }}>{post.locationTag}</Text>
          </View>
        )}
      </View>

      {locked ? (
        <View>
          <Text style={[s.postContent, { color: colors.mutedForeground }]} numberOfLines={2}>
            {post.contentPreview}
          </Text>
          <TouchableOpacity
            style={[s.unlockRow, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}
            onPress={onUnlock}
            activeOpacity={0.8}
          >
            <Feather name="lock" size={13} color={colors.primary} />
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.primary }}>
              Join to read the full post
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={[s.postContent, { color: colors.foreground }]}>{post.contentPreview}{post.isBlurred ? "…" : ""}</Text>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="arrow-up" size={13} color={colors.mutedForeground} />
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground }}>{post.upvotes}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="message-circle" size={13} color={colors.mutedForeground} />
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground }}>{post.commentsCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Join nudge modal (inline, no modal — just an animated CTA strip) ─────────
function JoinNudge({ colors, onJoin, onLogin }: { colors: ReturnType<typeof useColors>; onJoin: () => void; onLogin: () => void }) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, tension: 120, friction: 7 }).start();
  }, []);
  return (
    <Animated.View style={[s.nudge, { backgroundColor: colors.card, borderColor: colors.primary + "30", transform: [{ scale: pop }] }]}>
      <View style={[s.nudgeIcon, { backgroundColor: colors.primary + "15" }]}>
        <Feather name="users" size={22} color={colors.primary} />
      </View>
      <Text style={[s.nudgeTitle, { color: colors.foreground }]}>You're almost in</Text>
      <Text style={[s.nudgeSub, { color: colors.mutedForeground }]}>
        Create a free account to read community posts, save businesses, and earn founding member status.
      </Text>
      <TouchableOpacity style={[s.nudgeBtn, { backgroundColor: colors.primary }]} onPress={onJoin} activeOpacity={0.85}>
        <Feather name="user-plus" size={16} color="#FFFFFF" />
        <Text style={s.nudgeBtnText}>Join Free — It Takes 30 Seconds</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onLogin} activeOpacity={0.75}>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>
          Already have an account?{" "}
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main preview screen ───────────────────────────────────────────────────────
export default function PreviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<Stats | null>(null);
  const [spotlight, setSpotlight] = useState<SpotBiz[]>([]);
  const [posts, setPosts] = useState<PreviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNudge, setShowNudge] = useState(false);
  const [activeTab, setActiveTab] = useState<"community" | "business">("community");

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void (async () => {
      try {
        const [sRes, bRes, pRes] = await Promise.all([
          fetch("/api/preview/stats"),
          fetch("/api/preview/spotlight"),
          fetch("/api/preview/posts"),
        ]);
        if (sRes.ok) setStats(await sRes.json() as Stats);
        if (bRes.ok) { const d = await bRes.json() as { businesses: SpotBiz[] }; setSpotlight(d.businesses); }
        if (pRes.ok) { const d = await pRes.json() as { posts: PreviewPost[] }; setPosts(d.posts); }
      } catch { } finally {
        setLoading(false);
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    })();
  }, []);

  const handleUnlock = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowNudge(true);
  };

  const handleJoin = () => router.push("/signup" as never);
  const handleLogin = () => router.push("/login" as never);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Platform Preview</Text>
        <TouchableOpacity onPress={handleJoin} activeOpacity={0.8} style={[s.headerJoinBtn, { backgroundColor: colors.primary }]}>
          <Text style={s.headerJoinText}>Join Free</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>

        {/* Hero banner */}
        <View style={[s.hero, { backgroundColor: colors.primary + "12", borderBottomColor: colors.primary + "20" }]}>
          <View style={[s.heroIconWrap, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="compass" size={28} color={colors.primary} />
          </View>
          <Text style={[s.heroTitle, { color: colors.foreground }]}>
            Community Discovery, Reimagined
          </Text>
          <Text style={[s.heroSub, { color: colors.mutedForeground }]}>
            Find melanated-owned businesses, read real community safety intel, and plan journeys with confidence. Here's a taste of what's waiting for you.
          </Text>

          {/* Tab toggle */}
          <View style={[s.tabToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(["community", "business"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[s.tabBtn, activeTab === tab && { backgroundColor: colors.primary }]}
                onPress={() => { setActiveTab(tab); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                activeOpacity={0.8}
              >
                <Feather
                  name={tab === "community" ? "users" : "briefcase"}
                  size={13}
                  color={activeTab === tab ? "#FFFFFF" : colors.mutedForeground}
                />
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: activeTab === tab ? "#FFFFFF" : colors.mutedForeground }}>
                  {tab === "community" ? "For Members" : "For Businesses"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Animated.View style={{ opacity: fade }}>
          {/* Platform stats */}
          {stats && (
            <View style={s.statsSection}>
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>LIVE PLATFORM STATS</Text>
              <View style={s.statsRow}>
                <StatChip icon="briefcase" value={stats.businesses} label="Businesses" colors={colors} />
                <StatChip icon="map-pin" value={stats.cities} label="Cities" colors={colors} />
                <StatChip icon="users" value={stats.members} label="Members" colors={colors} />
                <StatChip icon="star" value={stats.reviews} label="Reviews" colors={colors} />
              </View>
            </View>
          )}

          {activeTab === "community" ? (
            <>
              {/* Spotlight businesses */}
              {spotlight.length > 0 && (
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <Feather name="award" size={15} color={colors.primary} />
                    <Text style={[s.sectionTitle, { color: colors.foreground }]}>Spotlight Businesses</Text>
                    <View style={[s.previewPill, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 9, color: colors.primary }}>PREVIEW</Text>
                    </View>
                  </View>
                  <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>
                    Top-rated, verified businesses from across the community.
                  </Text>
                  {spotlight.map((biz, idx) => (
                    <BusinessTeaserCard
                      key={biz.id}
                      biz={biz}
                      locked={idx >= 2}
                      colors={colors}
                      onUnlock={handleUnlock}
                    />
                  ))}
                  {spotlight.length >= 2 && (
                    <TouchableOpacity style={[s.seeMoreRow, { borderColor: colors.border }]} onPress={handleUnlock} activeOpacity={0.75}>
                      <Feather name="lock" size={13} color={colors.primary} />
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.primary }}>
                        Join to explore {100}+ businesses in your city
                      </Text>
                      <Feather name="chevron-right" size={13} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Community feed preview */}
              {posts.length > 0 && (
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <Feather name="message-circle" size={15} color={colors.primary} />
                    <Text style={[s.sectionTitle, { color: colors.foreground }]}>Community Pulse</Text>
                    <View style={[s.previewPill, { backgroundColor: "#7B2D8B15", borderColor: "#7B2D8B30" }]}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 9, color: "#7B2D8B" }}>LIVE</Text>
                    </View>
                  </View>
                  <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>
                    Real conversations happening in the community right now.
                  </Text>
                  {posts.map((post, idx) => (
                    <PostTeaserCard
                      key={post.id}
                      post={post}
                      locked={idx >= 1}
                      colors={colors}
                      onUnlock={handleUnlock}
                    />
                  ))}
                </View>
              )}

              {/* Member feature grid */}
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Feather name="gift" size={15} color={colors.primary} />
                  <Text style={[s.sectionTitle, { color: colors.foreground }]}>What You Unlock</Text>
                </View>
                {MEMBER_FEATURES.map((f) => {
                  const tc = TIER_COLOR[f.tier];
                  const tl = TIER_LABEL[f.tier];
                  return (
                    <View key={f.label} style={[s.featureRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={[s.featureIconWrap, { backgroundColor: tc + "18" }]}>
                        <Feather name={f.icon} size={16} color={tc} />
                      </View>
                      <Text style={[s.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
                      <View style={[s.tierPill, { backgroundColor: tc + "15", borderColor: tc + "30" }]}>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 9, color: tc }}>{tl.toUpperCase()}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            /* Business tab */
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Feather name="trending-up" size={15} color={colors.primary} />
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Tools for Business Owners</Text>
              </View>
              <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>
                Claim your free profile and reach thousands of community members actively looking to support.
              </Text>
              {BIZ_FEATURES.map((f) => {
                const tc = TIER_COLOR[f.tier];
                const tl = TIER_LABEL[f.tier];
                return (
                  <View key={f.label} style={[s.featureRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[s.featureIconWrap, { backgroundColor: tc + "18" }]}>
                      <Feather name={f.icon} size={16} color={tc} />
                    </View>
                    <Text style={[s.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
                    <View style={[s.tierPill, { backgroundColor: tc + "15", borderColor: tc + "30" }]}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 9, color: tc }}>{tl.toUpperCase()}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Business CTA */}
              <View style={[s.bizCTA, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
                <Feather name="briefcase" size={20} color={colors.primary} />
                <Text style={[s.bizCTATitle, { color: colors.foreground }]}>List Your Business — Free</Text>
                <Text style={[s.bizCTASub, { color: colors.mutedForeground }]}>
                  Join hundreds of melanated-owned businesses already reaching our community.
                </Text>
                <TouchableOpacity
                  style={[s.nudgeBtn, { backgroundColor: colors.primary, marginTop: 4 }]}
                  onPress={handleJoin}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={15} color="#FFFFFF" />
                  <Text style={s.nudgeBtnText}>Get Started</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Join nudge (shown after tapping locked content) */}
          {showNudge && (
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <JoinNudge colors={colors} onJoin={handleJoin} onLogin={handleLogin} />
            </View>
          )}

          {/* Sticky bottom CTA */}
          <View style={[s.bottomCTA, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: insets.bottom > 0 ? 0 : 16 }]}>
            <TouchableOpacity style={[s.ctaBtn, { backgroundColor: colors.primary }]} onPress={handleJoin} activeOpacity={0.85}>
              <Feather name="user-plus" size={17} color="#FFFFFF" />
              <Text style={s.ctaBtnText}>Join the Community — Free</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.ctaBtnGhost, { borderColor: colors.primary + "50" }]} onPress={handleLogin} activeOpacity={0.8}>
              <Feather name="log-in" size={17} color={colors.primary} />
              <Text style={[s.ctaBtnGhostText, { color: colors.primary }]}>I Already Have an Account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, flex: 1 },
  headerJoinBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  headerJoinText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFFFFF" },

  hero: {
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    gap: 10,
    alignItems: "center",
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "center" },
  heroSub: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },

  tabToggle: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 3,
    marginTop: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 9,
  },

  statsSection: { padding: 16, gap: 10 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1 },
  statsRow: { flexDirection: "row", gap: 8 },
  statChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 16 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },

  section: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, flex: 1 },
  sectionSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  previewPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },

  bizCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bizIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bizName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  bizMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  seeMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: "dashed",
  },

  postCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#FFFFFF" },
  postAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  postContent: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  unlockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  featureIconWrap: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  featureLabel: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  tierPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },

  nudge: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  nudgeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  nudgeTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  nudgeSub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  nudgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
    marginTop: 4,
  },
  nudgeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },

  bizCTA: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  bizCTATitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  bizCTASub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },

  bottomCTA: {
    padding: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 10,
    marginTop: 8,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFFFFF" },
  ctaBtnGhost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  ctaBtnGhostText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
