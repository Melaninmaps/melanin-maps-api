/**
 * Debug screen — Crash Log
 *
 * Shows the last crash report captured by the crash logger, including
 * full stack trace, navigation breadcrumbs, API requests, and device state.
 *
 * Access: Settings → (scroll down) → "View Crash Log" (only visible in dev
 * or when a crash has been recorded).
 *
 * This screen reads from AsyncStorage so it works across launches. The
 * founder can open this immediately after a crash to see the full context
 * without needing TestFlight or a Mac.
 */

import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getSavedCrashReport, clearSavedCrashReport, type CrashReport } from "@/lib/crashLogger";

export default function CrashLogScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [report, setReport] = useState<CrashReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedCrashReport().then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, []);

  const handleShare = async () => {
    if (!report) return;
    try {
      await Share.share({
        title: "MWM Crash Report",
        message: JSON.stringify(report, null, 2),
      });
    } catch {}
  };

  const handleClear = () => {
    Alert.alert("Clear crash log?", "This removes the saved crash report from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          clearSavedCrashReport().then(() => setReport(null));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#C9A84C" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.label}>No crash report on record.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnTxt}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Crash Report</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
            <Text style={styles.actionBtnTxt}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={[styles.actionBtn, styles.clearBtn]}>
            <Text style={[styles.actionBtnTxt, { color: "#FF6B6B" }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Summary */}
        <Section title="Summary">
          <Row label="Type" value={report.type} />
          <Row label="Error" value={report.error.message} highlight />
          <Row label="Time" value={report.ts} />
          <Row label="Screen" value={report.context.currentScreen} />
          <Row label="App state" value={report.context.appState} />
          <Row label="Platform" value={`${report.context.platform} ${report.context.osVersion}`} />
          <Row label="Version" value={`${report.context.version} (build ${report.context.buildNumber})`} />
          <Row label="Commit" value={report.context.commitSha} />
          <Row label="Sent to server" value={report.sent ? "✅ Yes" : "⚠️ No — retrying on next launch"} />
        </Section>

        {/* Stack trace */}
        <Section title="Stack Trace">
          <Text style={styles.code}>{report.error.stack}</Text>
        </Section>

        {/* Navigation breadcrumbs */}
        <Section title={`Navigation (last ${report.context.breadcrumbs.filter(b => b.type === "navigation").length})`}>
          {report.context.breadcrumbs
            .filter((b) => b.type === "navigation")
            .map((b, i) => (
              <Text key={i} style={styles.breadcrumb}>{b.ts.slice(11, 19)} {b.message}</Text>
            ))}
        </Section>

        {/* All breadcrumbs */}
        <Section title={`All Breadcrumbs (${report.context.breadcrumbs.length})`}>
          {report.context.breadcrumbs.map((b, i) => (
            <Text key={i} style={[styles.breadcrumb, b.type === "memory" && styles.warn]}>
              [{b.type}] {b.ts.slice(11, 19)} {b.message}
            </Text>
          ))}
        </Section>

        {/* Last API requests */}
        <Section title={`Last API Requests (${report.context.lastApiRequests.length})`}>
          {report.context.lastApiRequests.map((r, i) => (
            <View key={i} style={styles.apiRow}>
              <Text style={[styles.apiStatus, (r.status ?? 0) >= 400 && styles.apiError]}>
                {r.method} {r.status ?? "ERR"} {r.durationMs != null ? `${r.durationMs}ms` : ""}
              </Text>
              <Text style={styles.apiUrl} numberOfLines={2}>{r.url}</Text>
              {r.error ? <Text style={styles.apiErrorMsg}>{r.error}</Text> : null}
            </View>
          ))}
        </Section>

        {/* Map / location state */}
        <Section title="Map / Location State">
          <Row label="Permission" value={report.context.mapState.permissionStatus ?? "unknown"} />
          <Row label="Loading" value={String(report.context.mapState.loading ?? "unknown")} />
          {report.context.mapState.lastLat != null && (
            <Row label="Last coords" value={`${report.context.mapState.lastLat}, ${report.context.mapState.lastLng}`} />
          )}
          {report.context.mapState.error && (
            <Row label="Map error" value={report.context.mapState.error} highlight />
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]} selectable>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1C0E06" },
  center: { flex: 1, backgroundColor: "#1C0E06", alignItems: "center", justifyContent: "center", gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A1208",
  },
  backLink: { color: "#C9A84C", fontSize: 14, marginRight: 12 },
  title: { flex: 1, color: "#FBF7F0", fontSize: 16, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#2A1208" },
  clearBtn: { borderWidth: 1, borderColor: "#FF6B6B33" },
  actionBtnTxt: { color: "#C9A84C", fontSize: 13, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80, gap: 20 },
  section: { backgroundColor: "#2A1208", borderRadius: 12, padding: 14, gap: 8 },
  sectionTitle: { color: "#C9A84C", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  code: { color: "#FBF7F0", fontSize: 11, fontFamily: "Courier", lineHeight: 16 },
  breadcrumb: { color: "#C0A882", fontSize: 11, fontFamily: "Courier" },
  warn: { color: "#FF9F45" },
  row: { flexDirection: "row", gap: 8 },
  rowLabel: { color: "#7A5C3C", fontSize: 12, width: 90 },
  rowValue: { color: "#FBF7F0", fontSize: 12, flex: 1 },
  rowValueHighlight: { color: "#FF6B6B" },
  apiRow: { gap: 2, marginBottom: 8 },
  apiStatus: { color: "#78D97B", fontSize: 12, fontWeight: "600" },
  apiError: { color: "#FF6B6B" },
  apiUrl: { color: "#C0A882", fontSize: 11, fontFamily: "Courier" },
  apiErrorMsg: { color: "#FF6B6B", fontSize: 11 },
  label: { color: "#7A5C3C", fontSize: 14 },
  backBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#2A1208", borderRadius: 8 },
  backBtnTxt: { color: "#C9A84C", fontWeight: "600" },
});
