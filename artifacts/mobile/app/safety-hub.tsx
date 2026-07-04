import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
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
};

export default function SafetyHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [checkins, setCheckins] = useState<SafetyCheckin[]>([]);
  const [shares, setShares] = useState<LocationShare[]>([]);
  const [meetups, setMeetups] = useState<MeetupVerification[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { void fetchData(); }, [fetchData]);

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

  const pendingCheckins = checkins.filter((c) => c.status === "pending");
  const activeShares = shares.filter((s) => s.isActive && new Date(s.expiresAt) > new Date());
  const pendingMeetups = meetups.filter((m) => m.status === "pending" && m.partnerId === user?.id);

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

  const FEATURES: { id: string; icon: React.ComponentProps<typeof Feather>["name"]; title: string; desc: string; color: string; route: string | null; externalUrl?: string }[] = [
    { id: "tip", icon: "alert-triangle" as const, title: "Submit Safety Tip", desc: "Pin a location where violence or hate occurred. Nearby verified members are alerted to confirm.", color: "#DC2626", route: "/safety-tip" },
    { id: "checkin", icon: "check-circle" as const, title: "Safety Check-In", desc: "Schedule a check-in. Your contact is alerted if you don't confirm.", color: "#16A34A", route: "/checkin" },
    { id: "location", icon: "map-pin" as const, title: "Location Sharing", desc: "Share your live location with a trusted contact temporarily.", color: "#2563EB", route: "/location-share" },
    { id: "meetup", icon: "users" as const, title: "Meetup Verification", desc: "Mutually verify in-person meetups with connections you trust.", color: "#7C3AED", route: "/member-connections" },
    { id: "police", icon: "shield-off" as const, title: "Report Police or ICE", desc: "Report a police encounter, ICE activity, racial profiling, or checkpoint in your area.", color: "#991B1B", route: "/report-police" },
    { id: "report", icon: "flag" as const, title: "Anonymous Report", desc: "Report unsafe content or behavior without revealing your identity.", color: "#DC2626", route: "/report-safety" },
    { id: "space", icon: "alert-octagon" as const, title: "Report an Unsafe Space", desc: "Flag any business or venue where you experienced unsafe, discriminatory, or unwelcoming treatment.", color: "#7C2D12", route: "/report-space" },
    { id: "family", icon: "eye" as const, title: "Under-18 Content Shield", desc: "All messages and posts from users under 18 are automatically scanned and filtered for harmful content.", color: "#CA922B", route: null },
    { id: "survey", icon: "star" as const, title: "Neighborhood Safety", desc: "Share and read community safety reports for any neighborhood.", color: "#0891B2", route: "/neighborhood-survey" },
    { id: "registry", icon: "search" as const, title: "Sex Offender Registry", desc: "Search the national registry to see registered offenders in any neighborhood or zip code.", color: "#4338CA", route: null, externalUrl: "https://www.nsopw.gov" },
    { id: "officer-watch", icon: "eye" as const, title: "Officer Watch", desc: "Track law enforcement officers flagged for violence against minorities and their department transfers.", color: "#DC2626", route: "/officer-watch" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Safety Hub</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#CA922B" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Active alerts */}
          {(pendingCheckins.length > 0 || pendingMeetups.length > 0) && (
            <View style={styles.alertsSection}>
              {pendingCheckins.map((c) => (
                <View key={c.id} style={[styles.alertCard, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
                  <Feather name="clock" size={18} color="#DC2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: "#991B1B" }]}>Check-in due {formatRelativeTime(c.scheduledAt)}</Text>
                    <Text style={[styles.alertSub, { color: "#7F1D1D" }]}>Contact: {c.trustedContactName}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.imSafeBtn, { backgroundColor: "#16A34A" }]}
                    onPress={() => void handleConfirmCheckin(c.id)}
                    activeOpacity={0.85}
                  >
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
                    <TouchableOpacity
                      style={[styles.imSafeBtn, { backgroundColor: "#2563EB" }]}
                      onPress={() => router.push("/member-connections" as Parameters<typeof router.push>[0])}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.imSafeBtnText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Active location shares */}
          {activeShares.length > 0 && (
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
                      Expires {formatRelativeTime(s.expiresAt)}
                      {s.recipientEmail ? ` · ${s.recipientEmail}` : ""}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => void handleStopShare(s.id)} activeOpacity={0.7} style={{ padding: 8 }}>
                    <Feather name="x-circle" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Feature grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Safety Features</Text>
            <View style={styles.featureGrid}>
              {FEATURES.map((f) => (
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

          {/* Community safety pledge */}
          <View style={[styles.pledge, { backgroundColor: "#CA922B0F", borderColor: "#CA922B30" }]}>
            <Feather name="heart" size={18} color="#CA922B" />
            <Text style={[styles.pledgeText, { color: colors.foreground }]}>
              Mapping With Melanin is built on trust and community care. Every safety feature here exists because our members deserved better — use them, share them, and look out for each other.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20, gap: 24, paddingBottom: 60 },
  alertsSection: { gap: 10 },
  alertCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  alertTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  alertSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  imSafeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  imSafeBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  section: { gap: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  shareCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  shareIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  shareName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  shareExpiry: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  featureCard: { width: "47%", borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  featureTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  featureDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  pledge: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  pledgeText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
});
