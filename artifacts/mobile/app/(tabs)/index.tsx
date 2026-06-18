import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import { AlertBanner } from "@/components/AlertBanner";
import { BusinessCard } from "@/components/BusinessCard";
import { CategoryPill } from "@/components/CategoryPill";
import { ScoreFilterPanel } from "@/components/ScoreFilterPanel";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { ALERTS, BUSINESSES, CATEGORIES } from "@/constants/data";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";

interface FilterState {
  minScore: number;
  verifiedOnly: boolean;
  blackOwnedOnly: boolean;
}

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, toggleSave } = useFavorites();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState(ALERTS);
  const [filters, setFilters] = useState<FilterState>({
    minScore: 0,
    verifiedOnly: false,
    blackOwnedOnly: false,
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const filtered = BUSINESSES.filter((b) => {
    const matchesSearch =
      search.length === 0 ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || b.category === activeCategory;
    const matchesScore = b.confidenceScore >= filters.minScore;
    const matchesVerified = !filters.verifiedOnly || b.verified;
    const matchesBlackOwned = !filters.blackOwnedOnly || b.blackOwned;
    return matchesSearch && matchesCat && matchesScore && matchesVerified && matchesBlackOwned;
  });

  const featured = filtered.filter((b) => b.featured);
  const nearby = filtered.filter((b) => !b.featured);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const activeFilterCount =
    (filters.minScore > 0 ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.blackOwnedOnly ? 1 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#C4622D", "#D4873A"]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerBrand}>
            <Image
              source={require("@/assets/images/logo-transparent.png")}
              style={styles.logoImg}
              contentFit="contain"
            />
            <Text style={styles.greeting}>Good morning 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8} onPress={() => router.push("/messages")}>
            <Feather name="bell" size={20} color="#FFFFFF" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              selected={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Safety alerts */}
        <View style={styles.section}>
          <View style={styles.safetyHeader}>
            <View style={styles.safetyTitleRow}>
              <Feather name="shield" size={16} color="#DC2626" />
              <Text style={[styles.safetyTitle, { color: colors.foreground }]}>Community Safety</Text>
              {alerts.length > 0 && (
                <View style={[styles.alertCount, { backgroundColor: "#DC262618" }]}>
                  <Text style={styles.alertCountText}>{alerts.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.reportBtn, { backgroundColor: "#DC262612", borderColor: "#DC262630" }]}
              onPress={() => router.push("/report-safety")}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={13} color="#DC2626" />
              <Text style={[styles.reportBtnText, { color: "#DC2626" }]}>Report</Text>
            </TouchableOpacity>
          </View>
          {alerts.length > 0 ? (
            alerts.map((a) => (
              <AlertBanner
                key={a.id}
                alert={a}
                onDismiss={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))}
              />
            ))
          ) : (
            <View style={[styles.noAlerts, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="check-circle" size={20} color="#2D7A4F" />
              <Text style={[styles.noAlertsText, { color: colors.mutedForeground }]}>No active alerts in your area</Text>
            </View>
          )}
        </View>

        {/* Hero banner */}
        <View style={[styles.section, { paddingHorizontal: 20, marginBottom: 24 }]}>
          <View style={[styles.heroBanner, { overflow: "hidden" }]}>
            <Image
              source={require("@/assets/images/hero.jpg")}
              style={styles.heroImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.65)"]}
              style={styles.heroOverlay}
            >
              <Text style={styles.heroLabel}>COMMUNITY DISCOVERY</Text>
              <Text style={styles.heroTitle}>Map Your Life.{"\n"}Connect Deeper.</Text>
              <TouchableOpacity style={styles.heroCta} activeOpacity={0.85}>
                <Text style={styles.heroCtaText}>Explore Near You</Text>
                <Feather name="arrow-right" size={14} color="#C4622D" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* AI Travel banner */}
        <View style={[styles.section, { paddingHorizontal: 20, marginBottom: 24 }]}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/travel")}
            style={[styles.travelBanner, { backgroundColor: colors.terracotta }]}
          >
            <View style={styles.travelBannerLeft}>
              <Text style={styles.travelBannerEyebrow}>✨ AI-POWERED</Text>
              <Text style={styles.travelBannerTitle}>Plan Your Next Trip</Text>
              <Text style={styles.travelBannerSub}>
                Black-owned spots, safe neighborhoods & events
              </Text>
            </View>
            <View style={styles.travelBannerRight}>
              <View style={styles.travelBannerArrow}>
                <Ionicons name="airplane" size={22} color={colors.terracotta} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Filter panel */}
        <View style={{ paddingHorizontal: 20 }}>
          <ScoreFilterPanel filters={filters} onChange={setFilters} />
        </View>

        {/* Active filter summary */}
        {activeFilterCount > 0 && (
          <View style={[styles.filterSummary, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Feather name="filter" size={13} color={colors.primary} />
            <Text style={[styles.filterSummaryText, { color: colors.primary }]}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} · {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
            </Text>
          </View>
        )}

        {/* Featured businesses */}
        {featured.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Featured Businesses" />
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(b) => b.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <BusinessCard
                  business={item}
                  onPress={() => router.push({ pathname: "/business/[id]", params: { id: item.id } })}
                  isSaved={isSaved(item.id)}
                  onToggleSave={() => toggleSave(item.id)}
                  horizontal
                />
              )}
            />
          </View>
        )}

        {/* Nearby businesses */}
        {nearby.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Near You" />
            {nearby.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                onPress={() => router.push({ pathname: "/business/[id]", params: { id: b.id } })}
                isSaved={isSaved(b.id)}
                onToggleSave={() => toggleSave(b.id)}
              />
            ))}
          </View>
        )}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Feather name="search" size={40} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No results found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Try adjusting your search, category, or filters.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 16 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerBrand: { flex: 1, gap: 2 },
  logoImg: { width: 120, height: 80 },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FACC15",
    borderWidth: 1.5,
    borderColor: "#C4622D",
  },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  categoryScroll: { paddingHorizontal: 20, gap: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20 },
  heroBanner: { borderRadius: 18, height: 200 },
  heroImage: { width: "100%", height: "100%", borderRadius: 18 },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    gap: 4,
  },
  heroLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
    lineHeight: 26,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  heroCtaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#C4622D",
  },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  travelBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  travelBannerLeft: { flex: 1, gap: 4 },
  travelBannerEyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "rgba(251,247,240,0.75)",
    letterSpacing: 1,
  },
  travelBannerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FBF7F0",
  },
  travelBannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(251,247,240,0.85)",
    lineHeight: 18,
  },
  travelBannerRight: { marginLeft: 12 },
  travelBannerArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterSummaryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  safetyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  safetyTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  safetyTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  alertCount: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCountText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#DC2626" },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  reportBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  noAlerts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noAlertsText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
});
