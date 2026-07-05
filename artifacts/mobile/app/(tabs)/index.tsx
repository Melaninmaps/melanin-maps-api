import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  Animated,
  Dimensions,
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
import { SkipFeedbackModal } from "@/components/SkipFeedbackModal";
import { SwipeableBusinessCard } from "@/components/SwipeableBusinessCard";
import { SkeletonBusinessCardHorizontal, SkeletonBusinessCardVertical } from "@/components/SkeletonCard";
import { CategoryPill } from "@/components/CategoryPill";
import { NeighborhoodSafetySurvey } from "@/components/NeighborhoodSafetySurvey";
import { OnboardingPreferenceSurvey } from "@/components/OnboardingPreferenceSurvey";
import { ScoreFilterPanel } from "@/components/ScoreFilterPanel";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { BrandQuoteBanner } from "@/components/BrandQuoteBanner";
import { ForYouCard } from "@/components/ForYouCard";
import { CATEGORIES } from "@/constants/data";
import { getDailyQuoteText } from "@/constants/brandQuotes";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useAlerts } from "@/hooks/useAlerts";
import { type FilterState } from "@/components/ScoreFilterPanel";
import { useSpaces } from "@/hooks/useSpaces";
import { useDismissedBusinesses } from "@/hooks/useDismissedBusinesses";
import { useAuth } from "@/lib/auth";
import { useUserPreferences } from "@/hooks/useUserPreferences";

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { isSaved, toggleSave } = useFavorites();
  const { preferences } = useUserPreferences();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const { alerts: liveAlerts, isLive, refetch: refetchAlerts } = useAlerts("GA");
  const [alerts, setAlerts] = useState(liveAlerts);
  React.useEffect(() => { setAlerts(liveAlerts); }, [liveAlerts]);
  const [filters, setFilters] = useState<FilterState>({
    minScore: 0,
    verifiedOnly: false,
    ownershipTypes: [],
  });
  const [prefsBannerDismissed, setPrefsBannerDismissed] = useState(false);

  // When saved preferences load, auto-apply ownership types if user hasn't set a filter yet
  React.useEffect(() => {
    if (preferences?.preferredOwnershipTypes?.length && filters.ownershipTypes.length === 0) {
      setFilters((f) => ({ ...f, ownershipTypes: preferences.preferredOwnershipTypes }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences?.preferredOwnershipTypes?.join(",")]);
  const [showNeighborhoodSurvey, setShowNeighborhoodSurvey] = useState(false);
  const [showPrefsSurvey, setShowPrefsSurvey] = useState(false);
  const [feedbackBusiness, setFeedbackBusiness] = useState<{ id: string; name: string; feedbackOptIn?: boolean } | null>(null);
  const [sponsoredDismissed, setSponsoredDismissed] = useState(false);

  // KinfolkAI banner hide-on-scroll
  const kinfolkAnim = useRef(new Animated.Value(1)).current;
  const kinfolkVisible = useRef(true);
  const lastScrollY = useRef(0);

  const handleScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    if (diff > 10 && kinfolkVisible.current) {
      kinfolkVisible.current = false;
      Animated.timing(kinfolkAnim, { toValue: 0, duration: 220, useNativeDriver: false }).start();
    } else if (diff < -10 && !kinfolkVisible.current) {
      kinfolkVisible.current = true;
      Animated.timing(kinfolkAnim, { toValue: 1, duration: 260, useNativeDriver: false }).start();
    }
    lastScrollY.current = currentY;
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const { businesses, isLoading: businessesLoading, refetch: refetchBusinesses } = useBusinesses({
    search,
    category: activeCategory,
  });

  const { spaces: searchSpaces } = useSpaces(search.trim().length > 2 ? { q: search.trim() } : undefined);
  const { isDismissed, dismissBusiness } = useDismissedBusinesses();

  const [activeVibe, setActiveVibe] = useState<string | null>(null);
  const [minorityExpanded, setMinorityExpanded] = useState(false);

  const VIBES: { label: string; emoji: string; categories: string[] }[] = [
    { label: "Soul Food", emoji: "🍽️", categories: ["Food", "Restaurant"] },
    { label: "Hair & Beauty", emoji: "💈", categories: ["Beauty", "Hair"] },
    { label: "Wellness", emoji: "💆🏾", categories: ["Health", "Wellness"] },
    { label: "Art & Culture", emoji: "🎨", categories: ["Arts", "Culture", "Gallery"] },
    { label: "Late Night", emoji: "🌙", categories: ["Entertainment", "Nightlife", "Bar"] },
    { label: "Shopping", emoji: "🛍️", categories: ["Retail", "Shop"] },
    { label: "Date Night", emoji: "💑", categories: ["Restaurant", "Food", "Entertainment"] },
    { label: "Family", emoji: "👨🏾‍👩🏾‍👧🏾", categories: ["Food", "Entertainment", "Health"] },
  ];

  const filtered = businesses.filter((b) => {
    if (isDismissed(b.id)) return false;
    const matchesScore = b.confidenceScore >= filters.minScore;
    const matchesVerified = !filters.verifiedOnly || b.verified;
    const matchesOwnership =
      filters.ownershipTypes.length === 0 ||
      filters.ownershipTypes.some(
        (t) =>
          (t === "black-owned" && b.blackOwned) ||
          (t === "minority-owned" && b.blackOwned) ||
          b.ownershipDesignations.includes(t)
      );
    const matchesVibe = !activeVibe
      ? true
      : VIBES.find((v) => v.label === activeVibe)?.categories.some(
          (cat) => b.category?.toLowerCase().includes(cat.toLowerCase())
        ) ?? true;
    return matchesScore && matchesVerified && matchesOwnership && matchesVibe;
  });

  // Sort: preference-matched businesses first within each section
  const savedOwnershipPrefs = preferences?.preferredOwnershipTypes ?? [];
  const matchesPref = (b: (typeof filtered)[0]) =>
    savedOwnershipPrefs.length === 0 ||
    savedOwnershipPrefs.some(
      (t) =>
        (t === "minority-owned" && b.blackOwned) ||
        b.ownershipDesignations?.includes(t)
    );

  const sortByPref = (list: typeof filtered) => {
    if (savedOwnershipPrefs.length === 0) return list;
    const matched = list.filter(matchesPref);
    const rest = list.filter((b) => !matchesPref(b));
    return [...matched, ...rest];
  };

  const featured = sortByPref(filtered.filter((b) => b.featured));
  const nearby = sortByPref(filtered.filter((b) => !b.featured));

  // True when the user has ownership prefs but zero businesses match them
  const prefMatchCount = filtered.filter(matchesPref).length;
  const showNoPrefsMatch =
    !prefsBannerDismissed &&
    savedOwnershipPrefs.length > 0 &&
    prefMatchCount === 0 &&
    filtered.length > 0 &&
    !businessesLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBusinesses(), refetchAlerts()]);
    setRefreshing(false);
  };

  const activeFilterCount =
    (filters.minScore > 0 ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.ownershipTypes.length > 0 ? 1 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#3A1F0E", "#1C0E06"]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerBrand}>
            <Image
              source={require("@/assets/images/logo-transparent.png")}
              style={styles.logoImg}
              contentFit="contain"
            />
            <Text style={styles.greeting}>{getTimeGreeting()}{user?.firstName ? `, ${user.firstName}` : ""} 👋🏾</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8} onPress={() => router.push("/notification-center")}>
            <Feather name="bell" size={20} color="#FFFFFF" />
            {user && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search businesses, events..."
            onFocus={() => router.push("/business-search")}
          />
        </View>

        {/* Search banners row */}
        <View style={styles.searchBannersRow}>
          <TouchableOpacity
            style={[styles.searchBannerHalf, { borderColor: "#CA922B30", backgroundColor: "#CA922B08" }]}
            onPress={() => router.push("/smart-search" as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.aiSearchIcon}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiSearchTitle}>AI Search</Text>
              <Text style={styles.aiSearchSub}>Natural language</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.searchBannerHalf, { borderColor: "#3B82F630", backgroundColor: "#3B82F608" }]}
            onPress={() => router.push("/connections" as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.aiSearchIcon}>👥</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiSearchTitle, { color: "#3B82F6" }]}>Find People</Text>
              <Text style={[styles.aiSearchSub, { color: "#3B82F699" }]}>Friends & community</Text>
            </View>
          </TouchableOpacity>
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
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* AI For You */}
        <ForYouCard />

        {/* Safety alerts */}
        <View style={styles.section}>
          <View style={styles.safetyHeader}>
            <View style={styles.safetyTitleRow}>
              <Feather name="shield" size={16} color="#DC2626" />
              <Text style={[styles.safetyTitle, { color: colors.foreground }]}>Community Safety</Text>
              {isLive && (
                <View style={[styles.alertCount, { backgroundColor: "#DC262618" }]}>
                  <Text style={styles.alertCountText}>LIVE</Text>
                </View>
              )}
              {alerts.length > 0 && (
                <View style={[styles.alertCount, { backgroundColor: "#DC262618" }]}>
                  <Text style={styles.alertCountText}>{alerts.length}</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.reportBtn, { backgroundColor: "#2D7A4F12", borderColor: "#2D7A4F30" }]}
                onPress={() => setShowNeighborhoodSurvey(true)}
                activeOpacity={0.8}
              >
                <Feather name="map-pin" size={13} color="#2D7A4F" />
                <Text style={[styles.reportBtnText, { color: "#2D7A4F" }]}>Rate Neighborhood</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportBtn, { backgroundColor: "#DC262612", borderColor: "#DC262630" }]}
                onPress={() => router.push("/report-safety")}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={13} color="#DC2626" />
                <Text style={[styles.reportBtnText, { color: "#DC2626" }]}>Report</Text>
              </TouchableOpacity>
            </View>
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
              <Text style={styles.heroLabel}>{getDailyQuoteText("mission", 0).toUpperCase()}</Text>
              <Text style={styles.heroTitle}>Map Your Life.{"\n"}Connect Deeper.{"\n"}Live With Purpose.</Text>
              <TouchableOpacity style={styles.heroCta} activeOpacity={0.85} onPress={() => router.push("/(tabs)/map")}>
                <Text style={styles.heroCtaText}>Explore Near You</Text>
                <Feather name="arrow-right" size={14} color="#3A1F0E" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          {[
            { value: "2,400+", label: "Verified Businesses" },
            { value: "48", label: "States" },
            { value: "94/100", label: "Avg. Score" },
            { value: "100%", label: "Authenticity Checked" },
          ].map((stat, i, arr) => (
            <React.Fragment key={stat.label}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
              {i < arr.length - 1 && (
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Brand quote strip */}
        <BrandQuoteBanner
          category="community"
          offset={1}
          variant="card"
          style={{ marginHorizontal: 20, marginBottom: 20 }}
        />

        {/* AI Travel banner — hides on scroll down, reappears on scroll up */}
        <Animated.View style={{
          opacity: kinfolkAnim,
          maxHeight: kinfolkAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 140] }),
          overflow: "hidden",
          marginBottom: kinfolkAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }),
        }}>
          <View style={[styles.section, { paddingHorizontal: 20 }]}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push("/travel")}
              style={[styles.travelBanner, { backgroundColor: colors.primary }]}
            >
              <View style={styles.travelBannerLeft}>
                <Text style={styles.travelBannerEyebrow}>✨ KINFOLKAI™</Text>
                <Text style={styles.travelBannerTitle}>Plan Your Next Trip</Text>
                <Text style={styles.travelBannerSub}>
                  {getDailyQuoteText("kinfolk", 0)}
                </Text>
              </View>
              <View style={styles.travelBannerRight}>
                <View style={styles.travelBannerArrow}>
                  <Ionicons name="airplane" size={22} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Global Recommendations banner */}
        <View style={[styles.section, { paddingHorizontal: 20, marginBottom: 16 }]}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/global-recommendations" as any)}
            style={[styles.travelBanner, { backgroundColor: "#1A2E22" }]}
          >
            <View style={styles.travelBannerLeft}>
              <Text style={styles.travelBannerEyebrow}>🌍 COMMUNITY PICKS</Text>
              <Text style={styles.travelBannerTitle}>Global Recommendations</Text>
              <Text style={styles.travelBannerSub}>
                Trusted places around the world — shared by our community.
              </Text>
            </View>
            <View style={styles.travelBannerRight}>
              <View style={[styles.travelBannerArrow, { backgroundColor: "#CA922B" }]}>
                <Ionicons name="globe-outline" size={22} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Relocation Planner banner */}
        <View style={[styles.section, { paddingHorizontal: 20, marginBottom: 16 }]}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/relocation-planner" as any)}
            style={[styles.travelBanner, { backgroundColor: "#1A3A2A" }]}
          >
            <View style={styles.travelBannerLeft}>
              <Text style={styles.travelBannerEyebrow}>🚚 RELOCATION CONCIERGE</Text>
              <Text style={styles.travelBannerTitle}>Plan Your Move</Text>
              <Text style={styles.travelBannerSub}>
                AI guides you step-by-step — realtor, movers, doctor, and more minority-owned businesses at every turn.
              </Text>
            </View>
            <View style={styles.travelBannerRight}>
              <View style={[styles.travelBannerArrow, { backgroundColor: "#C9922B" }]}>
                <Text style={{ fontSize: 20 }}>🏠</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Community Spaces banner */}
        <View style={[styles.section, { paddingHorizontal: 20, marginBottom: 12 }]}>
          <TouchableOpacity
            style={[styles.spacesBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/spaces")}
            activeOpacity={0.85}
          >
            <View style={[styles.spacesIconWrap, { backgroundColor: "#2D7A4F18" }]}>
              <Feather name="home" size={22} color="#2D7A4F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.spacesBannerTitle, { color: colors.foreground }]}>Community Spaces</Text>
              <Text style={[styles.spacesBannerSub, { color: colors.mutedForeground }]}>
                Spaces for rent, sale & business in safe neighborhoods
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          {searchSpaces.length > 0 && (
            <TouchableOpacity
              style={[styles.spacesMatch, { backgroundColor: "#2D7A4F12", borderColor: "#2D7A4F33" }]}
              onPress={() => router.push({ pathname: "/spaces", params: { q: search } } as any)}
              activeOpacity={0.85}
            >
              <Feather name="briefcase" size={13} color="#2D7A4F" />
              <Text style={[styles.spacesMatchText, { color: "#2D7A4F" }]}>
                {searchSpaces.length} space{searchSpaces.length !== 1 ? "s" : ""} match "{search}" — tap to view
              </Text>
              <Feather name="arrow-right" size={13} color="#2D7A4F" />
            </TouchableOpacity>
          )}
        </View>

        {/* Vibe Match chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vibeScroll}
        >
          {VIBES.map((v) => (
            <TouchableOpacity
              key={v.label}
              style={[
                styles.vibeChip,
                activeVibe === v.label
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setActiveVibe(activeVibe === v.label ? null : v.label)}
              activeOpacity={0.75}
            >
              <Text style={styles.vibeEmoji}>{v.emoji}</Text>
              <Text style={[styles.vibeLabel, { color: activeVibe === v.label ? "#FFFFFF" : colors.foreground }]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
        {businessesLoading ? (
          <View style={styles.section}>
            <SectionHeader title="Featured Businesses" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {[0, 1, 2].map((i) => <SkeletonBusinessCardHorizontal key={i} />)}
            </ScrollView>
          </View>
        ) : featured.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Featured Businesses" />
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(b) => b.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <View>
                  <BusinessCard
                    business={item}
                    onPress={() => router.push({ pathname: "/business/[id]", params: { id: item.id } })}
                    isSaved={isSaved(item.id)}
                    onToggleSave={() => toggleSave(item.id)}
                    horizontal
                  />
                  <View style={styles.cardActions}>
                    {item.feedbackOptIn && (
                      <TouchableOpacity
                        style={styles.notForMeBtn}
                        onPress={() => setFeedbackBusiness(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.notForMeTxt, { color: colors.mutedForeground }]}>Leave a note</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.hideBtn}
                      onPress={() => dismissBusiness(item.id)}
                      activeOpacity={0.7}
                    >
                      <Feather name="x" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.hideTxt, { color: colors.mutedForeground }]}>Not interested</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        ) : null}

        {feedbackBusiness && (
          <SkipFeedbackModal
            visible={!!feedbackBusiness}
            businessId={feedbackBusiness.id}
            businessName={feedbackBusiness.name}
            onClose={() => setFeedbackBusiness(null)}
          />
        )}

        {/* Nearby businesses */}
        {businessesLoading ? (
          <View style={styles.section}>
            <SectionHeader title="Near You" />
            {[0, 1, 2, 4].map((i) => <SkeletonBusinessCardVertical key={i} />)}
          </View>
        ) : nearby.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Near You" subtitle="Swipe ← skip  ·  → save" />
            {nearby.map((b) => (
              <View key={b.id}>
                <SwipeableBusinessCard
                  business={b}
                  onPress={() => router.push({ pathname: "/business/[id]", params: { id: b.id } })}
                  isSaved={isSaved(b.id)}
                  onToggleSave={() => toggleSave(b.id)}
                />
                <TouchableOpacity
                  style={[styles.hideBtn, { justifyContent: "center", marginBottom: 4 }]}
                  onPress={() => dismissBusiness(b.id)}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.hideTxt, { color: colors.mutedForeground }]}>Not interested</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {/* No preference-matched businesses — offer to broaden */}
        {showNoPrefsMatch && (
          <View style={[styles.noPrefsMatch, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.noPrefsMatchTop}>
              <Feather name="heart" size={18} color="#CA922B" />
              <Text style={[styles.noPrefsMatchTitle, { color: colors.foreground }]}>
                No exact preference matches
              </Text>
              <TouchableOpacity
                onPress={() => setPrefsBannerDismissed(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.noPrefsMatchSub, { color: colors.mutedForeground }]}>
              We couldn't find businesses matching your saved preferences in this view. Would you like to explore other minority-owned businesses?
            </Text>
            <View style={styles.noPrefsMatchBtns}>
              <TouchableOpacity
                style={[styles.noPrefsBtn, { backgroundColor: "#CA922B" }]}
                onPress={() => {
                  setFilters((f) => ({ ...f, ownershipTypes: ["minority-owned"] }));
                  setPrefsBannerDismissed(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.noPrefsBtnTxt}>Show All Minority-Owned</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.noPrefsGhostBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setFilters((f) => ({ ...f, ownershipTypes: [] }));
                  setPrefsBannerDismissed(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.noPrefsGhostTxt, { color: colors.mutedForeground }]}>Show Everything</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {filtered.length === 0 && !showNoPrefsMatch && (() => {
          const hasActiveOwnershipFilter = filters.ownershipTypes.length > 0;
          const hasOtherMinorityBiz = businesses.some(
            (b) => !isDismissed(b.id) && (b.blackOwned || (b.ownershipDesignations && b.ownershipDesignations.length > 0))
          );
          const selectedLabel = hasActiveOwnershipFilter
            ? filters.ownershipTypes[0]?.replace(/-/g, " ") ?? "filtered"
            : "filtered";

          if (hasActiveOwnershipFilter && hasOtherMinorityBiz && !minorityExpanded) {
            return (
              <View style={[styles.minorityOptCard, { backgroundColor: colors.card, borderColor: "#CA922B44" }]}>
                <View style={[styles.minorityOptGold, { backgroundColor: "#CA922B" }]} />
                <View style={{ flex: 1, padding: 14 }}>
                  <Text style={[styles.minorityOptTitle, { color: colors.foreground }]}>
                    No {selectedLabel} businesses found yet
                  </Text>
                  <Text style={[styles.minorityOptBody, { color: colors.mutedForeground }]}>
                    We're growing every day. Would you like to explore other minority-owned businesses in the meantime?
                  </Text>
                  <TouchableOpacity
                    style={[styles.minorityOptBtn, { backgroundColor: "#CA922B" }]}
                    onPress={() => setMinorityExpanded(true)}
                    activeOpacity={0.85}
                  >
                    <Feather name="compass" size={14} color="#fff" />
                    <Text style={styles.minorityOptBtnText}>Explore Other Minority-Owned</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          if (hasActiveOwnershipFilter && hasOtherMinorityBiz && minorityExpanded) {
            const expansion = businesses.filter(
              (b) => !isDismissed(b.id) && (b.blackOwned || (b.ownershipDesignations && b.ownershipDesignations.length > 0))
            );
            return (
              <View>
                <View style={[styles.expansionHeader, { borderBottomColor: "#CA922B44" }]}>
                  <Feather name="compass" size={15} color="#CA922B" />
                  <Text style={[styles.expansionLabel, { color: "#CA922B" }]}>
                    Other Minority-Owned Businesses
                  </Text>
                  <TouchableOpacity onPress={() => setMinorityExpanded(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x" size={15} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.expansionNote, { color: colors.mutedForeground }]}>
                  Showing results from all minority-owned businesses — not filtered by your selected type
                </Text>
                {expansion.map((b) => (
                  <BusinessCard key={b.id} business={b} onPress={() => router.push({ pathname: "/business/[id]", params: { id: b.id } } as never)} isSaved={false} onToggleSave={() => {}} />
                ))}
              </View>
            );
          }

          return (
            <View style={styles.empty}>
              <Feather name="search" size={40} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No businesses found</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                We're growing every day — try a different search, category, or check back soon.
              </Text>
            </View>
          );
        })()}

        {/* List Your Business CTA */}
        <TouchableOpacity
          style={[styles.listBizBanner, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/list-business" as never)}
          activeOpacity={0.88}
        >
          <View style={styles.listBizLeft}>
            <View style={[styles.listBizIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather name="briefcase" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listBizTitle}>Own a Minority-Owned Business?</Text>
              <Text style={styles.listBizSub}>Get discovered by thousands of locals and travelers. Listing is free.</Text>
            </View>
          </View>
          <View style={[styles.listBizCta, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.listBizCtaText}>List Free</Text>
            <Feather name="arrow-right" size={13} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Preferences shortcut */}
        <TouchableOpacity
          style={[styles.prefsRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowPrefsSurvey(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.prefsIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="sliders" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.prefsTitle, { color: colors.foreground }]}>Update Preferences</Text>
            <Text style={[styles.prefsSub, { color: colors.mutedForeground }]}>Personalize your discovery feed</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>

      <NeighborhoodSafetySurvey
        visible={showNeighborhoodSurvey}
        onClose={() => setShowNeighborhoodSurvey(false)}
      />
      <OnboardingPreferenceSurvey
        visible={showPrefsSurvey}
        onClose={() => setShowPrefsSurvey(false)}
      />

      {/* ── Sponsored business pill — bottom-left, scales to screen ── */}
      {!sponsoredDismissed && featured.length > 0 && (() => {
        const biz = featured[0];
        const screenW = Dimensions.get("window").width;
        const pillW = Math.min(screenW * 0.62, 280);
        return (
          <View style={[styles.sponsoredPill, { bottom: bottomPad + 100, width: pillW }]}>
            <TouchableOpacity
              style={styles.sponsoredInner}
              onPress={() => router.push(`/business/${biz.id}`)}
              activeOpacity={0.88}
            >
              <View style={styles.sponsoredBadge}>
                <Text style={styles.sponsoredBadgeTxt}>✦ Sponsored</Text>
              </View>
              <Text style={styles.sponsoredName} numberOfLines={1}>{biz.name}</Text>
              <Text style={styles.sponsoredCat} numberOfLines={1}>{biz.category} · {biz.city}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sponsoredClose} onPress={() => setSponsoredDismissed(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={12} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        );
      })()}
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
    borderColor: "#1C1A10",
  },
  searchWrap: { paddingHorizontal: 20, marginBottom: 8 },
  searchBannersRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  searchBannerHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  aiSearchIcon: { fontSize: 15 },
  aiSearchTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#CA922B" },
  aiSearchSub: { fontFamily: "Inter_400Regular", fontSize: 10, color: "#CA922B99", marginTop: 1 },
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
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
    lineHeight: 30,
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
    color: "#0A0A08",
  },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  notForMeBtn: { marginTop: 4, paddingVertical: 4, alignItems: "center" },
  notForMeTxt: { fontSize: 11, fontFamily: "Inter_400Regular", textDecorationLine: "underline" },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 4 },
  hideBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 },
  hideTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
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
    color: "rgba(250,241,228,0.75)",
    letterSpacing: 1,
  },
  travelBannerTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    color: "#FAF1E4",
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
  spacesBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  spacesIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  spacesBannerTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  spacesBannerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2, lineHeight: 17 },
  spacesMatch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  spacesMatchText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12 },
  vibeScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  vibeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  vibeEmoji: { fontSize: 15 },
  vibeLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
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
    flexWrap: "wrap",
    rowGap: 8,
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
  listBizBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  listBizLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  listBizIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  listBizTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF", marginBottom: 3 },
  listBizSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 15 },
  listBizCta: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  listBizCtaText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#FFFFFF" },
  prefsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  prefsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  prefsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  prefsSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "transparent",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 28,
    opacity: 0.4,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  minorityOptCard: { flexDirection: "row", marginHorizontal: 16, marginVertical: 8, borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
  minorityOptGold: { width: 4 },
  minorityOptTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 4 },
  minorityOptBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, marginBottom: 12 },
  minorityOptBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 14, alignSelf: "flex-start" },
  minorityOptBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  expansionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  expansionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  expansionNote: { fontFamily: "Inter_400Regular", fontSize: 12, paddingHorizontal: 16, paddingBottom: 10, paddingTop: 4 },
  noPrefsMatch: {
    marginHorizontal: 20, marginVertical: 8,
    borderRadius: 16, borderWidth: 1,
    padding: 16, gap: 10,
  },
  noPrefsMatchTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  noPrefsMatchTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1 },
  noPrefsMatchSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  noPrefsMatchBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  noPrefsBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  noPrefsBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#1C0E06" },
  noPrefsGhostBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  noPrefsGhostTxt: { fontFamily: "Inter_500Medium", fontSize: 13 },
  sponsoredPill: {
    position: "absolute",
    left: 12,
    backgroundColor: "#2B1507",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(202,146,43,0.4)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  sponsoredInner: { padding: 12, gap: 3 },
  sponsoredBadge: {
    backgroundColor: "rgba(202,146,43,0.15)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  sponsoredBadgeTxt: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#CA922B", letterSpacing: 1 },
  sponsoredName: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#F5EBD8" },
  sponsoredCat: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(245,235,216,0.5)" },
  sponsoredClose: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
