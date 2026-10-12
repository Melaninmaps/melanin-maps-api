import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Marker, Polyline, PROVIDER_DEFAULT, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IntentModal, type PinLocation } from "@/components/IntentModal";
import { RatingStars } from "@/components/RatingStars";
import { SearchBar } from "@/components/SearchBar";
import { VerificationBadge } from "@/components/VerificationBadge";
import type { Business } from "@/constants/types";
import { useColors } from "@/hooks/useColors";
import { useFavorites } from "@/hooks/useFavorites";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useMembership } from "@/hooks/useMembership";
import { useUserPreferences } from "@/hooks/useUserPreferences";

// Strip HTML tags from Google Directions html_instructions
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Fetch KinfolkAI-voiced navigation steps from the server
async function fetchVoicedSteps(
  steps: string[],
  destCity: string,
  destName: string,
  voiceMode: string,
  prefs: { communicationStyle?: string; emojiLevel?: string; humorLevel?: string; culturalInterests?: string[] } | null,
  apiBase: string,
): Promise<string[]> {
  try {
    const res = await fetch(`${apiBase}/api/maps/nav-voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps, destCity, destName, voiceMode, prefs }),
    });
    if (!res.ok) return steps;
    const data = await res.json() as { voicedSteps?: string[] };
    if (Array.isArray(data.voicedSteps) && data.voicedSteps.length > 0) return data.voicedSteps;
  } catch { /* fall through */ }
  return steps;
}

function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const coords: { latitude: number; longitude: number }[] = [];
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

export function MapTabView() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, toggleSave } = useFavorites();
  const mapRef = useRef<MapView>(null);

  const [locationGrantedLocal, setLocationGrantedLocal] = useState(false);
  const [search, setSearch] = useState("");
  // Map shortcut chips were removed for a calmer surface. Typed search keeps
  // every category discoverable, including markets and HBCUs.
  const activeCategory = "All";
  const [selected, setSelected] = useState<Business | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(INITIAL_REGION);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [pendingPinLocation, setPendingPinLocation] = useState<PinLocation | null>(null);
  const { subscription } = useMembership();
  const isPaidMember = subscription !== null && ["active", "trialing"].includes(subscription.status ?? "");
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // ── KinfolkAI Voice Navigation state ────────────────────────────────────
  type VoiceMode = "professional" | "community" | "local" | "home";
  const [navVoiceMode, setNavVoiceMode] = useState<VoiceMode>("community");
  const [voicedSteps, setVoicedSteps] = useState<string[]>([]);
  const [navRawSteps, setNavRawSteps] = useState<string[]>([]);
  const [navDestCity, setNavDestCity] = useState<string>("");
  const [currentNavStep, setCurrentNavStep] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const { preferences: userPrefs } = useUserPreferences();

  // Speak the current navigation step whenever it changes (if not muted)
  useEffect(() => {
    const step = voicedSteps[currentNavStep];
    if (!isMuted && step && routeCoords.length > 0) {
      Speech.stop();
      Speech.speak(step, { language: "en-US", rate: 0.95 });
    }
  }, [currentNavStep, voicedSteps, isMuted, routeCoords.length]);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setLocationGrantedLocal(status === "granted");
    });
  }, []);

  const apiBase = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

  // Re-voice steps in new mode when user changes the discretion selector
  const handleVoiceModeChange = useCallback(async (mode: VoiceMode) => {
    setNavVoiceMode(mode);
    if (navRawSteps.length === 0) return;
    const voiced = await fetchVoicedSteps(
      navRawSteps,
      navDestCity,
      selected?.name ?? "",
      mode,
      userPrefs ? {
        communicationStyle: userPrefs.communicationStyle,
        emojiLevel: userPrefs.emojiLevel,
        humorLevel: userPrefs.humorLevel,
        culturalInterests: userPrefs.culturalInterests,
      } : null,
      apiBase,
    );
    setVoicedSteps(voiced);
    setCurrentNavStep(0);
  }, [navRawSteps, navDestCity, selected, userPrefs, apiBase]);

  const { businesses } = useBusinesses();
  const filtered = businesses.filter((b) => {
    const matchesSearch =
      search.length === 0 ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || b.category === activeCategory;
    return matchesSearch && matchesCat;
  });

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
    setVoicedSteps([]);
    setNavRawSteps([]);
    setCurrentNavStep(0);
    setNavDestCity(biz.city ?? "");
    try {
      // Directions use the member's active map area, never a Safety-proximity
      // location state. This value stays within ordinary map navigation only.
      const origin = `${currentRegion.latitude},${currentRegion.longitude}`;
      const destination = `${biz.latitude},${biz.longitude}`;

      // Navigation uses the selected business and the member's own map choice.
      // It never queries or presents a map-local safety assessment.
      const routeRes = await fetch(
        `${apiBase}/api/maps/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
      );

      if (routeRes.ok) {
        type GStep = { html_instructions: string; distance?: { text: string }; duration?: { text: string } };
        type GRoute = { overview_polyline?: { points: string }; legs?: { steps?: GStep[] }[] };
        const data = await routeRes.json() as { routes?: GRoute[] };
        const points = data.routes?.[0]?.overview_polyline?.points;
        // Extract plain-text steps for KinfolkAI voice translation
        const rawSteps = (data.routes?.[0]?.legs?.[0]?.steps ?? [])
          .map((s) => stripHtml(s.html_instructions) + (s.distance?.text ? ` (${s.distance.text})` : ""))
          .filter(Boolean);
        if (rawSteps.length > 0) {
          setNavRawSteps(rawSteps);
          // Fire voice translation in background — don't block the route display
          void fetchVoicedSteps(
            rawSteps,
            biz.city ?? "",
            biz.name,
            navVoiceMode,
            userPrefs ? {
              communicationStyle: userPrefs.communicationStyle,
              emojiLevel: userPrefs.emojiLevel,
              humorLevel: userPrefs.humorLevel,
              culturalInterests: userPrefs.culturalInterests,
            } : null,
            apiBase,
          ).then((voiced) => {
            setVoicedSteps(voiced);
            setCurrentNavStep(0);
          });
        }
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation={locationGrantedLocal}
        showsMyLocationButton={false}
        onRegionChangeComplete={setCurrentRegion}
      >
        {filtered.map((b) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: b.latitude, longitude: b.longitude }}
            onPress={() => handleMarkerPress(b)}
          >
            <View
              style={[
                styles.pin,
                {
                  backgroundColor: selected?.id === b.id ? colors.primary : colors.card,
                  borderColor: selected?.id === b.id ? colors.primary : colors.primary,
                  borderWidth: 2,
                },
              ]}
            >
              <Feather
                name="map-pin"
                size={14}
                color={selected?.id === b.id ? colors.primaryForeground : colors.primary}
              />
            </View>
            <Callout tooltip><View /></Callout>
          </Marker>
        ))}

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
      </View>

      {/* ── KinfolkAI Navigation Voice Step Banner ── */}
      {routeCoords.length > 0 && voicedSteps.length > 0 && (
        <View style={[styles.navStepBanner, { top: insets.top + 120 }]} pointerEvents="box-none">
          <View style={[styles.navStepCard, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
            <View style={styles.navStepLeft}>
              <View style={[styles.navStepCountBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.navStepCountText, { color: colors.primary }]}>
                  {currentNavStep + 1}/{voicedSteps.length}
                </Text>
              </View>
              <Text style={[styles.navStepText, { color: colors.foreground }]} numberOfLines={3}>
                {voicedSteps[currentNavStep]}
              </Text>
            </View>
            <View style={styles.navStepControls}>
              <TouchableOpacity
                onPress={() => setIsMuted((m) => !m)}
                style={[styles.navStepIconBtn, { backgroundColor: isMuted ? "#EF444418" : colors.primary + "18" }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name={isMuted ? "volume-x" : "volume-2"} size={15} color={isMuted ? "#EF4444" : colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                disabled={currentNavStep === 0}
                onPress={() => setCurrentNavStep((s) => Math.max(0, s - 1))}
                style={[styles.navStepIconBtn, { backgroundColor: colors.muted, opacity: currentNavStep === 0 ? 0.35 : 1 }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="chevron-up" size={15} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity
                disabled={currentNavStep === voicedSteps.length - 1}
                onPress={() => setCurrentNavStep((s) => Math.min(voicedSteps.length - 1, s + 1))}
                style={[styles.navStepIconBtn, { backgroundColor: colors.muted, opacity: currentNavStep === voicedSteps.length - 1 ? 0.35 : 1 }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="chevron-down" size={15} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>
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

          {/* ── Route guidance — never a safety assessment ── */}
          {routeCoords.length > 0 && (
            <View style={[styles.navSafetySection, { borderTopColor: colors.border }]}>

              <View style={styles.navSafetyHeader}>
                <View style={[styles.navSafetyBadge, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="navigation" size={14} color={colors.primary} />
                  <Text style={[styles.navSafetyBadgeText, { color: colors.primary }]}>Navigation guidance</Text>
                </View>
              </View>
              <Text style={[styles.navSafetyNote, { color: colors.mutedForeground }]}>Route details do not include a safety assessment. Choose a city in Community Intelligence for consented, aggregate-only context.</Text>

              {/* KinfolkAI Voice discretion selector */}
              <View style={styles.navVoiceRow}>
                <Text style={[styles.navVoiceLabel, { color: colors.mutedForeground }]}>Navigator voice:</Text>
                <View style={styles.navVoicePills}>
                  {(["professional", "community", "local", "home"] as const).map((mode) => {
                    const labels: Record<string, string> = {
                      professional: "Pro",
                      community: "Community",
                      local: "Local",
                      home: "Home",
                    };
                    const active = navVoiceMode === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          styles.navVoicePill,
                          active
                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                            : { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" },
                        ]}
                        onPress={() => void handleVoiceModeChange(mode)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.navVoicePillText, { color: active ? "#FFF" : colors.primary }]}>
                          {labels[mode]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            </View>
          )}

          <TouchableOpacity
            onPress={() => {
              setSelected(null);
              setRouteCoords([]);
              setVoicedSteps([]);
              setNavRawSteps([]);
              setCurrentNavStep(0);
              Speech.stop();
            }}
            style={styles.dismissBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
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
  navSafetyNote: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15, marginTop: 2 },
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
  // ── KinfolkAI Voice mode selector ──
  navVoiceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" },
  navVoiceLabel: { fontFamily: "Inter_500Medium", fontSize: 11 },
  navVoicePills: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  navVoicePill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  navVoicePillText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  // ── KinfolkAI Voice Step Banner ──
  navStepBanner: {
    position: "absolute", left: 12, right: 12, zIndex: 25,
  },
  navStepCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 16, padding: 14,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 10,
  },
  navStepLeft: { flex: 1, gap: 6 },
  navStepCountBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  navStepCountText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  navStepText: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 },
  navStepControls: { gap: 6, alignItems: "center" },
  navStepIconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
