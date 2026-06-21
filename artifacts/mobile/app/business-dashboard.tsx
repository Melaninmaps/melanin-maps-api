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

const STATS = [
  { label: "Profile Views", value: "1,284", change: "+18%", icon: "eye" as const, color: "#442A19" },
  { label: "Saved", value: "47", change: "+5", icon: "bookmark" as const, color: "#CA922B" },
  { label: "Rating", value: "4.8★", change: "312 reviews", icon: "star" as const, color: "#2D7A4F" },
  { label: "Messages", value: "3", change: "unread", icon: "message-circle" as const, color: "#7B4F2E" },
];

const ACTIONS = [
  { id: "edit", icon: "edit-2" as const, label: "Edit Listing", color: "#442A19", route: "/list-business" },
  { id: "hours", icon: "clock" as const, label: "Manage Hours", color: "#CA922B", route: null },
  { id: "reviews", icon: "star" as const, label: "All Reviews", color: "#2D7A4F", route: null },
  { id: "messages", icon: "message-circle" as const, label: "Messages", color: "#7B4F2E", route: "/messages" },
  { id: "verify", icon: "shield" as const, label: "Get Verified", color: "#442A19", route: "/business-verify" },
  { id: "analytics", icon: "bar-chart-2" as const, label: "Analytics", color: "#3A1F0E", route: null },
];

const RECENT_REVIEWS = [
  { name: "Zara M.", rating: 5, text: "Incredible experience every time. The staff makes you feel like family!", time: "2 days ago" },
  { name: "Kwame A.", rating: 4, text: "Great food and atmosphere. Will definitely be coming back soon.", time: "5 days ago" },
  { name: "Imani T.", rating: 5, text: "Best BBQ in Atlanta hands down. Rooted in culture and community.", time: "1 week ago" },
];

export default function BusinessDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "insights">("overview");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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
          <Text style={styles.headerBiz}>Sweet Auburn BBQ</Text>
          <View style={styles.verifyBadge}>
            <Feather name="shield" size={11} color="#FFF" />
            <Text style={styles.verifyTxt}>Verified Business</Text>
          </View>
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
              {STATS.map((s) => (
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

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Reviews</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>

            {RECENT_REVIEWS.map((r, i) => (
              <View key={i} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.reviewTop}>
                  <View style={[styles.reviewAvatar, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.reviewInitial, { color: colors.primary }]}>{r.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewName, { color: colors.foreground }]}>{r.name}</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Feather
                          key={s}
                          name="star"
                          size={12}
                          color={s <= r.rating ? colors.primary : colors.border}
                        />
                      ))}
                      <Text style={[styles.reviewTime, { color: colors.mutedForeground }]}>{r.time}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.replyBtn, { backgroundColor: colors.secondary }]}>
                    <Feather name="corner-up-left" size={13} color={colors.primary} />
                    <Text style={[styles.replyTxt, { color: colors.primary }]}>Reply</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>{r.text}</Text>
              </View>
            ))}
          </>
        )}

        {activeTab === "reviews" && (
          <View style={styles.comingSoon}>
            <Feather name="star" size={40} color={colors.border} />
            <Text style={[styles.comingSoonTxt, { color: colors.mutedForeground }]}>Full review management coming soon</Text>
          </View>
        )}

        {activeTab === "insights" && (
          <View>
            <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.insightTitle, { color: colors.foreground }]}>Views This Week</Text>
              <View style={styles.barChart}>
                {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                  <View key={i} style={styles.barWrap}>
                    <View style={[styles.bar, { height: h, backgroundColor: colors.primary + (i === 5 ? "FF" : "55") }]} />
                    <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.insightTitle, { color: colors.foreground }]}>Top Search Terms</Text>
              {["BBQ Atlanta", "Minority-owned restaurant", "Sweet Auburn", "Soul food"].map((t, i) => (
                <View key={i} style={styles.termRow}>
                  <Text style={[styles.termRank, { color: colors.mutedForeground }]}>#{i + 1}</Text>
                  <Text style={[styles.termTxt, { color: colors.foreground }]}>{t}</Text>
                  <View style={[styles.termBar, { backgroundColor: colors.primary, width: `${[90, 75, 60, 40][i]}%` as any }]} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  tabs: {
    flexDirection: "row", borderBottomWidth: 1,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabTxt: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 20, gap: 0 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statCard: {
    width: "47%", borderRadius: 16, padding: 16, gap: 4,
    borderWidth: 1,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statChange: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  actionCard: {
    width: "30%", borderRadius: 14, padding: 14, alignItems: "center",
    gap: 8, borderWidth: 1,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  reviewCard: { borderRadius: 14, padding: 16, marginBottom: 12, gap: 10, borderWidth: 1 },
  reviewTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reviewInitial: { fontSize: 15, fontFamily: "Inter_700Bold" },
  reviewName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reviewStars: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  reviewTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: 4 },
  replyBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  replyTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },
  reviewText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  comingSoon: { alignItems: "center", gap: 12, paddingTop: 60 },
  comingSoonTxt: { fontSize: 15, fontFamily: "Inter_400Regular" },
  insightCard: { borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1 },
  insightTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 16 },
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 100 },
  barWrap: { flex: 1, alignItems: "center", gap: 6 },
  bar: { width: "100%", borderRadius: 4 },
  barLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  termRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  termRank: { fontSize: 12, fontFamily: "Inter_500Medium", width: 24 },
  termTxt: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  termBar: { height: 4, borderRadius: 2 },
});
