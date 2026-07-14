import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Circle, Marker, Polyline, PROVIDER_DEFAULT, type Region } from "react-native-maps";
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
import { useMembership } from "@/hooks/useMembership";
import { useSafetyProximity, type ProximityWarning } from "@/hooks/useSafetyProximity";

function decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
  const coords: Array<{ latitude: number; longitude: number }> = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

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

type ActiveAlert = {
  id: string;
  type: string;
  lat: number;
  lng: number;
  confirmedCount: number;
  distanceKm: number;
  status?: "possible" | "confirmed";
  description?: string | null;
};

const ALERT_TYPE_COLORS: Record<string, string> = {
  // Legacy
  police: "#3B82F6",
  ice: "#DC2626",
  checkpoint: "#F59E0B",
  traffic: "#F59E0B",
  other: "#8B5CF6",
  // Community Intelligence
  road_closure: "#F59E0B",
  construction: "#D97706",
  road_reopened: "#16A34A",
  transit_disruption: "#0EA5E9",
  protest: "#8B5CF6",
  celebration: "#10B981",
  festival: "#EC4899",
  severe_weather: "#6366F1",
  emergency: "#DC2626",
  avoid_area: "#DC2626",
  situation_cleared: "#16A34A",
};

const ALERT_TYPE_ICONS: Record<string, string> = {
  // Legacy
  police: "🚔",
  ice: "🚨",
  checkpoint: "⛔",
  traffic: "🚦",
  other: "⚠️",
  // Community Intelligence
  road_closure: "🚧",
  construction: "🏗️",
  road_reopened: "✅",
  transit_disruption: "🚌",
  protest: "✊🏾",
  celebration: "🎉",
  festival: "🎊",
  severe_weather: "⛈️",
  emergency: "🚨",
  avoid_area: "⛔",
  situation_cleared: "🟢",
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  // Legacy
  police: "Police Activity Reported",
  ice: "ICE / Immigration Activity",
  checkpoint: "Checkpoint Reported",
  traffic: "Traffic Issue",
  other: "Community Safety Alert",
  // Community Intelligence
  road_closure: "Road Closure",
  construction: "Construction Zone",
  road_reopened: "Road Reopened",
  transit_disruption: "Transit Disruption",
  protest: "Active Protest",
  celebration: "Community Celebration",
  festival: "Festival or Event",
  severe_weather: "Severe Weather",
  emergency: "Neighborhood Emergency",
  avoid_area: "Area to Avoid",
  situation_cleared: "Situation Cleared",
};

function ActiveAlertCard({
  alert,
  onDismiss,
}: {
  alert: ActiveAlert;
  onDismiss: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const color = ALERT_TYPE_COLORS[alert.type] ?? "#EF4444";
  const isConfirmed = (alert.status === "confirmed") || alert.confirmedCount >= 3;
  const statusColor = isConfirmed ? "#16A34A" : "#F59E0B";
  const statusLabel = isConfirmed ? "✓ Confirmed" : "⚡ Possible";

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
  }, [slideAnim]);

  const distMi = alert.distanceKm < 0.5
    ? "Less than 0.5 mi away"
    : `${Math.round((alert.distanceKm / 1.609) * 10) / 10} mi away`;

  return (
    <Animated.View
      style={[styles.warningCard, { borderLeftColor: statusColor, transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.warningTop}>
        <View style={styles.warningBadgeRow}>
          <View style={[styles.warningBadge, { backgroundColor: color + "22" }]}>
            <Text style={styles.warningIcon}>{ALERT_TYPE_ICONS[alert.type] ?? "⚠️"}</Text>
            <Text style={[styles.warningBadgeText, { color }]}>
              {ALERT_TYPE_LABELS[alert.type] ?? "Alert"}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + "18", borderColor: statusColor + "40" }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.warningName}>
        {alert.confirmedCount} community confirmation{alert.confirmedCount !== 1 ? "s" : ""}
      </Text>
      <Text style={styles.warningMeta}>{distMi} · Reported by your community</Text>
      <View style={styles.warningFooter}>
        <Text style={[styles.warningCategory, { color: statusColor }]}>
          {isConfirmed ? "Community-verified — stay aware" : "Unverified — use caution"}
        </Text>
        <Text style={styles.warningTip}>Be safe 🙏🏾</Text>
      </View>
    </Animated.View>
  );
}

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

  const { subscription } = useMembership();
  const isPaidMember = subscription !== null && ["active", "trialing"].includes(subscription.status ?? "");
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  type NavAlert = {
    id: string; type: string; distanceKm: number;
    confirmedCount: number; status?: string; description?: string | null;
  };
  type NavAlt = { id: string; name: string; city: string; category: string; latitude: number; longitude: number; distanceMiles: number };
  const [navDestAlerts, setNavDestAlerts] = useState<NavAlert[]>([]);
  const [navAlternatives, setNavAlternatives] = useState<NavAlt[]>([]);

  const HIGH_CONCERN_TYPES = new Set(["ice", "checkpoint", "avoid_area", "police"]);

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

  const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
  const [communityAlertPins, setCommunityAlertPins] = useState<ActiveAlert[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [alternatives, setAlternatives] = useState<Array<{
    id: string; name: string; city: string; category: string;
    latitude: number; longitude: number; distanceMiles: number;
  }>>([]);

  // Fetch active police/ICE/checkpoint pins near the user, refresh every 3 min
  useEffect(() => {
    if (!userLocation) return;
    const fetchAlerts = async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/community-alerts/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=16`
        );
        if (res.ok) {
          const data = await res.json();
          setCommunityAlertPins(data.alerts ?? []);
        }
      } catch { /**/ }
    };
    void fetchAlerts();
    const interval = setInterval(fetchAlerts, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userLocation?.lat, userLocation?.lng]);

  // When a non-minority business is selected, fetch nearby minority-owned alternatives
  useEffect(() => {
    if (!selected || selected.blackOwned) {
      setAlternatives([]);
      return;
    }
    const fetchAlts = async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/community-alerts/minority-alternatives?lat=${selected.latitude}&lng=${selected.longitude}&category=${encodeURIComponent(selected.category)}&radiusMiles=5`
        );
        if (res.ok) {
          const data = await res.json();
          setAlternatives(data.businesses ?? []);
        }
      } catch { /**/ }
    };
    void fetchAlts();
  }, [selected?.id]);

  // Active alerts within 1.5 km that the user hasn't dismissed
  const visibleActiveAlerts = communityAlertPins.filter(
    (a) => !dismissedAlertIds.has(a.id) && a.distanceKm < 1.5
  );

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
  const navHighAlerts = navDestAlerts.filter((a) => HIGH_CONCERN_TYPES.has(a.type));
  const navHasSafetyConcern = navHighAlerts.length > 0 || (selected ? flaggedBusinessIds.has(String(selected.id)) : false);

  const handleMarkerPress = (business: Business) => {
    setSelected(business);
    setRouteCoords([]);
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

  const handleNavigate = async (biz: Business) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isPaidMember) {
      const lat = biz.latitude;
      const lng = biz.longitude;
      const nativeUrl =
        Platform.OS === "ios"
          ? `maps://?daddr=${lat},${lng}&dirflg=d`
          : `google.navigation:q=${lat},${lng}`;
      const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      const canOpen = await Linking.canOpenURL(nativeUrl).catch(() => false);
      Linking.openURL(canOpen ? nativeUrl : webFallback);
      return;
    }

    setIsNavigating(true);
    setNavDestAlerts([]);
    setNavAlternatives([]);
    try {
      const origin = userLocation
        ? `${userLocation.lat},${userLocation.lng}`
        : `${INITIAL_REGION.latitude},${INITIAL_REGION.longitude}`;
      const destination = `${biz.latitude},${biz.longitude}`;

      // Fetch route + destination safety data in parallel
      const [routeRes, alertsRes] = await Promise.all([
        fetch(`${apiBase}/api/maps/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`),
        fetch(`${apiBase}/api/community-alerts/nearby?lat=${biz.latitude}&lng=${biz.longitude}&radius=8`),
      ]);

      if (routeRes.ok) {
        const data = await routeRes.json() as { routes?: Array<{ overview_polyline?: { points: string } }> };
        const points = data.routes?.[0]?.overview_polyline?.points;
        if (points) {
          const coords = decodePolyline(points);
          setRouteCoords(coords);
          if (coords.length > 0) {
            mapRef.current?.animateToRegion(
              {
                latitude: (coords[0].latitude + coords[coords.length - 1].latitude) / 2,
                longitude: (coords[0].longitude + coords[coords.length - 1].longitude) / 2,
                latitudeDelta: Math.abs(coords[0].latitude - coords[coords.length - 1].latitude) * 1.5 + 0.05,
                longitudeDelta: Math.abs(coords[0].longitude - coords[coords.length - 1].longitude) * 1.5 + 0.05,
              },
              800
            );
          }
        }
      }

      if (alertsRes.ok) {
        const alertData = await alertsRes.json() as { alerts?: NavAlert[] };
        const destAlerts = (alertData.alerts ?? []).filter((a) => a.distanceKm < 8);
        setNavDestAlerts(destAlerts);

        // Fetch minority-owned alternatives whenever navigating to any business
        // (safety concerns or not — give users the option to support community)
        const altsRes = await fetch(
          `${apiBase}/api/community-alerts/minority-alternatives?lat=${biz.latitude}&lng=${biz.longitude}&category=${encodeURIComponent(biz.category ?? "")}&radiusMiles=10`
        );
        if (altsRes.ok) {
          const altsData = await altsRes.json() as { businesses?: NavAlt[] };
          // Exclude the destination itself
          const alts = (altsData.businesses ?? []).filter((a) => String(a.id) !== String(biz.id));
          setNavAlternatives(alts.slice(0, 5));
        }
      }
    } catch { /**/ } finally {
      setIsNavigating(false);
    }
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

        {/* Community Intelligence alert pins with radius circles */}
        {communityAlertPins.map((alert) => {
          const typeColor = ALERT_TYPE_COLORS[alert.type] ?? "#EF4444";
          const isConfirmed = (alert.status === "confirmed") || alert.confirmedCount >= 3;
          const pinColor = isConfirmed ? typeColor : "#F59E0B";
          const radius = alert.type === "ice" || alert.type === "emergency" ? 500 : 300;
          return (
            <React.Fragment key={alert.id}>
              <Circle
                center={{ latitude: alert.lat, longitude: alert.lng }}
                radius={radius}
                fillColor={pinColor + (isConfirmed ? "1A" : "11")}
                strokeColor={pinColor + (isConfirmed ? "88" : "55")}
                strokeWidth={isConfirmed ? 2 : 1}
              />
              <Marker coordinate={{ latitude: alert.lat, longitude: alert.lng }}>
                <View style={[
                  styles.alertPin,
                  {
                    backgroundColor: pinColor + (isConfirmed ? "22" : "11"),
                    borderColor: pinColor,
                    borderWidth: isConfirmed ? 3 : 2,
                  },
                ]}>
                  <Text style={styles.alertPinIcon}>
                    {ALERT_TYPE_ICONS[alert.type] ?? "⚠️"}
                  </Text>
                  {isConfirmed && (
                    <View style={styles.confirmedDot} />
                  )}
                </View>
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

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#CA922B"
            strokeWidth={5}
            lineDashPattern={undefined}
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

      {/* Active police/ICE proximity cards — shown when user is within 1.5 km */}
      {visibleActiveAlerts.length > 0 && !showAllWarnings && (
        <View style={[styles.warningStack, { top: insets.top + (topWarning ? 228 : 120) }]}>
          <ActiveAlertCard
            alert={visibleActiveAlerts[0]}
            onDismiss={() =>
              setDismissedAlertIds((prev) => new Set([...prev, visibleActiveAlerts[0].id]))
            }
          />
          {visibleActiveAlerts.length > 1 && (
            <View style={styles.moreWarningsBtn}>
              <Feather name="alert-triangle" size={13} color="#EF4444" />
              <Text style={styles.moreWarningsText}>
                {visibleActiveAlerts.length - 1} more active alert{visibleActiveAlerts.length > 2 ? "s" : ""} nearby
              </Text>
            </View>
          )}
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
                onPress={() => handleNavigate(selected)}
                style={[styles.actionBtn, { backgroundColor: isNavigating ? colors.primary + "40" : colors.secondary }]}
                disabled={isNavigating}
              >
                <Feather
                  name="navigation"
                  size={18}
                  color={routeCoords.length > 0 ? colors.primary : (isNavigating ? colors.primary : colors.mutedForeground)}
                />
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

          {/* Minority-owned alternatives strip — shown when a non-minority business is selected */}
          {alternatives.length > 0 && routeCoords.length === 0 && (
            <View style={[styles.altSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.altTitle, { color: colors.foreground }]}>
                ✨ Try a minority-owned alternative nearby
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
                contentContainerStyle={{ gap: 8 }}
              >
                {alternatives.map((alt) => (
                  <TouchableOpacity
                    key={alt.id}
                    style={[styles.altChip, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}
                    onPress={() => {
                      const b = businesses.find((x) => String(x.id) === alt.id);
                      if (b) handleMarkerPress(b);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.altChipName, { color: colors.foreground }]} numberOfLines={1}>
                      {alt.name}
                    </Text>
                    <Text style={[styles.altChipMeta, { color: colors.primary }]}>
                      {alt.distanceMiles} mi · {alt.category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Route Safety Panel — shown when in-app navigation is active ── */}
          {routeCoords.length > 0 && (
            <View style={[styles.navSafetySection, { borderTopColor: navHasSafetyConcern ? "#DC262640" : colors.border }]}>

              {/* Header row */}
              <View style={styles.navSafetyHeader}>
                <View style={[styles.navSafetyBadge, { backgroundColor: navHasSafetyConcern ? "#DC262618" : "#16A34A18" }]}>
                  <Text style={styles.navSafetyIcon}>{navHasSafetyConcern ? "⚠️" : "✅"}</Text>
                  <Text style={[styles.navSafetyBadgeText, { color: navHasSafetyConcern ? "#DC2626" : "#16A34A" }]}>
                    {navHasSafetyConcern ? "Safety alerts near destination" : "Route looks clear"}
                  </Text>
                </View>
                {navDestAlerts.length > 0 && (
                  <View style={styles.navAlertCount}>
                    <Text style={styles.navAlertCountText}>{navDestAlerts.length} alert{navDestAlerts.length !== 1 ? "s" : ""}</Text>
                  </View>
                )}
              </View>

              {/* High-concern alerts */}
              {navHighAlerts.length > 0 && (
                <View style={{ gap: 6, marginTop: 8 }}>
                  {navHighAlerts.slice(0, 3).map((alert) => {
                    const color = ALERT_TYPE_COLORS[alert.type] ?? "#EF4444";
                    const dist = alert.distanceKm < 1
                      ? `${Math.round(alert.distanceKm * 1000)}m away`
                      : `${(alert.distanceKm / 1.609).toFixed(1)} mi away`;
                    return (
                      <View key={alert.id} style={[styles.navAlertRow, { backgroundColor: color + "12", borderColor: color + "30" }]}>
                        <Text style={styles.navAlertIcon}>{ALERT_TYPE_ICONS[alert.type] ?? "⚠️"}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.navAlertLabel, { color }]}>
                            {ALERT_TYPE_LABELS[alert.type] ?? "Community Alert"}
                          </Text>
                          <Text style={styles.navAlertMeta}>
                            {alert.confirmedCount} confirmation{alert.confirmedCount !== 1 ? "s" : ""} · {dist}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Business safety reports warning */}
              {selected && flaggedBusinessIds.has(String(selected.id)) && (() => {
                const w = warnings.find((x) => x.targetId === String(selected.id));
                if (!w) return null;
                return (
                  <View style={[styles.navAlertRow, { backgroundColor: "#EF444412", borderColor: "#EF444430", marginTop: 6 }]}>
                    <Text style={styles.navAlertIcon}>🏪</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.navAlertLabel, { color: "#EF4444" }]}>Community-flagged destination</Text>
                      <Text style={styles.navAlertMeta}>
                        {w.reportCount} safety report{w.reportCount !== 1 ? "s" : ""} in the last 7 days
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Minority-owned alternatives during navigation */}
              {navAlternatives.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.navAltsTitle, { color: colors.foreground }]}>
                    {navHasSafetyConcern
                      ? "Minority-owned alternatives nearby:"
                      : "Support the community — alternatives nearby:"}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 6 }}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {navAlternatives.map((alt) => {
                      const destBiz = businesses.find((x) => String(x.id) === alt.id);
                      return (
                        <TouchableOpacity
                          key={alt.id}
                          style={[styles.navAltChip, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "50" }]}
                          onPress={() => {
                            if (destBiz) {
                              handleMarkerPress(destBiz);
                            } else {
                              // navigate to this alternative directly
                              const fakeBiz = { ...alt, blackOwned: true, rating: 0, reviewCount: 0, verified: false, imageUrl: null } as unknown as Business;
                              handleNavigate(fakeBiz);
                            }
                          }}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.navAltName, { color: colors.foreground }]} numberOfLines={1}>
                            {alt.name}
                          </Text>
                          <Text style={[styles.navAltMeta, { color: colors.primary }]}>
                            {alt.distanceMiles} mi · {alt.category}
                          </Text>
                          <View style={[styles.navAltBtn, { backgroundColor: colors.primary }]}>
                            <Text style={styles.navAltBtnText}>Navigate →</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

            </View>
          )}

          <TouchableOpacity onPress={() => { setSelected(null); setRouteCoords([]); }} style={styles.dismissBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
  warningTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  warningBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, flexWrap: "wrap" },
  warningBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  statusPillText: { fontFamily: "Inter_700Bold", fontSize: 10 },
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
  alertPin: {
    width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22, shadowRadius: 6, elevation: 6,
  },
  alertPinIcon: { fontSize: 16 },
  confirmedDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: "#16A34A", borderWidth: 1.5, borderColor: "#fff",
  },
  altSection: { borderTopWidth: 1, marginTop: 10, paddingTop: 10 },
  altTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  altChip: {
    borderRadius: 10, borderWidth: 1, padding: 9, minWidth: 120, maxWidth: 160,
  },
  altChipName: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 2 },
  altChipMeta: { fontFamily: "Inter_400Regular", fontSize: 11 },
  // ── Route Safety Panel styles ──
  navSafetySection: {
    borderTopWidth: 1, marginTop: 10, paddingTop: 10, gap: 4,
  },
  navSafetyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navSafetyBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  navSafetyIcon: { fontSize: 12 },
  navSafetyBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  navAlertCount: {
    backgroundColor: "#EF444418", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  navAlertCountText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#EF4444" },
  navAlertRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 8, borderRadius: 8, borderWidth: 1,
  },
  navAlertIcon: { fontSize: 13, marginTop: 1 },
  navAlertLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, lineHeight: 16 },
  navAlertMeta: { fontFamily: "Inter_400Regular", fontSize: 10, color: "#6B7280", marginTop: 1 },
  navAltsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  navAltChip: {
    borderRadius: 10, borderWidth: 1, padding: 9, minWidth: 140, maxWidth: 180, gap: 2,
  },
  navAltName: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  navAltMeta: { fontFamily: "Inter_400Regular", fontSize: 11 },
  navAltBtn: {
    marginTop: 6, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start",
  },
  navAltBtnText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#FFF" },
});
