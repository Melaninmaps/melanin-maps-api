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
  trustedContactEmail: string;
  scheduledAt: string;
  status: string;
  confirmedAt: string | null;
  note: string | null;
  city: string | null;
  location: string | null;
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

export default function CheckinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [checkins, setCheckins] = useState<SafetyCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
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

  useEffect(() => { void fetchCheckins(); }, [fetchCheckins]);

  const handleCreate = async () => {
    if (!contactName.trim() || !contactEmail.includes("@")) {
      Alert.alert("Required", "Please enter your trusted contact's name and email.");
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
          trustedContactName: contactName.trim(),
          trustedContactEmail: contactEmail.trim(),
          scheduledAt: scheduledAt.toISOString(),
          note: note.trim() || undefined,
          location: location.trim() || undefined,
        }),
      });
      const d = await res.json() as { checkin?: SafetyCheckin; error?: string };
      if (res.ok && d.checkin) {
        setCheckins((prev) => [d.checkin!, ...prev]);
        setShowNew(false);
        setContactName(""); setContactEmail(""); setNote(""); setLocation("");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Check-In Scheduled ✓",
          `If you don't confirm your safety by ${scheduledAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}, ${contactName} will be notified.`,
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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* How it works banner */}
          <View style={[styles.infoBanner, { backgroundColor: "#16A34A0F", borderColor: "#16A34A30" }]}>
            <Feather name="check-circle" size={18} color="#16A34A" />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Schedule a check-in before going somewhere. If you don't tap "I'm Safe" in time, your trusted contact gets an automated email alert.
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
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Trusted Contact Name</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="e.g. Mom, Best Friend, Partner"
                placeholderTextColor={colors.mutedForeground}
                value={contactName}
                onChangeText={setContactName}
                autoCapitalize="words"
              />
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Their Email</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="email@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Check in by (from now)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                Before your next meetup, schedule a check-in so someone you trust always knows you're safe.
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
                        <Text style={[styles.checkinEmail, { color: colors.mutedForeground }]}>{c.trustedContactEmail}</Text>
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
                    {isPending && (
                      <TouchableOpacity
                        style={styles.iAmSafeBtn}
                        onPress={() => void handleConfirm(c.id)}
                        activeOpacity={0.85}
                      >
                        <Feather name="check" size={16} color="#fff" />
                        <Text style={styles.iAmSafeBtnText}>I'm Safe ✓</Text>
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
  iAmSafeBtn: { backgroundColor: "#16A34A", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, margin: 12, marginTop: 0, borderRadius: 12 },
  iAmSafeBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  deleteBtn: { position: "absolute", top: 14, right: 14, padding: 4 },
});
