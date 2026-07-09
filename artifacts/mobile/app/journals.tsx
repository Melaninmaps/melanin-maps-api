import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

type Journal = {
  id: number;
  title: string;
  description?: string | null;
  cities?: string[] | null;
  coverEmoji?: string | null;
  savedCount: number;
  createdAt: string;
  authorName?: string | null;
};

const MOCK_JOURNALS: Journal[] = [
  {
    id: 1,
    title: "My Weekend in Atlanta",
    description: "From Sweet Auburn to Little Five Points — a 48-hour Black culture deep dive.",
    cities: ["Atlanta", "GA"],
    coverEmoji: "🍑",
    savedCount: 142,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    authorName: "Zora Williams",
  },
  {
    id: 2,
    title: "My Black History Tour",
    description: "Selma. Montgomery. Birmingham. A drive through history that changed me forever.",
    cities: ["Selma", "Montgomery", "Birmingham"],
    coverEmoji: "✊🏾",
    savedCount: 287,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    authorName: "Malik Thompson",
  },
  {
    id: 3,
    title: "Girls Trip — New Orleans 🎷",
    description: "Jazz Fest, Treme, hidden Creole gems and the best beignets you'll ever have.",
    cities: ["New Orleans", "LA"],
    coverEmoji: "🎷",
    savedCount: 391,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    authorName: "Imani Scott",
  },
  {
    id: 4,
    title: "My Brazil Adventure",
    description: "Salvador and beyond — three weeks of Afro-Brazilian culture, food, and music.",
    cities: ["Salvador", "Rio de Janeiro"],
    coverEmoji: "🇧🇷",
    savedCount: 563,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    authorName: "Nia Okafor",
  },
  {
    id: 5,
    title: "Solo in Harlem",
    description: "A first-timer's guide to the best soul food, jazz spots, and art in Harlem.",
    cities: ["New York City", "NY"],
    coverEmoji: "🗽",
    savedCount: 219,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    authorName: "Devon Carter",
  },
  {
    id: 6,
    title: "Accra for Black Americans",
    description: "Year of Return energy, hospitality, jollof debates, and roots I didn't know I had.",
    cities: ["Accra"],
    coverEmoji: "🇬🇭",
    savedCount: 712,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    authorName: "Fatima Asante",
  },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function JournalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [journals, setJournals] = useState<Journal[]>(MOCK_JOURNALS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/journals`);
      if (res.ok) {
        const data = await res.json() as { journals: Journal[] };
        if (data.journals.length > 0) setJournals(data.journals);
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (id: number) => {
    if (!isAuthenticated) { router.push("/login" as never); return; }
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    try {
      await fetch(`${getApiBase()}/api/journals/${id}/save`, { method: "POST" });
    } catch {}
  };

  const renderItem = ({ item }: { item: Journal }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.emoji, { backgroundColor: colors.secondary }]}>
          <Text style={styles.emojiTxt}>{item.coverEmoji ?? "✈️"}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.authorName && (
            <Text style={[styles.cardAuthor, { color: colors.mutedForeground }]}>
              by {item.authorName} · {timeAgo(item.createdAt)}
            </Text>
          )}
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={() => void handleSave(item.id)} hitSlop={8}>
          <Feather
            name="bookmark"
            size={20}
            color={saved.has(item.id) ? colors.primary : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      {item.description && (
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {(item.cities ?? []).length > 0 && (
        <View style={styles.cities}>
          {(item.cities ?? []).map((c) => (
            <View key={c} style={[styles.cityChip, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="map-pin" size={10} color={colors.primary} />
              <Text style={[styles.cityTxt, { color: colors.primary }]}>{c}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={styles.footerLeft}>
          <Feather name="bookmark" size={13} color={colors.mutedForeground} />
          <Text style={[styles.footerTxt, { color: colors.mutedForeground }]}>
            {saved.has(item.id) ? item.savedCount + 1 : item.savedCount} saved
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.85}
          style={[styles.useBtn, { backgroundColor: colors.primary + "18" }]}
          onPress={() => router.push("/create-journal" as never)}
        >
          <Text style={[styles.useBtnTxt, { color: colors.primary }]}>Use as template</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/community" as never)}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Trip Journals</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Community-created travel guides
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.85}
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/create-journal" as never)}
        >
          <Feather name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.createTxt}>Create</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={journals}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void load(true); }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={[styles.heroBanner, { backgroundColor: "#1A3B2B" }]}>
              <Text style={styles.heroEmoji}>🗺️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Saved by your community</Text>
                <Text style={styles.heroSub}>
                  Real trip guides built by real people who look like you.
                </Text>
              </View>
            </View>
          }
        />
      )}
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
  createTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 14 },
  heroBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, marginBottom: 4 },
  heroEmoji: { fontSize: 30 },
  heroTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.78)", marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  emoji: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  emojiTxt: { fontSize: 22 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", lineHeight: 22 },
  cardAuthor: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  cities: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cityChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  cityTxt: { fontSize: 11, fontFamily: "Inter_500Medium" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1 },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerTxt: { fontSize: 12, fontFamily: "Inter_400Regular" },
  useBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  useBtnTxt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
