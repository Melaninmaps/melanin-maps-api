import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

      <View style={styles.searchRow}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        keyboardDismissMode="on-drag"
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
        keyboardDismissMode="on-drag"
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

      {/* Police / ICE awareness uses the explicit city-region flow, not a map-local report. */}
      <TouchableOpacity
        style={[styles.reportBtn, { backgroundColor: "#1E3A8A" }]}
        activeOpacity={0.85}
        onPress={() => {
          if (!isAuthenticated) {
            setShowUpgrade(true);
          } else {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/report-police");
          }
        }}
      >
        <Text style={{ fontSize: 14 }}>🚔</Text>
        <Text style={styles.reportBtnText}>Police / ICE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.safetyBtn, { backgroundColor: colors.secondary }]}
        activeOpacity={0.85}
        onPress={() => {
          if (!isAuthenticated) {
            setShowUpgrade(true);
          } else {
            router.push("/safety-hub");
          }
        }}
      >
        <Feather name="shield" size={15} color="#CA922B" />
        <Text style={[styles.safetyBtnText, { color: "#CA922B" }]}>Safety Insights</Text>
        {!isAuthenticated && <Feather name="lock" size={12} color="#CA922B" style={{ marginLeft: 2 }} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.flaggedBtn, { backgroundColor: "#0F766E" }]}
        activeOpacity={0.85}
        onPress={() => {
          if (!isAuthenticated) {
            setShowUpgrade(true);
          } else {
            router.push("/report-intelligence");
          }
        }}
      >
        <Feather name="bar-chart-2" size={13} color="#CCFBF1" />
        <Text style={[styles.safetyBtnText, { color: "#CCFBF1" }]}>Community Intelligence</Text>
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
  proximityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  proximityIcon: { fontSize: 18 },
  proximityTitle: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  proximityMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  warningNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  warningNavText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
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
  dangerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  dangerBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  scannerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  scannerTitle: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  scannerMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  scannerAction: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  alertCountBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  alertCountText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#fff" },
  reportBtn: {
    position: "absolute",
    bottom: 220,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  reportBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  reportBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  reportBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#fff" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 36,
    gap: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.35)",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 19 },
  modalSub: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  reportTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  reportSubmitBtn: {
    marginTop: 6,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  reportSubmitText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  reportDisclaimer: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", lineHeight: 16, marginTop: 4 },
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
  flaggedBtn: {
    position: "absolute",
    bottom: 210,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  flaggedSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", minHeight: 300 },
  flaggedHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  flaggedTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 3 },
  flaggedSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
  flaggedCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32, minHeight: 200 },
  flaggedEmptyText: { fontFamily: "Inter_600SemiBold", fontSize: 16, textAlign: "center" },
  flaggedEmptySubtext: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 18 },
  flaggedCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  flaggedCardLeft: { alignItems: "center" },
  flaggedAlertBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center", minWidth: 48 },
  flaggedAlertCount: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#FCA5A5" },
  flaggedAlertLabel: { fontFamily: "Inter_400Regular", fontSize: 9, color: "#FCA5A5", letterSpacing: 0.5 },
  flaggedCardName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  flaggedCardMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  flaggedCardDist: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
});
