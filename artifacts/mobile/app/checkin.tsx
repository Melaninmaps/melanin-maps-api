import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function getApiBase() {
  if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  return "";
}

type SafetyCheckin = {
  id: number;
  trustedContactName: string;
  trustedContactEmail: string | null;
  scheduledAt: string;
  status: string;
  confirmedAt: string | null;
  note: string | null;
  city: string | null;
  location: string | null;
  recipients?: TrustedProfile[];
  deliverySummary?: {
    channel: "in_app_notification";
    total: number;
    pending: number;
    delivered: number;
    skipped: number;
    state: "legacy_email_unobserved" | "scheduled_not_sent" | "delivered" | "partially_processed" | "partially_delivered" | "skipped";
  };
};

type TrustedProfile = {
  trustedShareId: string;
  recipientUserId: string;
  recipientName: string;
  profileImageUrl: string | null;
  pushEnabled?: boolean;
  deliveryStatus?: "pending" | "delivered" | "skipped";
  notifiedAt?: string | null;
};

const DURATION_OPTIONS = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "3 hours", minutes: 180 },
  { label: "4 hours", minutes: 240 },
  { label: "Tonight", minutes: 480 },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#C9922B",
  checked_in: "#16A34A",
  overdue: "#DC2626",
  cancelled: "#6B7280",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  checked_in: "✓ Checked In",
  overdue: "⚠️ Overdue",
  cancelled: "Cancelled",
};

function deliveryLabel(checkin: SafetyCheckin): string {
  const summary = checkin.deliverySummary;
  if (!summary || summary.total === 0) {
    return checkin.trustedContactEmail
      ? "Legacy email delivery is not tracked here"
      : "No in-app delivery record";
  }
  if (summary.state === "scheduled_not_sent") {
    return `Alert scheduled, not sent · ${summary.pending}/${summary.total} waiting`;
  }
  const parts = [
    summary.delivered > 0 ? `${summary.delivered} delivered` : null,
    summary.pending > 0 ? `${summary.pending} waiting` : null,
    summary.skipped > 0 ? `${summary.skipped} skipped` : null,
  ].filter(Boolean);
  return `In-app alert delivery · ${parts.join(" · ")}`;
}

export default function CheckinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [checkins, setCheckins] = useState<SafetyCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [trustedProfiles, setTrustedProfiles] = useState<TrustedProfile[]>([]);
  const [selectedShareIds, setSelectedShareIds] = useState<string[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleUseLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location Access", "Enable location access in Settings to use this feature.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (geo) {
        const parts = [geo.streetNumber, geo.street, geo.city, geo.region].filter(Boolean);
        setLocation(parts.join(", "));
      }
    } catch { Alert.alert("Location Error", "Could not get your location. Try again."); }
    finally { setLocating(false); }
  };

  const fetchCheckins = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/safety/checkins`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json() as { checkins: SafetyCheckin[] }; setCheckins(d.checkins ?? []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { queueMicrotask(() => { void fetchCheckins(); }); }, [fetchCheckins]);

  const fetchTrustedProfiles = useCallback(async () => {
    setProfilesLoading(true);
    setProfilesError(null);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/safety/checkins/recipients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { recipients?: TrustedProfile[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not load trusted profiles");
      setTrustedProfiles(data.recipients ?? []);
    } catch (error) {
      setProfilesError(error instanceof Error ? error.message : "Could not load trusted profiles");
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showNew) void fetchTrustedProfiles();
  }, [fetchTrustedProfiles, showNew]);

  const toggleTrustedProfile = (trustedShareId: string) => {
    setSelectedShareIds((current) => {
      if (current.includes(trustedShareId)) return current.filter((id) => id !== trustedShareId);
      if (current.length >= 5) {
        Alert.alert("Up to 5 profiles", "A Check-In can alert up to five trusted Kinfolk profiles.");
        return current;
      }
      return [...current, trustedShareId];
    });
  };

  const handleCreate = async () => {
    if (selectedShareIds.length === 0) {
      Alert.alert("Choose a trusted profile", "Select at least one trusted Kinfolk profile to receive an in-app safety alert.");
      return;
    }
    setSaving(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const scheduledAt = new Date(Date.now() + selectedDuration * 60 * 1000);
      const res = await fetch(`${getApiBase()}/api/safety/checkins`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientShareIds: selectedShareIds,
          scheduledAt: scheduledAt.toISOString(),
          note: note.trim() || undefined,
          location: location.trim() || undefined,
        }),
      });
      const d = await res.json() as { checkin?: SafetyCheckin; error?: string };
      if (res.ok && d.checkin) {
        setCheckins((prev) => [d.checkin!, ...prev]);
        setShowNew(false);
        setSelectedShareIds([]); setNote(""); setLocation("");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Check-In Scheduled ✓",
          `The alert is scheduled, not sent yet. If you don't confirm by ${scheduledAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}, delivery will be attempted to your selected trusted profile${selectedShareIds.length === 1 ? "" : "s"}.`,
        );
      } else {
        Alert.alert("Error", d.error ?? "Failed to schedule check-in.");
      }
    } finally { setSaving(false); }
  };

  const handleConfirm = async (id: number) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const token = await SecureStore.getItemAsync("auth_session_token");
    const res = await fetch(`${getApiBase()}/api/safety/checkins/${id}/confirm`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setCheckins((prev) => prev.map((c) => c.id === id ? { ...c, status: "checked_in", confirmedAt: new Date().toISOString() } : c));
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Cancel Check-In", "Remove this scheduled check-in?", [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          const token = await SecureStore.getItemAsync("auth_session_token");
          await fetch(`${getApiBase()}/api/safety/checkins/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
          setCheckins((prev) => prev.filter((c) => c.id !== id));
        },
      },
    ]);
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Safety Check-In</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#16A34A" /></View>
      ) : (
        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* How it works banner */}
          <View style={[styles.infoBanner, { backgroundColor: "#16A34A0F", borderColor: "#16A34A30" }]}>
            <Feather name="check-circle" size={18} color="#16A34A" />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Schedule an in-app alert attempt if you miss your check-in. This is not live location tracking, emergency dispatch, or a substitute for calling local emergency services. No email is required.
            </Text>
          </View>

          {/* New check-in form */}
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: "#16A34A18", borderColor: "#16A34A40" }]}
            onPress={() => setShowNew((v) => !v)}
            activeOpacity={0.75}
          >
            <Feather name={showNew ? "chevron-up" : "plus-circle"} size={18} color="#16A34A" />
            <Text style={[styles.newBtnText, { color: "#16A34A" }]}>{showNew ? "Cancel" : "New Check-In"}</Text>
          </TouchableOpacity>

          {showNew && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Alert trusted Kinfolk profiles</Text>
              <Text style={[styles.profileHelp, { color: colors.mutedForeground }]}>
                Only people who accepted your Trusted Safety Share and allow safety alerts appear here. Choose up to five profiles.
              </Text>
              {profilesLoading ? (
                <View style={styles.profileState}><ActivityIndicator size="small" color="#16A34A" /></View>
              ) : profilesError ? (
                <View style={[styles.profileState, { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" }]}>
                  <Text style={{ color: "#991B1B", flex: 1 }}>{profilesError}</Text>
                  <TouchableOpacity onPress={() => void fetchTrustedProfiles()} accessibilityRole="button" accessibilityLabel="Retry trusted profile loading">
                    <Text style={{ color: "#166534", fontFamily: "Inter_700Bold" }}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : trustedProfiles.length === 0 ? (
                <View style={[styles.profileState, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.profileEmptyTitle, { color: colors.foreground }]}>No eligible trusted profiles yet</Text>
                    <Text style={[styles.profileHelp, { color: colors.mutedForeground }]}>Add a trusted Kinfolk profile in Safety, then have them accept your request before scheduling a Check-In.</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/trusted-safety-share")} accessibilityRole="button" accessibilityLabel="Add a trusted safety profile">
                    <Text style={{ color: "#166534", fontFamily: "Inter_700Bold" }}>Add</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.profileList}>
                  {trustedProfiles.map((profile) => {
                    const selected = selectedShareIds.includes(profile.trustedShareId);
                    return (
                      <TouchableOpacity
                        key={profile.trustedShareId}
                        style={[styles.profileOption, { borderColor: selected ? "#16A34A" : colors.border, backgroundColor: selected ? "#16A34A12" : colors.background }]}
                        onPress={() => toggleTrustedProfile(profile.trustedShareId)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={`Alert ${profile.recipientName}`}
                      >
                        <View style={[styles.profileAvatar, { backgroundColor: "#16A34A18" }]}>
                          <Feather name="user" size={15} color="#16A34A" />
                        </View>
                        <Text style={[styles.profileName, { color: colors.foreground }]} numberOfLines={1}>{profile.recipientName}</Text>
                        <Feather name={selected ? "check-circle" : "circle"} size={20} color={selected ? "#16A34A" : colors.mutedForeground} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Check in by (from now)</Text>
              <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.durationRow}>
                  {DURATION_OPTIONS.map((o) => {
                    const sel = selectedDuration === o.minutes;
                    return (
                      <TouchableOpacity
                        key={o.minutes}
                        style={[styles.durationChip, { borderColor: sel ? "#16A34A" : colors.border, backgroundColor: sel ? "#16A34A" : colors.background }]}
                        onPress={() => setSelectedDuration(o.minutes)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.durationText, { color: sel ? "#fff" : colors.foreground }]}>{o.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Location (optional)</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  style={[styles.input, { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="e.g. Downtown Atlanta, Midtown bar"
                  placeholderTextColor={colors.mutedForeground}
                  value={location}
                  onChangeText={setLocation}
                />
                <TouchableOpacity
                  onPress={() => void handleUseLocation()}
                  disabled={locating}
                  style={{ padding: 10, borderRadius: 10, backgroundColor: colors.primary, opacity: locating ? 0.6 : 1 }}
                >
                  {locating
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Feather name="navigation" size={16} color="#fff" />}
                </TouchableOpacity>
              </View>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Note (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Any additional details..."
                placeholderTextColor={colors.mutedForeground}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[styles.saveBtn, { opacity: saving ? 0.6 : 1 }]}
                onPress={() => void handleCreate()}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="check-circle" size={16} color="#fff" />}
                <Text style={styles.saveBtnText}>{saving ? "Scheduling…" : "Schedule Check-In"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Existing check-ins */}
          {checkins.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="check-circle" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No check-ins yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Before a meetup, schedule an alert attempt to trusted profiles if you miss your check-in.
              </Text>
            </View>
          ) : (
            <View style={styles.checkinList}>
              {checkins.map((c) => {
                const isPending = c.status === "pending";
                const isOverdue = c.status === "overdue";
                const statusColor = STATUS_COLORS[c.status] ?? "#6B7280";
                return (
                  <View key={c.id} style={[styles.checkinCard, { backgroundColor: colors.card, borderColor: colors.border }, (isOverdue) && { borderColor: "#FECACA" }]}>
                    <View style={styles.checkinHeader}>
                      <View style={[styles.checkinIconWrap, { backgroundColor: statusColor + "18" }]}>
                        <Feather name={isPending ? "clock" : isOverdue ? "alert-triangle" : "check-circle"} size={16} color={statusColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.checkinContact, { color: colors.foreground }]}>{c.trustedContactName}</Text>
                        <Text style={[styles.checkinEmail, { color: colors.mutedForeground }]}>
                          {c.recipients?.length
                            ? `${c.recipients.length} trusted profile${c.recipients.length === 1 ? "" : "s"} · In-app alert`
                            : c.trustedContactEmail ?? "Trusted profile · In-app alert"}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[c.status] ?? c.status}</Text>
                      </View>
                    </View>
                    <View style={[styles.checkinMeta, { borderTopColor: colors.border }]}>
                      <Feather name="clock" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.checkinTime, { color: colors.mutedForeground }]}>Due: {formatTime(c.scheduledAt)}</Text>
                      {c.location && (
                        <>
                          <Feather name="map-pin" size={12} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
                          <Text style={[styles.checkinTime, { color: colors.mutedForeground }]}>{c.location}</Text>
                        </>
                      )}
                    </View>
                    <View style={[styles.deliveryRow, { borderTopColor: colors.border }]}>
                      <Feather name="bell" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.deliveryText, { color: colors.mutedForeground }]}>{deliveryLabel(c)}</Text>
                    </View>
                    {isPending && (
                      <TouchableOpacity
                        style={styles.iAmSafeBtn}
                        onPress={() => void handleConfirm(c.id)}
                        activeOpacity={0.85}
                      >
                        <Feather name="check" size={16} color="#fff" />
                        <Text style={styles.iAmSafeBtnText}>I&apos;m Safe ✓</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(c.id)} activeOpacity={0.7}>
                      <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
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
  scroll: { padding: 20, gap: 16, paddingBottom: 60 },
  infoBanner: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start" },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, flex: 1 },
  newBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  newBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  formCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 6 },
  formLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 8, marginBottom: 4 },
  profileHelp: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginBottom: 5 },
  profileList: { gap: 8, marginBottom: 4 },
  profileState: { minHeight: 58, borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  profileEmptyTitle: { fontFamily: "Inter_700Bold", fontSize: 13, marginBottom: 2 },
  profileOption: { minHeight: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  profileAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  profileName: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 14 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontFamily: "Inter_400Regular", fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  durationRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  durationChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  durationText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  saveBtn: { backgroundColor: "#16A34A", borderRadius: 14, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  saveBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  emptyCard: { borderRadius: 18, borderWidth: 1, padding: 28, alignItems: "center", gap: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 },
  checkinList: { gap: 12 },
  checkinCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden", position: "relative" },
  checkinHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  checkinIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  checkinContact: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  checkinEmail: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  checkinMeta: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  checkinTime: { fontFamily: "Inter_400Regular", fontSize: 12 },
  deliveryRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderTopWidth: 1 },
  deliveryText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 17 },
  iAmSafeBtn: { backgroundColor: "#16A34A", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, margin: 12, marginTop: 0, borderRadius: 12 },
  iAmSafeBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  deleteBtn: { position: "absolute", top: 14, right: 14, padding: 4 },
});
