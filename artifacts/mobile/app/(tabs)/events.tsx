import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryPill } from "@/components/CategoryPill";
import { EventCard } from "@/components/EventCard";
import { EVENT_CATEGORIES } from "@/constants/data";
import { useEvents } from "@/hooks/useEvents";
import { useColors } from "@/hooks/useColors";

const TIME_FILTERS = ["Upcoming", "This Week", "This Month"];

export default function EventsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState("Upcoming");
  const [category, setCategory] = useState("All");

  const { events, isLoading, error, refetch } = useEvents({ category });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Events</Text>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.secondary }]}>
          <Feather name="sliders" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: "#FEF3C7" }]}>
          <Feather name="alert-circle" size={14} color="#92400E" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      <View style={[styles.timeFilterRow, { borderBottomColor: colors.border }]}>
        {TIME_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setTimeFilter(f)}
            style={[
              styles.timeFilterBtn,
              timeFilter === f && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.timeFilterText,
                { color: timeFilter === f ? colors.primary : colors.mutedForeground },
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.catRow, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.catContent}
      >
        {EVENT_CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat}
            label={cat}
            selected={category === cat}
            onPress={() => setCategory(cat)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={40} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No events found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Check back soon for upcoming events in your area.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => router.push({ pathname: "/event/[id]", params: { id: item.id } })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timeFilterRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  timeFilterBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  timeFilterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  catRow: {
    flexShrink: 0,
    paddingVertical: 10,
  },
  catContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
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
  errorBannerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#92400E",
    flex: 1,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
