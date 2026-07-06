import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase() { return process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""; }

interface WrappedData {
  year: number;
  checkInsCount: number;
  reviewsCount: number;
  savesCount: number;
  pointsEarned: number;
  topCategory: string | null;
  citiesCount: number;
  cities: string[];
  firstBusiness: { name: string; category: string } | null;
  communitiesCount: number;
  impactScore: number;
  impactLevel: string;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  Trailblazer: { bg: "#CA922B", text: "#FFFFFF", glow: "#CA922B55" },
  Navigator:   { bg: "#2D7A4F", text: "#FFFFFF", glow: "#2D7A4F55" },
  Explorer:    { bg: "#1D4ED8", text: "#FFFFFF", glow: "#1D4ED855" },
  Discoverer:  { bg: "#7C3AED", text: "#FFFFFF", glow: "#7C3AED55" },
  Newcomer:    { bg: "#374151", text: "#FFFFFF", glow: "#37415155" },
};

const CATEGORY_EMOJI: Record<string, string> = {
  "Food & Drink": "🍽️", "Beauty & Grooming": "💇", "Retail & Shopping": "🛍️",
  "Health & Wellness": "💚", "Professional Services": "💼", "Arts & Culture": "🎨",
  "Entertainment": "🎭", "Education": "📚", "Real Estate": "🏠",
  "Tech & Digital": "💻", "Travel & Accommodation": "✈️", "Automotive": "🚗",
};

function StatCard({ emoji, value, label, color, delay }: {
  emoji: string; value: string | number; label: string; color: string; delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.statCard, { opacity, transform: [{ translateY }], borderColor: color + "30", backgroundColor: color + "12" }]}>
      <Text style={s.statEmoji}>{emoji}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function MelaninWrappedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.85)).current;

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const token = Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/users/wrapped`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { setError(true); return; }
      const json = await res.json() as WrappedData;
      setData(json);
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(heroScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      ]).start();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleShare() {
    if (!data) return;
    const text = [
      `✨ My ${data.year} Melanin Wrapped ✨`,
      ``,
      `🏪 ${data.checkInsCount} Black-owned businesses supported`,
      `⭐ ${data.reviewsCount} reviews written`,
      `🌍 ${data.citiesCount} ${data.citiesCount === 1 ? "city" : "cities"} explored`,
      `🏅 ${data.pointsEarned.toLocaleString()} community points`,
      data.topCategory ? `❤️ Favorite: ${data.topCategory}` : null,
      ``,
      `💛 Level: ${data.impactLevel}`,
      ``,
      `Download Mapping With Melanin™ — mappingwithmelanin.com`,
    ].filter(Boolean).join("\n");

    try { await Share.share({ message: text }); } catch { /* cancelled */ }
  }

  const level = data ? (LEVEL_COLORS[data.impactLevel] ?? LEVEL_COLORS.Newcomer) : LEVEL_COLORS.Newcomer;

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: "#0A0A0A" }]}>
        <View style={[s.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={s.center}><ActivityIndicator size="large" color="#CA922B" /></View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[s.root, { backgroundColor: "#0A0A0A" }]}>
        <View style={[s.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>🌱</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Nothing yet this year</Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center", paddingHorizontal: 40 }}>
            Check in to Black-owned businesses, leave reviews, and save places to build your story.
          </Text>
          <TouchableOpacity style={[s.shareBtn, { backgroundColor: "#CA922B", marginTop: 28 }]} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={s.shareBtnTxt}>Start Exploring</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: "#0A0A0A" }]}>
      <View style={[s.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={s.shareIconBtn} activeOpacity={0.7}>
          <Feather name="share-2" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}>

        {/* ─── Hero ─── */}
        <Animated.View style={[s.hero, { opacity: heroOpacity, transform: [{ scale: heroScale }] }]}>
          <View style={[s.yearBadge, { backgroundColor: level.bg }]}>
            <Text style={[s.yearBadgeTxt, { color: level.text }]}>{data.year} Wrapped</Text>
          </View>
          <Text style={s.heroTitle}>You showed{"\n"}up for the culture.</Text>
          <View style={[s.levelPill, { backgroundColor: level.bg + "22", borderColor: level.bg + "55" }]}>
            <Text style={[s.levelPillTxt, { color: level.text === "#FFFFFF" ? level.bg : level.text }]}>
              🏅 {data.impactLevel} — Impact Score {data.impactScore}
            </Text>
          </View>
        </Animated.View>

        {/* ─── Stats grid ─── */}
        <View style={s.statsGrid}>
          <StatCard emoji="🏪" value={data.checkInsCount} label="Businesses Supported" color="#CA922B" delay={100} />
          <StatCard emoji="⭐" value={data.reviewsCount} label="Reviews Written" color="#2D7A4F" delay={200} />
          <StatCard emoji="🔖" value={data.savesCount} label="Places Saved" color="#1D4ED8" delay={300} />
          <StatCard emoji="🌍" value={data.citiesCount} label={data.citiesCount === 1 ? "City Explored" : "Cities Explored"} color="#7C3AED" delay={400} />
          <StatCard emoji="💰" value={data.pointsEarned.toLocaleString()} label="Points Earned" color="#CA922B" delay={500} />
          <StatCard emoji="🤝" value={data.communitiesCount} label="Communities Joined" color="#2D7A4F" delay={600} />
        </View>

        {/* ─── Cities ─── */}
        {data.cities.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Cities You Explored</Text>
            <View style={s.cityRow}>
              {data.cities.map((city) => (
                <View key={city} style={s.cityChip}>
                  <Text style={s.cityTxt}>📍 {city}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── Top category ─── */}
        {data.topCategory && (
          <View style={[s.categoryCard, { borderColor: "#CA922B44" }]}>
            <Text style={s.categoryEmoji}>{CATEGORY_EMOJI[data.topCategory] ?? "🏪"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.categoryPre}>Your Favorite Category</Text>
              <Text style={s.categoryName}>{data.topCategory}</Text>
            </View>
          </View>
        )}

        {/* ─── First business ─── */}
        {data.firstBusiness && (
          <View style={[s.firstCard, { borderColor: "#2D7A4F44" }]}>
            <Text style={s.firstPre}>Where it all started</Text>
            <Text style={s.firstName}>{data.firstBusiness.name}</Text>
            {data.firstBusiness.category && (
              <Text style={s.firstCat}>{data.firstBusiness.category}</Text>
            )}
          </View>
        )}

        {/* ─── Share CTA ─── */}
        <View style={s.ctaSection}>
          <Text style={s.ctaTitle}>Share your impact 🤎</Text>
          <Text style={s.ctaSub}>Every check-in, review, and save helps Black-owned businesses thrive. Thank you for showing up.</Text>
          <TouchableOpacity style={[s.shareBtn, { backgroundColor: "#CA922B" }]} onPress={handleShare} activeOpacity={0.85}>
            <Feather name="share-2" size={16} color="#fff" />
            <Text style={s.shareBtnTxt}>Share My Wrapped</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { padding: 8 },
  shareIconBtn: { padding: 8 },
  hero: { alignItems: "center", paddingTop: 16, paddingBottom: 32, paddingHorizontal: 24 },
  yearBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  yearBadgeTxt: { fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  heroTitle: { fontSize: 34, fontWeight: "800", color: "#FFFFFF", textAlign: "center", lineHeight: 40, marginBottom: 20 },
  levelPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  levelPillTxt: { fontSize: 14, fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10, marginBottom: 24 },
  statCard: { width: "47%", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1, gap: 6 },
  statEmoji: { fontSize: 26 },
  statValue: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "center" },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  cityRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cityChip: { backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  cityTxt: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  categoryCard: { marginHorizontal: 16, marginBottom: 16, padding: 18, borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(202,146,43,0.08)", flexDirection: "row", alignItems: "center", gap: 14 },
  categoryEmoji: { fontSize: 36 },
  categoryPre: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  categoryName: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  firstCard: { marginHorizontal: 16, marginBottom: 16, padding: 18, borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(45,122,79,0.08)" },
  firstPre: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 6 },
  firstName: { color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginBottom: 4 },
  firstCat: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  ctaSection: { marginHorizontal: 16, marginTop: 8, alignItems: "center" },
  ctaTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  ctaSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 19, textAlign: "center", marginBottom: 20 },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 25 },
  shareBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
