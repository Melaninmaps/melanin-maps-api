import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useUnsavedKinfolkExitGuard } from "@/hooks/useUnsavedKinfolkExitGuard";
import { requireKinfolkPrivateApiContext } from "@/lib/kinfolkPrivateApi";

type Status = { enabled: boolean; disclosureVersion: string; disclosure: string };
type Place = { id: string; label: string; isActive: boolean };

async function memberToken(): Promise<string | null> { try { return await SecureStore.getItemAsync("auth_session_token"); } catch { return null; } }
async function message(response: Response, fallback: string): Promise<string> { const payload = await response.json().catch(() => ({})) as { error?: string }; return payload.error ?? fallback; }

/** A separate, member-controlled location space. It never contributes to Kinfolk memory, chat, check-ins, or passive recommendations. */
export default function KinfolkPrivatePlacesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mounted = useRef(true);
  const [status, setStatus] = useState<Status | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [label, setLabel] = useState("");
  const [exactAddress, setExactAddress] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbySummary, setNearbySummary] = useState<string | null>(null);
  const dirty = Boolean(label.trim() || exactAddress.trim() || accepted);

  const headers = useCallback(async () => {
    return requireKinfolkPrivateApiContext(memberToken, "Private Places");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { base, headers: auth } = await headers();
      const statusResponse = await fetch(`${base}/api/kinfolk/private-places/status`, { headers: auth });
      if (!statusResponse.ok) throw new Error(await message(statusResponse, "Private Places could not be loaded."));
      const next = await statusResponse.json() as Status;
      if (!mounted.current) return;
      setStatus(next);
      if (!next.enabled) { setPlaces([]); return; }
      const placesResponse = await fetch(`${base}/api/kinfolk/private-places`, { headers: auth });
      if (!placesResponse.ok) throw new Error(await message(placesResponse, "Private Places could not be loaded."));
      const payload = await placesResponse.json() as { places?: Place[] };
      if (mounted.current) setPlaces(Array.isArray(payload.places) ? payload.places : []);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "Private Places could not be loaded.");
    } finally { if (mounted.current) setLoading(false); }
  }, [headers]);

  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const discard = useCallback(() => { setLabel(""); setExactAddress(""); setAccepted(false); setError(null); }, []);
  const save = useCallback(async (): Promise<boolean> => {
    if (!dirty) return true;
    if (!status?.enabled) { setError("Private Places is currently off. Nothing was saved."); return false; }
    if (!label.trim() || !exactAddress.trim() || !accepted) { setError("Choose a nickname, enter an address, and accept the Google Maps disclosure before saving."); return false; }
    setSaving(true); setError(null);
    try {
      const { base, headers: auth } = await headers();
      const response = await fetch(`${base}/api/kinfolk/private-places`, { method: "POST", headers: auth, body: JSON.stringify({ label: label.trim(), exactAddress: exactAddress.trim(), googleMapsGeocodingConsent: true, disclosureVersion: status.disclosureVersion }) });
      if (!response.ok) throw new Error(await message(response, "Private Place could not be saved."));
      if (mounted.current) { discard(); await load(); }
      return true;
    } catch (cause) {
      if (mounted.current) { const detail = cause instanceof Error ? cause.message : "Private Place could not be saved."; setError(`${detail} Your draft is still here.`); Alert.alert("Private Place not saved", `${detail}\n\nYour draft is still here.`); }
      return false;
    } finally { if (mounted.current) setSaving(false); }
  }, [accepted, dirty, discard, exactAddress, headers, label, load, status?.disclosureVersion, status?.enabled]);

  useUnsavedKinfolkExitGuard({ dirty, saving, screenLabel: "Private Places", onSave: save, onDiscard: discard });

  const setActive = async (place: Place, isActive: boolean) => {
    try { const { base, headers: auth } = await headers(); const response = await fetch(`${base}/api/kinfolk/private-places/${encodeURIComponent(place.id)}/active`, { method: "PATCH", headers: auth, body: JSON.stringify({ isActive }) }); if (!response.ok) throw new Error(await message(response, "Private Place status could not be changed.")); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Private Place status could not be changed."); }
  };
  const remove = async (place: Place) => {
    try { const { base, headers: auth } = await headers(); const response = await fetch(`${base}/api/kinfolk/private-places/${encodeURIComponent(place.id)}`, { method: "DELETE", headers: auth }); if (!response.ok) throw new Error(await message(response, "Private Place could not be deleted.")); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Private Place could not be deleted."); }
  };
  const nearby = async (place: Place) => {
    try { const { base, headers: auth } = await headers(); const response = await fetch(`${base}/api/kinfolk/private-places/${encodeURIComponent(place.id)}/nearby`, { method: "POST", headers: auth, body: JSON.stringify({ radiusMiles: 8 }) }); if (!response.ok) throw new Error(await message(response, "Nearby directory search could not run.")); const payload = await response.json() as { businesses?: unknown[] }; setNearbySummary(`${Array.isArray(payload.businesses) ? payload.businesses.length : 0} nearby directory results loaded from ${place.label}.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Nearby directory search could not run."); }
  };

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}><TouchableOpacity style={styles.back} accessibilityLabel="Back from Private Places" onPress={() => router.canGoBack() ? router.back() : router.replace("/kinfolk-settings" as never)}><Feather name="arrow-left" color={colors.foreground} size={22} /></TouchableOpacity><Text style={[styles.title, { color: colors.foreground }]}>Private Places</Text><View style={styles.back} /></View>
    <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 36 }]}>
      <View style={[styles.info, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "35" }]}><Feather name="shield" color={colors.primary} size={19} /><Text style={[styles.infoText, { color: colors.foreground }]}>A separate private space for a home, family location, school, or other personal place. It never becomes Kinfolk chat memory, a check-in, or an automatic recommendation.</Text></View>
      {error ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      {loading ? <ActivityIndicator color={colors.primary} size="large" style={styles.loading} /> : null}
      {!loading && status && !status.enabled ? <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Private Places is off</Text><Text style={[styles.sub, { color: colors.mutedForeground }]}>Nothing is stored or sent to Google Maps until this separately governed feature is explicitly enabled.</Text></View> : null}
      {!loading && status?.enabled ? <>
        <Text style={[styles.section, { color: colors.mutedForeground }]}>YOUR PRIVATE PLACES</Text>
        {places.map((place) => <View key={place.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.placeHead}><View style={styles.grow}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{place.label}</Text><Text style={[styles.sub, { color: colors.mutedForeground }]}>{place.isActive ? "Active only when you select it" : "Paused — not available for nearby search"}</Text></View><Switch value={place.isActive} onValueChange={(next) => void setActive(place, next)} accessibilityLabel={`${place.label} active`} trackColor={{ false: colors.border, true: colors.primary + "A0" }} thumbColor={place.isActive ? colors.primary : "#f4f4f5"} /></View>{place.isActive ? <TouchableOpacity accessibilityLabel={`Use ${place.label} for nearby directory search`} onPress={() => void nearby(place)}><Text style={[styles.link, { color: colors.primary }]}>Use for nearby directory search</Text></TouchableOpacity> : null}<TouchableOpacity accessibilityLabel={`Delete ${place.label}`} onPress={() => void remove(place)}><Text style={styles.delete}>Delete</Text></TouchableOpacity></View>)}
        {nearbySummary ? <Text style={[styles.summary, { color: colors.mutedForeground }]}>{nearbySummary}</Text> : null}
        <Text style={[styles.section, { color: colors.mutedForeground }]}>SAVE A PRIVATE PLACE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><TextInput value={label} onChangeText={setLabel} maxLength={80} placeholder="Nickname, for example Mom's house" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Private Place nickname" /><TextInput value={exactAddress} onChangeText={setExactAddress} maxLength={300} placeholder="Exact address" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Exact Private Place address" /><View style={styles.disclosure}><Switch value={accepted} onValueChange={setAccepted} accessibilityLabel="Accept Google Maps geocoding disclosure" trackColor={{ false: colors.border, true: colors.primary + "A0" }} thumbColor={accepted ? colors.primary : "#f4f4f5"} /><Text style={[styles.sub, { color: colors.mutedForeground }]}>{status.disclosure}</Text></View><TouchableOpacity disabled={saving || !label.trim() || !exactAddress.trim() || !accepted} accessibilityLabel="Save Private Place" onPress={() => { void save(); }} style={[styles.save, { backgroundColor: colors.primary, opacity: saving || !label.trim() || !exactAddress.trim() || !accepted ? 0.5 : 1 }]}><Text style={styles.saveText}>{saving ? "Saving…" : "Save Private Place"}</Text></TouchableOpacity></View>
      </> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth }, back: { width: 44, height: 40, justifyContent: "center" }, title: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: "Inter_700Bold" }, scroll: { paddingHorizontal: 20, gap: 12 }, info: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 18 }, infoText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" }, loading: { marginTop: 44 }, error: { borderRadius: 12, backgroundColor: "#FFF1F2", borderWidth: 1, borderColor: "#FCA5A5", padding: 12 }, errorText: { color: "#8A1C12", fontSize: 12, lineHeight: 17, fontFamily: "Inter_500Medium" }, section: { fontSize: 11, letterSpacing: 0.8, fontFamily: "Inter_600SemiBold", marginTop: 10 }, card: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 11 }, placeHead: { flexDirection: "row", alignItems: "center", gap: 12 }, grow: { flex: 1 }, cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" }, sub: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" }, link: { fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 2 }, delete: { color: "#B42318", fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 2 }, summary: { fontSize: 12, lineHeight: 17, paddingHorizontal: 4, fontFamily: "Inter_400Regular" }, input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13, fontFamily: "Inter_400Regular" }, disclosure: { flexDirection: "row", alignItems: "flex-start", gap: 9 }, save: { height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" }, saveText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
});
