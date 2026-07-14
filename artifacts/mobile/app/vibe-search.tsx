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

const VIBES = [
  { id: "date-night", label: "Date Night", icon: "heart" as const, description: "Romantic & intimate" },
  { id: "group-hangout", label: "Group Hangout", icon: "users" as const, description: "Lively, great for squads" },
  { id: "solo-vibes", label: "Solo Vibes", icon: "user" as const, description: "Quiet, chill, recharge" },
  { id: "bougie-treat", label: "Bougie Treat", icon: "award" as const, description: "Upscale & elevated" },
  { id: "hood-classic", label: "Hood Classic", icon: "home" as const, description: "Authentic local staple" },
  { id: "soul-food", label: "Soul Food", icon: "coffee" as const, description: "Southern comfort cooking" },
  { id: "late-night", label: "Late Night", icon: "moon" as const, description: "After dark energy" },
  { id: "family-time", label: "Family Time", icon: "smile" as const, description: "Kid-friendly & wholesome" },
  { id: "creative-scene", label: "Creative Scene", icon: "music" as const, description: "Art, music & culture" },
  { id: "wellness", label: "Wellness", icon: "activity" as const, description: "Health, spa & balance" },
  { id: "work-and-study", label: "Work & Study", icon: "book-open" as const, description: "Productive, WiFi energy" },
  { id: "adventure", label: "Adventure Ready", icon: "compass" as const, description: "Active & explorative" },
];

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

type VibeResult = {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  imageUrl: string | null;
  priceRange: string | null;
  rating: number;
  reviewCount: number;
  confidenceScore: number;
  verified: boolean;
  blackOwned: boolean;
  vibes: string[];
  ownerVibeMatches: number;
  communityTagCount: number;
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
  const [results, setResults] = useState<VibeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
    try {
      const token = await getItemAsync("auth_session_token");
      const params = new URLSearchParams();
      selectedVibes.forEach((v) => params.append("vibes", v));
      selectedPrices.forEach((p) => params.append("price", p));
      const res = await fetch(`${BASE}/api/vibes/search?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { businesses: VibeResult[] };
        setResults(data.businesses ?? []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedVibes, selectedPrices]);

  useEffect(() => {
    if (selectedVibes.length > 0) {
      void search();
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [selectedVibes, selectedPrices]);

  const getRankBadge = (b: VibeResult) => {
    if (b.isSaved) return { label: "Saved", color: "#CA922B" };
    if (b.ownerVibeMatches > 0 && b.communityTagCount > 5)
      return { label: "Community Pick", color: "#2D7A4F" };
    if (b.ownerVibeMatches > 0) return { label: "Vibe Match", color: "#5B6AF0" };
    if (b.communityTagCount > 0) return { label: "Community Tagged", color: "#7A6030" };
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
                const meta = VIBES.find((x) => x.id === v);
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
          <Text style={styles.headerTitle}>Vibe Search</Text>
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
              Select one or more moods — we'll find spots that match
            </Text>
            <View style={styles.vibeGrid}>
              {VIBES.map((v) => {
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
                    <Feather name={v.icon} size={22} color={active ? "#FFF" : colors.primary} />
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
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No spots yet</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Be the first to tag businesses with this vibe — help the community discover great spots.
                </Text>
              </View>
            )}

            {results.length > 0 && (
              <Text style={[styles.rankNote, { color: colors.mutedForeground }]}>
                Ranked by your saves · promotions · community tags
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
});
