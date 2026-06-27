import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Circle, Marker, PROVIDER_DEFAULT, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryPill } from "@/components/CategoryPill";
import { IntentModal, type PinLocation } from "@/components/IntentModal";
import { RatingStars } from "@/components/RatingStars";
import { SearchBar } from "@/components/SearchBar";
import { VerificationBadge } from "@/components/VerificationBadge";
import { CATEGORIES } from "@/constants/data";
import type { Business } from "@/constants/types";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useSafetyProximity, type ProximityWarning } from "@/hooks/useSafetyProximity";

const INITIAL_REGION: Region = {
  latitude: 33.7,
  longitude: -84.38,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

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

function ProximityWarningCard({
  warning,
  onDismiss,
}: {
  warning: ProximityWarning;
  onDismiss: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const colors = SEVERITY_COLORS[warning.severity] ?? "#EF4444";

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const distLabel =
    warning.distanceMeters < 100
      ? "You are very close"
      : `${Math.round(warning.distanceMeters)}m away`;

  const icon = CATEGORY_ICONS[warning.category] ?? "⚠️";

  return (
    <Animated.View
      style={[
        styles.warningCard,
        { borderLeftColor: colors, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.warningTop}>
        <View style={[styles.warningBadge, { backgroundColor: colors + "22" }]}>
          <Text style={styles.warningIcon}>{icon}</Text>
          <Text style={[styles.warningBadgeText, { color: colors }]}>
            {SEVERITY_LABELS[warning.severity] ?? "Alert"}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.warningName} numberOfLines={1}>
        {warning.name}
      </Text>
      <Text style={styles.warningMeta}>
        {warning.reportCount} community {warning.reportCount === 1 ? "report" : "reports"} in the last 7 days · {distLabel}
      </Text>
      <View style={styles.warningFooter}>
        <Text style={[styles.warningCategory, { color: colors }]}>
          {warning.category.charAt(0).toUpperCase() + warning.category.slice(1)} concern
        </Text>
        <Text style={styles.warningTip}>Stay aware of your surroundings</Text>
      </View>
    </Animated.View>
  );
}

export function MapTabView() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, toggleSave } = useFavorites();
  const mapRef = useRef<MapView>(null);

  const [locationGrantedLocal, setLocationGrantedLocal] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selected, setSelected] = useState<Business | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(INITIAL_REGION);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [pendingPinLocation, setPendingPinLocation] = useState<PinLocation | null>(null);
  const [showAllWarnings, setShowAllWarnings] = useState(false);

  const {
    warnings,
    locationGranted: proximityGranted,
    userLocation,
    dismissWarning,
    dismissAll,
  } = useSafetyProximity();

  const prevWarningCount = useRef(0);

  useEffect(() => {
    if (warnings.length > prevWarningCount.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    prevWarningCount.current = warnings.length;
  }, [warnings.length]);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setLocationGrantedLocal(status === "granted");
    });
  }, []);

  const { businesses } = useBusinesses();
  const filtered = businesses.filter((b) => {
    const matchesSearch =
      search.length === 0 ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || b.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const flaggedBusinessIds = new Set(warnings.map((w) => w.targetId));

  const handleMarkerPress = (business: Business) => {
    setSelected(business);
    mapRef.current?.animateToRegion(
      {
        latitude: business.latitude,
        longitude: business.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      500
    );
  };

  const handlePinArea = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const lat = currentRegion.latitude;
    const lng = currentRegion.longitude;
    let label = "My selected area";
    let city: string | undefined;
    let state: string | undefined;
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (place) {
        city = place.city ?? place.subregion ?? undefined;
        state = place.region ?? undefined;
        label = place.district ?? place.subregion ?? place.city ?? place.name ?? label;
      }
    } catch { /**/ }
    setPendingPinLocation({ label, city, state, latitude: lat, longitude: lng });
    setShowIntentModal(true);
  };

  const handlePinSaved = (_intentId: string, pinId: string) => {
    setShowIntentModal(false);
    setPendingPinLocation(null);
    router.push({ pathname: "/smart-pathway", params: { pinId } } as never);
  };

  const topWarning = warnings[0] ?? null;
  const extraCount = warnings.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation={locationGrantedLocal || proximityGranted}
        showsMyLocationButton={false}
        onRegionChangeComplete={setCurrentRegion}
      >
        {filtered.map((b) => {
          const isDangerous = flaggedBusinessIds.has(String(b.id));
          const warning = warnings.find((w) => w.targetId === String(b.id));
          const pinColor = isDangerous
            ? (SEVERITY_COLORS[warning?.severity ?? "medium"])
            : (selected?.id === b.id ? colors.primary : colors.card);

          return (
            <React.Fragment key={b.id}>
              {isDangerous && (
                <Circle
                  center={{ latitude: b.latitude, longitude: b.longitude }}
                  radius={120}
                  fillColor={`${SEVERITY_COLORS[warning?.severity ?? "medium"]}33`}
                  strokeColor={`${SEVERITY_COLORS[warning?.severity ?? "medium"]}88`}
                  strokeWidth={2}
                />
              )}
              <Marker
                coordinate={{ latitude: b.latitude, longitude: b.longitude }}
                onPress={() => handleMarkerPress(b)}
              >
                <View
                  style={[
                    styles.pin,
                    {
                      backgroundColor: isDangerous ? (SEVERITY_COLORS[warning?.severity ?? "medium"] + "22") : (selected?.id === b.id ? colors.primary : colors.card),
                      borderColor: pinColor,
                      borderWidth: isDangerous ? 2.5 : 2,
                    },
                  ]}
                >
                  <Feather
                    name={isDangerous ? "alert-triangle" : "map-pin"}
                    size={14}
                    color={isDangerous ? SEVERITY_COLORS[warning?.severity ?? "medium"] : (selected?.id === b.id ? colors.primaryForeground : colors.primary)}
                  />
                </View>
                <Callout tooltip><View /></Callout>
              </Marker>
            </React.Fragment>
          );
        })}

        {userLocation && (
          <Circle
            center={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            radius={500}
            fillColor="rgba(59,130,246,0.05)"
            strokeColor="rgba(59,130,246,0.25)"
            strokeWidth={1}
          />
        )}
      </MapView>

      <View style={[styles.overlay, { top: insets.top + 8 }]}>
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
      </View>

      {topWarning && !showAllWarnings && (
        <View style={[styles.warningStack, { top: insets.top + 120 }]}>
          <ProximityWarningCard
            warning={topWarning}
            onDismiss={() => dismissWarning(topWarning.targetId)}
          />
          {extraCount > 0 && (
            <TouchableOpacity
              style={styles.moreWarningsBtn}
              onPress={() => setShowAllWarnings(true)}
            >
              <Feather name="alert-triangle" size={13} color="#EF4444" />
              <Text style={styles.moreWarningsText}>
                {extraCount} more alert{extraCount > 1 ? "s" : ""} in this area
              </Text>
              <Feather name="chevron-down" size={13} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {showAllWarnings && warnings.length > 0 && (
        <View style={[styles.allWarningsPanel, { top: insets.top + 120, bottom: insets.bottom + 200 }]}>
          <View style={styles.allWarningsHeader}>
            <Text style={styles.allWarningsTitle}>
              {warnings.length} Safety Alert{warnings.length > 1 ? "s" : ""} Nearby
            </Text>
            <TouchableOpacity onPress={() => { dismissAll(); setShowAllWarnings(false); }}>
              <Text style={styles.dismissAllText}>Dismiss All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {warnings.map((w) => (
              <ProximityWarningCard
                key={w.targetId}
                warning={w}
                onDismiss={() => {
                  dismissWarning(w.targetId);
                  if (warnings.length <= 1) setShowAllWarnings(false);
                }}
              />
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.collapseBtn} onPress={() => setShowAllWarnings(false)}>
            <Feather name="chevron-up" size={16} color="#6B7280" />
            <Text style={styles.collapseText}>Collapse</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.pinAreaBtn, {
          backgroundColor: colors.primary,
          bottom: (selected ? 200 : 100) + insets.bottom + 58,
        }]}
        onPress={handlePinArea}
        activeOpacity={0.85}
      >
        <Feather name="map-pin" size={16} color="#FFF" />
        <Text style={styles.pinAreaTxt}>Pin Area</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.myLocationBtn, { backgroundColor: colors.card, shadowColor: colors.foreground, bottom: (selected ? 200 : 100) + insets.bottom }]}
        onPress={() => {
          mapRef.current?.animateToRegion(INITIAL_REGION, 800);
          setSelected(null);
        }}
        activeOpacity={0.8}
      >
        <Feather name="navigation" size={20} color={colors.primary} />
      </TouchableOpacity>

      {selected && (
        <View style={[styles.selectedCard, { backgroundColor: colors.card, shadowColor: colors.foreground, bottom: insets.bottom + 90 }]}>
          {flaggedBusinessIds.has(String(selected.id)) && (() => {
            const w = warnings.find((x) => x.targetId === String(selected.id));
            const sc = SEVERITY_COLORS[w?.severity ?? "medium"];
            return (
              <View style={[styles.businessWarningBadge, { backgroundColor: sc + "18", borderColor: sc + "55" }]}>
                <Feather name="alert-triangle" size={12} color={sc} />
                <Text style={[styles.businessWarningText, { color: sc }]}>
                  {w?.reportCount} community safety {w?.reportCount === 1 ? "report" : "reports"} in the last 7 days
                </Text>
              </View>
            );
          })()}
          <View style={styles.selectedTop}>
            <View style={styles.selectedInfo}>
              <Text style={[styles.selectedName, { color: colors.foreground }]} numberOfLines={1}>{selected.name}</Text>
              <View style={styles.selectedMeta}>
                <Text style={[styles.selectedCategory, { color: colors.primary }]}>{selected.category}</Text>
                {selected.verified && <VerificationBadge />}
              </View>
              <RatingStars rating={selected.rating} reviewCount={selected.reviewCount} size={12} />
              <Text style={[styles.selectedAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
                {selected.city}, {selected.state}
              </Text>
            </View>
            <View style={styles.selectedActions}>
              <TouchableOpacity onPress={() => toggleSave(selected.id)} style={[styles.actionBtn, { backgroundColor: colors.secondary }]}>
                <Feather name="bookmark" size={18} color={isSaved(selected.id) ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/business/[id]", params: { id: selected.id } })}
                style={[styles.viewBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.viewText, { color: colors.primaryForeground }]}>View</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.exploreNeighborhood, { borderTopColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPendingPinLocation({
                label: `${selected.city} area`,
                city: selected.city,
                state: selected.state,
                latitude: selected.latitude,
                longitude: selected.longitude,
              });
              setShowIntentModal(true);
            }}
          >
            <Feather name="compass" size={14} color={colors.primary} />
            <Text style={[styles.exploreTxt, { color: colors.primary }]}>Explore this neighborhood →</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSelected(null)} style={styles.dismissBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      <IntentModal
        visible={showIntentModal}
        location={pendingPinLocation}
        onClose={() => { setShowIntentModal(false); setPendingPinLocation(null); }}
        onSaved={handlePinSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { position: "absolute", left: 0, right: 0, gap: 10 },
  searchWrap: { paddingHorizontal: 16 },
  categoryScroll: { paddingHorizontal: 16, gap: 8 },
  pin: {
    width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
    borderWidth: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  warningStack: {
    position: "absolute",
    left: 12,
    right: 12,
    gap: 6,
    zIndex: 20,
  },
  warningCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  warningTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  warningBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  warningIcon: { fontSize: 12 },
  warningBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 0.3 },
  warningName: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#111827" },
  warningMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#6B7280", lineHeight: 17 },
  warningFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  warningCategory: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  warningTip: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#9CA3AF", fontStyle: "italic" },
  moreWarningsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  moreWarningsText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#EF4444" },
  allWarningsPanel: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 14,
    zIndex: 25,
  },
  allWarningsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  allWarningsTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#111827" },
  dismissAllText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#EF4444" },
  collapseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingTop: 8 },
  collapseText: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#6B7280" },
  businessWarningBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, marginBottom: 10,
  },
  businessWarningText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1, lineHeight: 16 },
  pinAreaBtn: {
    position: "absolute", right: 16, flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5,
  },
  pinAreaTxt: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  myLocationBtn: {
    position: "absolute", right: 16, width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  selectedCard: {
    position: "absolute", left: 16, right: 16, borderRadius: 16, padding: 16,
    shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  selectedTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  selectedInfo: { flex: 1, gap: 4 },
  selectedName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  selectedMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectedCategory: { fontFamily: "Inter_500Medium", fontSize: 12 },
  selectedAddr: { fontFamily: "Inter_400Regular", fontSize: 12 },
  selectedActions: { gap: 8 },
  actionBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  viewBtn: { paddingHorizontal: 16, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  viewText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  exploreNeighborhood: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 12, marginTop: 10, borderTopWidth: 1 },
  exploreTxt: { fontSize: 13, fontWeight: "700" },
  dismissBtn: { position: "absolute", top: 10, right: 10 },
});
