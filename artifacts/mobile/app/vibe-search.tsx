import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { getItemAsync } from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";

const BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

type VibeOption = {
  id: string;
  label: string;
  description: string;
  categories: string[];
};

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

type VibeResult = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  city: string;
  state: string;
  imageUrl: string | null;
  priceRange: string | null;
  rating: number;
  reviewCount: number;
  confidenceScore: number;
  verified: boolean;
  vibes: string[];
  ownerVibeMatches: number;
  communityTagCount: number;
  communityReactionCount: number;
  communitySignals: Array<{ key: string; label: string; count: number }>;
  isSaved: boolean;
  rankScore: number;
};

export default function VibeSearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSaved, toggleSave } = useFavorites();

  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [vibes, setVibes] = useState<VibeOption[]>([]);
  const [vibesError, setVibesError] = useState<string | null>(null);
  const [results, setResults] = useState<VibeResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const loadVibes = useCallback(async () => {
    setVibesError(null);
    try {
      // VIBES is member-aware because community feedback belongs to members.
      // The API intentionally protects it; the previous screen omitted this
      // existing session token and therefore rendered an empty picker.
      const token = await getItemAsync("auth_session_token");
      if (!token) throw new Error("Sign in to explore member VIBES.");
      const response = await fetch(`${BASE}/api/vibes/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({})) as { vibes?: VibeOption[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "VIBES could not be loaded");
      setVibes(data.vibes ?? []);
    } catch (error) {
      setVibesError(error instanceof Error ? error.message : "VIBES could not be loaded");
    }
  }, []);

  useEffect(() => {
    void loadVibes();
  }, [loadVibes]);

  const toggleVibe = (id: string) => {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const togglePrice = (p: string) => {
    setSelectedPrices((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const search = useCallback(async () => {
    if (selectedVibes.length === 0) return;
    setLoading(true);
    setSearched(true);
    setSearchError(null);
    try {
      const token = await getItemAsync("auth_session_token");
      if (!token) throw new Error("Sign in to search member VIBES.");
      const params = new URLSearchParams();
      selectedVibes.forEach((v) => params.append("vibes", v));
      selectedPrices.forEach((p) => params.append("price", p));
      const res = await fetch(`${BASE}/api/vibes/search?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({})) as { businesses?: VibeResult[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "VIBES search could not be completed");
      setResults(data.businesses ?? []);
    } catch (error) {
      setResults([]);
      setSearchError(error instanceof Error ? error.message : "VIBES search could not be completed");
    } finally {
      setLoading(false);
    }
  }, [selectedVibes, selectedPrices]);

  useEffect(() => {
    if (selectedVibes.length > 0) {
      queueMicrotask(() => { void search(); });
    } else {
      queueMicrotask(() => { setResults([]); });
      queueMicrotask(() => { setSearched(false); });
    }
  }, [selectedVibes, selectedPrices]);

  const getRankBadge = (b: VibeResult) => {
    if (b.isSaved) return { label: "Saved", color: "#CA922B" };
    if (b.ownerVibeMatches > 0 && b.communityReactionCount > 0)
      return { label: "Community Pick", color: "#2D7A4F" };
    if (b.ownerVibeMatches > 0) return { label: "Vibe Match", color: "#5B6AF0" };
    if (b.communityTagCount > 0 || b.communityReactionCount > 0)
      return { label: "Community Tagged", color: "#7A6030" };
    return null;
  };

  const renderResult = ({ item }: { item: VibeResult }) => {
    const badge = getRankBadge(item);
    const saved = isSaved(item.id);
    return (
      <TouchableOpacity
        style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/business/${item.id}`)}
        activeOpacity={0.85}
      >
        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : require("@/assets/images/icon.png")}
          style={styles.resultImage}
          contentFit="cover"
        />
        <View style={styles.resultInfo}>
          <View style={styles.resultTop}>
            <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity onPress={() => toggleSave(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather
                name={saved ? "bookmark" : "bookmark"}
                size={16}
                color={saved ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>
            {item.category} · {item.city}, {item.state}
            {item.priceRange ? ` · ${item.priceRange}` : ""}
          </Text>
          <View style={styles.resultBottom}>
            {item.rating > 0 && (
              <View style={styles.ratingRow}>
                <Feather name="star" size={11} color="#CA922B" />
                <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
                  {Number(item.rating).toFixed(1)}
                </Text>
              </View>
            )}
            {item.verified && (
              <View style={[styles.chip, { backgroundColor: "#2D7A4F15" }]}>
                <Feather name="check-circle" size={10} color="#2D7A4F" />
                <Text style={[styles.chipText, { color: "#2D7A4F" }]}>Verified</Text>
              </View>
            )}
            {badge && (
              <View style={[styles.chip, { backgroundColor: badge.color + "18" }]}>
                <Text style={[styles.chipText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            )}
          </View>
          {item.vibes?.length > 0 && (
            <View style={styles.vibeRow}>
              {item.vibes.slice(0, 3).map((v) => {
                const meta = vibes.find((x) => x.id === v);
                return (
                  <View key={v} style={[styles.vibePill, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                    <Text style={[styles.vibePillText, { color: colors.primary }]}>
                      {meta?.label ?? v}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          {item.communityReactionCount > 0 && (
            <View style={[styles.communitySays, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="message-circle" size={11} color={colors.primary} />
              <Text style={[styles.communitySaysLabel, { color: colors.primary }]}>Community says</Text>
              <Text style={[styles.communitySaysText, { color: colors.foreground }]} numberOfLines={1}>
                {item.communitySignals.slice(0, 2).map((signal) => (
                  signal.count > 1 ? `${signal.label} (${signal.count})` : signal.label
                )).join(" · ") || `${item.communityReactionCount} positive signal${item.communityReactionCount === 1 ? "" : "s"}`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>VIBES</Text>
          <Text style={styles.headerSub}>Find your scene by mood</Text>
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderResult}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}
        ListHeaderComponent={
          <View>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Pick your vibe</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Select one or more moods — we&apos;ll find spots that match
            </Text>
            <View style={styles.vibeGrid}>
              {vibes.map((v) => {
                const active = selectedVibes.includes(v.id);
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vibeCard,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => toggleVibe(v.id)}
                    activeOpacity={0.8}
                  >
                    <Feather name="tag" size={22} color={active ? "#FFF" : colors.primary} />
                    <Text style={[styles.vibeCardLabel, { color: active ? "#FFF" : colors.foreground }]}>
                      {v.label}
                    </Text>
                    <Text style={[styles.vibeCardDesc, { color: active ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>
                      {v.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {vibesError ? (
              <View style={styles.errorBlock}>
                <Text style={[styles.vibesError, { color: "#B91C1C" }]}>{vibesError}</Text>
                <TouchableOpacity onPress={() => { void loadVibes(); }} accessibilityRole="button">
                  <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : vibes.length === 0 ? (
              <Text style={[styles.vibesError, { color: colors.mutedForeground }]}>Loading available VIBES…</Text>
            ) : null}

            <Text style={[styles.sectionLabel, { color: colors.foreground, marginTop: 20 }]}>Price range</Text>
            <View style={styles.priceRow}>
              {PRICE_RANGES.map((p) => {
                const active = selectedPrices.includes(p);
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priceBtn,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => togglePrice(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.priceBtnText, { color: active ? "#FFF" : colors.foreground }]}>{p}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedVibes.length > 0 && (
              <View style={styles.resultsHeader}>
                {loading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>
                    {results.length} spot{results.length !== 1 ? "s" : ""} match
                    {results.length !== 1 ? "" : "es"} your vibe
                  </Text>
                )}
              </View>
            )}

            {searched && !loading && results.length === 0 && selectedVibes.length > 0 && (
              <View style={[styles.emptyState, { borderColor: colors.border }]}>
                <Feather name="search" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{searchError ? "VIBES search unavailable" : "No spots yet"}</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  {searchError ?? "Be the first to tag businesses with this vibe — help the community discover great spots."}
                </Text>
                {searchError && (
                  <TouchableOpacity onPress={() => { void search(); }} accessibilityRole="button">
                    <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {results.length > 0 && (
              <Text style={[styles.rankNote, { color: colors.mutedForeground }]}>
                Ranked by member saves, eligible promotion signals, and community feedback
              </Text>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#CA922B",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {},
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#FFF" },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 1 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 20, marginBottom: 4 },
  sectionSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 12, lineHeight: 18 },
  vibeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  errorBlock: { gap: 5, marginTop: 12 },
  vibesError: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  retryText: { fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 2 },
  vibeCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    gap: 6,
  },
  vibeCardLabel: { fontFamily: "Inter_700Bold", fontSize: 13 },
  vibeCardDesc: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15 },
  priceRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  priceBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  priceBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  resultsHeader: { marginTop: 20, marginBottom: 4 },
  resultsCount: { fontFamily: "Inter_400Regular", fontSize: 13 },
  rankNote: { fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 12, marginTop: 2 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 16,
    borderStyle: "dashed",
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 18 },
  resultCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  resultImage: { width: 90, height: 90 },
  resultInfo: { flex: 1, padding: 12, gap: 4 },
  resultTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  resultName: { fontFamily: "Inter_700Bold", fontSize: 14, flex: 1 },
  resultMeta: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
  resultBottom: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  chip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  vibeRow: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginTop: 2 },
  vibePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  vibePillText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  communitySays: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginTop: 3 },
  communitySaysLabel: { fontFamily: "Inter_700Bold", fontSize: 10 },
  communitySaysText: { fontFamily: "Inter_400Regular", fontSize: 10, flex: 1 },
});
