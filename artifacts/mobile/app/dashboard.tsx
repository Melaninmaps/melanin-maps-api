import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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
import { useFavorites } from "@/hooks/useFavorites";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useEvents } from "@/hooks/useEvents";
import { usePoints } from "@/hooks/usePoints";

const RECENT_ACTIVITY = [
  { id: "a1", icon: "star" as const, color: "#C9922B", text: "Leave a review to earn points", time: "" },
  { id: "a2", icon: "shield" as const, color: "#2D7A4F", text: "Submit a safety report for your neighborhood", time: "" },
  { id: "a3", icon: "calendar" as const, color: "#CA922B", text: "RSVP to an upcoming event", time: "" },
  { id: "a4", icon: "message-circle" as const, color: "#7B4F2E", text: "Share something in the community feed", time: "" },
];

const REFERRAL_GOAL = 500;

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { savedIds } = useFavorites();
  const { businesses } = useBusinesses();
  const { events, isLoading: eventsLoading } = useEvents();
  const { total: pointsTotal, ledger } = usePoints();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const firstName = user?.firstName ?? "Explorer";

  const savedBusinesses = businesses.filter((b) => savedIds.includes(b.id)).slice(0, 5);
  const upcomingEvents = events.slice(0, 3);
  const reviewCount = ledger.filter((e) => e.action === "review").length;
  const rsvpCount = ledger.filter((e) => e.action === "rsvp").length;

  const pct = Math.min(pointsTotal / REFERRAL_GOAL, 1);

  const STATS = [
    { label: "Reviews", value: String(reviewCount), icon: "star" as const },
    { label: "Saved", value: String(savedIds.length), icon: "bookmark" as const },
    { label: "Events", value: String(rsvpCount), icon: "calendar" as const },
    { label: "Points", value: String(pointsTotal), icon: "award" as const },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back 👋🏾</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{firstName}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.85}
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
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={s.icon} size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

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
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/(tabs)")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {savedBusinesses.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="bookmark" size={22} color={colors.muted} />
              <Text style={[styles.emptyCardText, { color: colors.mutedForeground }]}>
                No saved businesses yet — tap ♥ on any listing
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20 }}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {savedBusinesses.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.bizCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/business/${b.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.bizIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name="shopping-bag" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.bizName, { color: colors.foreground }]} numberOfLines={2}>{b.name}</Text>
                  <Text style={[styles.bizCat, { color: colors.mutedForeground }]}>{b.category}</Text>
                  <View style={styles.bizMeta}>
                    <Feather name="star" size={12} color="#C9922B" />
                    <Text style={[styles.bizRating, { color: colors.foreground }]}>{b.rating}</Text>
                    <Text style={[styles.bizCity, { color: colors.mutedForeground }]}>· {b.city}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Upcoming events */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Events</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/(tabs)/events")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {eventsLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : upcomingEvents.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="calendar" size={20} color={colors.mutedForeground} />
              <Text style={[styles.emptyCardText, { color: colors.mutedForeground }]}>No upcoming events right now</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {upcomingEvents.map((ev) => (
                <TouchableOpacity
                  key={ev.id}
                  style={[styles.eventRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/event/[id]", params: { id: ev.id } })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.eventEmoji, { backgroundColor: colors.secondary }]}>
                    <Feather name="calendar" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {ev.title}
                    </Text>
                    <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>
                      {ev.dateShort} · {ev.city}, {ev.state}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Points / referral progress */}
        <TouchableOpacity
          style={[styles.referralCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/referral")}
          activeOpacity={0.85}
        >
          <View style={styles.referralTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.referralTitle, { color: colors.foreground }]}>🎁 Points Progress</Text>
              <Text style={[styles.referralSub, { color: colors.mutedForeground }]}>
                {pointsTotal} / {REFERRAL_GOAL} pts to next reward
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
            Review businesses & attend events to earn points →
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
            <Text style={styles.travelTitle}>KinfolkAI™</Text>
            <Text style={styles.travelSub}>AI-powered itineraries for melanated travelers</Text>
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
              { emoji: "🏢", title: "Share Business Insight", sub: "Anonymous safety or employee survey for any business", route: "/business-insight" },
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

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Get Started</Text>
          <View style={[styles.activityList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {RECENT_ACTIVITY.map((a, i) => (
              <View key={a.id}>
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: a.color + "22" }]}>
                    <Feather name={a.icon} size={16} color={a.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityText, { color: colors.foreground }]}>{a.text}</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
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
  notifDot: { width: 8, height: 8, borderRadius: 4, position: "absolute", top: 9, right: 9 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, alignItems: "center", paddingVertical: 14,
    borderRadius: 14, gap: 4, borderWidth: 1,
  },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  memberCard: {
    backgroundColor: "#CA922B", borderRadius: 20, padding: 20,
    flexDirection: "row", alignItems: "center", gap: 16,
  },
  memberBadge: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.65)", letterSpacing: 0.8 },
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
  emptyCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 16, borderRadius: 14, borderWidth: 1, borderStyle: "dashed",
  },
  emptyCardText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
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
  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  activityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activityText: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  divider: { height: 1, marginLeft: 62 },
});
