import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBase, getMemberApiHeaders } from "@/lib/api";

type ReceivedCheckinAlert = {
  notificationId: string;
  title: string;
  body: string;
  createdAt: string;
  status: "overdue" | "resolved";
  privacy: string;
};

export default function SafetyCheckinAlertScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notificationId } = useLocalSearchParams<{ notificationId?: string }>();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [alert, setAlert] = useState<ReceivedCheckinAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!notificationId) {
        if (active) {
          setError("This Safety Check-In alert is unavailable.");
          setLoading(false);
        }
        return;
      }
      try {
        const headers = await getMemberApiHeaders();
        const response = await fetch(
          `${getApiBase()}/api/safety/checkins/received/${encodeURIComponent(notificationId)}`,
          {
            headers,
            credentials: Platform.OS === "web" ? "include" : "omit",
          },
        );
        if (!response.ok) throw new Error("Safety Check-In alert is unavailable.");
        const payload = await response.json() as { alert?: ReceivedCheckinAlert };
        if (!payload.alert) throw new Error("Safety Check-In alert is unavailable.");
        if (!active) return;
        setAlert(payload.alert);
        setError(null);

        const token = Platform.OS !== "web"
          ? await SecureStore.getItemAsync("auth_session_token")
          : null;
        if (token) {
          fetch(`${getApiBase()}/api/notifications/${encodeURIComponent(notificationId)}/read`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Safety Check-In alert is unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [notificationId]);

  const statusColor = alert?.status === "overdue" ? "#B45309" : "#2D7A4F";
  const statusLabel = alert?.status === "overdue" ? "Check-In overdue" : "Check-In resolved";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityLabel="Back to notifications"
          style={styles.back}
          activeOpacity={0.85}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/notification-center")}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Safety Check-In</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}>
        {loading ? (
          <View style={styles.loading} accessibilityLabel="Loading Safety Check-In alert">
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>Loading a private Safety Check-In alert…</Text>
          </View>
        ) : error || !alert ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shield" size={28} color={colors.mutedForeground} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Alert unavailable</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {error ?? "This Safety Check-In alert is not available for this account."}
            </Text>
            <TouchableOpacity
              accessibilityLabel="Return to notifications"
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={() => router.replace("/notification-center")}
            >
              <Text style={[styles.secondaryText, { color: colors.foreground }]}>Return to notifications</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.statusCard, { backgroundColor: statusColor + "14", borderColor: statusColor + "45" }]}>
              <View style={[styles.statusIcon, { backgroundColor: statusColor + "24" }]}>
                <Feather name="shield" size={23} color={statusColor} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{alert.title}</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.body, { color: colors.foreground }]}>{alert.body}</Text>
              <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                Alert received {new Date(alert.createdAt).toLocaleString()}
              </Text>
            </View>

            <View style={[styles.privacyCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="lock" size={19} color={colors.primary} />
              <View style={styles.flex}>
                <Text style={[styles.privacyTitle, { color: colors.foreground }]}>Privacy boundary</Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>{alert.privacy}</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>What to do</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                If appropriate, use an ordinary contact method you already have to check in with the trusted member. This alert does not contact emergency services or reveal where anyone is.
              </Text>
              <TouchableOpacity
                accessibilityLabel="Open Safety Hub"
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/safety-hub")}
              >
                <Text style={styles.primaryText}>Open Safety Hub</Text>
                <Feather name="arrow-right" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { width: 36, height: 36, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  content: { padding: 20, gap: 14 },
  loading: { alignItems: "center", gap: 12, paddingTop: 60 },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 10 },
  statusCard: { borderWidth: 1, borderRadius: 16, padding: 18, flexDirection: "row", gap: 13, alignItems: "center" },
  statusIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  statusLabel: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  body: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  timestamp: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  privacyCard: { borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  privacyTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 3 },
  flex: { flex: 1 },
  primaryButton: { marginTop: 4, borderRadius: 12, minHeight: 46, paddingHorizontal: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  primaryText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_700Bold" },
  secondaryButton: { marginTop: 4, borderWidth: 1, borderRadius: 12, minHeight: 44, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
