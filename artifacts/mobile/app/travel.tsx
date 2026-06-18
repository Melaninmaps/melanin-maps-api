import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { PostItineraryFeedbackSurvey } from "@/components/PostItineraryFeedbackSurvey";

const VIBES = [
  { id: "foodie", label: "Foodie", icon: "restaurant" },
  { id: "nightlife", label: "Nightlife", icon: "moon" },
  { id: "culture", label: "Culture", icon: "color-palette" },
  { id: "art", label: "Art", icon: "brush" },
  { id: "music", label: "Music", icon: "musical-notes" },
  { id: "beauty", label: "Beauty", icon: "sparkles" },
  { id: "history", label: "History", icon: "library" },
  { id: "outdoors", label: "Outdoors", icon: "leaf" },
  { id: "family", label: "Family", icon: "people" },
  { id: "wellness", label: "Wellness", icon: "heart" },
];

type TravelBusiness = {
  name: string;
  category: string;
  description: string;
  neighborhood: string;
  mustTry: string;
};

type TravelNeighborhood = {
  name: string;
  vibe: string;
  highlights: string[];
  safetyNote: string;
};

type TravelEvent = {
  name: string;
  type: string;
  description: string;
  timing: string;
};

type TravelRecommendations = {
  destination: string;
  summary: string;
  businesses: TravelBusiness[];
  neighborhoods: TravelNeighborhood[];
  events: TravelEvent[];
  safetyTips: string[];
  localInsights: string[];
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export default function TravelScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [destination, setDestination] = useState("");
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TravelRecommendations | null>(null);
  const [activeTab, setActiveTab] = useState<
    "businesses" | "neighborhoods" | "events" | "safety"
  >("businesses");
  const [showFeedbackSurvey, setShowFeedbackSurvey] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];

  function toggleVibe(id: string) {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  async function handleSearch() {
    if (!destination.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`${BASE_URL}/api/travel/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destination.trim(),
          vibes: selectedVibes,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const data: TravelRecommendations = await res.json();
      setResults(data);
      setActiveTab("businesses");

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      setError("Couldn't load recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const TABS = [
    { id: "businesses", label: "Spots", icon: "storefront" },
    { id: "neighborhoods", label: "Areas", icon: "map" },
    { id: "events", label: "Events", icon: "calendar" },
    { id: "safety", label: "Safety", icon: "shield-checkmark" },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#FBF7F0" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Travel Guide</Text>
          <Text style={styles.headerSub}>
            Black-owned spots & community intel
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.searchCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.searchLabel, { color: colors.text }]}>
            Where are you headed?
          </Text>
          <View
            style={[
              styles.inputRow,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={colors.primary}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="City, state or country..."
              placeholderTextColor={colors.mutedForeground}
              value={destination}
              onChangeText={setDestination}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {destination.length > 0 && (
              <TouchableOpacity onPress={() => setDestination("")}>
                <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.vibeLabel, { color: colors.text }]}>
            Your vibe{" "}
            <Text style={[styles.vibeOptional, { color: colors.mutedForeground }]}>
              (optional)
            </Text>
          </Text>
          <View style={styles.vibeGrid}>
            {VIBES.map((vibe) => {
              const selected = selectedVibes.includes(vibe.id);
              return (
                <TouchableOpacity
                  key={vibe.id}
                  style={[
                    styles.vibeChip,
                    {
                      backgroundColor: selected
                        ? colors.primary
                        : colors.background,
                      borderColor: selected
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => toggleVibe(vibe.id)}
                >
                  <Ionicons
                    name={vibe.icon as any}
                    size={13}
                    color={selected ? "#FBF7F0" : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.vibeChipText,
                      {
                        color: selected ? "#FBF7F0" : colors.text,
                      },
                    ]}
                  >
                    {vibe.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.searchBtn,
              {
                backgroundColor:
                  destination.trim() ? colors.primary : colors.border,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleSearch}
            disabled={!destination.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FBF7F0" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color="#FBF7F0" />
                <Text style={styles.searchBtnText}>Get AI Recommendations</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Finding Black-owned gems in {destination}...
            </Text>
          </View>
        )}

        {error && (
          <View
            style={[
              styles.errorCard,
              { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {results && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View
              style={[
                styles.resultHeader,
                { backgroundColor: "#D4873A" + "22", borderColor: "#D4873A" + "44" },
              ]}
            >
              <Ionicons name="sparkles" size={20} color={"#D4873A"} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultCity, { color: colors.text }]}>
                  {results.destination}
                </Text>
                <Text
                  style={[styles.resultSummary, { color: colors.mutedForeground }]}
                >
                  {results.summary}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.tabBar,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.tab,
                      active && {
                        borderBottomColor: colors.primary,
                        borderBottomWidth: 2,
                      },
                    ]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={16}
                      color={active ? colors.primary : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color: active ? colors.primary : colors.mutedForeground,
                          fontFamily: active
                            ? "Inter_600SemiBold"
                            : "Inter_400Regular",
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeTab === "businesses" &&
              results.businesses.map((biz, i) => (
                <View
                  key={i}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: colors.primary + "18" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: colors.primary },
                        ]}
                      >
                        {biz.category}
                      </Text>
                    </View>
                    <Text
                      style={[styles.neighborhoodTag, { color: colors.mutedForeground }]}
                    >
                      <Ionicons name="location-outline" size={12} /> {biz.neighborhood}
                    </Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {biz.name}
                  </Text>
                  <Text
                    style={[styles.cardDesc, { color: colors.mutedForeground }]}
                  >
                    {biz.description}
                  </Text>
                  <View
                    style={[
                      styles.mustTryRow,
                      { backgroundColor: "#D4873A" + "18", borderColor: "#D4873A" + "33" },
                    ]}
                  >
                    <Ionicons name="star" size={13} color={"#D4873A"} />
                    <Text style={[styles.mustTryText, { color: colors.text }]}>
                      <Text style={{ fontFamily: "Inter_600SemiBold" }}>
                        Must try:{" "}
                      </Text>
                      {biz.mustTry}
                    </Text>
                  </View>
                </View>
              ))}

            {activeTab === "neighborhoods" &&
              results.neighborhoods.map((n, i) => (
                <View
                  key={i}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {n.name}
                  </Text>
                  <Text
                    style={[
                      styles.vibePill,
                      { color: "#D4873A", fontFamily: "Inter_600SemiBold" },
                    ]}
                  >
                    {n.vibe}
                  </Text>
                  <View style={styles.highlightList}>
                    {n.highlights.map((h, j) => (
                      <View key={j} style={styles.highlightRow}>
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                        <Text
                          style={[
                            styles.highlightText,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {h}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {n.safetyNote ? (
                    <View
                      style={[
                        styles.safetyNoteRow,
                        {
                          backgroundColor: "#F0FDF4",
                          borderColor: "#BBF7D0",
                        },
                      ]}
                    >
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={13}
                        color="#16A34A"
                      />
                      <Text style={[styles.safetyNoteText, { color: "#15803D" }]}>
                        {n.safetyNote}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}

            {activeTab === "events" &&
              results.events.map((ev, i) => (
                <View
                  key={i}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: "#D4873A22" },
                      ]}
                    >
                      <Text
                        style={[styles.categoryText, { color: "#D4873A" }]}
                      >
                        {ev.type}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.timingText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      <Ionicons name="time-outline" size={12} /> {ev.timing}
                    </Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {ev.name}
                  </Text>
                  <Text
                    style={[styles.cardDesc, { color: colors.mutedForeground }]}
                  >
                    {ev.description}
                  </Text>
                </View>
              ))}

            {activeTab === "safety" && (
              <View>
                <Text
                  style={[styles.sectionHeading, { color: colors.text }]}
                >
                  Safety Tips
                </Text>
                {results.safetyTips.map((tip, i) => (
                  <View
                    key={i}
                    style={[
                      styles.listItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.listNum,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text style={styles.listNumText}>{i + 1}</Text>
                    </View>
                    <Text
                      style={[styles.listText, { color: colors.mutedForeground }]}
                    >
                      {tip}
                    </Text>
                  </View>
                ))}

                <Text
                  style={[
                    styles.sectionHeading,
                    { color: colors.text, marginTop: 20 },
                  ]}
                >
                  Local Insights
                </Text>
                {results.localInsights.map((insight, i) => (
                  <View
                    key={i}
                    style={[
                      styles.listItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="bulb-outline"
                      size={16}
                      color="#D4873A"
                      style={{ marginTop: 2 }}
                    />
                    <Text
                      style={[styles.listText, { color: colors.mutedForeground }]}
                    >
                      {insight}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 24 }} />

            {/* Rate this itinerary */}
            <TouchableOpacity
              style={[styles.rateItinBtn, { backgroundColor: colors.card, borderColor: "#D4873A40" }]}
              onPress={() => setShowFeedbackSurvey(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.rateItinIcon, { backgroundColor: "#D4873A18" }]}>
                <Ionicons name="star" size={18} color="#D4873A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rateItinTitle, { color: colors.text }]}>Rate this Itinerary</Text>
                <Text style={[styles.rateItinSub, { color: colors.mutedForeground }]}>Help us improve AI trip planning</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </Animated.View>
        )}

        {!results && !loading && !error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✈️</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Plan Your Next Trip
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
            >
              Enter a destination and let AI surface the best Black-owned
              businesses, safe neighborhoods, and community events.
            </Text>
          </View>
        )}
      </ScrollView>

      <PostItineraryFeedbackSurvey
        visible={showFeedbackSurvey}
        destination={results?.destination ?? destination}
        onClose={() => setShowFeedbackSurvey(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#FBF7F0",
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(251,247,240,0.8)",
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  searchLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    padding: 0,
  },
  vibeLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginTop: 4,
  },
  vibeOptional: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  vibeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  vibeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  vibeChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  searchBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FBF7F0",
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 14,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#DC2626",
    flex: 1,
  },
  resultHeader: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  resultCity: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    marginBottom: 4,
  },
  resultSummary: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 3,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 11,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  neighborhoodTag: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  cardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  mustTryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  mustTryText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  vibePill: {
    fontSize: 13,
  },
  highlightList: { gap: 6 },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  highlightText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    flex: 1,
  },
  safetyNoteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  safetyNoteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  timingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  sectionHeading: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  listNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  listNumText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#FBF7F0",
  },
  listText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  rateItinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  rateItinIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rateItinTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 2 },
  rateItinSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
