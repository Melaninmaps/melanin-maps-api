import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type Status = "shipped" | "in_progress" | "planned";

interface Feature {
  id: string;
  title: string;
  desc: string;
  category: string;
  status: Status;
  votes: number;
  voted?: boolean;
}

const FEATURES: Feature[] = [
  { id: "f1", title: "Business Safety Surveys", desc: "Community-powered safety ratings for every business listing", category: "Safety", status: "shipped", votes: 412 },
  { id: "f2", title: "Neighborhood Safety Ratings", desc: "City neighborhood scores aggregated from community surveys", category: "Safety", status: "shipped", votes: 387 },
  { id: "f3", title: "KinfolkAI™ Travel Itineraries", desc: "AI-powered personalized city itineraries with safety context for Black travelers", category: "AI", status: "shipped", votes: 524 },
  { id: "f4", title: "Business Discovery & Search", desc: "Full-text search with category, safety, and minority-owned filters", category: "Discovery", status: "shipped", votes: 601 },
  { id: "f5", title: "Interactive Map", desc: "Full map view with custom pins, clustering, and rich info windows", category: "Map", status: "shipped", votes: 489 },
  { id: "f6", title: "Direct Messaging", desc: "Message businesses and community members directly", category: "Community", status: "shipped", votes: 298 },
  { id: "f7", title: "Referral Program", desc: "Invite friends and earn rewards up to Ambassador tier", category: "Community", status: "shipped", votes: 267 },
  { id: "f8", title: "Business Owner Dashboard", desc: "Analytics, review management, and profile tools for owners", category: "Business", status: "shipped", votes: 334 },
  { id: "f9", title: "AI Chat Widget", desc: "Context-aware floating AI guide available throughout the app", category: "AI", status: "shipped", votes: 445 },
  { id: "f10", title: "Onboarding Preference Survey", desc: "Personalization engine driven by travel style, interests, and safety priority", category: "AI", status: "shipped", votes: 312 },
  { id: "f11", title: "Stripe Payment Integration", desc: "Full payment processing for membership upgrades and premium features", category: "Membership", status: "in_progress", votes: 678 },
  { id: "f12", title: "Native Mobile App (iOS & Android)", desc: "Full App Store and Google Play release with native performance", category: "Platform", status: "in_progress", votes: 891 },
  { id: "f13", title: "Real-time Community Alerts", desc: "Push notifications for safety alerts in your saved neighborhoods", category: "Safety", status: "in_progress", votes: 543 },
  { id: "f14", title: "Business Verification Program", desc: "Official verified status for minority-owned businesses with document review", category: "Business", status: "in_progress", votes: 412 },
  { id: "f15", title: "Events Discovery", desc: "Community events, cultural gatherings, and Black-led experiences per city", category: "Discovery", status: "in_progress", votes: 367 },
  { id: "f16", title: "Employer Reviews", desc: "Community-sourced reviews of employers rated for DEI, pay equity, and inclusion", category: "Community", status: "planned", votes: 589 },
  { id: "f17", title: "City Safety Leaderboards", desc: "Ranked city safety scores updated weekly from survey data", category: "Safety", status: "planned", votes: 423 },
  { id: "f18", title: "Group Travel Planning", desc: "Collaborative itinerary planning for groups with shared saves and voting", category: "AI", status: "planned", votes: 398 },
  { id: "f19", title: "Safety Incident Heatmap", desc: "Anonymous incident data visualized on the map with trend analysis", category: "Safety", status: "planned", votes: 501 },
  { id: "f20", title: "Business Loyalty Points", desc: "Earn and redeem points at participating minority-owned businesses", category: "Business", status: "planned", votes: 334 },
  { id: "f21", title: "Community Stories", desc: "Long-form travel stories and neighborhood guides from community members", category: "Community", status: "planned", votes: 287 },
  { id: "f22", title: "International Cities", desc: "Expand beyond US to Caribbean, Africa, UK, and Canada", category: "Platform", status: "planned", votes: 723 },
];

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: string }> = {
  shipped: { label: "Shipped", color: "#2D7A4F", bg: "#2D7A4F18", icon: "check-circle" },
  in_progress: { label: "In Progress", color: "#C9922B", bg: "#C9922B18", icon: "loader" },
  planned: { label: "Planned", color: "#6B7280", bg: "#6B728018", icon: "clock" },
};

const FILTER_TABS: { id: Status | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "shipped", label: "Shipped" },
  { id: "in_progress", label: "In Progress" },
  { id: "planned", label: "Planned" },
];

export default function RoadmapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeFilter, setActiveFilter] = useState<Status | "all">("all");
  const [features, setFeatures] = useState(FEATURES);

  const toggleVote = (id: string) => {
    setFeatures((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, voted: !f.voted, votes: f.voted ? f.votes - 1 : f.votes + 1 }
          : f
      )
    );
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const filtered = activeFilter === "all" ? features : features.filter((f) => f.status === activeFilter);

  const counts = {
    shipped: features.filter((f) => f.status === "shipped").length,
    in_progress: features.filter((f) => f.status === "in_progress").length,
    planned: features.filter((f) => f.status === "planned").length,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85}
          style={styles.back}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Product Roadmap</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>What We're Building</Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Vote on features you want most. Your input shapes the Mapping with Melanin roadmap.
          </Text>
          <View style={styles.statsRow}>
            {[
              { label: "Shipped", val: counts.shipped, color: "#2D7A4F" },
              { label: "In Progress", val: counts.in_progress, color: "#C9922B" },
              { label: "Planned", val: counts.planned, color: "#6B7280" },
            ].map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: s.color + "12", borderColor: s.color + "25" }]}>
                <Text style={[styles.statNum, { color: s.color }]}>{s.val}</Text>
                <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity activeOpacity={0.85}
              key={tab.id}
              style={[
                styles.filterTab,
                { backgroundColor: activeFilter === tab.id ? colors.primary : colors.secondary, borderColor: activeFilter === tab.id ? colors.primary : colors.border },
              ]}
              onPress={() => setActiveFilter(tab.id)}
            >
              <Text style={[styles.filterTabTxt, { color: activeFilter === tab.id ? colors.primaryForeground : colors.foreground }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {filtered.map((feature) => {
            const s = STATUS_CONFIG[feature.status];
            return (
              <View key={feature.id} style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.featureHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Feather name={s.icon as any} size={11} color={s.color} />
                    <Text style={[styles.statusTxt, { color: s.color }]}>{s.label}</Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.categoryTxt, { color: colors.mutedForeground }]}>{feature.category}</Text>
                  </View>
                </View>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{feature.desc}</Text>
                <View style={styles.featureFooter}>
                  <TouchableOpacity
                    style={[
                      styles.voteBtn,
                      { backgroundColor: feature.voted ? colors.primary : "transparent", borderColor: feature.voted ? colors.primary : colors.border },
                    ]}
                    onPress={() => toggleVote(feature.id)}
                    activeOpacity={0.8}
                  >
                    <Feather name="chevrons-up" size={14} color={feature.voted ? "#FFF" : colors.mutedForeground} />
                    <Text style={[styles.voteTxt, { color: feature.voted ? "#FFF" : colors.mutedForeground }]}>{feature.votes}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  scroll: { padding: 20, gap: 20 },
  heroSection: { gap: 10 },
  heroTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  heroSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 2 },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  filterScroll: { gap: 8, paddingVertical: 4 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterTabTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  list: { gap: 12 },
  featureCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  featureHeader: { flexDirection: "row", gap: 8 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryTxt: { fontSize: 11, fontFamily: "Inter_500Medium" },
  featureTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  featureDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  featureFooter: { flexDirection: "row", marginTop: 4 },
  voteBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  voteTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
