import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

interface CommunityPlace {
  id: string;
  name: string;
  venueName?: string | null;
  category: string;
  city?: string | null;
  state?: string | null;
  country: string;
  postCount: number;
  communityRating?: string | null;
  isVerified: boolean;
}

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "hotel", label: "Hotels" },
  { value: "restaurant", label: "Restaurants" },
  { value: "cafe", label: "Cafes" },
  { value: "venue", label: "Venues" },
  { value: "attraction", label: "Attractions" },
];

function PlaceCard({ place, colors }: { place: CommunityPlace; colors: ReturnType<typeof useColors> }) {
  const locationParts = [place.city, place.state, place.country !== "United States" ? place.country : undefined].filter(Boolean);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.cardIcon, { backgroundColor: colors.primary + "18" }]}>
        <Feather name="map-pin" size={20} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {place.venueName ?? place.name}
          </Text>
          {place.isVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: "#2D7A4F18" }]}>
              <Feather name="check-circle" size={11} color="#2D7A4F" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardLocation, { color: colors.mutedForeground }]} numberOfLines={1}>
          {locationParts.join(", ")}
        </Text>
        <View style={styles.cardStats}>
          <Feather name="users" size={12} color={colors.mutedForeground} />
          <Text style={[styles.cardStatText, { color: colors.mutedForeground }]}>
            {place.postCount} community {place.postCount === 1 ? "post" : "posts"}
          </Text>
          {place.communityRating && Number(place.communityRating) > 0 && (
            <>
              <Text style={[styles.cardStatDot, { color: colors.mutedForeground }]}> · </Text>
              <Feather name="star" size={12} color="#CA922B" />
              <Text style={[styles.cardStatText, { color: colors.mutedForeground }]}>
                {" "}{Number(place.communityRating).toFixed(1)}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

export default function SafeSpacesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [places, setPlaces] = useState<CommunityPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "40" });
      if (search.trim()) params.set("city", search.trim());
      if (category) params.set("category", category);
      const res = await fetch(`${getApiBase()}/api/places?${params}`);
      if (res.ok) {
        const data = await res.json() as { places: CommunityPlace[]; total: number };
        setPlaces(data.places ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, category]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Safe Spaces</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Community-sourced venues worldwide
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchText, { color: colors.foreground }]}
            placeholder="Search by city or country…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={(t) => setSearch(t)}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category chips */}
      <View style={styles.chipsRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[
              styles.chip,
              {
                backgroundColor: category === c.value ? colors.primary : colors.card,
                borderColor: category === c.value ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setCategory(c.value)}
          >
            <Text style={[styles.chipText, { color: category === c.value ? "#fff" : colors.foreground }]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : places.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="globe" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No places yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            When community members tag locations in their posts, they appear here as verified safe spaces.
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          onRefresh={() => { setRefreshing(true); load(); }}
          refreshing={refreshing}
          ListHeaderComponent={
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
              {total} {total === 1 ? "place" : "places"} shared by the community
            </Text>
          }
          renderItem={({ item }) => <PlaceCard place={item} colors={colors} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  headerText: { flex: 1 },
  headerTitle: { fontFamily: "Cormorant_700Bold", fontSize: 22 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13 },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  searchInput: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, padding: 0 },
  chipsRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexWrap: "nowrap" },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  totalLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  cardName: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  verifiedText: { fontFamily: "Inter_500Medium", fontSize: 10, color: "#2D7A4F" },
  cardLocation: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 4 },
  cardStats: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardStatText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  cardStatDot: { fontFamily: "Inter_400Regular", fontSize: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle: { fontFamily: "Cormorant_700Bold", fontSize: 20, marginBottom: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
