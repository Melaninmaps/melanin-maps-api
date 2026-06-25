import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

type CommunityList = {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  coverEmoji?: string | null;
  savedCount: number;
  createdAt: string;
  authorFirstName?: string | null;
  authorLastName?: string | null;
};

const MOCK_LISTS: CommunityList[] = [
  { id: 1, title: "Black-Owned Brunch Spots in Chicago", description: "The city's best Sunday brunch — all Black-owned, all worth the wait.", category: "Food", coverEmoji: "🥞", savedCount: 234, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), authorFirstName: "Tasha", authorLastName: "R." },
  { id: 2, title: "Date-Night Restaurants in Charlotte", description: "Upscale, intimate, and 100% Black-owned. Perfect for any occasion.", category: "Food", coverEmoji: "🕯️", savedCount: 187, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), authorFirstName: "Jordan", authorLastName: "M." },
  { id: 3, title: "Best Black-Owned Bookstores", description: "From Harlem to Houston — independent Black bookstores worth every mile.", category: "Culture", coverEmoji: "📚", savedCount: 412, createdAt: new Date(Date.now() - 86400000 * 9).toISOString(), authorFirstName: "Amara", authorLastName: "B." },
  { id: 4, title: "Family-Friendly Places in Orlando", description: "Kid-approved, parent-loved Black-owned spots near the parks and beyond.", category: "Family", coverEmoji: "👨‍👩‍👧", savedCount: 156, createdAt: new Date(Date.now() - 86400000 * 14).toISOString(), authorFirstName: "Darius", authorLastName: "W." },
  { id: 5, title: "Safe Solo Traveler Destinations", description: "Cities with strong Black communities, high safety ratings, and vibrant culture.", category: "Travel", coverEmoji: "👩🏾", savedCount: 521, createdAt: new Date(Date.now() - 86400000 * 20).toISOString(), authorFirstName: "Kezia", authorLastName: "O." },
  { id: 6, title: "Black-Owned Coffee Shops Nationwide", description: "Your work-from-café guide — great Wi-Fi, great vibes, great owners.", category: "Food", coverEmoji: "☕", savedCount: 298, createdAt: new Date(Date.now() - 86400000 * 25).toISOString(), authorFirstName: "Marcus", authorLastName: "T." },
  { id: 7, title: "Hidden Gems in New Orleans", description: "Off the tourist trail — Creole spots and cultural treasures only locals know.", category: "Culture", coverEmoji: "🎷", savedCount: 340, createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), authorFirstName: "Simone", authorLastName: "V." },
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#C9922B",
  Culture: "#2D7A4F",
  Family: "#7B3F00",
  Travel: "#1D4ED8",
  Wellness: "#7B2D8B",
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export default function CommunityListsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [lists, setLists] = useState<CommunityList[]>(MOCK_LISTS);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Food", "Culture", "Travel", "Family", "Wellness"];

  const load = useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/lists");
      if (res.ok) {
        const data = await res.json() as { lists: CommunityList[] };
        if (data.lists.length > 0) setLists(data.lists);
      }
    } catch {} finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (id: number) => {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    setSaved(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    try { await fetch(`/api/lists/${id}/save`, { method: "POST" }); } catch {}
  };

  const filtered = activeCategory === "All" ? lists : lists.filter(l => l.category === activeCategory);

  const renderItem = ({ item }: { item: CommunityList }) => {
    const catColor = CATEGORY_COLORS[item.category ?? ""] ?? colors.primary;
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardTop}>
          <View style={[styles.emojiWrap, { backgroundColor: catColor + "18" }]}>
            <Text style={styles.emojiTxt}>{item.coverEmoji ?? "📍"}</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
            <View style={styles.metaRow}>
              {item.category && (
                <View style={[styles.catChip, { backgroundColor: catColor + "18" }]}>
                  <Text style={[styles.catChipTxt, { color: catColor }]}>{item.category}</Text>
                </View>
              )}
              <Text style={[styles.metaTxt, { color: colors.mutedForeground }]}>
                {item.authorFirstName ? `by ${item.authorFirstName} ${item.authorLastName ?? ""}` : "Community"} · {timeAgo(item.createdAt)}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => void handleSave(item.id)} hitSlop={8}>
            <Feather name="bookmark" size={20} color={saved.has(item.id) ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        {item.description && (
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.footerLeft}>
            <Feather name="bookmark" size={13} color={colors.mutedForeground} />
            <Text style={[styles.footerTxt, { color: colors.mutedForeground }]}>{saved.has(item.id) ? item.savedCount + 1 : item.savedCount} saved</Text>
          </View>
          <TouchableOpacity
            style={[styles.viewBtn, { backgroundColor: colors.primary + "18" }]}
            onPress={() => router.push("/create-list" as never)}
          >
            <Text style={[styles.viewBtnTxt, { color: colors.primary }]}>Make similar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/community" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community Lists</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Curated by the community, for the community</Text>
        </View>
        <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/create-list" as never)}>
          <Feather name="plus" size={16} color="#FFF" />
          <Text style={styles.createTxt}>Create</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(true); }} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <View style={[styles.heroBanner, { backgroundColor: "#3B1F0E" }]}>
              <Text style={styles.heroEmoji}>📋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>People love curated lists</Text>
                <Text style={styles.heroSub}>Build one. Follow one. Support local together.</Text>
              </View>
            </View>
            <View style={styles.filterRow}>
              {categories.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.filterChip, { backgroundColor: activeCategory === c ? colors.primary : colors.secondary, borderColor: activeCategory === c ? colors.primary : colors.border }]}
                  onPress={() => setActiveCategory(c)}
                >
                  <Text style={[styles.filterTxt, { color: activeCategory === c ? "#FFF" : colors.foreground }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 38, height: 38, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  createBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  createTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  list: { padding: 16, gap: 12 },
  heroBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14 },
  heroEmoji: { fontSize: 28 },
  heroTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFF" },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  filterTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  emojiWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  emojiTxt: { fontSize: 22 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", lineHeight: 21 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  catChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  catChipTxt: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  metaTxt: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1 },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerTxt: { fontSize: 12, fontFamily: "Inter_400Regular" },
  viewBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  viewBtnTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
