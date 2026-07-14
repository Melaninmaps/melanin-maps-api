import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryPill } from "@/components/CategoryPill";
import { CATEGORIES } from "@/constants/data";
import type { Business } from "@/constants/types";
import { useActivityAlerts, ALERT_META, type AlertType } from "@/hooks/useActivityAlerts";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useColors } from "@/hooks/useColors";
import { useGeoSafeAlert } from "@/hooks/useGeoSafeAlert";
import { useSafetyProximity } from "@/hooks/useSafetyProximity";

const GOLD = "#CA922B";

const DEFAULT_REGION: Region = {
  latitude: 37.09,
  longitude: -95.71,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

export function BusinessMapView() {
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

  const { businesses } = useBusinesses();
  const { alerts: activityAlerts, confirmAlert, clearAlert, dismissAlert } = useActivityAlerts();
  const { warnings, dismissWarning } = useSafetyProximity();
  const { alert: geoAlert, dismissAlert: dismissGeoAlert } = useGeoSafeAlert();

  const mapped = businesses.filter(
    (b) =>
      b.latitude != null &&
      b.longitude != null &&
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
        if (status !== "granted") {
          setLocating(false);
          return;
        }
        setLocationGranted(true);
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        mapRef.current?.animateToRegion(
          {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          },
          800,
        );
      } catch {
        // permission denied or location unavailable — stays at default US overview
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  const recenter = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        },
        600,
      );
    } catch { }
  };

  const cardVisible = selectedBusiness !== null;

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        onPress={() => setSelectedBusiness(null)}
      >
        {mapped.map((biz) => (
          <Marker
            key={biz.id}
            coordinate={{ latitude: biz.latitude, longitude: biz.longitude }}
            pinColor={GOLD}
            onPress={() => setSelectedBusiness(biz)}
          />
        ))}
      </MapView>

      {/* ── Top overlay: safety alerts + category filter ── */}
      <View style={[s.topOverlay, { paddingTop: insets.top + 6 }]}>

        {/* Activity scanner banner (police / ICE / etc.) */}
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
                    <View style={s.badgePill}>
                      <Text style={s.badgePillTxt}>{activityAlerts.length}</Text>
                    </View>
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
                <TouchableOpacity
                  onPress={() => dismissAlert(a.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
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
            <Text style={[s.navTxt, { color: GOLD }]}>
              Alert {scannerAlertIdx + 1} of {activityAlerts.length}
            </Text>
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
              onPress={() => {
                dismissWarning(currentWarning.targetId);
                setWarningIdx((i) => Math.max(0, i - 1));
              }}
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

      {/* ── Locating spinner (centered, non-blocking) ── */}
      {locating && (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <View style={s.locatingWrap}>
            <View style={s.locatingPill}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={s.locatingTxt}>Finding your location…</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Recenter FAB ── */}
      {locationGranted && (
        <TouchableOpacity
          style={[
            s.fab,
            {
              backgroundColor: colors.background,
              bottom: cardVisible ? 210 : insets.bottom + 24,
            },
          ]}
          onPress={() => void recenter()}
          activeOpacity={0.85}
        >
          <Feather name="navigation" size={20} color={GOLD} />
        </TouchableOpacity>
      )}

      {/* ── Selected business bottom card ── */}
      {cardVisible && selectedBusiness && (
        <View
          style={[
            s.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
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
              <Text style={[s.cardMetaTxt, { color: colors.mutedForeground }]}>
                {selectedBusiness.priceRange}
              </Text>
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
            onPress={() =>
              router.push({ pathname: "/business/[id]", params: { id: selectedBusiness.id } })
            }
          >
            <Text style={s.cardBtnTxt}>View Business</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    gap: 6,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  bannerTitle: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  bannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 1,
  },
  bannerBtn: {
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bannerBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#fff" },
  badgePill: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgePillTxt: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#fff" },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginHorizontal: 12,
    borderRadius: 8,
    paddingVertical: 4,
  },
  navTxt: { fontFamily: "Inter_500Medium", fontSize: 11 },
  catRow: { paddingHorizontal: 12, paddingVertical: 4, gap: 8 },

  locatingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  locatingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  locatingTxt: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#fff" },

  fab: {
    position: "absolute",
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
  },

  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 14,
  },
  cardClose: { position: "absolute", top: 16, right: 16, padding: 4 },
  cardName: { fontFamily: "Inter_700Bold", fontSize: 18, paddingRight: 32, marginBottom: 3 },
  cardSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 10 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaTxt: { fontFamily: "Inter_500Medium", fontSize: 13 },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedTxt: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#2D7A4F" },
  cardBtn: { borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  cardBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});
