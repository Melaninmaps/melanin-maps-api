import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useItineraries, type Itinerary } from "@/hooks/useItineraries";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function MyTripsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { itineraries, isLoading, deleteItinerary } = useItineraries();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleDelete = (item: Itinerary) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      deleteItinerary(item.id);
      return;
    }
    Alert.alert("Remove Trip?", `Delete "${item.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteItinerary(item.id) },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>My Saved Trips</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/travel" as any)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={15} color="#FFFFFF" />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 32 }]} showsVerticalScrollIndicator={false}>
        {!isLoading && itineraries.length === 0 && (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="bookmark" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No saved trips yet</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Use KinfolkAI™ to find Minority-owned spots, then tap "Save This Trip" to build your itinerary.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/travel" as any)}
              activeOpacity={0.85}
            >
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Open KinfolkAI™</Text>
            </TouchableOpacity>
          </View>
        )}

        {itineraries.map((itin) => (
          <View key={itin.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardRow}>
              <View style={[styles.icon, { backgroundColor: colors.primary + "18" }]}>
                <Feather name="map-pin" size={18} color={colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.name, { color: colors.foreground }]}>{itin.name}</Text>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>Saved {formatDate(itin.createdAt)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(itin)}
                hitSlop={8}
              >
                <Feather name="trash-2" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {itin.notes.length > 0 && (
              <Text style={[styles.notes, { color: colors.mutedForeground, borderTopColor: colors.border }]} numberOfLines={3}>
                {itin.notes}
              </Text>
            )}

            {itin.stops.length > 0 && (
              <View style={[styles.stops, { borderTopColor: colors.border }]}>
                {itin.stops.slice(0, 4).map((stop, i) => (
                  <View key={stop.businessId} style={styles.stopRow}>
                    <View style={[styles.stopBullet, { backgroundColor: colors.primary }]}>
                      <Text style={styles.stopNum}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stopName, { color: colors.foreground }]} numberOfLines={1}>{stop.businessName}</Text>
                  </View>
                ))}
                {itin.stops.length > 4 && (
                  <Text style={[styles.moreText, { color: colors.mutedForeground }]}>+{itin.stops.length - 4} more</Text>
                )}
              </View>
            )}

            {itin.stops.length === 0 && (
              <View style={[styles.noStops, { borderTopColor: colors.border }]}>
                <Feather name="info" size={12} color={colors.mutedForeground} />
                <Text style={[styles.noStopsText, { color: colors.mutedForeground }]}>No stops added yet</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, flex: 1 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  newBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFFFFF" },
  list: { padding: 16, gap: 14 },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 28,
    gap: 12,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  emptyBody: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  emptyBtn: { marginTop: 4, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24 },
  emptyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardText: { flex: 1 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  date: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  notes: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  stops: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  stopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stopBullet: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stopNum: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#FFFFFF" },
  stopName: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  moreText: { fontFamily: "Inter_400Regular", fontSize: 12, paddingLeft: 32, marginTop: 2 },
  noStops: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  noStopsText: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
