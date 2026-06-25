import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type CreatorData = {
  name: string;
  handle: string;
  bio: string;
  cities: number;
  videos: number;
  followers: number;
  coverColor: string;
  emoji: string;
  badges: string[];
  recentVideos: { title: string; city: string; views: string; emoji: string }[];
  topCities: { name: string; state: string; videoCount: number }[];
};

const CREATOR_DB: Record<string, CreatorData> = {
  "@yaratravels": {
    name: "Yara Mensah", handle: "@yaratravels",
    bio: "Black travel creator documenting minority-owned spots across the diaspora. ATL-based. Ghana-raised. I find the food, you book the flights. 🌍",
    cities: 82, videos: 340, followers: 12400,
    coverColor: "#2D5016", emoji: "🌍",
    badges: ["🏆 Verified Creator", "🍽️ Food & Culture", "🌍 Diaspora Traveler"],
    recentVideos: [
      { title: "Atlanta's best Sunday brunch spots", city: "Atlanta, GA", views: "48K", emoji: "🥞" },
      { title: "Accra for first-timers — what I wish I knew", city: "Accra, Ghana", views: "91K", emoji: "✈️" },
      { title: "Hidden soul food gems in DC", city: "Washington, DC", views: "34K", emoji: "🍗" },
      { title: "New Orleans through a Black lens", city: "New Orleans, LA", views: "62K", emoji: "🎷" },
    ],
    topCities: [
      { name: "Atlanta", state: "GA", videoCount: 42 },
      { name: "Accra", state: "Ghana", videoCount: 28 },
      { name: "New Orleans", state: "LA", videoCount: 21 },
      { name: "Washington", state: "DC", videoCount: 18 },
    ],
  },
  "@marcusinmotion": {
    name: "Marcus Cole", handle: "@marcusinmotion",
    bio: "Solo Black traveler. 30 countries. Every video is a love letter to our culture wherever it shows up. Safety tips always included.",
    cities: 30, videos: 180, followers: 8200,
    coverColor: "#1A2F5E", emoji: "🚀",
    badges: ["🏆 Verified Creator", "✈️ Solo Travel", "🛡 Safety Advocate"],
    recentVideos: [
      { title: "Traveling solo in Brazil as a Black man", city: "São Paulo, Brazil", views: "77K", emoji: "🇧🇷" },
      { title: "Harlem vs. South End — the comparison nobody asked for", city: "New York / Boston", views: "29K", emoji: "🏙️" },
      { title: "Best minority-owned hotels in Charlotte", city: "Charlotte, NC", views: "18K", emoji: "🏨" },
      { title: "Why I'll never stop going to Jamaica", city: "Kingston, Jamaica", views: "55K", emoji: "🌴" },
    ],
    topCities: [
      { name: "Kingston", state: "Jamaica", videoCount: 15 },
      { name: "São Paulo", state: "Brazil", videoCount: 12 },
      { name: "New York", state: "NY", videoCount: 22 },
      { name: "Charlotte", state: "NC", videoCount: 9 },
    ],
  },
  "@nanaamagh": {
    name: "Nana Ama", handle: "@nanaamagh",
    bio: "Ghana-born, Houston-raised. I document the African diaspora experience through food, business, and community — one city at a time.",
    cities: 55, videos: 210, followers: 9800,
    coverColor: "#5B2333", emoji: "🎬",
    badges: ["🏆 Verified Creator", "🍴 Culinary", "🤝 Community Builder"],
    recentVideos: [
      { title: "Houston's best Afro-Caribbean restaurants", city: "Houston, TX", views: "41K", emoji: "🍲" },
      { title: "Finding community in Chicago's South Side", city: "Chicago, IL", views: "38K", emoji: "🤝" },
      { title: "minority-owned wellness spots in LA", city: "Los Angeles, CA", views: "26K", emoji: "🧘🏾" },
      { title: "The real Wakanda: visiting Accra in 2024", city: "Accra, Ghana", views: "84K", emoji: "🌟" },
    ],
    topCities: [
      { name: "Houston", state: "TX", videoCount: 38 },
      { name: "Accra", state: "Ghana", videoCount: 30 },
      { name: "Chicago", state: "IL", videoCount: 24 },
      { name: "Los Angeles", state: "CA", videoCount: 18 },
    ],
  },
};

const DEFAULT_CREATOR: CreatorData = {
  name: "Community Creator", handle: "@creator",
  bio: "Documenting Black culture, food, and travel across the world.",
  cities: 20, videos: 80, followers: 3200,
  coverColor: "#3B1F0E", emoji: "🎥",
  badges: ["🏆 Verified Creator"],
  recentVideos: [
    { title: "Finding community on the road", city: "Various cities", views: "12K", emoji: "🗺️" },
  ],
  topCities: [{ name: "Atlanta", state: "GA", videoCount: 8 }],
};

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function CreatorProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const creator = (handle && CREATOR_DB[handle as string]) ? CREATOR_DB[handle as string]! : DEFAULT_CREATOR;
  const [following, setFollowing] = useState(false);

  const handleFollow = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFollowing(f => !f);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Creator Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Cover + avatar */}
        <View style={[styles.cover, { backgroundColor: creator.coverColor }]}>
          <View style={[styles.avatarCircle, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Text style={styles.avatarEmoji}>{creator.emoji}</Text>
          </View>
          <View style={[styles.verifiedBadge, { backgroundColor: "#C9922B" }]}>
            <Feather name="check" size={10} color="#FFF" />
            <Text style={styles.verifiedTxt}>Verified Creator</Text>
          </View>
        </View>

        {/* Name + follow */}
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.creatorName, { color: colors.foreground }]}>{creator.name}</Text>
            <Text style={[styles.creatorHandle, { color: colors.mutedForeground }]}>{creator.handle}</Text>
          </View>
          <TouchableOpacity
            style={[styles.followBtn, { backgroundColor: following ? colors.secondary : colors.primary, borderColor: colors.primary, borderWidth: 1.5 }]}
            onPress={handleFollow}
            activeOpacity={0.85}
          >
            <Text style={[styles.followBtnTxt, { color: following ? colors.primary : "#FFF" }]}>
              {following ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Cities", value: String(creator.cities), emoji: "📍" },
            { label: "Videos", value: String(creator.videos), emoji: "🎥" },
            { label: "Followers", value: formatFollowers(following ? creator.followers + 1 : creator.followers), emoji: "❤️" },
          ].map((s) => (
            <View key={s.label} style={styles.statCell}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={[styles.statNum, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bio */}
        <View style={[styles.bioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bioTxt, { color: colors.foreground }]}>{creator.bio}</Text>
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          {creator.badges.map((b) => (
            <View key={b} style={[styles.badgeChip, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.badgeTxt, { color: colors.foreground }]}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Recent Videos */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Videos</Text>
        {creator.recentVideos.map((v, i) => (
          <View key={i} style={[styles.videoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.videoThumb, { backgroundColor: creator.coverColor + "40" }]}>
              <Text style={styles.videoThumbEmoji}>{v.emoji}</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.videoTitle, { color: colors.foreground }]} numberOfLines={2}>{v.title}</Text>
              <View style={styles.videoMeta}>
                <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                <Text style={[styles.videoMetaTxt, { color: colors.mutedForeground }]}>{v.city}</Text>
                <Feather name="eye" size={11} color={colors.mutedForeground} />
                <Text style={[styles.videoMetaTxt, { color: colors.mutedForeground }]}>{v.views} views</Text>
              </View>
            </View>
            <Feather name="play-circle" size={22} color={colors.primary} />
          </View>
        ))}

        {/* Top Cities */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Cities</Text>
        <View style={styles.citiesGrid}>
          {creator.topCities.map((c) => (
            <View key={c.name} style={[styles.cityCard, { backgroundColor: colors.secondary }]}>
              <Text style={styles.cityFlag}>📍</Text>
              <Text style={[styles.cityName, { color: colors.foreground }]}>{c.name}</Text>
              <Text style={[styles.cityState, { color: colors.mutedForeground }]}>{c.state}</Text>
              <Text style={[styles.cityCount, { color: colors.primary }]}>{c.videoCount} videos</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={[styles.ctaCard, { backgroundColor: "#3B1F0E" }]}>
          <Text style={styles.ctaEmoji}>🎥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Are you a Black travel creator?</Text>
            <Text style={styles.ctaSub}>Apply to be a verified creator and get your content featured across the community.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 38, height: 38, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  scroll: { gap: 14 },
  cover: { height: 140, alignItems: "center", justifyContent: "flex-end", paddingBottom: 0 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: -40, zIndex: 1 },
  avatarEmoji: { fontSize: 36 },
  verifiedBadge: { position: "absolute", top: 12, right: 16, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  verifiedTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  nameRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 48, gap: 12 },
  creatorName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  creatorHandle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  followBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  followBtnTxt: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statsCard: { flexDirection: "row", marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  statCell: { flex: 1, alignItems: "center", gap: 4 },
  statEmoji: { fontSize: 20 },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  bioCard: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, padding: 14 },
  bioTxt: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16 },
  badgeChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", paddingHorizontal: 16 },
  videoCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, marginHorizontal: 16 },
  videoThumb: { width: 56, height: 56, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  videoThumbEmoji: { fontSize: 26 },
  videoTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  videoMeta: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  videoMetaTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  citiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 },
  cityCard: { width: "47%", borderRadius: 12, padding: 12, gap: 3 },
  cityFlag: { fontSize: 18 },
  cityName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  cityState: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cityCount: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  ctaCard: { flexDirection: "row", alignItems: "center", gap: 12, margin: 16, borderRadius: 14, padding: 14 },
  ctaEmoji: { fontSize: 28 },
  ctaTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 3 },
  ctaSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
});
