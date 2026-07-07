import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

const WIDGET_ORDER_KEY = "@melanin_maps_safety_widget_order";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

type SafetyCheckin = {
  id: number;
  trustedContactName: string;
  trustedContactEmail: string;
  scheduledAt: string;
  status: string;
  confirmedAt: string | null;
  note: string | null;
  city: string | null;
  location: string | null;
};

type LocationShare = {
  id: number;
  label: string;
  shareToken: string;
  recipientEmail: string | null;
  isActive: boolean;
  expiresAt: string;
  currentLat: number | null;
  currentLng: number | null;
  lastUpdatedAt: string | null;
};

type MeetupVerification = {
  id: number;
  initiatorId: string;
  partnerId: string;
  status: string;
  location: string | null;
  initiatedAt: string;
  confirmedAt: string | null;
  partnerFirstName: string | null;
  partnerLastName: string | null;
  arrivalCheckAt: string | null;
  arrivalCheckedAt: string | null;
  arrivalCheckStatus: string | null;
  homeCheckAt: string | null;
  homeCheckedAt: string | null;
  homeCheckStatus: string | null;
  safetyFriendName: string | null;
  safetyFriendEmail: string | null;
};

type IntelAlert = {
  id: string;
  type: string;
  lat: number;
  lng: number;
  description: string | null;
  confirmedCount: number;
  clearedCount: number;
  status: "possible" | "confirmed";
  distanceMeters: number;
  expiresAt: string;
  createdAt: string;
};

const INTEL_TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  road_closure:       { icon: "🚧", label: "Road Closure",            color: "#F59E0B" },
  construction:       { icon: "🏗️", label: "Construction Zone",       color: "#D97706" },
  road_reopened:      { icon: "✅", label: "Road Reopened",           color: "#16A34A" },
  transit_disruption: { icon: "🚌", label: "Transit Disruption",      color: "#0EA5E9" },
  protest:            { icon: "✊🏾", label: "Active Protest",         color: "#8B5CF6" },
  celebration:        { icon: "🎉", label: "Community Celebration",  color: "#10B981" },
  festival:           { icon: "🎊", label: "Festival or Event",       color: "#EC4899" },
  severe_weather:     { icon: "⛈️", label: "Severe Weather",          color: "#6366F1" },
  emergency:          { icon: "🚨", label: "Neighborhood Emergency",  color: "#DC2626" },
  avoid_area:         { icon: "⛔", label: "Area to Avoid",           color: "#DC2626" },
  situation_cleared:  { icon: "🟢", label: "Situation Cleared",       color: "#16A34A" },
  police:             { icon: "🚔", label: "Police Activity",         color: "#3B82F6" },
  ice:                { icon: "🚨", label: "ICE / Immigration",       color: "#DC2626" },
  checkpoint:         { icon: "⛔", label: "Checkpoint",              color: "#F59E0B" },
  traffic:            { icon: "🚦", label: "Traffic Issue",           color: "#F59E0B" },
  other:              { icon: "⚠️", label: "Community Alert",         color: "#8B5CF6" },
};

const ALL_FEATURES: { id: string; icon: React.ComponentProps<typeof Feather>["name"]; title: string; desc: string; color: string; route: string | null; externalUrl?: string }[] = [
  { id: "intel",       icon: "radio",         title: "Community Intelligence",       desc: "Report real-time alerts — road closures, protests, celebrations, weather impacts, and more.",          color: "#CA922B", route: "/report-intelligence" },
  { id: "tip",         icon: "alert-triangle", title: "Submit Safety Tip",           desc: "Pin a location where violence or hate occurred. Nearby verified members are alerted to confirm.",      color: "#DC2626", route: "/safety-tip" },
  { id: "checkin",     icon: "check-circle",   title: "Safety Check-In",             desc: "Schedule a check-in. Your contact is alerted if you don't confirm.",                                   color: "#16A34A", route: "/checkin" },
  { id: "location",    icon: "map-pin",        title: "Location Sharing",            desc: "Share your live location with a trusted contact temporarily.",                                          color: "#2563EB", route: "/location-share" },
  { id: "meetup",      icon: "users",          title: "Meetup Verification",         desc: "Mutually verify in-person meetups with connections you trust.",                                         color: "#7C3AED", route: "/member-connections" },
  { id: "police",      icon: "shield-off",     title: "Report Police or ICE",        desc: "Report a police encounter, ICE activity, racial profiling, or checkpoint in your area.",               color: "#991B1B", route: "/report-police" },
  { id: "report",      icon: "flag",           title: "Anonymous Report",            desc: "Report unsafe content or behavior without revealing your identity.",                                    color: "#DC2626", route: "/report-safety" },
  { id: "space",       icon: "alert-octagon",  title: "Report an Unsafe Space",      desc: "Flag any business or venue where you experienced unsafe, discriminatory, or unwelcoming treatment.",    color: "#7C2D12", route: "/report-space" },
  { id: "family",      icon: "eye",            title: "Community Guidance",           desc: "Content is rated 🟢 Everyone, 🔵 Teen (13+), 🟠 Young Adult (16+), or 🔴 Adult (18+). Parents choose which tiers to show. Ratings include a reason so families always understand the context.", color: "#CA922B", route: "/family-settings" },
  { id: "survey",      icon: "star",           title: "Neighborhood Safety",         desc: "Share and read community safety reports for any neighborhood.",                                         color: "#0891B2", route: "/neighborhood-survey" },
  { id: "registry",    icon: "search",         title: "Sex Offender Registry",       desc: "Search the national registry to see registered offenders in any neighborhood or zip code.",             color: "#4338CA", route: null, externalUrl: "https://www.nsopw.gov" },
  { id: "officer-watch",   icon: "eye",    title: "Officer Watch",              desc: "Track law enforcement officers flagged for violence against minorities and their department transfers.", color: "#DC2626", route: "/officer-watch" },
  { id: "mental-health",   icon: "heart",  title: "Mental Health Resources",    desc: "Crisis hotlines, 988 Lifeline, NAMI, Trevor Project, and Black mental health support — one tap away.", color: "#DC2626", route: "/mental-health" },
  { id: "na-aa-meetings",  icon: "map-pin", title: "NA/AA Meetings Near You",   desc: "Find Narcotics Anonymous, Alcoholics Anonymous, Al-Anon, and SMART Recovery meetings in your area.", color: "#059669", route: "/na-aa-meetings" },
];

function applyOrder(ids: string[]) {
  const map = new Map(ALL_FEATURES.map((f) => [f.id, f]));
  const ordered = ids.map((id) => map.get(id)).filter(Boolean) as typeof ALL_FEATURES;
  const known = new Set(ids);
  for (const f of ALL_FEATURES) {
    if (!known.has(f.id)) ordered.push(f);
  }
  return ordered;
}

function formatAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDist(meters: number): string {
  if (meters < 161) return "< 0.1 mi away";
  const miles = meters / 1609;
  return `${(Math.round(miles * 10) / 10).toFixed(1)} mi away`;
}

export default function SafetyHubTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [checkins, setCheckins] = useState<SafetyCheckin[]>([]);
  const [shares, setShares] = useState<LocationShare[]>([]);
  const [meetups, setMeetups] = useState<MeetupVerification[]>([]);
  const [intelAlerts, setIntelAlerts] = useState<IntelAlert[]>([]);
  const [intelLoading, setIntelLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [features, setFeatures] = useState(ALL_FEATURES);

  useEffect(() => {
    AsyncStorage.getItem(WIDGET_ORDER_KEY).then((raw) => {
      if (!raw) return;
      try {
        const ids = JSON.parse(raw) as string[];
        setFeatures(applyOrder(ids));
      } catch {}
    });
  }, []);

  const fetchIntel = useCallback(async () => {
    setIntelLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const base = getApiBase();
      const res = await fetch(
        `${base}/api/community-alerts/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=16`
      );
      if (res.ok) {
        const data = await res.json() as { alerts: IntelAlert[] };
        setIntelAlerts(data.alerts ?? []);
      }
    } catch { /**/ } finally {
      setIntelLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const base = getApiBase();
      const [ciRes, lsRes, mvRes] = await Promise.all([
        fetch(`${base}/api/safety/checkins`, { headers }),
        fetch(`${base}/api/safety/location-shares`, { headers }),
        fetch(`${base}/api/meetups`, { headers }),
      ]);
      if (ciRes.ok) { const d = await ciRes.json() as { checkins: SafetyCheckin[] }; setCheckins(d.checkins ?? []); }
      if (lsRes.ok) { const d = await lsRes.json() as { shares: LocationShare[] }; setShares(d.shares ?? []); }
      if (mvRes.ok) { const d = await mvRes.json() as { verifications: MeetupVerification[] }; setMeetups(d.verifications ?? []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void fetchData();
    void fetchIntel();
  }, [fetchData, fetchIntel]);

  const moveWidget = (index: number, direction: "up" | "down") => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setFeatures((prev) => {
      const next = [...prev];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
      return next;
    });
  };

  const saveOrder = async () => {
    await AsyncStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(features.map((f) => f.id)));
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditMode(false);
  };

  const handleConfirmCheckin = async (id: number) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const token = await SecureStore.getItemAsync("auth_session_token");
    const res = await fetch(`${getApiBase()}/api/safety/checkins/${id}/confirm`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setCheckins((prev) => prev.map((c) => c.id === id ? { ...c, status: "checked_in", confirmedAt: new Date().toISOString() } : c));
    else Alert.alert("Error", "Failed to confirm check-in.");
  };

  const handleStopShare = async (id: number) => {
    const token = await SecureStore.getItemAsync("auth_session_token");
    await fetch(`${getApiBase()}/api/safety/location-shares/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setShares((prev) => prev.filter((s) => s.id !== id));
  };

  const handleConfirmAlert = async (alertId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const token = await SecureStore.getItemAsync("auth_session_token");
    const res = await fetch(`${getApiBase()}/api/community-alerts/${alertId}/confirm`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (res.ok) {
      const data = await res.json() as { confirmedCount: number; status: "possible" | "confirmed" };
      setIntelAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, confirmedCount: data.confirmedCount, status: data.status }
            : a
        )
      );
    }
  };

  const handleClearAlert = async (alertId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const token = await SecureStore.getItemAsync("auth_session_token");
    const res = await fetch(`${getApiBase()}/api/community-alerts/${alertId}/clear`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (res.ok) {
      setIntelAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }
  };

  const handleArrivalCheckin = async (id: number) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const token = await SecureStore.getItemAsync("auth_session_token");
    const res = await fetch(`${getApiBase()}/api/meetups/${id}/arrival-checkin`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token ?? ""}` },
    });
    if (res.ok) {
      setMeetups((prev) => prev.map((m) => m.id === id ? { ...m, arrivalCheckStatus: "confirmed", arrivalCheckedAt: new Date().toISOString() } : m));
    } else {
      Alert.alert("Error", "Failed to confirm arrival.");
    }
  };

  const handleHomeCheckin = async (id: number) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const token = await SecureStore.getItemAsync("auth_session_token");
    const res = await fetch(`${getApiBase()}/api/meetups/${id}/home-checkin`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token ?? ""}` },
    });
    if (res.ok) {
      setMeetups((prev) => prev.map((m) => m.id === id ? { ...m, homeCheckStatus: "confirmed", homeCheckedAt: new Date().toISOString() } : m));
    } else {
      Alert.alert("Error", "Failed to confirm home check-in.");
    }
  };

  const pendingCheckins = checkins.filter((c) => c.status === "pending");
  const activeShares = shares.filter((s) => s.isActive && new Date(s.expiresAt) > new Date());
  const pendingMeetups = meetups.filter((m) => m.status === "pending" && m.partnerId === user?.id);
  const arrivalCheckinsDue = meetups.filter((m) => m.initiatorId === user?.id && m.arrivalCheckAt && m.arrivalCheckStatus === "pending");
  const homeCheckinsDue = meetups.filter((m) => m.initiatorId === user?.id && m.homeCheckAt && m.homeCheckStatus === "pending");

  const formatRelativeTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 0) return `${Math.abs(diffMin)}m ago`;
    if (diffMin < 60) return `in ${diffMin}m`;
    const diffHrs = Math.round(diffMin / 60);
    if (diffHrs < 24) return `in ${diffHrs}h`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const openExternal = (url: string) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
      else Alert.alert("Unable to open", "Please visit nsopw.gov in your browser.");
    });
  };

  const confirmedAlerts = intelAlerts.filter((a) => a.status === "confirmed");
  const possibleAlerts = intelAlerts.filter((a) => a.status === "possible");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Safety Hub</Text>
        {editMode ? (
          <TouchableOpacity onPress={saveOrder} style={[styles.editBtn, { backgroundColor: colors.primary ?? "#CA922B" }]} activeOpacity={0.8}>
            <Text style={styles.editBtnTextWhite}>Done</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditMode(true)} style={[styles.editBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]} activeOpacity={0.8}>
            <Feather name="sliders" size={14} color={colors.foreground} />
            <Text style={[styles.editBtnText, { color: colors.foreground }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#CA922B" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {editMode && (
            <View style={[styles.editBanner, { backgroundColor: "#CA922B18", borderColor: "#CA922B40" }]}>
              <Feather name="move" size={16} color="#CA922B" />
              <Text style={[styles.editBannerText, { color: colors.foreground }]}>
                Use the arrows to reorder your widgets. Tap <Text style={{ fontFamily: "Inter_700Bold" }}>Done</Text> to save.
              </Text>
            </View>
          )}

          {/* Active safety alerts */}
          {!editMode && (pendingCheckins.length > 0 || pendingMeetups.length > 0 || arrivalCheckinsDue.length > 0 || homeCheckinsDue.length > 0) && (
            <View style={styles.alertsSection}>
              {pendingCheckins.map((c) => (
                <View key={c.id} style={[styles.alertCard, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
                  <Feather name="clock" size={18} color="#DC2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: "#991B1B" }]}>Check-in due {formatRelativeTime(c.scheduledAt)}</Text>
                    <Text style={[styles.alertSub, { color: "#7F1D1D" }]}>Contact: {c.trustedContactName}</Text>
                  </View>
                  <TouchableOpacity style={[styles.imSafeBtn, { backgroundColor: "#16A34A" }]} onPress={() => void handleConfirmCheckin(c.id)} activeOpacity={0.85}>
                    <Text style={styles.imSafeBtnText}>I'm Safe ✓</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {pendingMeetups.map((m) => {
                const name = [m.partnerFirstName, m.partnerLastName].filter(Boolean).join(" ") || "your connection";
                return (
                  <View key={m.id} style={[styles.alertCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
                    <Feather name="user-check" size={18} color="#2563EB" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.alertTitle, { color: "#1D4ED8" }]}>Meetup request from {name}</Text>
                      <Text style={[styles.alertSub, { color: "#1E40AF" }]}>{m.location ?? "No location specified"}</Text>
                    </View>
                    <TouchableOpacity style={[styles.imSafeBtn, { backgroundColor: "#2563EB" }]} onPress={() => router.push("/member-connections" as Parameters<typeof router.push>[0])} activeOpacity={0.85}>
                      <Text style={styles.imSafeBtnText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              {arrivalCheckinsDue.map((m) => {
                const loc = m.location ?? "your meetup location";
                return (
                  <View key={`arr-${m.id}`} style={[styles.alertCard, { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }]}>
                    <Text style={{ fontSize: 18 }}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.alertTitle, { color: "#92400E" }]}>Arrived at {loc}?</Text>
                      <Text style={[styles.alertSub, { color: "#78350F" }]}>Tap to confirm arrival — or your safety friend will be alerted.</Text>
                    </View>
                    <TouchableOpacity style={[styles.imSafeBtn, { backgroundColor: "#CA922B" }]} onPress={() => void handleArrivalCheckin(m.id)} activeOpacity={0.85}>
                      <Text style={styles.imSafeBtnText}>I Arrived ✓</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              {homeCheckinsDue.map((m) => (
                <View key={`home-${m.id}`} style={[styles.alertCard, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
                  <Text style={{ fontSize: 18 }}>🏠</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: "#14532D" }]}>Home safe yet?</Text>
                    <Text style={[styles.alertSub, { color: "#166534" }]}>Confirm you're home — or your safety friend will be alerted.</Text>
                  </View>
                  <TouchableOpacity style={[styles.imSafeBtn, { backgroundColor: "#16A34A" }]} onPress={() => void handleHomeCheckin(m.id)} activeOpacity={0.85}>
                    <Text style={styles.imSafeBtnText}>I'm Home ✓</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ─── Community Intelligence ───────────────────────────────────────── */}
          {!editMode && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.intelDot}>📡</Text>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Community Intelligence</Text>
                  {intelAlerts.length > 0 && (
                    <View style={[styles.intelCount, { backgroundColor: "#CA922B18" }]}>
                      <Text style={styles.intelCountText}>{intelAlerts.length}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/report-intelligence" as Parameters<typeof router.push>[0])}
                  style={[styles.reportIntelBtn, { backgroundColor: "#CA922B18", borderColor: "#CA922B40" }]}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={13} color="#CA922B" />
                  <Text style={styles.reportIntelBtnText}>Report</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.threeStarRuleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statusBadge, { backgroundColor: "#F59E0B18", borderColor: "#F59E0B40" }]}>
                  <Text style={[styles.statusBadgeText, { color: "#F59E0B" }]}>⚡ Possible</Text>
                </View>
                <Text style={[styles.ruleSlash, { color: colors.mutedForeground }]}>1–2 reports</Text>
                <View style={[styles.statusBadge, { backgroundColor: "#16A34A18", borderColor: "#16A34A40" }]}>
                  <Text style={[styles.statusBadgeText, { color: "#16A34A" }]}>✓ Confirmed</Text>
                </View>
                <Text style={[styles.ruleSlash, { color: colors.mutedForeground }]}>3+ reports</Text>
              </View>

              {intelLoading && (
                <View style={styles.intelLoadingRow}>
                  <ActivityIndicator size="small" color="#CA922B" />
                  <Text style={[styles.intelLoadingText, { color: colors.mutedForeground }]}>Scanning your area…</Text>
                </View>
              )}

              {!intelLoading && intelAlerts.length === 0 && (
                <View style={[styles.intelEmptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={styles.intelEmptyEmoji}>🟢</Text>
                  <Text style={[styles.intelEmptyTitle, { color: colors.foreground }]}>All clear nearby</Text>
                  <Text style={[styles.intelEmptySub, { color: colors.mutedForeground }]}>
                    No active community intelligence in your area. Be the first to report if you see something.
                  </Text>
                </View>
              )}

              {confirmedAlerts.length > 0 && (
                <View style={styles.intelGroup}>
                  <Text style={[styles.intelGroupLabel, { color: "#16A34A" }]}>✓ Confirmed ({confirmedAlerts.length})</Text>
                  {confirmedAlerts.map((a) => (
                    <IntelAlertCard
                      key={a.id}
                      alert={a}
                      colors={colors}
                      onConfirm={() => void handleConfirmAlert(a.id)}
                      onClear={() => void handleClearAlert(a.id)}
                      isAuthed={!!user}
                    />
                  ))}
                </View>
              )}

              {possibleAlerts.length > 0 && (
                <View style={styles.intelGroup}>
                  <Text style={[styles.intelGroupLabel, { color: "#F59E0B" }]}>⚡ Possible ({possibleAlerts.length})</Text>
                  {possibleAlerts.map((a) => (
                    <IntelAlertCard
                      key={a.id}
                      alert={a}
                      colors={colors}
                      onConfirm={() => void handleConfirmAlert(a.id)}
                      onClear={() => void handleClearAlert(a.id)}
                      isAuthed={!!user}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Active location shares */}
          {!editMode && activeShares.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Location Shares</Text>
              {activeShares.map((s) => (
                <View key={s.id} style={[styles.shareCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.shareIcon, { backgroundColor: "#2563EB18" }]}>
                    <Feather name="map-pin" size={16} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.shareName, { color: colors.foreground }]}>{s.label}</Text>
                    <Text style={[styles.shareExpiry, { color: colors.mutedForeground }]}>
                      Expires {formatRelativeTime(s.expiresAt)}{s.recipientEmail ? ` · ${s.recipientEmail}` : ""}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => void handleStopShare(s.id)} activeOpacity={0.7} style={{ padding: 8 }}>
                    <Feather name="x-circle" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Feature grid — normal mode */}
          {!editMode && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Safety Features</Text>
              <View style={styles.featureGrid}>
                {features.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      if (f.externalUrl) { openExternal(f.externalUrl); return; }
                      if (f.route) router.push(f.route as Parameters<typeof router.push>[0]);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.featureIcon, { backgroundColor: f.color + "18" }]}>
                      <Feather name={f.icon} size={22} color={f.color} />
                    </View>
                    <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                    <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Feature list — edit mode */}
          {editMode && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Safety Features</Text>
              {features.map((f, index) => (
                <View key={f.id} style={[styles.editRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.editRowIcon, { backgroundColor: f.color + "18" }]}>
                    <Feather name={f.icon} size={20} color={f.color} />
                  </View>
                  <Text style={[styles.editRowTitle, { color: colors.foreground }]} numberOfLines={2}>{f.title}</Text>
                  <View style={styles.editControls}>
                    <TouchableOpacity onPress={() => moveWidget(index, "up")} disabled={index === 0} style={[styles.arrowBtn, { opacity: index === 0 ? 0.25 : 1, borderColor: colors.border }]} activeOpacity={0.7}>
                      <Feather name="chevron-up" size={18} color={colors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveWidget(index, "down")} disabled={index === features.length - 1} style={[styles.arrowBtn, { opacity: index === features.length - 1 ? 0.25 : 1, borderColor: colors.border }]} activeOpacity={0.7}>
                      <Feather name="chevron-down" size={18} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {!editMode && (
            <View style={[styles.pledge, { backgroundColor: "#CA922B0F", borderColor: "#CA922B30" }]}>
              <Feather name="heart" size={18} color="#CA922B" />
              <Text style={[styles.pledgeText, { color: colors.foreground }]}>
                Mapping With Melanin is built on trust and community care. Every safety feature here exists because our members deserved better — use them, share them, and look out for each other.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

type ColorsType = ReturnType<typeof useColors>;

function IntelAlertCard({
  alert,
  colors,
  onConfirm,
  onClear,
  isAuthed,
}: {
  alert: IntelAlert;
  colors: ColorsType;
  onConfirm: () => void;
  onClear: () => void;
  isAuthed: boolean;
}) {
  const meta = INTEL_TYPE_META[alert.type] ?? { icon: "⚠️", label: "Community Alert", color: "#8B5CF6" };
  const isConfirmed = alert.status === "confirmed";
  const statusColor = isConfirmed ? "#16A34A" : "#F59E0B";
  const statusLabel = isConfirmed ? "✓ Confirmed" : "⚡ Possible";

  return (
    <View style={[styles.intelCard, { backgroundColor: colors.card, borderColor: isConfirmed ? "#16A34A30" : "#F59E0B30", borderLeftColor: statusColor }]}>
      <View style={styles.intelCardTop}>
        <Text style={styles.intelCardEmoji}>{meta.icon}</Text>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.intelCardTitleRow}>
            <Text style={[styles.intelCardLabel, { color: colors.foreground }]} numberOfLines={1}>{meta.label}</Text>
            <View style={[styles.statusBadgeSmall, { backgroundColor: statusColor + "18", borderColor: statusColor + "40" }]}>
              <Text style={[styles.statusBadgeSmallText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={[styles.intelCardMeta, { color: colors.mutedForeground }]}>
            {formatAgo(alert.createdAt)} · {formatDist(alert.distanceMeters)} · {alert.confirmedCount} confirmation{alert.confirmedCount !== 1 ? "s" : ""}
          </Text>
          {alert.description ? (
            <Text style={[styles.intelCardDesc, { color: colors.foreground }]} numberOfLines={2}>{alert.description}</Text>
          ) : null}
        </View>
      </View>
      {isAuthed && (
        <View style={styles.intelCardActions}>
          <TouchableOpacity
            style={[styles.intelActionBtn, { backgroundColor: "#16A34A18", borderColor: "#16A34A40" }]}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Feather name="check" size={13} color="#16A34A" />
            <Text style={[styles.intelActionText, { color: "#16A34A" }]}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.intelActionBtn, { backgroundColor: "#6B728018", borderColor: "#6B728040" }]}
            onPress={onClear}
            activeOpacity={0.8}
          >
            <Feather name="x" size={13} color="#6B7280" />
            <Text style={[styles.intelActionText, { color: "#6B7280" }]}>All Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  editBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  editBtnTextWhite: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20, gap: 24, paddingBottom: 120 },
  editBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  editBannerText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, flex: 1 },
  alertsSection: { gap: 10 },
  alertCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  alertTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  alertSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  imSafeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  imSafeBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  intelDot: { fontSize: 16 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  intelCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  intelCountText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#CA922B" },
  reportIntelBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  reportIntelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#CA922B" },
  threeStarRuleRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, flexWrap: "wrap" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  ruleSlash: { fontFamily: "Inter_400Regular", fontSize: 11 },
  intelLoadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  intelLoadingText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  intelEmptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  intelEmptyEmoji: { fontSize: 32 },
  intelEmptyTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  intelEmptySub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, textAlign: "center" },
  intelGroup: { gap: 8 },
  intelGroupLabel: { fontFamily: "Inter_700Bold", fontSize: 13 },
  intelCard: {
    borderRadius: 14, borderWidth: 1, borderLeftWidth: 4,
    padding: 12, gap: 10,
  },
  intelCardTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  intelCardEmoji: { fontSize: 22, marginTop: 1 },
  intelCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  intelCardLabel: { fontFamily: "Inter_700Bold", fontSize: 13 },
  statusBadgeSmall: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  statusBadgeSmallText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  intelCardMeta: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15 },
  intelCardDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },
  intelCardActions: { flexDirection: "row", gap: 8 },
  intelActionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  intelActionText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  shareCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  shareIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  shareName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  shareExpiry: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  featureCard: { width: "47%", borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  featureTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  featureDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16, borderWidth: 1 },
  editRowIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  editRowTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1, lineHeight: 19 },
  editControls: { flexDirection: "column", gap: 4, flexShrink: 0 },
  arrowBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pledge: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  pledgeText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
});
