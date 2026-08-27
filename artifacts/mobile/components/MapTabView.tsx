import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Linking,
  Modal,
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
import { useActivityAlerts, ALERT_META, type AlertType } from "@/hooks/useActivityAlerts";

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
  const [slideAnim] = useState(() => new Animated.Value(-80));
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

const ALERT_TYPES: { type: AlertType; label: string; icon: string }[] = [
  { type: "police", label: "Police Activity", icon: "🚔" },
  { type: "ice", label: "ICE Activity", icon: "⚠️" },
  { type: "checkpoint", label: "Checkpoint", icon: "🛑" },
  { type: "traffic", label: "Traffic Stop", icon: "🚦" },
  { type: "other", label: "Other Alert", icon: "📢" },
];

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
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingType, setReportingType] = useState<AlertType | null>(null);
  const [scannerAlertIdx, setScannerAlertIdx] = useState(0);
  const [showFlaggedModal, setShowFlaggedModal] = useState(false);
  const [flaggedBizLoading, setFlaggedBizLoading] = useState(false);
  const [flaggedBizList, setFlaggedBizList] = useState<{
    id: string; name: string; address: string; city: string; state: string;
    category: string; alertCount: number; distanceMiles: number;
  }[]>([]);

  const { alerts: activityAlerts, reportAlert, confirmAlert, clearAlert, dismissAlert } = useActivityAlerts();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const { alert: geoAlert, dismissAlert: dismissGeoAlert } = useGeoSafeAlert();
  const { warnings, dismissWarning } = useSafetyProximity();

  function getApiBase() {
    if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
    return "";
  }

  const loadFlaggedBusinesses = async () => {
    if (Platform.OS === "web") {
      setShowFlaggedModal(true);
      return;
    }
    setFlaggedBizLoading(true);
    setShowFlaggedModal(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setFlaggedBizLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const res = await fetch(
        `${getApiBase()}/api/community-alerts/flagged-businesses?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}`,
      );
      if (res.ok) {
        const data = await res.json() as { businesses: typeof flaggedBizList };
        setFlaggedBizList(data.businesses ?? []);
      }
    } catch { }
    finally { setFlaggedBizLoading(false); }
  };

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

  const currentWarning = warnings[Math.min(warningIdx, Math.max(0, warnings.length - 1))] ?? null;

  const handleDismissCurrent = () => {
    if (!currentWarning) return;
    dismissWarning(currentWarning.targetId);
    setWarningIdx((i) => Math.max(0, i - 1));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Map</Text>
        <View style={[styles.mapNotice, { backgroundColor: colors.secondary }]}>
          <Feather name="map" size={14} color={colors.primary} />
          <Text style={[styles.mapNoticeText, { color: colors.primary }]}>Use Expo Go for interactive map</Text>
        </View>
      </View>

      {/* Activity Scanner — police/ICE alerts */}
      {activityAlerts.length > 0 && (() => {
        const a = activityAlerts[Math.min(scannerAlertIdx, activityAlerts.length - 1)];
        if (!a) return null;
        const meta = ALERT_META[a.type as AlertType] ?? ALERT_META.other;
        return (
          <View style={[styles.scannerBanner, { backgroundColor: meta.bgColor }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 15 }}>{meta.icon}</Text>
                <Text style={styles.scannerTitle}>{meta.label}</Text>
                {activityAlerts.length > 1 && (
                  <View style={styles.alertCountBadge}>
                    <Text style={styles.alertCountText}>{activityAlerts.length}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.scannerMeta}>
                {a.distanceMeters < 1000
                  ? `${a.distanceMeters}m away`
                  : `${(a.distanceMeters / 1000).toFixed(1)}km away`}
                {a.confirmedCount > 0 ? ` · ${a.confirmedCount} confirmed` : ""}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <TouchableOpacity
                style={styles.scannerAction}
                onPress={() => void confirmAlert(a.id)}
              >
                <Text style={{ fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold" }}>✓ Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scannerAction, { backgroundColor: "rgba(255,255,255,0.12)" }]}
                onPress={() => void clearAlert(a.id)}
              >
                <Text style={{ fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold" }}>✗ Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => dismissAlert(a.id)}>
                <Feather name="x" size={15} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}

      {activityAlerts.length > 1 && (
        <View style={[styles.warningNav, { backgroundColor: colors.secondary }]}>
          <TouchableOpacity
            onPress={() => setScannerAlertIdx((i) => Math.max(0, i - 1))}
            disabled={scannerAlertIdx === 0}
            style={{ opacity: scannerAlertIdx === 0 ? 0.3 : 1 }}
          >
            <Feather name="chevron-left" size={16} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.warningNavText, { color: colors.primary }]}>
            Alert {scannerAlertIdx + 1} of {activityAlerts.length} nearby
          </Text>
          <TouchableOpacity
            onPress={() => setScannerAlertIdx((i) => Math.min(activityAlerts.length - 1, i + 1))}
            disabled={scannerAlertIdx === activityAlerts.length - 1}
            style={{ opacity: scannerAlertIdx === activityAlerts.length - 1 ? 0.3 : 1 }}
          >
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {currentWarning && (
        <ProximityWarningBanner
          warning={currentWarning}
          onDismiss={handleDismissCurrent}
        />
      )}

      {!currentWarning && geoAlert && (
        <TouchableOpacity
          style={styles.geoAlertBanner}
          onPress={dismissGeoAlert}
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

      {/* Report Activity FAB */}
      <TouchableOpacity
        style={[styles.reportBtn, { backgroundColor: "#1E3A8A" }]}
        activeOpacity={0.85}
        onPress={() => {
          if (!isAuthenticated) {
            setShowUpgrade(true);
          } else {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowReportModal(true);
          }
        }}
      >
        <Text style={{ fontSize: 14 }}>🚔</Text>
        <Text style={styles.reportBtnText}>Report Activity</Text>
        {activityAlerts.length > 0 && (
          <View style={styles.reportBadge}>
            <Text style={styles.reportBadgeText}>{activityAlerts.length}</Text>
          </View>
        )}
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
        style={[styles.flaggedBtn, { backgroundColor: "#7F1D1D" }]}
        activeOpacity={0.85}
        onPress={() => {
          if (!isAuthenticated) {
            setShowUpgrade(true);
          } else {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            void loadFlaggedBusinesses();
          }
        }}
      >
        <Text style={{ fontSize: 13 }}>🚩</Text>
        <Text style={[styles.safetyBtnText, { color: "#FCA5A5" }]}>Flagged Nearby</Text>
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

      {/* Flagged Businesses Modal */}
      <Modal
        visible={showFlaggedModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFlaggedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.flaggedSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.flaggedHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.flaggedTitle, { color: colors.foreground }]}>🚩 Flagged Businesses</Text>
                <Text style={[styles.flaggedSub, { color: colors.mutedForeground }]}>
                  Non-minority-owned · 3+ community alerts · within 10 miles · last 6 months
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowFlaggedModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {flaggedBizLoading ? (
              <View style={styles.flaggedCenter}>
                <Text style={{ fontSize: 28 }}>🔍</Text>
                <Text style={[styles.flaggedEmptyText, { color: colors.mutedForeground }]}>Scanning your area…</Text>
              </View>
            ) : flaggedBizList.length === 0 ? (
              <View style={styles.flaggedCenter}>
                <Text style={{ fontSize: 40 }}>✅</Text>
                <Text style={[styles.flaggedEmptyText, { color: colors.foreground }]}>No flagged businesses found</Text>
                <Text style={[styles.flaggedEmptySubtext, { color: colors.mutedForeground }]}>
                  No non-minority-owned businesses within 10 miles have received 3+ community safety alerts in the last 6 months.
                </Text>
              </View>
            ) : (
              <FlatList
        keyboardDismissMode="on-drag"
                data={flaggedBizList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, gap: 10 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.flaggedCard, { backgroundColor: colors.card, borderColor: "#DC262640" }]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setShowFlaggedModal(false);
                      router.push({ pathname: "/business/[id]", params: { id: item.id } });
                    }}
                  >
                    <View style={styles.flaggedCardLeft}>
                      <View style={[styles.flaggedAlertBadge, { backgroundColor: "#7F1D1D" }]}>
                        <Text style={styles.flaggedAlertCount}>{item.alertCount}</Text>
                        <Text style={styles.flaggedAlertLabel}>alerts</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.flaggedCardName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.flaggedCardMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {item.category} · {item.city}, {item.state}
                      </Text>
                      <Text style={[styles.flaggedCardDist, { color: colors.mutedForeground }]}>
                        {item.distanceMiles} mi away
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Report Activity Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => { setShowReportModal(false); setReportingType(null); }}
        />
        <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Report Nearby Activity</Text>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
            ICE & Police alerts reach everyone within 10 miles + anyone who saved a nearby business. Other alerts reach 1.5 km. All reports expire automatically.
          </Text>
          <View style={{ gap: 10, marginTop: 8 }}>
            {ALERT_TYPES.map(({ type, label, icon }) => {
              const meta = ALERT_META[type];
              const active = reportingType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.reportTypeRow,
                    {
                      borderColor: active ? meta.color : colors.border,
                      backgroundColor: active ? meta.color + "18" : colors.background,
                    },
                  ]}
                  onPress={() => setReportingType(active ? null : type)}
                >
                  <Text style={{ fontSize: 20, width: 28 }}>{icon}</Text>
                  <Text style={{ flex: 1, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular", fontSize: 15, color: active ? meta.color : colors.foreground }}>{label}</Text>
                  {active && <Feather name="check-circle" size={18} color={meta.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[
              styles.reportSubmitBtn,
              { backgroundColor: reportingType ? ALERT_META[reportingType].bgColor : colors.mutedForeground },
            ]}
            disabled={!reportingType}
            onPress={async () => {
              if (!reportingType) return;
              setShowReportModal(false);
              const ok = await reportAlert(reportingType);
              setReportingType(null);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
                );
              }
              if (!ok) Alert.alert("Location Required", "Enable location access to report activity.");
            }}
          >
            <Text style={styles.reportSubmitText}>
              {reportingType ? `Report ${ALERT_META[reportingType].label}` : "Select an alert type"}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.reportDisclaimer, { color: colors.mutedForeground }]}>
            Only report real, immediate activity. Alerts auto-clear after community votes or time expiry.
          </Text>
        </View>
      </Modal>
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
