import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getApiBase } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

type Mode = "off" | "review" | "on";
type Evidence = { id: string; signalKey: string; stance: "helpful" | "not_helpful"; count: number; status: "pending" | "active" };
type ViewState = { mode: Mode; evidence: Evidence[]; disclosure?: string };
const modes: Array<{ value: Mode; label: string; detail: string }> = [
  { value: "off", label: "Off", detail: "Default. Do not collect or use this layer." },
  { value: "review", label: "Review", detail: "Wait for your approval before use." },
  { value: "on", label: "On", detail: "Review or delete at any time." },
];

async function authToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); } catch { return null; }
}
function unavailable(payload: unknown): string {
  const code = typeof payload === "object" && payload !== null && "error" in payload ? (payload as { error?: unknown }).error : undefined;
  return code === "KINFOLK_BEHAVIORAL_EVIDENCE_SCHEMA_UNAVAILABLE"
    ? "Behavioral evidence needs its approved service migration before it is available. No behavioral evidence was changed or used."
    : "Behavioral evidence could not be updated. Nothing was claimed as saved.";
}
function label(key: string) { return key.replace(/_/g, " "); }

/** Separate from explicit preferences, saved memories, and Current Chapter. */
export function KinfolkBehavioralEvidenceControl() {
  const colors = useColors();
  const [view, setView] = useState<ViewState>({ mode: "off", evidence: [] });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const auth = await authToken(); const base = getApiBase();
      if (!auth || !base) throw new Error("Please sign in again to view behavioral evidence.");
      const response = await fetch(`${base}/api/kinfolk/behavioral-evidence`, { headers: { Authorization: `Bearer ${auth}` }, cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(unavailable(payload));
      const data = payload as Partial<ViewState>;
      setView({ mode: data.mode === "review" || data.mode === "on" ? data.mode : "off", evidence: Array.isArray(data.evidence) ? data.evidence as Evidence[] : [], disclosure: typeof data.disclosure === "string" ? data.disclosure : undefined });
      setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Behavioral evidence could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const request = async (path: string, method: "PUT" | "PATCH" | "DELETE", body?: unknown) => {
    setWorking(true); setError(null);
    try {
      const auth = await authToken(); const base = getApiBase();
      if (!auth || !base) throw new Error("Please sign in again to update behavioral evidence.");
      const response = await fetch(`${base}/api/kinfolk/behavioral-evidence${path}`, {
        method, cache: "no-store", headers: { Authorization: `Bearer ${auth}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(unavailable(payload));
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Behavioral evidence could not be updated. Nothing was claimed as saved."); }
    finally { setWorking(false); }
  };

  return <>
    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>REVIEWABLE INTERACTION PATTERNS</Text>
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLabel="Reviewable behavioral evidence controls">
      <View style={styles.copy}><View style={styles.copyTitle}><Feather name="eye" size={16} color={colors.primary} /><Text style={[styles.title, { color: colors.foreground }]}>Member-controlled behavioral evidence</Text></View><Text style={[styles.detail, { color: colors.mutedForeground }]}>{view.disclosure ?? "This separate layer is not a saved memory, preference, or Current Chapter."}</Text><Text style={[styles.detail, { color: colors.mutedForeground }]}>It never infers your identity, health, legal or immigration status, financial status, relationship, safety status, or a sensitive life circumstance. V1 uses only your explicit helpful or not helpful Kinfolk response feedback in a small set of broad, non-sensitive categories.</Text></View>
      {error ? <View accessibilityRole="alert" style={styles.error}><Feather name="alert-circle" color="#B42318" size={15} /><Text style={styles.errorText}>{error}</Text></View> : null}
      {loading ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : <>
        <View style={styles.modes}>{modes.map((choice) => <TouchableOpacity key={choice.value} disabled={working} accessibilityRole="radio" accessibilityState={{ selected: view.mode === choice.value, disabled: working }} accessibilityLabel={`Behavioral evidence ${choice.label}`} onPress={() => { void request("/mode", "PUT", { mode: choice.value }); }} style={[styles.mode, { borderColor: view.mode === choice.value ? colors.primary : colors.border, backgroundColor: view.mode === choice.value ? colors.primary + "14" : colors.card }]}><Text style={[styles.modeTitle, { color: colors.foreground }]}>{choice.label}</Text><Text style={[styles.modeDetail, { color: colors.mutedForeground }]}>{choice.detail}</Text></TouchableOpacity>)}</View>
        {view.mode === "off" ? <Text style={[styles.detail, { color: colors.mutedForeground, marginHorizontal: 16, marginBottom: 12 }]}>Off takes effect immediately: Kinfolk will not collect or use this layer.</Text> : null}
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <View style={styles.listHeader}><View><Text style={[styles.title, { color: colors.foreground }]}>Your review list</Text><Text style={[styles.detail, { color: colors.mutedForeground }]}>Only category, stance, count, and review state appear here — never chat text, places, or other activity.</Text></View>{view.evidence.length ? <TouchableOpacity disabled={working} onPress={() => { void request("", "DELETE"); }} accessibilityLabel="Clear all behavioral evidence"><Text style={[styles.clear, { color: "#B42318", opacity: working ? 0.5 : 1 }]}>Clear all</Text></TouchableOpacity> : null}</View>
        {view.evidence.length === 0 ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No reviewable interaction patterns are saved.</Text> : view.evidence.map((item) => <View key={item.id} style={[styles.item, { borderTopColor: colors.border }]}><View style={styles.itemText}><Text style={[styles.title, { color: colors.foreground, textTransform: "capitalize" }]}>{label(item.signalKey)} · {item.stance === "helpful" ? "helpful" : "not helpful"}</Text><Text style={[styles.detail, { color: colors.mutedForeground }]}>{item.count} explicit response-feedback signal{item.count === 1 ? "" : "s"} · {item.status === "pending" ? "Awaiting your approval" : "Active only for directly matching Kinfolk conversations"}</Text></View><View style={styles.actions}>{item.status === "pending" ? <TouchableOpacity disabled={working} accessibilityLabel={`Approve ${label(item.signalKey)} behavioral evidence`} onPress={() => { void request(`/${encodeURIComponent(item.id)}/approve`, "PATCH", {}); }}><Text style={[styles.approve, { color: colors.primary, opacity: working ? 0.5 : 1 }]}>Approve</Text></TouchableOpacity> : null}<TouchableOpacity disabled={working} accessibilityLabel={`Remove ${label(item.signalKey)} behavioral evidence`} onPress={() => { void request(`/${encodeURIComponent(item.id)}`, "DELETE"); }}><Text style={[styles.remove, { opacity: working ? 0.5 : 1 }]}>Remove</Text></TouchableOpacity></View></View>)}
        <View style={[styles.note, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Feather name="shield" size={14} color={colors.mutedForeground} /><Text style={[styles.detail, { color: colors.mutedForeground, flex: 1 }]}>Removing or clearing an item immediately prevents future use. This layer never ranks or determines Directory or Map eligibility.</Text></View>
      </>}
    </View>
  </>;
}
const styles = StyleSheet.create({
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, fontFamily: "Inter_600SemiBold", marginBottom: 8 }, card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 22 }, copy: { padding: 16, gap: 7 }, copyTitle: { flexDirection: "row", alignItems: "center", gap: 8 }, title: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_600SemiBold" }, detail: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" }, modes: { flexDirection: "row", gap: 7, paddingHorizontal: 16, paddingBottom: 12 }, mode: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 9, gap: 3 }, modeTitle: { fontSize: 12, fontFamily: "Inter_700Bold" }, modeDetail: { fontSize: 10, lineHeight: 14, fontFamily: "Inter_400Regular" }, line: { height: StyleSheet.hairlineWidth }, listHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10, padding: 16 }, clear: { fontSize: 12, fontFamily: "Inter_700Bold" }, empty: { paddingHorizontal: 16, paddingBottom: 16, fontSize: 12, fontFamily: "Inter_400Regular" }, item: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: StyleSheet.hairlineWidth }, itemText: { flex: 1, gap: 3 }, actions: { alignItems: "flex-end", gap: 10 }, approve: { fontSize: 12, fontFamily: "Inter_700Bold" }, remove: { color: "#B42318", fontSize: 12, fontFamily: "Inter_700Bold" }, note: { flexDirection: "row", gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, margin: 16, marginTop: 4 }, error: { flexDirection: "row", gap: 7, borderWidth: 1, borderColor: "#FCA5A5", backgroundColor: "#FFF1F2", padding: 12, marginHorizontal: 16, marginBottom: 12, borderRadius: 10 }, errorText: { flex: 1, color: "#8A1C12", fontSize: 12, lineHeight: 17, fontFamily: "Inter_500Medium" }, loader: { marginVertical: 22 },
});
