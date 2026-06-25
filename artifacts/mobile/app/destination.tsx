import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Mock destination data ────────────────────────────────────────────────────
const DESTINATION_DATA: Record<string, {
  name: string;
  emoji: string;
  country: string;
  communityRating: number;
  ratingCount: number;
  videoCount: number;
  photoCount: number;
  businessCount: number;
  safetyScore: number;
  tagline: string;
  highlights: string[];
  vibeVideos: { id: string; title: string; creator: string; emoji: string; duration: string; views: string }[];
}> = {
  brazil: {
    name: "Brazil", emoji: "🇧🇷", country: "Brazil",
    communityRating: 4.6, ratingCount: 312, videoCount: 237, photoCount: 1842,
    businessCount: 89, safetyScore: 3.8,
    tagline: "Afro-Brazilian culture, cuisine, and community in the heart of the Diaspora.",
    highlights: ["Salvador", "Rio de Janeiro", "São Paulo", "Bahia"],
    vibeVideos: [
      { id: "v1", title: "Pelourinho by night — Salvador's soul", creator: "Yara Mensah", emoji: "🌃", duration: "3:47", views: "14.2K" },
      { id: "v2", title: "Candomblé ceremony in Bahia", creator: "Nana Asante", emoji: "🥁", duration: "5:12", views: "22.1K" },
      { id: "v3", title: "Feijoada tour — Rio's best Black-owned spots", creator: "Malik Ferreira", emoji: "🍲", duration: "6:05", views: "9.8K" },
    ],
  },
  atlanta: {
    name: "Atlanta", emoji: "🌆", country: "USA",
    communityRating: 4.8, ratingCount: 1204, videoCount: 891, photoCount: 6432,
    businessCount: 412, safetyScore: 4.2,
    tagline: "The Black Mecca of the South — culture, food, music, and history on every block.",
    highlights: ["Sweet Auburn", "West End", "BeltLine", "Buckhead"],
    vibeVideos: [
      { id: "v1", title: "Sweet Auburn Curb Market — food lover's paradise", creator: "Marcus Cole", emoji: "🛒", duration: "4:22", views: "34.1K" },
      { id: "v2", title: "BeltLine art walk & Black-owned cafes", creator: "Jade Williams", emoji: "🎨", duration: "5:58", views: "28.7K" },
      { id: "v3", title: "HBCU tailgate energy in Atlanta", creator: "Darius Thompson", emoji: "🏈", duration: "3:15", views: "18.4K" },
    ],
  },
  accra: {
    name: "Accra", emoji: "🇬🇭", country: "Ghana",
    communityRating: 4.9, ratingCount: 678, videoCount: 423, photoCount: 3217,
    businessCount: 156, safetyScore: 4.5,
    tagline: "The gateway to the Motherland — year-round Diaspora pilgrimage, culture, and belonging.",
    highlights: ["Osu", "Labadi Beach", "Jamestown", "Accra Mall"],
    vibeVideos: [
      { id: "v1", title: "Year of Return — emotional first visit", creator: "Nana Ama", emoji: "🌍", duration: "8:05", views: "41.3K" },
      { id: "v2", title: "Makola Market — sights, sounds & spices", creator: "Kofi Mensah", emoji: "🌶️", duration: "4:33", views: "19.6K" },
      { id: "v3", title: "Labadi Beach with the culture on full display", creator: "Abena Boateng", emoji: "🏖️", duration: "6:20", views: "27.8K" },
    ],
  },
};

const SECTION_CARDS = [
  { icon: "🎥", label: "Community Videos", key: "videos", color: "#1A3B2B" },
  { icon: "📸", label: "Photos", key: "photos", color: "#2D1A6B" },
  { icon: "🍽️", label: "Black-Owned Restaurants", key: "restaurants", color: "#3B1A0E" },
  { icon: "🏨", label: "Hotels & Stays", key: "hotels", color: "#1A2B3B" },
  { icon: "🎉", label: "Events", key: "events", color: "#4A1A6B" },
  { icon: "👥", label: "Travel Groups", key: "groups", color: "#1A4B2B" },
  { icon: "✈️", label: "Travel Tips", key: "tips", color: "#3B2A0E" },
  { icon: "⚠️", label: "Safety Insights", key: "safety", color: "#4B2A0E" },
];

export default function DestinationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const [vibeActive, setVibeActive] = useState(false);

  const key = (slug ?? "atlanta").toLowerCase();
  const dest = DESTINATION_DATA[key] ?? DESTINATION_DATA["atlanta"];

  function handleSectionTap(key: string) {
    if (key === "videos") {
      router.push("/travel-videos");
    } else if (key === "safety") {
      router.push("/safety-hub");
    } else {
      Alert.alert(
        SECTION_CARDS.find((s) => s.key === key)?.label ?? "Coming soon",
        "This section is coming soon as the community grows.",
      );
    }
  }

  function handleVibeVideo(video: (typeof dest.vibeVideos)[0]) {
    Alert.alert(
      video.title,
      `By ${video.creator} · ${video.views} views · ${video.duration}\n\nVideo playback coming soon!`,
    );
  }

  const ratingEmoji = dest.communityRating >= 4.5 ? "👑" : dest.communityRating >= 4 ? "🤎🤎🤎🤎" : "🤎🤎🤎";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerEmoji]}>{dest.emoji}</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{dest.name}</Text>
        </View>
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.card }]}>
          <Feather name="share-2" size={17} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Hero stats bar */}
        <View style={[styles.heroStats, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatVal, { color: colors.foreground }]}>{ratingEmoji}</Text>
            <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Community Rating</Text>
            <Text style={[styles.heroStatSub, { color: colors.mutedForeground }]}>{dest.ratingCount} reviews</Text>
          </View>
          <View style={[styles.heroStatDiv, { backgroundColor: colors.border }]} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatVal, { color: colors.foreground }]}>{dest.videoCount.toLocaleString()}</Text>
            <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Community Videos</Text>
          </View>
          <View style={[styles.heroStatDiv, { backgroundColor: colors.border }]} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatVal, { color: colors.foreground }]}>{dest.photoCount.toLocaleString()}</Text>
            <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Photos</Text>
          </View>
          <View style={[styles.heroStatDiv, { backgroundColor: colors.border }]} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatVal, { color: colors.foreground }]}>{dest.businessCount}</Text>
            <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Businesses</Text>
          </View>
        </View>

        {/* Tagline */}
        <View style={styles.taglineWrap}>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>{dest.tagline}</Text>
        </View>

        {/* Highlights row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsRow}>
          {dest.highlights.map((h) => (
            <View key={h} style={[styles.highlightChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.highlightTxt, { color: colors.foreground }]}>{h}</Text>
            </View>
          ))}
        </ScrollView>

        {/* SHOW ME THE VIBE — hero CTA */}
        <TouchableOpacity
          style={[styles.vibeBtn, { backgroundColor: vibeActive ? "#1A3B2B" : colors.primary }]}
          activeOpacity={0.85}
          onPress={() => setVibeActive(!vibeActive)}
        >
          <Text style={styles.vibeBtnEmoji}>🎥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.vibeBtnTitle}>Show Me the Vibe</Text>
            <Text style={styles.vibeBtnSub}>
              {vibeActive ? "Tap a video below to watch" : `Watch ${dest.videoCount} community clips from ${dest.name}`}
            </Text>
          </View>
          <Feather name={vibeActive ? "chevron-up" : "chevron-down"} size={18} color="#fff" />
        </TouchableOpacity>

        {/* Vibe videos — expanded */}
        {vibeActive && (
          <View style={[styles.vibeVideos, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {dest.vibeVideos.map((v, i) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.vibeVideoRow, i < dest.vibeVideos.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={() => handleVibeVideo(v)}
                activeOpacity={0.8}
              >
                <View style={[styles.vibeVideoThumb, { backgroundColor: colors.primary + "33" }]}>
                  <Text style={{ fontSize: 22 }}>{v.emoji}</Text>
                  <View style={styles.vibePlayOverlay}>
                    <Feather name="play" size={10} color="#fff" />
                  </View>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.vibeVideoTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {v.title}
                  </Text>
                  <Text style={[styles.vibeVideoMeta, { color: colors.mutedForeground }]}>
                    {v.creator} · {v.views} views · {v.duration}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.vibeMoreBtn, { borderTopColor: colors.border }]}
              onPress={() => router.push("/travel-videos")}
            >
              <Text style={[styles.vibeMoreTxt, { color: colors.primary }]}>
                See all {dest.videoCount} videos from {dest.name} →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section grid */}
        <View style={styles.sectionGrid}>
          {SECTION_CARDS.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sectionCard, { backgroundColor: s.color }]}
              onPress={() => handleSectionTap(s.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.sectionCardEmoji}>{s.icon}</Text>
              <Text style={styles.sectionCardLabel}>{s.label}</Text>
              {s.key === "videos" && (
                <Text style={styles.sectionCardCount}>{dest.videoCount.toLocaleString()}</Text>
              )}
              {s.key === "photos" && (
                <Text style={styles.sectionCardCount}>{dest.photoCount.toLocaleString()}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety snapshot */}
        <View style={[styles.safetySnap, { backgroundColor: "#2D7A4F12", borderColor: "#2D7A4F30" }]}>
          <View style={styles.safetySnapHeader}>
            <Feather name="shield" size={15} color="#2D7A4F" />
            <Text style={[styles.safetySnapTitle, { color: "#2D7A4F" }]}>Safety Snapshot</Text>
            <TouchableOpacity onPress={() => router.push("/safety-hub")}>
              <Text style={[styles.safetySnapLink, { color: "#2D7A4F" }]}>Full report →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.safetySnapRow}>
            <View style={styles.safetySnapStat}>
              <Text style={[styles.safetySnapVal, { color: "#2D7A4F" }]}>{dest.safetyScore.toFixed(1)}</Text>
              <Text style={[styles.safetySnapLabel, { color: colors.mutedForeground }]}>Safety Score</Text>
            </View>
            <Text style={[styles.safetySnapDesc, { color: colors.mutedForeground }]}>
              Based on community safety surveys, check-ins, and reports from members who have visited {dest.name}.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  shareBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  heroStats: {
    flexDirection: "row", marginHorizontal: 16, borderRadius: 16,
    padding: 16, borderWidth: 1, marginBottom: 14,
  },
  heroStat: { flex: 1, alignItems: "center", gap: 3 },
  heroStatVal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  heroStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  heroStatSub: { fontSize: 9, fontFamily: "Inter_400Regular" },
  heroStatDiv: { width: 1, marginVertical: 4 },
  taglineWrap: { paddingHorizontal: 16, marginBottom: 12 },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, textAlign: "center" },
  highlightsRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  highlightChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  highlightTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  vibeBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginBottom: 10,
    padding: 16, borderRadius: 16,
  },
  vibeBtnEmoji: { fontSize: 24 },
  vibeBtnTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 2 },
  vibeBtnSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  vibeVideos: {
    marginHorizontal: 16, marginBottom: 14, borderRadius: 14, borderWidth: 1, overflow: "hidden",
  },
  vibeVideoRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
  },
  vibeVideoThumb: {
    width: 60, height: 44, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  vibePlayOverlay: {
    position: "absolute",
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
    paddingLeft: 1,
  },
  vibeVideoTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  vibeVideoMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  vibeMoreBtn: { padding: 14, borderTopWidth: 1, alignItems: "center" },
  vibeMoreTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 16, gap: 10, marginBottom: 16,
  },
  sectionCard: {
    width: (SCREEN_WIDTH - 16 * 2 - 10) / 2,
    borderRadius: 14, padding: 16, gap: 6,
    minHeight: 90,
  },
  sectionCardEmoji: { fontSize: 22 },
  sectionCardLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  sectionCardCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  safetySnap: {
    marginHorizontal: 16, borderRadius: 14, borderWidth: 1, padding: 14, gap: 10,
  },
  safetySnapHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  safetySnapTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_700Bold" },
  safetySnapLink: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  safetySnapRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  safetySnapStat: { alignItems: "center", gap: 3 },
  safetySnapVal: { fontSize: 24, fontFamily: "Inter_700Bold" },
  safetySnapLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  safetySnapDesc: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
});
