import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const TIERS = [
  {
    emoji: "🆓",
    name: "Community Business",
    promise: "Be discovered.",
    tagline:
      "Perfect for new businesses, side hustles, and startups that want to establish an online presence.",
    color: "#A87A40",
    bg: null as string | null,
    fee: { standard: "10%", founding: "9%" },
    goal: "Get discovered and start building your customer base.",
    sections: [
      {
        title: null as string | null,
        items: [
          "Business Profile & Story",
          "Business Verification",
          "Photos & Video Links (YouTube, TikTok, Instagram)",
          "Marketplace Access",
          "Sell Products & Services",
          "Receive & Respond to Reviews",
          "Create Events",
          "Basic Analytics",
          "Basic Messaging",
          "Community Posts",
          "Followed by Customers",
          "Business Notifications (2/month)",
        ],
      },
    ],
  },
  {
    emoji: "🚀",
    name: "Growth Business",
    promise: "Reach more customers.",
    tagline:
      "Perfect for businesses that want to actively attract more customers and understand how they're performing.",
    color: "#CA922B",
    bg: "#CA922B" as string | null,
    fee: { standard: "8%", founding: "7%" },
    goal: "Grow faster with better visibility, insights, and marketing tools.",
    sections: [
      {
        title: "Better Visibility" as string | null,
        items: [
          "Higher search placement",
          "Priority in category searches",
          "Featured in local searches",
        ],
      },
      {
        title: "Better Marketing" as string | null,
        items: [
          "8 customer broadcasts/month",
          "Promotional offers",
          "Featured events",
          "Business promotions",
        ],
      },
      {
        title: "Better Analytics" as string | null,
        items: [
          "Customer demographics",
          "Profile views",
          "Product performance & sales trends",
          "Customer engagement & follow growth",
          "Saved business metrics",
        ],
      },
      {
        title: "AI Tools" as string | null,
        items: [
          "AI social media captions",
          "AI promotion ideas",
          "AI responses to reviews",
          "AI marketing assistant",
        ],
      },
    ],
  },
  {
    emoji: "👑",
    name: "Premium Business",
    promise: "Build a thriving business.",
    tagline:
      "Perfect for established businesses, franchises, multi-location businesses, and companies that want every available growth tool.",
    color: "#CA922B",
    bg: "#1A0A00" as string | null,
    fee: { standard: "6%", founding: "5%" },
    goal: "Scale efficiently using premium tools and lower transaction costs.",
    sections: [
      {
        title: "Maximum Visibility" as string | null,
        items: [
          "Highest search priority",
          "Homepage feature eligibility",
          "Destination highlights",
          "City spotlight opportunities",
        ],
      },
      {
        title: "Premium AI" as string | null,
        items: [
          "AI business consultant",
          "Growth recommendations",
          "Business Health Score™ dashboard",
          "Customer trend analysis",
          "Marketplace optimization",
          "Personalized business insights",
        ],
      },
      {
        title: "Premium Communication" as string | null,
        items: [
          "20 broadcasts/month",
          "Priority customer support",
          "Beta feature access",
        ],
      },
      {
        title: "Advanced Analytics" as string | null,
        items: [
          "Revenue insights",
          "Repeat customer metrics",
          "Geographic customer trends",
          "Campaign performance",
          "Product recommendations",
        ],
      },
      {
        title: "Marketplace" as string | null,
        items: [
          "Lowest marketplace fee (6%)",
          "Unlimited products",
          "Featured product eligibility",
        ],
      },
    ],
  },
];

const COMPARISON_ROWS: { label: string; community: string; growth: string; premium: string }[] = [
  { label: "Goal",            community: "Get found",        growth: "Get more customers",  premium: "Scale your business" },
  { label: "Marketing",       community: "Basic profile",    growth: "Better marketing",    premium: "Advanced AI" },
  { label: "Analytics",       community: "Basic analytics",  growth: "Customer insights",   premium: "Business intelligence" },
  { label: "Broadcasts",      community: "2/month",          growth: "8/month",             premium: "20/month" },
  { label: "Visibility",      community: "Standard",         growth: "Priority",            premium: "Maximum" },
  { label: "Fee (standard)",  community: "10%",              growth: "8%",                  premium: "6%" },
  { label: "Fee (founding)",  community: "9%",               growth: "7%",                  premium: "5%" },
  { label: "AI Tools",        community: "—",                growth: "Marketing AI",        premium: "Business consultant" },
  { label: "Health Score™",   community: "—",                growth: "—",                   premium: "✓ Premium" },
];

const HEALTH_PREVIEW = [
  { emoji: "⭐", label: "Profile completeness", pct: 100 },
  { emoji: "📈", label: "Customer engagement",  pct: 89 },
  { emoji: "❤️", label: "Review sentiment",     pct: 96 },
  { emoji: "⏱",  label: "Response time",        pct: 92 },
  { emoji: "📢", label: "Marketing activity",   pct: 74 },
  { emoji: "🛍", label: "Marketplace perf.",    pct: 88 },
];

const UPGRADE_REASONS = [
  { icon: "trending-up" as const, title: "Help the business make more money", desc: "Lower marketplace fees, better product visibility, and featured placement drive more sales." },
  { icon: "clock" as const,       title: "Save time",                         desc: "AI tools write captions, suggest promotions, and respond to reviews so you can focus on running your business." },
  { icon: "eye" as const,         title: "Increase visibility",               desc: "Priority placement in searches, featured on the homepage, and city spotlights put your business in front of more customers." },
];

export default function BusinessGuideScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedTier, setExpandedTier] = useState<number | null>(null);

  return (
    <ScrollView
        keyboardDismissMode="on-drag"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>BUSINESS RESOURCE GUIDE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Why Would I Upgrade?</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Every tier is built around one simple idea: help your business make more money, save time, or reach more customers.
          </Text>
        </View>
      </View>

      {/* Tier cards */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>The Three Tiers</Text>
        {TIERS.map((tier, idx) => {
          const isDark = tier.bg !== null;
          const isExpanded = expandedTier === idx;
          return (
            <View
              key={idx}
              style={[
                styles.tierCard,
                {
                  backgroundColor: isDark ? tier.bg! : colors.card,
                  borderColor: isDark ? "transparent" : colors.border,
                },
              ]}
            >
              {/* Tier header */}
              <View style={styles.tierHeader}>
                <Text style={styles.tierEmoji}>{tier.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierName, { color: isDark ? "#FFF" : colors.foreground }]}>
                    {tier.name}
                  </Text>
                  <Text style={[styles.tierPromise, { color: tier.color }]}>{tier.promise}</Text>
                </View>
                <View style={[styles.feePill, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : colors.secondary }]}>
                  <Text style={[styles.feePillTxt, { color: isDark ? "rgba(255,255,255,0.85)" : colors.mutedForeground }]}>
                    {tier.fee.standard} fee
                  </Text>
                </View>
              </View>

              <Text style={[styles.tierTagline, { color: isDark ? "rgba(255,255,255,0.65)" : colors.mutedForeground }]}>
                {tier.tagline}
              </Text>

              {/* Founding fee note */}
              <View style={[styles.foundingNote, { backgroundColor: isDark ? "rgba(202,146,43,0.12)" : "#CA922B0F", borderColor: isDark ? "#CA922B30" : "#CA922B25" }]}>
                <Feather name="lock" size={11} color="#CA922B" />
                <Text style={styles.foundingNoteTxt}>
                  Founding Business rate: <Text style={{ fontFamily: "Inter_700Bold" }}>{tier.fee.founding}</Text> — 1% off standard, locked for 3 years
                </Text>
              </View>

              {/* Features */}
              <TouchableOpacity
                style={styles.expandToggle}
                onPress={() => setExpandedTier(isExpanded ? null : idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.expandToggleTxt, { color: isDark ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>
                  {isExpanded ? "Hide features" : "See all features"}
                </Text>
                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={isDark ? "rgba(255,255,255,0.5)" : colors.mutedForeground} />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.sectionsWrap}>
                  {tier.sections.map((sec, si) => (
                    <View key={si} style={{ gap: 5 }}>
                      {sec.title && (
                        <Text style={[styles.secTitle, { color: tier.color }]}>{sec.title}</Text>
                      )}
                      {sec.items.map((item, ii) => (
                        <View key={ii} style={styles.featureRow}>
                          <Feather name="check" size={13} color={isDark ? "#CA922B" : colors.success} />
                          <Text style={[styles.featureTxt, { color: isDark ? "rgba(255,255,255,0.88)" : colors.foreground }]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Goal */}
              <View style={[styles.goalRow, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : colors.background, borderColor: isDark ? "rgba(255,255,255,0.08)" : colors.border }]}>
                <Feather name="target" size={13} color={isDark ? "#CA922B" : colors.primary} />
                <Text style={[styles.goalTxt, { color: isDark ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", color: isDark ? "rgba(255,255,255,0.9)" : colors.foreground }}>Goal: </Text>
                  {tier.goal}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Why upgrade? */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>The Upgrade Promise</Text>
        {UPGRADE_REASONS.map((r, i) => (
          <View key={i} style={[styles.reasonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.reasonIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name={r.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.reasonTitle, { color: colors.foreground }]}>{r.title}</Text>
              <Text style={[styles.reasonDesc, { color: colors.mutedForeground }]}>{r.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Comparison table */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Side-by-Side Comparison</Text>
        <View style={[styles.tableWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Column headers */}
          <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tableLabel, { color: colors.mutedForeground }]} />
            <Text style={[styles.tableColHead, { color: "#A87A40" }]}>🆓 Community</Text>
            <Text style={[styles.tableColHead, { color: "#CA922B" }]}>🚀 Growth</Text>
            <Text style={[styles.tableColHead, { color: "#CA922B" }]}>👑 Premium</Text>
          </View>
          {COMPARISON_ROWS.map((row, i) => (
            <View
              key={i}
              style={[
                styles.tableRow,
                { borderBottomColor: colors.border, backgroundColor: i % 2 === 0 ? "transparent" : colors.secondary + "50" },
              ]}
            >
              <Text style={[styles.tableLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              <Text style={[styles.tableCell, { color: row.community === "—" ? colors.muted : colors.foreground }]}>{row.community}</Text>
              <Text style={[styles.tableCell, { color: row.growth === "—" ? colors.muted : colors.foreground }]}>{row.growth}</Text>
              <Text style={[styles.tableCell, { color: row.premium.startsWith("✓") ? "#2D7A4F" : row.premium === "—" ? colors.muted : colors.foreground, fontFamily: row.premium.startsWith("✓") ? "Inter_700Bold" : "Inter_400Regular" }]}>{row.premium}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Business Health Score™ preview */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Business Health Score™</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
          Exclusive to Premium Business — the one feature that turns data into action.
        </Text>
        <View style={[styles.healthCard, { backgroundColor: "#1A0A00", borderColor: "#CA922B30" }]}>
          <View style={styles.healthBadge}>
            <Feather name="activity" size={12} color="#CA922B" />
            <Text style={styles.healthBadgeTxt}>PREMIUM EXCLUSIVE</Text>
          </View>
          <View style={styles.healthScoreRow}>
            <View>
              <Text style={styles.healthScoreNum}>91</Text>
              <Text style={styles.healthScoreDenom}>/100</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.healthScoreLabel}>Business Health Score™</Text>
              <Text style={styles.healthScoreDesc}>
                A composite score across six dimensions — updated monthly as your business grows.
              </Text>
            </View>
          </View>
          <View style={styles.healthComponents}>
            {HEALTH_PREVIEW.map((comp, i) => (
              <View key={i} style={styles.healthCompRow}>
                <Text style={styles.healthCompEmoji}>{comp.emoji}</Text>
                <Text style={styles.healthCompLabel}>{comp.label}</Text>
                <View style={styles.healthBarWrap}>
                  <View style={[styles.healthBarFill, { width: `${comp.pct}%` }]} />
                </View>
                <Text style={styles.healthCompPct}>{comp.pct}%</Text>
              </View>
            ))}
          </View>
          <View style={styles.healthAiRow}>
            <View style={styles.healthAiBadge}>
              <Feather name="cpu" size={11} color="#2D7A4F" />
              <Text style={styles.healthAiBadgeTxt}>KinfolkAI™ Recommendations</Text>
            </View>
            {[
              "Posting one more update this week could increase engagement.",
              "Responding to recent reviews may improve your visibility.",
            ].map((rec, i) => (
              <View key={i} style={styles.healthRecRow}>
                <Feather name="chevron-right" size={13} color="#CA922B" />
                <Text style={styles.healthRecTxt}>{rec}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={[styles.healthNote, { color: colors.mutedForeground }]}>
          The Business Health Score™ doesn't just give you data — it suggests specific actions that can help your business grow. That's the kind of insight that makes Premium worth it.
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/membership")}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaBtnTxt}>View Plans &amp; Pricing</Text>
          <Feather name="arrow-right" size={16} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ctaSecondary, { borderColor: colors.border }]}
          onPress={() => router.push("/list-business" as never)}
          activeOpacity={0.8}
        >
          <Text style={[styles.ctaSecondaryTxt, { color: colors.foreground }]}>List my business for free</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  header: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerText: { gap: 6 },
  eyebrow: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 32 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },

  section: { paddingHorizontal: 20, paddingBottom: 28, gap: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: -4 },

  reasonCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  reasonIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  reasonTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  reasonDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },

  tierCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 12 },
  tierHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  tierEmoji: { fontSize: 26 },
  tierName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  tierPromise: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  feePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  feePillTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tierTagline: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  foundingNote: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  foundingNoteTxt: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#CA922B", flex: 1 },
  expandToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  expandToggleTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sectionsWrap: { gap: 14 },
  secTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureTxt: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  goalRow: { flexDirection: "row", alignItems: "flex-start", gap: 7, padding: 10, borderRadius: 8, borderWidth: 1 },
  goalTxt: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },

  tableWrap: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  tableRow: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, alignItems: "center" },
  tableHeader: { paddingVertical: 10 },
  tableLabel: { fontSize: 11, fontFamily: "Inter_500Medium", flex: 1.1, lineHeight: 14 },
  tableColHead: { fontSize: 10, fontFamily: "Inter_700Bold", flex: 0.9, textAlign: "center" },
  tableCell: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 0.9, textAlign: "center", lineHeight: 15 },

  healthCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 14 },
  healthBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  healthBadgeTxt: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#CA922B", letterSpacing: 1 },
  healthScoreRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  healthScoreNum: { fontSize: 52, fontFamily: "Inter_700Bold", color: "#FFF", lineHeight: 56 },
  healthScoreDenom: { fontSize: 16, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", marginTop: -8 },
  healthScoreLabel: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFF" },
  healthScoreDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", lineHeight: 17 },
  healthComponents: { gap: 8 },
  healthCompRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  healthCompEmoji: { fontSize: 13, width: 18 },
  healthCompLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", width: 140 },
  healthBarWrap: { flex: 1, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 },
  healthBarFill: { height: 4, backgroundColor: "#CA922B", borderRadius: 2 },
  healthCompPct: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#CA922B", width: 34, textAlign: "right" },
  healthAiRow: { gap: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingTop: 12 },
  healthAiBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  healthAiBadgeTxt: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#2D7A4F", letterSpacing: 0.8 },
  healthRecRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  healthRecTxt: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", flex: 1, lineHeight: 17 },
  healthNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 50 },
  ctaBtnTxt: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFF" },
  ctaSecondary: { alignItems: "center", paddingVertical: 13, borderRadius: 50, borderWidth: 1, marginTop: 4 },
  ctaSecondaryTxt: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
