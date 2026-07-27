import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EventCard } from "@/components/EventCard";
import { EVENT_CATEGORIES } from "@/constants/data";
import { useEvents } from "@/hooks/useEvents";
import { useColors } from "@/hooks/useColors";
import type { Event } from "@/constants/types";

const ORANGE = "#E07020";
const ORANGE_SOFT = "#E0702014";
const ORANGE_BORDER = "#E0702030";

const CAT_EMOJIS: Record<string, string> = {
  Cultural: "🎨",
  Business: "💼",
  Beauty: "💅🏾",
  Finance: "💰",
  Music: "🎵",
  Food: "🍽️",
  Wellness: "🧘🏾",
};

function getEventDate(e: Event): Date {
  try { return new Date(e.date); } catch { return new Date(0); }
}

export default function EventsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [category, setCategory] = useState("All");

  const { events, isLoading, error, refetch } = useEvents({ category });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const { todayEvents, weekendEvents, comingSoonByMonth, thisWeekCounts, showFallback } =
    useMemo(() => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 86_400_000);
      const nextWeek = new Date(today.getTime() + 7 * 86_400_000);

      const dayOfWeek = today.getDay();
      const daysToFri = dayOfWeek <= 5 ? 5 - dayOfWeek : 6;
      const weekendStart = daysToFri === 0 ? today : new Date(today.getTime() + daysToFri * 86_400_000);
      const weekendEnd = new Date(today.getTime() + 9 * 86_400_000);

      const todayEvents = events.filter((e) => {
        const d = getEventDate(e);
        return d >= today && d < tomorrow;
      });
      const weekendEvents = events.filter((e) => {
        const d = getEventDate(e);
        return d >= (daysToFri === 0 ? today : tomorrow) && d < weekendEnd;
      });
      const comingSoon = events.filter((e) => {
        const d = getEventDate(e);
        return d >= weekendEnd;
      });

      const months: Record<string, Event[]> = {};
      comingSoon.forEach((e) => {
        try {
          const d = getEventDate(e);
          const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          if (!months[key]) months[key] = [];
          months[key].push(e);
        } catch {}
      });

      const thisWeek = events.filter((e) => {
        const d = getEventDate(e);
        return d >= today && d < nextWeek;
      });
      const thisWeekCounts = EVENT_CATEGORIES.filter((c) => c !== "All")
        .map((cat) => ({ cat, count: thisWeek.filter((e) => e.category === cat).length }))
        .filter((x) => x.count > 0);

      const showFallback =
        todayEvents.length === 0 &&
        weekendEvents.length === 0 &&
        comingSoon.length === 0 &&
        events.length > 0;

      return { todayEvents, weekendEvents, comingSoonByMonth: months, thisWeekCounts, showFallback };
    }, [events]);

  const navigate = (id: string) =>
    router.push({ pathname: "/event/[id]", params: { id } });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={["#7A2E00", "#1C0A04"]}
        style={[styles.header, { paddingTop: topPad + 14 }]}
      >
        <Text style={styles.eyebrow}>📅 EXPERIENCES</Text>
        <Text style={styles.heroTitle}>Find Your Next{"\n"}Experience</Text>
        <Text style={styles.heroSub}>Attend · RSVP · Invite Friends</Text>

        <ScrollView
        keyboardDismissMode="on-drag"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {EVENT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              activeOpacity={0.8}
              style={[
                styles.catPill,
                {
                  backgroundColor: category === cat ? ORANGE : "rgba(255,255,255,0.12)",
                  borderColor: category === cat ? ORANGE : "rgba(255,255,255,0.2)",
                },
              ]}
            >
              <Text style={styles.catPillText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: "#FEF3C7" }]}>
          <Feather name="alert-circle" size={14} color="#92400E" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView
        keyboardDismissMode="on-drag"
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100, flexGrow: 1 }]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={ORANGE} />
        }
      >
        {/* This Week in Your Community */}
        {thisWeekCounts.length > 0 && (
          <View style={[styles.weekSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.weekSummaryTitle, { color: colors.mutedForeground }]}>
              THIS WEEK IN YOUR COMMUNITY
            </Text>
            <View style={styles.weekGrid}>
              {thisWeekCounts.map(({ cat, count }) => (
                <View
                  key={cat}
                  style={[styles.weekItem, { backgroundColor: ORANGE_SOFT, borderColor: ORANGE_BORDER }]}
                >
                  <Text style={styles.weekItemEmoji}>{CAT_EMOJIS[cat] ?? "📍"}</Text>
                  <Text style={[styles.weekItemCount, { color: ORANGE }]}>{count}</Text>
                  <Text style={[styles.weekItemLabel, { color: colors.mutedForeground }]}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Fallback: static events with no date info */}
        {showFallback && (
          <View style={styles.timeSection}>
            <View style={[styles.sectionLabelRow, { borderLeftColor: ORANGE }]}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Upcoming Events</Text>
            </View>
            {events.map((event) => (
              <EventCard key={event.id} event={event} onPress={() => navigate(event.id)} />
            ))}
          </View>
        )}

        {/* Happening Today */}
        {todayEvents.length > 0 && (
          <View style={styles.timeSection}>
            <View style={[styles.sectionLabelRow, { borderLeftColor: "#DC2626" }]}>
              <Text style={styles.fireMoji}>🔥</Text>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Happening Today</Text>
              <View style={[styles.liveBadge, { backgroundColor: "#DC262618" }]}>
                <Text style={[styles.liveBadgeText, { color: "#DC2626" }]}>TODAY</Text>
              </View>
            </View>
            {todayEvents.map((event) => (
              <EventCard key={event.id} event={event} onPress={() => navigate(event.id)} />
            ))}
          </View>
        )}

        {todayEvents.length > 0 && weekendEvents.length > 0 && (
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        )}

        {/* This Weekend */}
        {weekendEvents.length > 0 && (
          <View style={styles.timeSection}>
            <View style={[styles.sectionLabelRow, { borderLeftColor: ORANGE }]}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>This Weekend</Text>
            </View>
            {weekendEvents.slice(0, 5).map((event) => (
              <EventCard key={event.id} event={event} onPress={() => navigate(event.id)} />
            ))}
            {weekendEvents.length > 5 && (
              <TouchableOpacity
                style={[styles.seeMoreBtn, { borderColor: ORANGE_BORDER, backgroundColor: ORANGE_SOFT }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.seeMoreText, { color: ORANGE }]}>
                  See {weekendEvents.length - 5} more this weekend →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {(todayEvents.length > 0 || weekendEvents.length > 0) &&
          Object.keys(comingSoonByMonth).length > 0 && (
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          )}

        {/* Coming Soon by Month */}
        {Object.entries(comingSoonByMonth).map(([month, monthEvents]) => (
          <View key={month} style={styles.timeSection}>
            <View style={[styles.sectionLabelRow, { borderLeftColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{month}</Text>
              <Text style={[styles.eventCount, { color: colors.mutedForeground }]}>
                {monthEvents.length} event{monthEvents.length !== 1 ? "s" : ""}
              </Text>
            </View>
            {monthEvents.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} onPress={() => navigate(event.id)} />
            ))}
            {monthEvents.length > 3 && (
              <TouchableOpacity
                style={[styles.seeMoreBtn, { borderColor: ORANGE_BORDER, backgroundColor: ORANGE_SOFT }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.seeMoreText, { color: ORANGE }]}>
                  See {monthEvents.length - 3} more in {month.split(" ")[0]} →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Empty */}
        {events.length === 0 && !isLoading && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No events found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Check back soon for upcoming events in your area.
            </Text>
          </View>
        )}

        {/* Host an Event CTA */}
        <TouchableOpacity
          style={[styles.hostBanner, { backgroundColor: ORANGE }]}
          onPress={() => router.push("/submit-event" as never)}
          activeOpacity={0.88}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.hostTitle}>Hosting an Event?</Text>
            <Text style={styles.hostSub}>
              Reach thousands of locals and travelers — listing is free.
            </Text>
          </View>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    color: "#FFFFFF",
    lineHeight: 34,
    marginBottom: 4,
  },
  heroSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 14,
  },
  catScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catPillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#FFFFFF",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#92400E",
    flex: 1,
  },
  scroll: {
    paddingTop: 20,
    flexGrow: 1,
  },
  weekSummary: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  weekSummaryTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  weekGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weekItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 80,
  },
  weekItemEmoji: { fontSize: 18, marginBottom: 2 },
  weekItemCount: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    lineHeight: 20,
  },
  weekItemLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textAlign: "center",
    marginTop: 1,
  },
  timeSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 14,
    marginLeft: -10,
  },
  fireMoji: { fontSize: 16 },
  sectionLabel: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    flex: 1,
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
  eventCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  seeMoreBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  seeMoreText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  hostBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  hostTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  hostSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
});
