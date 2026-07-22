import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker, PROVIDER_DEFAULT, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryPill } from "@/components/CategoryPill";
import { CATEGORIES } from "@/constants/data";
import type { Business } from "@/constants/types";
import { useActivityAlerts, ALERT_META, type AlertType } from "@/hooks/useActivityAlerts";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useColors } from "@/hooks/useColors";
import { useGeoSafeAlert } from "@/hooks/useGeoSafeAlert";
import { useSafetyProximity } from "@/hooks/useSafetyProximity";
import { useAuth } from "@/lib/auth";

const GOLD = "#CA922B";

const DEFAULT_REGION: Region = {
  latitude: 39.9526,
  longitude: -75.1652,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

interface HeatmapPoint {
  city: string;
  state: string;
  lat: number;
  lng: number;
  avgScore: number;
  surveyCount: number;
  tier: "safe" | "moderate" | "alert";
}

interface CulturalSite {
  id: string;
  name: string;
  description: string;
  category: string;
  heritageCategory: string;
  subcategory?: string | null;
  city: string;
  state: string;
  address?: string | null;
  latitude: string;
  longitude: string;
  era: string | null;
  significance: string | null;
  externalUrl?: string | null;
  yearEstablished?: number | null;
}

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface CategoryStyle {
  color: string;
  icon: FeatherIconName;
  label: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "HBCU":                    { color: "#7C3AED", icon: "book-open",  label: "HBCU" },
  "Civil Rights":             { color: "#DC2626", icon: "flag",        label: "Civil Rights" },
  "African American Heritage":{ color: "#CA922B", icon: "star",        label: "Heritage" },
  "Native American Heritage": { color: "#065F46", icon: "globe",       label: "Native" },
  "Hispanic & Latino Heritage":{ color: "#B45309", icon: "map-pin",   label: "Latino" },
  "LGBTQ+ History":           { color: "#9D174D", icon: "heart",       label: "LGBTQ+" },
  "Women's History":          { color: "#7E22CE", icon: "user",        label: "Women's" },
  "Cultural Neighborhood":    { color: "#1D4ED8", icon: "home",        label: "Neighborhood" },
  "Freedom Trail":            { color: "#92400E", icon: "compass",     label: "Freedom Trail" },
  "Religious Heritage":       { color: "#4B5563", icon: "sun",         label: "Religious" },
  "Immigrant Heritage":       { color: "#0F766E", icon: "anchor",      label: "Immigrant" },
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = { color: "#6B7280", icon: "map-pin", label: "Site" };

function getCategoryStyle(heritageCategory: string): CategoryStyle {
  return CATEGORY_STYLES[heritageCategory] ?? DEFAULT_CATEGORY_STYLE;
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

export function FullMapView() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [locationGranted, setLocationGranted] = useState(false);
  const [locating, setLocating] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [scannerAlertIdx, setScannerAlertIdx] = useState(0);
  const [warningIdx, setWarningIdx] = useState(0);

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showCulturalSites, setShowCulturalSites] = useState(true);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [culturalSites, setCulturalSites] = useState<CulturalSite[]>([]);
  const [selectedCulturalSite, setSelectedCulturalSite] = useState<CulturalSite | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );
  const { user } = useAuth();
  const pollingEnabled = isFocused && user !== null;

  const { businesses } = useBusinesses();
  const { alerts: activityAlerts, confirmAlert, clearAlert, dismissAlert } = useActivityAlerts({ enabled: pollingEnabled });
  const { warnings, dismissWarning } = useSafetyProximity({ enabled: pollingEnabled });
  const { alert: geoAlert, dismissAlert: dismissGeoAlert } = useGeoSafeAlert();

  const mapped = businesses.filter(
    (b) =>
      b.latitude != null &&
      b.longitude != null &&
      !isNaN(b.latitude) &&
      !isNaN(b.longitude) &&
      isFinite(b.latitude) &&
      isFinite(b.longitude) &&
      b.latitude >= -90 && b.latitude <= 90 &&
      b.longitude >= -180 && b.longitude <= 180 &&
      (activeCategory === "All" || b.category === activeCategory),
  );

  const currentWarning = warnings[warningIdx] ?? null;

  useEffect(() => {
    if (warningIdx >= warnings.length && warnings.length > 0) {
      setWarningIdx(warnings.length - 1);
    }
  }, [warnings.length, warningIdx]);

  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setLocating(false); return; }
        setLocationGranted(true);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        mapRef.current?.animateToRegion(
          { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.12, longitudeDelta: 0.12 },
          800,
        );
      } catch {
        // permission denied — stays at default US overview
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (showHeatmap && heatmapPoints.length === 0) {
      void (async () => {
        try {
          const base = getApiBase();
          if (!base) return;
          const res = await fetch(`${base}/api/safety/heatmap`);
          if (res.ok) {
            const data = await res.json() as { points: HeatmapPoint[] };
            setHeatmapPoints(data.points ?? []);
          }
        } catch {}
      })();
    }
  }, [showHeatmap]);

  useEffect(() => {
    if (showCulturalSites && culturalSites.length === 0) {
      void (async () => {
        try {
          const base = getApiBase();
          if (!base) return;
          const res = await fetch(`${base}/api/cultural-sites`);
          if (res.ok) {
            const data = await res.json() as { sites: CulturalSite[] };
            setCulturalSites(data.sites ?? []);
          }
        } catch {}
      })();
    }
  }, [showCulturalSites]);

  const recenter = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      mapRef.current?.animateToRegion(
        { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.12, longitudeDelta: 0.12 },
        600,
      );
    } catch {}
  };

  const anyCardVisible = selectedBusiness !== null || selectedCulturalSite !== null;

  return (
    <View
      style={s.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ w: Math.round(width), h: Math.round(height) });
      }}
    >
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
        pointsOfInterestFilter={[
          "park", "nationalPark", "beach", "campground", "marina",
          "hospital", "pharmacy", "police", "fireStation",
          "museum", "theater", "library", "university", "school",
          "publicTransport", "airport", "stadium", "zoo", "aquarium",
          "postOffice", "restroom",
        ]}
        onPress={() => { setSelectedBusiness(null); setSelectedCulturalSite(null); }}
      >
        {/* Business pins — gold */}
        {mapped.map((biz) => (
          <Marker
            key={biz.id}
            coordinate={{ latitude: biz.latitude, longitude: biz.longitude }}
            onPress={() => { setSelectedBusiness(biz); setSelectedCulturalSite(null); }}
          >
            <View style={s.bizMarker}>
              <Feather name="briefcase" size={9} color="#fff" />
            </View>
          </Marker>
        ))}

        {/* Safety heatmap circles */}
        {showHeatmap && heatmapPoints.map((p) => {
          const fillColor = p.avgScore >= 70
            ? "rgba(34,197,94,0.18)"
            : p.avgScore >= 50
            ? "rgba(251,191,36,0.18)"
            : "rgba(239,68,68,0.18)";
          const strokeColor = p.avgScore >= 70
            ? "rgba(34,197,94,0.60)"
            : p.avgScore >= 50
            ? "rgba(251,191,36,0.60)"
            : "rgba(239,68,68,0.60)";
          return (
            <Circle
              key={`heat-${p.city}`}
              center={{ latitude: p.lat, longitude: p.lng }}
              radius={9000}
              fillColor={fillColor}
              strokeColor={strokeColor}
              strokeWidth={1.5}
            />
          );
        })}

        {/* Cultural heritage pins — category-specific colors + icons */}
        {showCulturalSites && culturalSites.map((site) => {
          const lat = parseFloat(site.latitude);
          const lng = parseFloat(site.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;
          const cs = getCategoryStyle(site.heritageCategory);
          return (
            <Marker
              key={site.id}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => { setSelectedCulturalSite(site); setSelectedBusiness(null); }}
            >
              <View style={[s.culturalMarker, { backgroundColor: cs.color }]}>
                <Feather name={cs.icon} size={10} color="#fff" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ── MapKit diagnostic badge (temp) ── */}
      <View style={{ position: "absolute", bottom: 90, left: 12, backgroundColor: mapReady ? "#16a34a" : "#dc2626", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, opacity: 0.85 }}>
        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>{`${mapReady ? "MapKit ✓" : "MapKit init…"} · ${containerSize.w}×${containerSize.h}`}</Text>
      </View>

      {/* ── Top overlay ── */}
      <View style={[s.topOverlay, { paddingTop: insets.top + 6 }]}>

        {/* Activity scanner banner */}
        {activityAlerts.length > 0 && (() => {
          const a = activityAlerts[Math.min(scannerAlertIdx, activityAlerts.length - 1)];
          if (!a) return null;
          const meta = ALERT_META[a.type as AlertType] ?? ALERT_META.other;
          return (
            <View style={[s.banner, { backgroundColor: meta.bgColor }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 13 }}>{meta.icon}</Text>
                  <Text style={s.bannerTitle}>{meta.label}</Text>
                  {activityAlerts.length > 1 && (
                    <View style={s.badgePill}><Text style={s.badgePillTxt}>{activityAlerts.length}</Text></View>
                  )}
                </View>
                <Text style={s.bannerSub}>
                  {a.distanceMeters < 1000
                    ? `${a.distanceMeters}m away`
                    : `${(a.distanceMeters / 1000).toFixed(1)}km away`}
                  {a.confirmedCount > 0 ? ` · ${a.confirmedCount} confirmed` : ""}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <TouchableOpacity style={s.bannerBtn} onPress={() => void confirmAlert(a.id)}>
                  <Text style={s.bannerBtnTxt}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.bannerBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
                  onPress={() => void clearAlert(a.id)}
                >
                  <Text style={s.bannerBtnTxt}>✗</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => dismissAlert(a.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={14} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {activityAlerts.length > 1 && (
          <View style={[s.navRow, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              onPress={() => setScannerAlertIdx((i) => Math.max(0, i - 1))}
              disabled={scannerAlertIdx === 0}
              style={{ opacity: scannerAlertIdx === 0 ? 0.3 : 1 }}
            >
              <Feather name="chevron-left" size={15} color={GOLD} />
            </TouchableOpacity>
            <Text style={[s.navTxt, { color: GOLD }]}>Alert {scannerAlertIdx + 1} of {activityAlerts.length}</Text>
            <TouchableOpacity
              onPress={() => setScannerAlertIdx((i) => Math.min(activityAlerts.length - 1, i + 1))}
              disabled={scannerAlertIdx === activityAlerts.length - 1}
              style={{ opacity: scannerAlertIdx === activityAlerts.length - 1 ? 0.3 : 1 }}
            >
              <Feather name="chevron-right" size={15} color={GOLD} />
            </TouchableOpacity>
          </View>
        )}

        {/* Proximity safety warning */}
        {currentWarning && (
          <View style={[s.banner, { backgroundColor: "#7F1D1D" }]}>
            <Feather name="alert-octagon" size={13} color="#fff" />
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={s.bannerTitle}>{currentWarning.name}</Text>
              <Text style={s.bannerSub}>
                {currentWarning.distanceMeters < 1000
                  ? `${Math.round(currentWarning.distanceMeters)}m away`
                  : `${(currentWarning.distanceMeters / 1000).toFixed(1)}km away`}
                {" "}· {currentWarning.reportCount} community {currentWarning.reportCount === 1 ? "report" : "reports"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { dismissWarning(currentWarning.targetId); setWarningIdx((i) => Math.max(0, i - 1)); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={14} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        )}

        {/* Geo-safe area alert */}
        {!currentWarning && geoAlert && (
          <TouchableOpacity
            style={[s.banner, { backgroundColor: "#92400E" }]}
            onPress={dismissGeoAlert}
            activeOpacity={0.85}
          >
            <Feather name="alert-triangle" size={13} color="#fff" />
            <Text style={[s.bannerSub, { flex: 1, marginLeft: 6 }]}>
              Safety alert · {geoAlert.city}
              {geoAlert.neighborhood ? ` · ${geoAlert.neighborhood}` : ""} — avg score{" "}
              {geoAlert.avgSafetyScore}/100 from {geoAlert.surveyCount} reports
            </Text>
          </TouchableOpacity>
        )}

        {/* Category filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catRow}
          keyboardDismissMode="on-drag"
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill key={cat} label={cat} selected={activeCategory === cat} onPress={() => setActiveCategory(cat)} />
          ))}
        </ScrollView>

        {/* Map layer toggles */}
        <View style={s.layerRow}>
          <TouchableOpacity
            style={[s.layerBtn, showHeatmap && { backgroundColor: "#059669", borderColor: "transparent" }]}
            onPress={() => setShowHeatmap((v) => !v)}
            activeOpacity={0.85}
          >
            <Feather name="thermometer" size={12} color={showHeatmap ? "#fff" : GOLD} />
            <Text style={[s.layerBtnTxt, { color: showHeatmap ? "#fff" : GOLD }]}>Safety Heat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.layerBtn, showCulturalSites && { backgroundColor: "#7C3AED", borderColor: "transparent" }]}
            onPress={() => setShowCulturalSites((v) => !v)}
            activeOpacity={0.85}
          >
            <Feather name="book-open" size={12} color={showCulturalSites ? "#fff" : GOLD} />
            <Text style={[s.layerBtnTxt, { color: showCulturalSites ? "#fff" : GOLD }]}>Heritage Sites</Text>
          </TouchableOpacity>
        </View>

        {/* Heritage pin legend — shown when cultural layer is active */}
        {showCulturalSites && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.legendRow}
            pointerEvents="box-none"
          >
            {Object.entries(CATEGORY_STYLES).map(([key, cs]) => (
              <View key={key} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: cs.color }]} />
                <Text style={s.legendTxt}>{cs.label}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Locating spinner */}
      {locating && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={s.locatingWrap}>
            <View style={s.locatingPill}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={s.locatingTxt}>Finding your location…</Text>
            </View>
          </View>
        </View>
      )}

      {/* Recenter FAB */}
      {locationGranted && (
        <TouchableOpacity
          style={[s.fab, { backgroundColor: colors.background, bottom: anyCardVisible ? 210 : insets.bottom + 24 }]}
          onPress={() => void recenter()}
          activeOpacity={0.85}
        >
          <Feather name="navigation" size={20} color={GOLD} />
        </TouchableOpacity>
      )}

      {/* ── Cultural site bottom card ── */}
      {selectedCulturalSite && (() => {
        const cs = getCategoryStyle(selectedCulturalSite.heritageCategory);
        return (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: cs.color + "40", paddingBottom: insets.bottom + 12 }]}>
            <View style={s.cardHandle} />
            <TouchableOpacity style={s.cardClose} onPress={() => setSelectedCulturalSite(null)}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <View style={[s.catPill, { backgroundColor: cs.color + "18" }]}>
                <Feather name={cs.icon} size={11} color={cs.color} />
                <Text style={[s.catPillTxt, { color: cs.color }]}>{selectedCulturalSite.heritageCategory}</Text>
              </View>
              {selectedCulturalSite.yearEstablished ? (
                <Text style={[s.estTxt, { color: colors.mutedForeground }]}>Est. {selectedCulturalSite.yearEstablished}</Text>
              ) : selectedCulturalSite.era ? (
                <Text style={[s.estTxt, { color: colors.mutedForeground }]}>{selectedCulturalSite.era}</Text>
              ) : null}
            </View>

            <Text style={[s.cardName, { color: colors.foreground }]} numberOfLines={2}>
              {selectedCulturalSite.name}
            </Text>
            <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
              {selectedCulturalSite.city}, {selectedCulturalSite.state}
            </Text>
            {selectedCulturalSite.significance && (
              <Text style={[s.culturalSig, { color: colors.foreground }]} numberOfLines={2}>
                {selectedCulturalSite.significance}
              </Text>
            )}

            <TouchableOpacity
              style={[s.cardBtn, { backgroundColor: cs.color }]}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/cultural-heritage",
                  params: { initialCategory: selectedCulturalSite.heritageCategory },
                })
              }
            >
              <Feather name="book-open" size={14} color="#fff" />
              <Text style={s.cardBtnTxt}>View Details</Text>
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* ── Business bottom card ── */}
      {!selectedCulturalSite && selectedBusiness && (
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          <View style={s.cardHandle} />
          <TouchableOpacity style={s.cardClose} onPress={() => setSelectedBusiness(null)}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <Text style={[s.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {selectedBusiness.name}
          </Text>
          <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
            {selectedBusiness.subcategory} · {selectedBusiness.city}, {selectedBusiness.state}
          </Text>

          <View style={s.cardRow}>
            <View style={s.cardMeta}>
              <Feather name="star" size={13} color={GOLD} />
              <Text style={[s.cardMetaTxt, { color: colors.foreground }]}>
                {selectedBusiness.rating.toFixed(1)}
                <Text style={{ color: colors.mutedForeground }}> ({selectedBusiness.reviewCount})</Text>
              </Text>
            </View>
            {selectedBusiness.priceRange ? (
              <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>{selectedBusiness.priceRange}</Text>
            ) : null}
            {selectedBusiness.verified && (
              <View style={s.verifiedPill}>
                <Feather name="check-circle" size={11} color="#2D7A4F" />
                <Text style={s.verifiedTxt}>Verified</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[s.cardBtn, { backgroundColor: GOLD }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/business/[id]", params: { id: selectedBusiness.id } })}
          >
            <Feather name="briefcase" size={14} color="#fff" />
            <Text style={s.cardBtnTxt}>View Business</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a" },
  map: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, gap: 6 },

  banner: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 12, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, gap: 4,
  },
  bannerTitle: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  bannerSub:   { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 1 },
  bannerBtn:   { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bannerBtnTxt:{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#fff" },
  badgePill:   { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  badgePillTxt:{ fontFamily: "Inter_700Bold", fontSize: 10, color: "#fff" },

  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginHorizontal: 12, borderRadius: 8, paddingVertical: 4 },
  navTxt: { fontFamily: "Inter_500Medium", fontSize: 11 },

  catRow: { paddingHorizontal: 12, paddingVertical: 4, gap: 8 },

  layerRow: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 2 },
  layerBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.52)",
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(202,146,43,0.35)",
  },
  layerBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 11 },

  legendRow: { paddingHorizontal: 12, paddingBottom: 6, gap: 8, alignItems: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendTxt:  { fontFamily: "Inter_500Medium", fontSize: 10, color: "#fff" },

  locatingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  locatingPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.62)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  locatingTxt:  { fontFamily: "Inter_500Medium", fontSize: 13, color: "#fff" },

  fab: {
    position: "absolute", right: 16,
    width: 46, height: 46, borderRadius: 23,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 4, elevation: 5,
  },

  bizMarker: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: GOLD,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3, shadowRadius: 2, elevation: 3,
  },
  culturalMarker: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3, shadowRadius: 2, elevation: 3,
  },

  card: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 8,
  },
  cardHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#ccc", alignSelf: "center", marginBottom: 14 },
  cardClose:  { position: "absolute", top: 16, right: 16, padding: 4 },
  cardName:   { fontFamily: "Inter_700Bold", fontSize: 18, paddingRight: 32, marginBottom: 3 },
  cardSub:    { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 8 },
  cardRow:    { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  cardMeta:   { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaTxt:{ fontFamily: "Inter_500Medium", fontSize: 13 },
  cardBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 12, marginTop: 4 },
  cardBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },

  catPill:    { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  catPillTxt: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  estTxt:     { fontFamily: "Inter_400Regular", fontSize: 11 },
  culturalSig:{ fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 10 },

  verifiedPill:{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#DCFCE7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  verifiedTxt: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#2D7A4F" },
});
