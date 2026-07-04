import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

const TYPE_LABELS: Record<string, string> = {
  restaurant: "🍽️ Restaurant",
  cafe: "☕ Café",
  hotel: "🏨 Hotel",
  salon: "💇🏾 Salon",
  market: "🛒 Market",
  attraction: "🎭 Attraction",
  guide: "🧭 Guide",
  healthcare: "🏥 Healthcare",
  transportation: "🚌 Transport",
  other: "📍 Other",
};

const BADGE_LABELS: Record<string, string> = {
  local_insider: "Local Insider",
  community_ambassador: "Community Ambassador",
  global_guide: "Global Guide",
};

const BADGE_COLORS: Record<string, string> = {
  local_insider: "#CA922B",
  community_ambassador: "#7B5EA7",
  global_guide: "#1E7A4E",
};

type Rec = {
  id: string;
  country: string;
  city: string | null;
  businessName: string;
  website: string | null;
  type: string;
  reason: string | null;
  personalConnection: string | null;
  badge: string | null;
  createdAt: string;
  contributorFirstName: string | null;
  contributorHomeCity: string | null;
};

export default function GlobalRecommendationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const muted = colors.mutedForeground;
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const fetchRecs = useCallback(async () => {
    try {
      const url = `${getApiBase()}/api/global-recommendations?limit=100`;
      const res = await fetch(url);
      const data = (await res.json()) as { recommendations: Rec[] };
      setRecs(data.recommendations ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchRecs(); }, [fetchRecs]);

  const onRefresh = () => { setRefreshing(true); void fetchRecs(); };

  const countries = Array.from(new Set(recs.map(r => r.country))).sort();

  const filtered = recs.filter(r => {
    if (selectedCountry && r.country !== selectedCountry) return false;
    if (selectedType && r.type !== selectedType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.businessName.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        (r.city ?? "").toLowerCase().includes(q) ||
        (r.reason ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const renderRec = ({ item }: { item: Rec }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={2}>
            {item.businessName}
          </Text>
          <Text style={[styles.location, { color: muted }]}>
            <Feather name="map-pin" size={11} color={muted} />{"  "}
            {item.city ? `${item.city}, ` : ""}{item.country}
          </Text>
        </View>
        <View style={[styles.typePill, { backgroundColor: colors.background, borderColor: "#CA922B40" }]}>
          <Text style={styles.typeText}>
            {TYPE_LABELS[item.type] ?? item.type}
          </Text>
        </View>
      </View>

      {!!item.reason && (
        <Text style={[styles.reason, { color: muted }]} numberOfLines={3}>
          "{item.reason}"
        </Text>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          {item.badge && (
            <View style={[styles.badgePill, { borderColor: (BADGE_COLORS[item.badge] ?? "#CA922B") + "40", backgroundColor: (BADGE_COLORS[item.badge] ?? "#CA922B") + "15" }]}>
              <Ionicons name="ribbon-outline" size={11} color={BADGE_COLORS[item.badge] ?? "#CA922B"} />
              <Text style={[styles.badgeText, { color: BADGE_COLORS[item.badge] ?? "#CA922B" }]}>
                {BADGE_LABELS[item.badge] ?? item.badge}
              </Text>
            </View>
          )}
          {!!item.contributorFirstName && (
            <Text style={[styles.contributor, { color: muted }]}>
              by {item.contributorFirstName}{item.contributorHomeCity ? ` · ${item.contributorHomeCity}` : ""}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: "#1A2E22" }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerLabel}>🌍 Global Recommendations</Text>
            <Text style={styles.headerSub}>Places trusted by the community</Text>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
          <Feather name="search" size={15} color="rgba(255,255,255,0.5)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, city, country…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Country filter */}
      {countries.length > 0 && (
        <View style={[styles.filterSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              onPress={() => setSelectedCountry(null)}
              style={[styles.filterChip, selectedCountry === null && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, selectedCountry === null && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {countries.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedCountry(c === selectedCountry ? null : c)}
                style={[styles.filterChip, selectedCountry === c && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, selectedCountry === c && styles.filterChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Type filter */}
      <View style={[styles.filterSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            onPress={() => setSelectedType(null)}
            style={[styles.filterChip, styles.typeChip, selectedType === null && styles.typeChipActive]}
          >
            <Text style={[styles.filterChipText, selectedType === null && styles.typeChipTextActive]}>All types</Text>
          </TouchableOpacity>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <TouchableOpacity
              key={k}
              onPress={() => setSelectedType(k === selectedType ? null : k)}
              style={[styles.filterChip, styles.typeChip, selectedType === k && styles.typeChipActive]}
            >
              <Text style={[styles.filterChipText, selectedType === k && styles.typeChipTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Count */}
      {!loading && (
        <View style={styles.countRow}>
          <Text style={[styles.countText, { color: muted }]}>
            {filtered.length} recommendation{filtered.length !== 1 ? "s" : ""}
            {selectedCountry ? ` in ${selectedCountry}` : ""}
          </Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#CA922B" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🌍</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No recommendations yet</Text>
          <Text style={[styles.emptySub, { color: muted }]}>
            {search || selectedCountry || selectedType
              ? "Try adjusting your filters"
              : "Our community is just getting started"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderRec}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CA922B" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1 },
  headerLabel: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 11 : 8,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, padding: 0 },
  filterSection: { borderBottomWidth: StyleSheet.hairlineWidth },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: "#3A1F0E22", backgroundColor: "transparent",
  },
  filterChipActive: { backgroundColor: "#2D7A4F", borderColor: "#2D7A4F" },
  typeChip: { borderColor: "#CA922B22" },
  typeChipActive: { backgroundColor: "#CA922B", borderColor: "#CA922B" },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#3A1F0E99" },
  filterChipTextActive: { color: "#fff" },
  typeChipTextActive: { color: "#fff" },
  countRow: { paddingHorizontal: 16, paddingVertical: 10 },
  countText: { fontSize: 12, fontWeight: "500" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardTitle: { flex: 1 },
  businessName: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  location: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  typePill: {
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, alignSelf: "flex-start",
  },
  typeText: { fontSize: 11, fontWeight: "600", color: "#CA922B" },
  reason: { fontSize: 13, lineHeight: 19, fontStyle: "italic" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" as const },
  badgePill: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" as const },
  contributor: { fontSize: 11 },
});
