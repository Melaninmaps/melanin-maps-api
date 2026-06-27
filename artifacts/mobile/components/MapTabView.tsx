import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
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
import { useSafetyProximity, type ProximityWarning } from "@/hooks/useSafetyProximity";

const SEVERITY_COLORS: Record<string, string> = {
  low: "#F59E0B",
  medium: "#EF4444",
  high: "#DC2626",
  critical: "#7F1D1D",
};

const SEVERITY_LABELS: Record<string, string> = {
  low: "Low Risk",
  medium: "Community Alert",
  high: "High Alert",
  critical: "Critical Alert",
};

const CATEGORY_ICONS: Record<string, string> = {
  safety: "⚠️",
  sundown: "🚫",
  discrimination: "🛡️",
  business: "🏪",
  resource: "ℹ️",
  positive: "✅",
};

function ProximityWarningBanner({
  warning,
  onDismiss,
}: {
  warning: ProximityWarning;
  onDismiss: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const sc = SEVERITY_COLORS[warning.severity] ?? "#EF4444";

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }).start();
  }, [slideAnim]);

  return (
    <Animated.View
      style={[
        styles.proximityBanner,
        { backgroundColor: sc, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.proximityIcon}>{CATEGORY_ICONS[warning.category] ?? "⚠️"}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.proximityTitle}>
          {SEVERITY_LABELS[warning.severity] ?? "Safety Alert"} · {warning.name}
        </Text>
        <Text style={styles.proximityMeta}>
          {warning.reportCount} community {warning.reportCount === 1 ? "report" : "reports"} in 7 days
          {warning.distanceMeters < 1000
            ? ` · ${Math.round(warning.distanceMeters)}m away`
            : ` · ${(warning.distanceMeters / 1000).toFixed(1)}km away`}
        </Text>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Feather name="x" size={16} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function MapTabView() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, toggleSave } = useFavorites();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [warningIdx, setWarningIdx] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const { alert: geoAlert, dismissAlert } = useGeoSafeAlert();
  const { warnings, dismissWarning } = useSafetyProximity();

  const { businesses } = useBusinesses();
  const filtered = businesses.filter((b) => {
    const matchesSearch =
      search.length === 0 ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || b.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const flaggedIds = new Set(warnings.map((w) => w.targetId));

  const currentWarning = warnings[warningIdx] ?? null;

  const handleDismissCurrent = () => {
    if (!currentWarning) return;
    dismissWarning(currentWarning.targetId);
    setWarningIdx((i) => Math.max(0, i - 1));
  };

  useEffect(() => {
    if (warningIdx >= warnings.length && warnings.length > 0) {
      setWarningIdx(warnings.length - 1);
    }
  }, [warnings.length, warningIdx]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Map</Text>
        <View style={[styles.mapNotice, { backgroundColor: colors.secondary }]}>
          <Feather name="map" size={14} color={colors.primary} />
          <Text style={[styles.mapNoticeText, { color: colors.primary }]}>Use Expo Go for interactive map</Text>
        </View>
      </View>

      {currentWarning && (
        <ProximityWarningBanner
          warning={currentWarning}
          onDismiss={handleDismissCurrent}
        />
      )}

      {!currentWarning && geoAlert && (
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

      {warnings.length > 1 && (
        <View style={[styles.warningNav, { backgroundColor: colors.secondary }]}>
          <TouchableOpacity
            onPress={() => setWarningIdx((i) => Math.max(0, i - 1))}
            disabled={warningIdx === 0}
            style={{ opacity: warningIdx === 0 ? 0.3 : 1 }}
          >
            <Feather name="chevron-left" size={16} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.warningNavText, { color: colors.primary }]}>
            Alert {warningIdx + 1} of {warnings.length} nearby
          </Text>
          <TouchableOpacity
            onPress={() => setWarningIdx((i) => Math.min(warnings.length - 1, i + 1))}
            disabled={warningIdx === warnings.length - 1}
            style={{ opacity: warningIdx === warnings.length - 1 ? 0.3 : 1 }}
          >
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
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
        renderItem={({ item }) => {
          const isDangerous = flaggedIds.has(String(item.id));
          const w = warnings.find((x) => x.targetId === String(item.id));
          return (
            <View>
              {isDangerous && w && (
                <View style={[styles.dangerBadge, { borderColor: SEVERITY_COLORS[w.severity] + "55", backgroundColor: SEVERITY_COLORS[w.severity] + "11" }]}>
                  <Feather name="alert-triangle" size={12} color={SEVERITY_COLORS[w.severity]} />
                  <Text style={[styles.dangerBadgeText, { color: SEVERITY_COLORS[w.severity] }]}>
                    {SEVERITY_LABELS[w.severity]} · {w.reportCount} community {w.reportCount === 1 ? "report" : "reports"} in 7 days
                  </Text>
                </View>
              )}
              <BusinessCard
                business={item}
                onPress={() => router.push({ pathname: "/business/[id]", params: { id: item.id } })}
                isSaved={isSaved(item.id)}
                onToggleSave={() => toggleSave(item.id)}
              />
            </View>
          );
        }}
      />

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
