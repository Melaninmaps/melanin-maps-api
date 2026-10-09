import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useUnsavedKinfolkExitGuard } from "@/hooks/useUnsavedKinfolkExitGuard";
import { requireKinfolkPrivateApiContext } from "@/lib/kinfolkPrivateApi";

type Retention = { departureDateRequired: boolean; postDepartureGraceDays: number; extensionAllowedBeforeExpiry: boolean };
type Status = { enabled: boolean; disclosureVersion: string; disclosure: string; privacyNotice: string; retention: Retention };
type Stay = { id: string; label: string; isActive: boolean; arrivalDate: string; departureDate: string; expiresAt: string };

async function memberToken(): Promise<string | null> { try { return await SecureStore.getItemAsync("auth_session_token"); } catch { return null; } }
async function message(response: Response, fallback: string): Promise<string> { const payload = await response.json().catch(() => ({})) as { error?: string }; return payload.error ?? fallback; }

/** Encrypted Temporary Stays have their own route, disclosure, dates, expiry, and explicit lifecycle. */
export default function KinfolkTemporaryStaysScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mounted = useRef(true);
  const [status, setStatus] = useState<Status | null>(null);
  const [stays, setStays] = useState<Stay[]>([]);
  const [label, setLabel] = useState("");
  const [exactAddress, setExactAddress] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [extensionDates, setExtensionDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbySummary, setNearbySummary] = useState<string | null>(null);
  const dirty = Boolean(label.trim() || exactAddress.trim() || arrivalDate || departureDate || accepted);

  const headers = useCallback(async () => {
    return requireKinfolkPrivateApiContext(memberToken, "Temporary Stays");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { base, headers: auth } = await headers();
      const statusResponse = await fetch(`${base}/api/kinfolk/temporary-stays/status`, { headers: auth });
      if (!statusResponse.ok) throw new Error(await message(statusResponse, "Temporary Stays could not be loaded."));
      const next = await statusResponse.json() as Status;
      if (!mounted.current) return;
      setStatus(next);
      if (!next.enabled) { setStays([]); return; }
      const staysResponse = await fetch(`${base}/api/kinfolk/temporary-stays`, { headers: auth });
      if (!staysResponse.ok) throw new Error(await message(staysResponse, "Temporary Stays could not be loaded."));
      const payload = await staysResponse.json() as { stays?: Stay[] };
      if (mounted.current) setStays(Array.isArray(payload.stays) ? payload.stays : []);
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "Temporary Stays could not be loaded."); }
    finally { if (mounted.current) setLoading(false); }
  }, [headers]);

  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const discard = useCallback(() => {
    setLabel(""); setExactAddress(""); setArrivalDate(""); setDepartureDate(""); setAccepted(false); setEditingId(null); setError(null);
  }, []);
  const save = useCallback(async (): Promise<boolean> => {
    if (!dirty) return true;
    if (!status?.enabled) { setError("Temporary Stays is currently off. Nothing was saved."); return false; }
    if (!label.trim() || !exactAddress.trim() || !arrivalDate || !departureDate || !accepted) { setError("Choose a nickname, address, arrival and departure dates, and accept the Google Maps disclosure."); return false; }
    setSaving(true); setError(null);
    try {
      const { base, headers: auth } = await headers();
      const path = editingId ? `/api/kinfolk/temporary-stays/${encodeURIComponent(editingId)}` : "/api/kinfolk/temporary-stays";
      const response = await fetch(`${base}${path}`, { method: editingId ? "PUT" : "POST", headers: auth, body: JSON.stringify({ label: label.trim(), exactAddress: exactAddress.trim(), arrivalDate, departureDate, googleMapsGeocodingConsent: true, disclosureVersion: status.disclosureVersion }) });
      if (!response.ok) throw new Error(await message(response, "This Temporary Stay could not be saved."));
      if (mounted.current) { discard(); await load(); }
      return true;
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "This Temporary Stay could not be saved.";
      if (mounted.current) { setError(`${detail} Your draft is still here.`); Alert.alert("Temporary Stay not saved", `${detail}\n\nYour draft is still here.`); }
      return false;
    } finally { if (mounted.current) setSaving(false); }
  }, [accepted, arrivalDate, departureDate, dirty, discard, editingId, exactAddress, headers, label, load, status?.disclosureVersion, status?.enabled]);

  useUnsavedKinfolkExitGuard({ dirty, saving, screenLabel: "Temporary Stays", onSave: save, onDiscard: discard });

  const edit = (stay: Stay) => { setEditingId(stay.id); setLabel(stay.label); setExactAddress(""); setArrivalDate(stay.arrivalDate); setDepartureDate(stay.departureDate); setAccepted(false); setError("Re-enter the exact address and accept the disclosure to update this encrypted stay."); };
  const setActive = async (stay: Stay, isActive: boolean) => { try { const { base, headers: auth } = await headers(); const response = await fetch(`${base}/api/kinfolk/temporary-stays/${encodeURIComponent(stay.id)}/active`, { method: "PATCH", headers: auth, body: JSON.stringify({ isActive }) }); if (!response.ok) throw new Error(await message(response, "Temporary Stay status could not be changed.")); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Temporary Stay status could not be changed."); } };
  const extend = async (stay: Stay) => { const next = extensionDates[stay.id] ?? ""; if (!next) { setError("Choose a later departure date before extending this Temporary Stay."); return; } try { const { base, headers: auth } = await headers(); const response = await fetch(`${base}/api/kinfolk/temporary-stays/${encodeURIComponent(stay.id)}/extend`, { method: "POST", headers: auth, body: JSON.stringify({ departureDate: next }) }); if (!response.ok) throw new Error(await message(response, "Temporary Stay could not be extended.")); setExtensionDates((current) => ({ ...current, [stay.id]: "" })); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Temporary Stay could not be extended."); } };
  const remove = async (stay: Stay) => { try { const { base, headers: auth } = await headers(); const response = await fetch(`${base}/api/kinfolk/temporary-stays/${encodeURIComponent(stay.id)}`, { method: "DELETE", headers: auth }); if (!response.ok) throw new Error(await message(response, "Temporary Stay could not be deleted.")); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Temporary Stay could not be deleted."); } };
  const nearby = async (stay: Stay) => { try { const { base, headers: auth } = await headers(); const response = await fetch(`${base}/api/kinfolk/temporary-stays/${encodeURIComponent(stay.id)}/nearby`, { method: "POST", headers: auth, body: JSON.stringify({}) }); if (!response.ok) throw new Error(await message(response, "Nearby directory search could not run.")); const payload = await response.json() as { businesses?: unknown[] }; setNearbySummary(`${Array.isArray(payload.businesses) ? payload.businesses.length : 0} nearby directory results loaded from ${stay.label}.`); } catch (cause) { setError(cause instanceof Error ? cause.message : "Nearby directory search could not run."); } };

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}><TouchableOpacity style={styles.back} accessibilityLabel="Back from Temporary Stays" onPress={() => router.canGoBack() ? router.back() : router.replace("/kinfolk-settings" as never)}><Feather name="arrow-left" color={colors.foreground} size={22} /></TouchableOpacity><Text style={[styles.title, { color: colors.foreground }]}>Temporary Stays</Text><View style={styles.back} /></View>
    <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 36 }]}>
      <View style={[styles.info, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "35" }]}><Feather name="shield" color={colors.primary} size={19} /><Text style={[styles.infoText, { color: colors.foreground }]}>A Temporary Stay is separate encrypted location context. It is never chat memory, a check-in, analytics, a public activity, or an automatic recommendation.</Text></View>
      {error ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={styles.loading} /> : null}
      {!loading && status && !status.enabled ? <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Temporary Stays is off</Text><Text style={[styles.sub, { color: colors.mutedForeground }]}>Nothing is saved or sent to Google Maps until this separately governed encrypted feature is explicitly enabled.</Text></View> : null}
      {!loading && status?.enabled ? <>
        <Text style={[styles.section, { color: colors.mutedForeground }]}>YOUR TEMPORARY STAYS</Text>
        {stays.map((stay) => <View key={stay.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.placeHead}><View style={styles.grow}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{stay.label}</Text><Text style={[styles.sub, { color: colors.mutedForeground }]}>{stay.arrivalDate} to {stay.departureDate} · encrypted until {new Date(stay.expiresAt).toLocaleDateString()}</Text></View><Switch value={stay.isActive} onValueChange={(next) => void setActive(stay, next)} accessibilityLabel={`${stay.label} active`} trackColor={{ false: colors.border, true: colors.primary + "A0" }} thumbColor={stay.isActive ? colors.primary : "#f4f4f5"} /></View>{stay.isActive ? <TouchableOpacity accessibilityLabel={`Use ${stay.label} for nearby directory search`} onPress={() => void nearby(stay)}><Text style={[styles.link, { color: colors.primary }]}>Use for nearby directory search</Text></TouchableOpacity> : null}<TouchableOpacity accessibilityLabel={`Edit ${stay.label}`} onPress={() => edit(stay)}><Text style={[styles.link, { color: colors.primary }]}>Edit stay</Text></TouchableOpacity><TextInput value={extensionDates[stay.id] ?? ""} onChangeText={(value) => setExtensionDates((current) => ({ ...current, [stay.id]: value }))} placeholder="Later departure date (YYYY-MM-DD)" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel={`Extend ${stay.label} departure date`} /><TouchableOpacity accessibilityLabel={`Extend ${stay.label}`} onPress={() => void extend(stay)}><Text style={[styles.link, { color: colors.primary }]}>Extend stay</Text></TouchableOpacity><TouchableOpacity accessibilityLabel={`Delete ${stay.label}`} onPress={() => void remove(stay)}><Text style={styles.delete}>Delete</Text></TouchableOpacity></View>)}
        {nearbySummary ? <Text style={[styles.summary, { color: colors.mutedForeground }]}>{nearbySummary}</Text> : null}
        <Text style={[styles.section, { color: colors.mutedForeground }]}>{editingId ? "EDIT TEMPORARY STAY" : "SAVE A TEMPORARY STAY"}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><TextInput value={label} onChangeText={setLabel} maxLength={80} placeholder="Nickname, for example Conference hotel" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Temporary Stay nickname" /><TextInput value={exactAddress} onChangeText={setExactAddress} maxLength={300} placeholder="Exact address" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Exact Temporary Stay address" /><TextInput value={arrivalDate} onChangeText={setArrivalDate} placeholder="Arrival date (YYYY-MM-DD)" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Temporary Stay arrival date" /><TextInput value={departureDate} onChangeText={setDepartureDate} placeholder="Departure date (YYYY-MM-DD)" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Temporary Stay departure date" /><Text style={[styles.sub, { color: colors.mutedForeground }]}>{status.privacyNotice}</Text><View style={styles.disclosure}><Switch value={accepted} onValueChange={setAccepted} accessibilityLabel="Accept Google Maps geocoding disclosure for Temporary Stay" trackColor={{ false: colors.border, true: colors.primary + "A0" }} thumbColor={accepted ? colors.primary : "#f4f4f5"} /><Text style={[styles.sub, { color: colors.mutedForeground }]}>{status.disclosure}</Text></View><TouchableOpacity disabled={saving || !label.trim() || !exactAddress.trim() || !arrivalDate || !departureDate || !accepted} accessibilityLabel={editingId ? "Save Temporary Stay changes" : "Save Temporary Stay"} onPress={() => { void save(); }} style={[styles.save, { backgroundColor: colors.primary, opacity: saving || !label.trim() || !exactAddress.trim() || !arrivalDate || !departureDate || !accepted ? 0.5 : 1 }]}><Text style={styles.saveText}>{saving ? "Saving…" : editingId ? "Save Temporary Stay changes" : "Save Temporary Stay"}</Text></TouchableOpacity>{editingId ? <TouchableOpacity accessibilityLabel="Cancel Temporary Stay edit" onPress={discard}><Text style={[styles.link, { color: colors.primary }]}>Cancel edit</Text></TouchableOpacity> : null}</View>
      </> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth }, back: { width: 44, height: 40, justifyContent: "center" }, title: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: "Inter_700Bold" }, scroll: { paddingHorizontal: 20, gap: 12 }, info: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 18 }, infoText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" }, loading: { marginTop: 44 }, error: { borderRadius: 12, backgroundColor: "#FFF1F2", borderWidth: 1, borderColor: "#FCA5A5", padding: 12 }, errorText: { color: "#8A1C12", fontSize: 12, lineHeight: 17, fontFamily: "Inter_500Medium" }, section: { fontSize: 11, letterSpacing: 0.8, fontFamily: "Inter_600SemiBold", marginTop: 10 }, card: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 11 }, placeHead: { flexDirection: "row", alignItems: "center", gap: 12 }, grow: { flex: 1 }, cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" }, sub: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" }, link: { fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 2 }, delete: { color: "#B42318", fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 2 }, summary: { fontSize: 12, lineHeight: 17, paddingHorizontal: 4, fontFamily: "Inter_400Regular" }, input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13, fontFamily: "Inter_400Regular" }, disclosure: { flexDirection: "row", alignItems: "flex-start", gap: 9 }, save: { minHeight: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }, saveText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
});
