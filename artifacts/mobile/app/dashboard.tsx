import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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
import { useAuth } from "@/lib/auth";

const SAVED_BUSINESSES = [
  { id: "1", name: "Sweet Auburn BBQ", category: "Restaurant", rating: 4.8, city: "Atlanta" },
  { id: "2", name: "Trap Kitchen", category: "Food Truck", rating: 4.6, city: "LA" },
  { id: "3", name: "Busboys & Poets", category: "Café", rating: 4.7, city: "DC" },
];

const UPCOMING_EVENTS = [
  { id: "e1", emoji: "🏪", title: "Black Business Expo", date: "Jun 22", location: "Atlanta, GA" },
  { id: "e2", emoji: "✊🏿", title: "Juneteenth Celebration", date: "Jun 19", location: "Houston, TX" },
];

const RECENT_ACTIVITY = [
  { id: "a1", icon: "star" as const, color: "#C9922B", text: "You reviewed Sweet Auburn BBQ", time: "2h ago" },
  { id: "a2", icon: "shield" as const, color: "#2D7A4F", text: "Safety report submitted in Atlanta, GA", time: "1d ago" },
  { id: "a3", icon: "bookmark" as const, color: "#3B1F0E", text: "Saved Trap Kitchen to favorites", time: "2d ago" },
  { id: "a4", icon: "message-circle" as const, color: "#7B4F2E", text: "Your community post got 12 upvotes", time: "3d ago" },
];

const STATS = [
  { label: "Reviews", value: "3", icon: "star" as const },
  { label: "Saved", value: "12", icon: "bookmark" as const },
  { label: "Events", value: "5", icon: "calendar" as const },
  { label: "Referrals", value: "2", icon: "users" as const },
];

const REFERRAL_PTS = 240;
const REFERRAL_GOAL = 500;

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const firstName = (user as any)?.firstName ?? "Explorer";
  const pct = REFERRAL_PTS / REFERRAL_GOAL;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back 👋</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{firstName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.push("/notification-center" as any)}
        >
          <Feather name="bell" size={20} color={colors.foreground} />
          <View style={[styles.notifDot, { backgroundColor: colors.primary }]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={s.icon} size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Membership upgrade banner */}
        <TouchableOpacity
          style={styles.memberCard}
          onPress={() => router.push("/membership")}
          activeOpacity={0.88}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.memberBadge}>EXPLORE · FREE</Text>
            <Text style={styles.memberTitle}>Upgrade to Navigator</Text>
            <Text style={styles.memberSub}>Unlimited favorites, safety insights & more</Text>
          </View>
          <View style={styles.memberArrow}>
            <Feather name="arrow-right" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Saved businesses */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Businesses</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          >
            {SAVED_BUSINESSES.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.bizCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/business/${b.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.bizIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="shopping-bag" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.bizName, { color: colors.foreground }]}>{b.name}</Text>
                <Text style={[styles.bizCat, { color: colors.mutedForeground }]}>{b.category}</Text>
                <View style={styles.bizMeta}>
                  <Feather name="star" size={12} color="#C9922B" />
                  <Text style={[styles.bizRating, { color: colors.foreground }]}>{b.rating}</Text>
                  <Text style={[styles.bizCity, { color: colors.mutedForeground }]}>· {b.city}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming events */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/events")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: 10 }}>
            {UPCOMING_EVENTS.map((ev) => (
              <TouchableOpacity
                key={ev.id}
                style={[styles.eventRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <View style={[styles.eventEmoji, { backgroundColor: colors.secondary }]}>
                  <Text style={{ fontSize: 22 }}>{ev.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventTitle, { color: colors.foreground }]}>{ev.title}</Text>
                  <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>
                    {ev.date} · {ev.location}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Referral progress */}
        <TouchableOpacity
          style={[styles.referralCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/referral")}
          activeOpacity={0.85}
        >
          <View style={styles.referralTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.referralTitle, { color: colors.foreground }]}>🎁 Referral Progress</Text>
              <Text style={[styles.referralSub, { color: colors.mutedForeground }]}>
                {REFERRAL_PTS} / {REFERRAL_GOAL} pts to next reward
              </Text>
            </View>
            <Text style={[styles.referralPct, { color: colors.primary }]}>
              {Math.round(pct * 100)}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${pct * 100}%` as any }]} />
          </View>
          <Text style={[styles.referralCta, { color: colors.primary }]}>
            Invite friends → earn $10 credit
          </Text>
        </TouchableOpacity>

        {/* AI Travel */}
        <TouchableOpacity
          style={styles.travelCard}
          onPress={() => router.push("/travel")}
          activeOpacity={0.88}
        >
          <Text style={styles.travelEmoji}>✈️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.travelTitle}>Plan Your Next Trip</Text>
            <Text style={styles.travelSub}>AI-powered itineraries for Black travelers</Text>
          </View>
          <Feather name="arrow-right" size={20} color="#C9922B" />
        </TouchableOpacity>

        {/* Community surveys */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community Surveys</Text>
          <View style={{ gap: 10, marginTop: 4 }}>
            {[
              { emoji: "🏘️", title: "Rate Your Neighborhood", sub: "Safety, diversity & community feel", route: "/neighborhood-survey" },
              { emoji: "💼", title: "Rate Your Employer", sub: "Inclusion, culture & pay equity", route: "/employer-survey" },
            ].map((s) => (
              <TouchableOpacity
                key={s.route}
                style={[styles.surveyRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(s.route as any)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.surveyTitle, { color: colors.foreground }]}>{s.title}</Text>
                  <Text style={[styles.surveySub, { color: colors.mutedForeground }]}>{s.sub}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
          <View style={[styles.activityList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {RECENT_ACTIVITY.map((a, i) => (
              <View key={a.id}>
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: a.color + "22" }]}>
                    <Feather name={a.icon} size={16} color={a.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityText, { color: colors.foreground }]}>{a.text}</Text>
                    <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{a.time}</Text>
                  </View>
                </View>
                {i < RECENT_ACTIVITY.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  notifDot: {
    width: 8, height: 8, borderRadius: 4,
    position: "absolute", top: 9, right: 9,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, alignItems: "center", paddingVertical: 14,
    borderRadius: 14, gap: 4, borderWidth: 1,
  },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  memberCard: {
    backgroundColor: "#3B1F0E", borderRadius: 20, padding: 20,
    flexDirection: "row", alignItems: "center", gap: 16,
  },
  memberBadge: {
    fontSize: 11, fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.65)", letterSpacing: 0.8,
  },
  memberTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#FFF" },
  memberSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
  memberArrow: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  section: { gap: 12 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  bizCard: { width: 160, borderRadius: 16, padding: 14, gap: 8, borderWidth: 1 },
  bizIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bizName: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  bizCat: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bizMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  bizRating: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  bizCity: { fontSize: 12, fontFamily: "Inter_400Regular" },
  eventRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  eventEmoji: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  eventTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  eventMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  referralCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  referralTop: { flexDirection: "row", alignItems: "flex-start" },
  referralTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  referralSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  referralPct: { fontSize: 18, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 8, borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },
  referralCta: { fontSize: 13, fontFamily: "Inter_500Medium" },
  travelCard: {
    backgroundColor: "#1A0A00", borderRadius: 18, padding: 20,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  travelEmoji: { fontSize: 32 },
  travelTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  travelSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(251,247,240,0.7)", marginTop: 3 },
  surveyRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  surveyTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  surveySub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  activityList: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  activityRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  activityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activityText: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  activityTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  divider: { height: 1, marginLeft: 62 },
});
