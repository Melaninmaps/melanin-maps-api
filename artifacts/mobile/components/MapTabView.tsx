import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusinessCard } from "@/components/BusinessCard";
import { CategoryPill } from "@/components/CategoryPill";
import { SafetyPulseWidget } from "@/components/SafetyPulseWidget";
import { UpgradeModal } from "@/components/UpgradeModal";
import { SearchBar } from "@/components/SearchBar";
import { CATEGORIES } from "@/constants/data";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useAuth } from "@/lib/auth";
import { useGeoSafeAlert } from "@/hooks/useGeoSafeAlert";

export function MapTabView() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, toggleSave } = useFavorites();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const { alert: geoAlert, dismissAlert } = useGeoSafeAlert();

  const { businesses } = useBusinesses();
  const filtered = businesses.filter((b) => {
    const matchesSearch =
      search.length === 0 ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || b.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Map</Text>
        <View style={[styles.mapNotice, { backgroundColor: colors.secondary }]}>
          <Feather name="map" size={14} color={colors.primary} />
          <Text style={[styles.mapNoticeText, { color: colors.primary }]}>Use Expo Go for interactive map</Text>
        </View>
      </View>
      {geoAlert && (
        <TouchableOpacity
          style={styles.geoAlertBanner}
          onPress={dismissAlert}
          activeOpacity={0.85}
        >
          <Feather name="alert-triangle" size={15} color="#fff" />
          <Text style={styles.geoAlertText}>
            Community safety alert for {geoAlert.city}{geoAlert.neighborhood ? ` · ${geoAlert.neighborhood}` : ""} — avg score {geoAlert.avgSafetyScore}/100 from {geoAlert.surveyCount} reports. Tap to dismiss.
          </Text>
        </TouchableOpacity>
      )}
      <View style={styles.searchRow}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        renderItem={({ item }) => (
          <CategoryPill
            label={item}
            selected={activeCategory === item}
            onPress={() => setActiveCategory(item)}
          />
        )}
        style={styles.catRow}
      />
      <SafetyPulseWidget />
      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
        renderItem={({ item }) => (
          <BusinessCard
            business={item}
            onPress={() => router.push({ pathname: "/business/[id]", params: { id: item.id } })}
            isSaved={isSaved(item.id)}
            onToggleSave={() => toggleSave(item.id)}
          />
        )}
      />

      {/* Safety Insights — gated for members */}
      <TouchableOpacity
        style={[styles.safetyBtn, { backgroundColor: colors.secondary }]}
        activeOpacity={0.85}
        onPress={() => {
          if (!isAuthenticated) {
            setShowUpgrade(true);
          } else {
            router.push("/safety-info");
          }
        }}
      >
        <Feather name="shield" size={15} color="#CA922B" />
        <Text style={[styles.safetyBtnText, { color: "#CA922B" }]}>Safety Insights</Text>
        {!isAuthenticated && <Feather name="lock" size={12} color="#CA922B" style={{ marginLeft: 2 }} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sosBtn}
        activeOpacity={0.85}
        onPress={() => {
          if (Platform.OS !== "web") {
            Linking.openURL("tel:911");
          }
        }}
      >
        <Feather name="phone-call" size={18} color="#FFFFFF" />
        <Text style={styles.sosBtnText}>SOS</Text>
      </TouchableOpacity>

      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="Safety Insights"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 26 },
  mapNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  mapNoticeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  geoAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#B45309",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  geoAlertText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#fff",
    flex: 1,
    lineHeight: 17,
  },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
  catRow: { flexShrink: 0 },
  catList: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  list: { paddingHorizontal: 16, paddingTop: 12 },
  sosBtn: {
    position: "absolute",
    bottom: 100,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#DC2626",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 30,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  sosBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF", letterSpacing: 1 },
  safetyBtn: {
    position: "absolute",
    bottom: 160,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  safetyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
