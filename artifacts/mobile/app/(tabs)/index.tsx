import { Feather } from "@expo/vector-icons";
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
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { ALERTS, BUSINESSES, CATEGORIES } from "@/constants/data";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, toggleSave } = useFavorites();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState(ALERTS);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const filtered = BUSINESSES.filter((b) => {
    const matchesSearch =
      search.length === 0 ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || b.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const featured = filtered.filter((b) => b.featured);
  const nearby = filtered.filter((b) => !b.featured);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#C4622D", "#D4873A"]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.tagline}>Melanin Maps™</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
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
        {alerts.length > 0 && (
          <View style={styles.section}>
            {alerts.map((a) => (
              <AlertBanner
                key={a.id}
                alert={a}
                onDismiss={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))}
              />
            ))}
          </View>
        )}

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
              Try adjusting your search or category filter.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  tagline: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
    letterSpacing: -0.3,
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
  searchWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
});
