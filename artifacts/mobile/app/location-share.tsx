import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

const DURATION_OPTIONS = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "8 hours", minutes: 480 },
  { label: "24 hours", minutes: 1440 },
];

export default function LocationShareScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);

  const [shares, setShares] = useState<LocationShare[]>([]);
  const [renderedAt] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [label, setLabel] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [creating, setCreating] = useState(false);
  const [activeShareId, setActiveShareId] = useState<number | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchShares = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/safety/location-shares`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json() as { shares: LocationShare[] }; setShares(d.shares ?? []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { queueMicrotask(() => { void fetchShares(); }); }, [fetchShares]);

  const startLocationUpdates = useCallback((token: string) => {
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    locationIntervalRef.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const activeShare = shares.find((s) => s.isActive && s.id === activeShareId);
        if (!activeShare) return;
        await fetch(`${getApiBase()}/api/safety/location-shares/${activeShare.shareToken}/update`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: loc.coords.latitude, lng: loc.coords.longitude }),
        });
      } catch { /* silent */ }
    }, 30000);
  }, [shares, activeShareId]);

  useEffect(() => {
    if (activeShareId) {
      SecureStore.getItemAsync("auth_session_token").then((t) => { if (t) startLocationUpdates(t); }).catch(() => {});
    }
    return () => { if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); };
  }, [activeShareId, startLocationUpdates]);

  const handleCreate = async () => {
    setCreating(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location access is needed to share your position.");
        return;
      }
      const token = await SecureStore.getItemAsync("auth_session_token");
      const res = await fetch(`${getApiBase()}/api/safety/location-shares`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || "My Live Location",
          recipientEmail: recipientEmail.trim() || undefined,
          durationMinutes: selectedDuration,
        }),
      });
      const d = await res.json() as { share?: LocationShare; error?: string };
      if (res.ok && d.share) {
        setShares((prev) => [d.share!, ...prev]);
        setActiveShareId(d.share!.id);
        setShowNew(false);
        setLabel(""); setRecipientEmail("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const shareUrl = `https://mappingwithmelanin.com/safety/location/${d.share!.shareToken}`;
        Alert.alert(
          "Location Sharing Active",
          `Your location is now being shared. Copy the link to send to ${recipientEmail || "your contact"}.`,
          [
            { text: "Copy Link", onPress: () => { void Clipboard.setStringAsync(shareUrl); Haptics.selectionAsync(); } },
            { text: "Done" },
          ],
        );
      } else {
        Alert.alert("Error", d.error ?? "Failed to start location share.");
      }
    } finally { setCreating(false); }
  };

  const handleStop = (id: number) => {
    Alert.alert("Stop Sharing", "Stop sharing your location?", [
      { text: "Keep Sharing", style: "cancel" },
      {
        text: "Stop", style: "destructive", onPress: async () => {
          const token = await SecureStore.getItemAsync("auth_session_token");
          await fetch(`${getApiBase()}/api/safety/location-shares/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
          setShares((prev) => prev.map((s) => s.id === id ? { ...s, isActive: false } : s));
          if (activeShareId === id) { setActiveShareId(null); if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); }
        },
      },
    ]);
  };

  const handleCopyLink = async (token: string) => {
    const url = `https://mappingwithmelanin.com/safety/location/${token}`;
    await Clipboard.setStringAsync(url);
    if (Platform.OS !== "web") Haptics.selectionAsync();
    Alert.alert("Copied!", "Location link copied to clipboard.");
  };

  const formatExpiry = (iso: string) => {
    const d = new Date(iso);
    const diffMs = d.getTime() - renderedAt;
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 0) return "Expired";
    if (diffMin < 60) return `${diffMin}m remaining`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m > 0 ? `${h}h ${m}m remaining` : `${h}h remaining`;
  };

  const activeShares = shares.filter((s) => s.isActive && new Date(s.expiresAt) > new Date());
  const pastShares = shares.filter((s) => !s.isActive || new Date(s.expiresAt) <= new Date());

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Location Sharing</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : (
        <ScrollView
        keyboardDismissMode="on-drag" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.infoBanner, { backgroundColor: "#2563EB0F", borderColor: "#2563EB30" }]}>
            <Feather name="map-pin" size={18} color="#2563EB" />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Share a live location link with a trusted contact. The link shows your real-time position until the share expires or you stop it.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: "#2563EB18", borderColor: "#2563EB40" }]}
            onPress={() => setShowNew((v) => !v)}
            activeOpacity={0.75}
          >
            <Feather name={showNew ? "chevron-up" : "map-pin"} size={18} color="#2563EB" />
            <Text style={[styles.newBtnText, { color: "#2563EB" }]}>{showNew ? "Cancel" : "Start Location Share"}</Text>
          </TouchableOpacity>

          {showNew && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Label (optional)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="e.g. Trip to Downtown, Date Night"
                placeholderTextColor={colors.mutedForeground}
                value={label}
                onChangeText={setLabel}
              />
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Recipient Email (optional)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Send link to email address"
                placeholderTextColor={colors.mutedForeground}
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Duration</Text>
              <ScrollView
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.durationRow}>
                  {DURATION_OPTIONS.map((o) => {
                    const sel = selectedDuration === o.minutes;
                    return (
                      <TouchableOpacity
                        key={o.minutes}
                        style={[styles.durationChip, { borderColor: sel ? "#2563EB" : colors.border, backgroundColor: sel ? "#2563EB" : colors.background }]}
                        onPress={() => setSelectedDuration(o.minutes)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.durationText, { color: sel ? "#fff" : colors.foreground }]}>{o.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              <TouchableOpacity
                style={[styles.saveBtn, { opacity: creating ? 0.6 : 1 }]}
                onPress={() => void handleCreate()}
                disabled={creating}
                activeOpacity={0.85}
              >
                {creating ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="map-pin" size={16} color="#fff" />}
                <Text style={styles.saveBtnText}>{creating ? "Starting…" : "Start Sharing"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeShares.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Shares</Text>
              {activeShares.map((s) => (
                <View key={s.id} style={[styles.shareCard, { backgroundColor: colors.card, borderColor: "#2563EB40" }]}>
                  <View style={styles.shareHeader}>
                    <View style={[styles.shareIconWrap, { backgroundColor: "#2563EB18" }]}>
                      <Feather name="radio" size={16} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.shareLabel, { color: colors.foreground }]}>{s.label}</Text>
                      <Text style={[styles.shareExpiry, { color: "#2563EB" }]}>{formatExpiry(s.expiresAt)}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.stopBtn, { borderColor: "#DC2626" }]}
                      onPress={() => handleStop(s.id)}
                      activeOpacity={0.7}
                    >
                      <Feather name="x" size={14} color="#DC2626" />
                      <Text style={styles.stopBtnText}>Stop</Text>
                    </TouchableOpacity>
                  </View>
                  {s.lastUpdatedAt && (
                    <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
                      Last updated: {new Date(s.lastUpdatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.copyBtn, { backgroundColor: "#2563EB18", borderColor: "#2563EB30" }]}
                    onPress={() => void handleCopyLink(s.shareToken)}
                    activeOpacity={0.7}
                  >
                    <Feather name="copy" size={14} color="#2563EB" />
                    <Text style={[styles.copyBtnText, { color: "#2563EB" }]}>Copy Share Link</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {activeShares.length === 0 && pastShares.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="map-pin" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No location shares yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Start a share before a meetup or trip so a trusted contact can see where you are in real time.
              </Text>
            </View>
          )}

          {pastShares.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Past Shares</Text>
              {pastShares.slice(0, 5).map((s) => (
                <View key={s.id} style={[styles.pastCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="map-pin" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.pastLabel, { color: colors.foreground }]}>{s.label}</Text>
                  <Text style={[styles.pastExpiry, { color: colors.mutedForeground }]}>Expired</Text>
                </View>
              ))}
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
  formCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 4 },
  formLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 8, marginBottom: 4 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontFamily: "Inter_400Regular", fontSize: 14 },
  durationRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  durationChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  durationText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  saveBtn: { backgroundColor: "#2563EB", borderRadius: 14, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  saveBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  section: { gap: 10 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  shareCard: { borderRadius: 18, borderWidth: 1.5, padding: 14, gap: 8 },
  shareHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  shareIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  shareLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  shareExpiry: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  stopBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  stopBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#DC2626" },
  lastUpdated: { fontFamily: "Inter_400Regular", fontSize: 12 },
  copyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  copyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  emptyCard: { borderRadius: 18, borderWidth: 1, padding: 28, alignItems: "center", gap: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 },
  pastCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  pastLabel: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  pastExpiry: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
