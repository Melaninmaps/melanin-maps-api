import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/lib/api";

type InterestCategory = "food_and_drink" | "arts_and_culture" | "books_and_learning" | "music_and_audio" | "fitness_and_outdoors" | "games_and_hobbies" | "social_and_community" | "travel_and_places" | "beauty_and_style" | "career_and_learning";
type InterestState = "tentative" | "confirmed" | "paused" | "dismissed";
type Interest = { id: number; label: string; category: InterestCategory; source: "explicit" | "conversation_pattern" | "discovery_pattern"; state: InterestState; observationCount: number; confidence: number; isTemporary: boolean; expiresAt: string | null };
type Settings = { interestRecognitionEnabled: boolean; proactiveDiscoveryEnabled: boolean; interestNotificationsEnabled: boolean };
type ViewData = { settings: Settings; interests: Interest[]; disclosure: string };
type Circle = { id: number; name: string; city: string | null; state: string | null };

const CATEGORIES: Array<{ id: InterestCategory; label: string }> = [
  { id: "food_and_drink", label: "Food" }, { id: "arts_and_culture", label: "Arts" },
  { id: "books_and_learning", label: "Books" }, { id: "music_and_audio", label: "Music" },
  { id: "fitness_and_outdoors", label: "Outdoors" }, { id: "games_and_hobbies", label: "Hobbies" },
  { id: "social_and_community", label: "Community" }, { id: "travel_and_places", label: "Travel" },
  { id: "beauty_and_style", label: "Beauty" }, { id: "career_and_learning", label: "Learning" },
];
const DEFAULT_SETTINGS: Settings = { interestRecognitionEnabled: false, proactiveDiscoveryEnabled: false, interestNotificationsEnabled: false };

function categoryLabel(value: string): string { return CATEGORIES.find((item) => item.id === value)?.label ?? value.replace(/_/g, " "); }
function sourceLabel(value: Interest["source"]): string { return value === "explicit" ? "Added by you" : value === "conversation_pattern" ? "Repeated non-sensitive topic" : "Discovery pattern"; }
async function headers(): Promise<Record<string, string>> { const token = await SecureStore.getItemAsync("auth_session_token"); return token ? { Authorization: `Bearer ${token}` } : {}; }

export default function KinfolkInterestControlsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<ViewData>({ settings: DEFAULT_SETTINGS, interests: [], disclosure: "" });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<InterestCategory>("books_and_learning");
  const [shareInterest, setShareInterest] = useState<Interest | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circlesLoading, setCirclesLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/api/kinfolk/interest-intelligence`, { headers: await headers(), cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as Partial<ViewData> & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Interest controls could not be loaded.");
      setView({ settings: { ...DEFAULT_SETTINGS, ...(payload.settings ?? {}) }, interests: Array.isArray(payload.interests) ? payload.interests : [], disclosure: typeof payload.disclosure === "string" ? payload.disclosure : "" });
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Interest controls could not be loaded.");
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const request = async (path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown): Promise<Response> => {
    const response = await fetch(`${getApiBase()}/api/kinfolk/interest-intelligence${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(await headers()) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(payload.error ?? "That change could not be saved.");
    }
    return response;
  };

  const changeSettings = async (patch: Partial<Settings>) => {
    setWorking(true); setError(null);
    try { await request("/settings", "PUT", patch); await load(); if (Platform.OS !== "web") void Haptics.selectionAsync(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "That setting could not be saved."); }
    finally { setWorking(false); }
  };

  const addInterest = async () => {
    if (!label.trim() || working) return;
    setWorking(true); setError(null);
    try { await request("/interests", "POST", { label: label.trim(), category }); setLabel(""); await load(); if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "That interest could not be added."); }
    finally { setWorking(false); }
  };

  const setInterestState = async (interest: Interest, state: InterestState) => {
    setWorking(true); setError(null);
    try { await request(`/interests/${interest.id}`, "PATCH", { state }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "That interest could not be updated."); }
    finally { setWorking(false); }
  };

  const removeInterest = (interest: Interest) => Alert.alert("Remove interest?", `Remove “${interest.label}” and every Circle share of it?`, [
    { text: "Keep", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => { void (async () => { setWorking(true); try { await request(`/interests/${interest.id}`, "DELETE"); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "That interest could not be removed."); } finally { setWorking(false); } })(); } },
  ]);

  const openShare = async (interest: Interest) => {
    setShareInterest(interest); setCirclesLoading(true); setCircles([]);
    try {
      const response = await fetch(`${getApiBase()}/api/circles`, { headers: await headers() });
      const payload = await response.json().catch(() => ({})) as { circles?: Circle[] };
      if (response.ok) setCircles(payload.circles ?? []);
    } finally { setCirclesLoading(false); }
  };

  const shareToCircle = async (circle: Circle) => {
    if (!shareInterest) return;
    setWorking(true); setError(null);
    try {
      const response = await fetch(`${getApiBase()}/api/kinfolk/circles/${circle.id}/interests/${shareInterest.id}/share`, { method: "POST", headers: await headers() });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "This interest could not be shared.");
      setShareInterest(null);
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "This interest could not be shared."); }
    finally { setWorking(false); }
  };

  const topPad = Platform.OS === "web" ? 70 : Math.max(insets.top, 44);
  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}><TouchableOpacity accessibilityLabel="Back from interest controls" onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" color={colors.foreground} size={22} /></TouchableOpacity><View style={styles.grow}><Text style={[styles.title, { color: colors.foreground }]}>Your interests</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Reviewable and always yours to control</Text></View></View>
    {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View> : <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
      {error ? <View accessibilityRole="alert" style={styles.error}><Feather name="alert-circle" color="#B42318" size={16} /><Text style={styles.errorText}>{error}</Text></View> : null}
      <View style={[styles.notice, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}><Feather name="shield" size={17} color={colors.primary} /><Text style={[styles.noticeText, { color: colors.foreground }]}>{view.disclosure || "This is separate from private memories. Nothing from ordinary chat is stored here unless you turn on safe repeated-topic recognition."}</Text></View>
      <Text style={[styles.section, { color: colors.mutedForeground }]}>CONTROLS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Toggle colors={colors} title="Recognize repeated topics" detail="Off by default. When on, Kinfolk may keep only repeated, broad, non-sensitive topic labels for your review—never chat text, family, health, or third-party context." value={view.settings.interestRecognitionEnabled} disabled={working} onChange={(interestRecognitionEnabled) => void changeSettings({ interestRecognitionEnabled })} />
        <Divider colors={colors} />
        <Toggle colors={colors} title="Show proactive discoveries" detail="Use interests you confirmed or explicitly saved in your profile to make a small For You card from governed MWM listings and active events." value={view.settings.proactiveDiscoveryEnabled} disabled={working} onChange={(proactiveDiscoveryEnabled) => void changeSettings({ proactiveDiscoveryEnabled })} />
      </View>
      <Text style={[styles.section, { color: colors.mutedForeground }]}>ADD AN INTEREST</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.helper, { color: colors.mutedForeground }]}>Add a broad, non-sensitive interest you want Kinfolk to use. Saving it is explicit consent.</Text><TextInput value={label} onChangeText={setLabel} editable={!working} maxLength={100} placeholder="For example, street photography" placeholderTextColor={colors.mutedForeground} style={[styles.input, { borderColor: colors.border, color: colors.foreground }]} accessibilityLabel="Interest label" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{CATEGORIES.map((option) => <TouchableOpacity key={option.id} disabled={working} onPress={() => setCategory(option.id)} accessibilityRole="radio" accessibilityState={{ selected: category === option.id }} style={[styles.chip, { borderColor: category === option.id ? colors.primary : colors.border, backgroundColor: category === option.id ? colors.primary : colors.card }]}><Text style={[styles.chipText, { color: category === option.id ? "#fff" : colors.foreground }]}>{option.label}</Text></TouchableOpacity>)}</ScrollView><TouchableOpacity disabled={working || !label.trim()} onPress={() => void addInterest()} style={[styles.add, { backgroundColor: colors.primary, opacity: working || !label.trim() ? 0.55 : 1 }]}><Feather name="plus" size={16} color="#fff" /><Text style={styles.addText}>Add and confirm</Text></TouchableOpacity></View>
      <Text style={[styles.section, { color: colors.mutedForeground }]}>YOUR REVIEW LIST</Text>
      {view.interests.length === 0 ? <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No interests saved yet</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>You can add one above or review a broad, repeated topic after choosing to turn that control on.</Text></View> : view.interests.map((interest) => <InterestCard key={interest.id} interest={interest} colors={colors} working={working} onState={setInterestState} onRemove={removeInterest} onShare={openShare} />)}
      <Text style={[styles.footnote, { color: colors.mutedForeground }]}>Removing an interest immediately stops it from future recommendations and removes any Circle shares. Dismissing a recommendation never creates or changes an interest on its own.</Text>
    </ScrollView>}
    <Modal visible={Boolean(shareInterest)} transparent animationType="fade" onRequestClose={() => setShareInterest(null)}><View style={styles.modalBackdrop}><View style={[styles.modal, { backgroundColor: colors.card }]}><View style={styles.modalTop}><View style={styles.grow}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Share with a Circle</Text><Text style={[styles.helper, { color: colors.mutedForeground }]}>Only “{shareInterest?.label}” is shared. Your profile, saves, chat, search history, and private activity stay private.</Text></View><TouchableOpacity onPress={() => setShareInterest(null)} accessibilityLabel="Close Circle sharing"><Feather name="x" size={21} color={colors.foreground} /></TouchableOpacity></View>{circlesLoading ? <ActivityIndicator color={colors.primary} /> : circles.length === 0 ? <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>You are not in a Circle yet.</Text> : <ScrollView style={{ maxHeight: 280 }}>{circles.map((circle) => <TouchableOpacity key={circle.id} disabled={working} onPress={() => void shareToCircle(circle)} style={[styles.circleRow, { borderColor: colors.border }]}><Text style={[styles.circleName, { color: colors.foreground }]}>{circle.name}</Text><Text style={[styles.circleMeta, { color: colors.mutedForeground }]}>{[circle.city, circle.state].filter(Boolean).join(", ") || "Private Circle"}</Text></TouchableOpacity>)}</ScrollView>}</View></View></Modal>
  </View>;
}

function Toggle({ colors, title, detail, value, disabled, onChange }: { colors: ReturnType<typeof useColors>; title: string; detail: string; value: boolean; disabled: boolean; onChange: (value: boolean) => void }) { return <View style={styles.toggleRow}><View style={styles.grow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{detail}</Text></View><Switch value={value} disabled={disabled} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.primary + "A0" }} thumbColor={value ? colors.primary : "#f4f4f5"} accessibilityLabel={title} /></View>; }
function Divider({ colors }: { colors: ReturnType<typeof useColors> }) { return <View style={[styles.divider, { backgroundColor: colors.border }]} />; }
function InterestCard({ interest, colors, working, onState, onRemove, onShare }: { interest: Interest; colors: ReturnType<typeof useColors>; working: boolean; onState: (interest: Interest, state: InterestState) => void; onRemove: (interest: Interest) => void; onShare: (interest: Interest) => void }) { const canShare = interest.state === "confirmed" && !interest.isTemporary; return <View style={[styles.interestCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.interestHead}><View style={styles.grow}><Text style={[styles.interestLabel, { color: colors.foreground }]}>{interest.label}</Text><Text style={[styles.interestMeta, { color: colors.mutedForeground }]}>{categoryLabel(interest.category)} · {sourceLabel(interest.source)}{interest.observationCount > 1 ? ` · Seen ${interest.observationCount} times` : ""}</Text>{interest.isTemporary ? <Text style={[styles.temp, { color: colors.primary }]}>Temporary until {interest.expiresAt ? new Date(interest.expiresAt).toLocaleDateString() : "it expires"}</Text> : null}</View><View style={[styles.state, { backgroundColor: interest.state === "confirmed" ? colors.primary + "14" : colors.secondary }]}><Text style={[styles.stateText, { color: interest.state === "confirmed" ? colors.primary : colors.mutedForeground }]}>{interest.state}</Text></View></View><View style={styles.actions}>{interest.state === "tentative" || interest.state === "dismissed" ? <Action colors={colors} disabled={working} label="Confirm" onPress={() => onState(interest, "confirmed")} /> : null}{interest.state === "confirmed" ? <Action colors={colors} disabled={working} label="Pause" onPress={() => onState(interest, "paused")} /> : null}{interest.state === "paused" ? <Action colors={colors} disabled={working} label="Use again" onPress={() => onState(interest, "confirmed")} /> : null}{canShare ? <Action colors={colors} disabled={working} label="Share with Circle" onPress={() => onShare(interest)} /> : null}<TouchableOpacity disabled={working} onPress={() => onRemove(interest)} accessibilityLabel={`Remove ${interest.label}`}><Text style={[styles.remove, { color: "#B42318", opacity: working ? 0.55 : 1 }]}>Remove</Text></TouchableOpacity></View></View>; }
function Action({ colors, label, disabled, onPress }: { colors: ReturnType<typeof useColors>; label: string; disabled: boolean; onPress: () => void }) { return <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.action, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "0D", opacity: disabled ? 0.55 : 1 }]}><Text style={[styles.actionText, { color: colors.primary }]}>{label}</Text></TouchableOpacity>; }

const styles = StyleSheet.create({
  root: { flex: 1 }, grow: { flex: 1 }, header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingBottom: 13, borderBottomWidth: StyleSheet.hairlineWidth }, back: { width: 34, height: 34, alignItems: "flex-start", justifyContent: "center" }, title: { fontFamily: "Inter_700Bold", fontSize: 18 }, subtitle: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, scroll: { padding: 18, gap: 12 }, error: { flexDirection: "row", gap: 8, borderWidth: 1, borderColor: "#FCA5A5", backgroundColor: "#FFF1F2", borderRadius: 12, padding: 12 }, errorText: { flex: 1, color: "#8A1C12", fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 17 }, notice: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 14, padding: 13 }, noticeText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 }, section: { fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, fontSize: 11, marginTop: 8 }, card: { borderRadius: 15, borderWidth: 1, padding: 14, gap: 12 }, toggleRow: { flexDirection: "row", gap: 12, alignItems: "center" }, rowTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 }, rowDetail: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 3 }, divider: { height: StyleSheet.hairlineWidth }, helper: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 }, input: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, fontFamily: "Inter_400Regular", fontSize: 14 }, chips: { gap: 7, paddingVertical: 2 }, chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 7 }, chipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 }, add: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, borderRadius: 10, paddingVertical: 11 }, addText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 }, empty: { padding: 18, borderRadius: 15, borderWidth: 1 }, emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 14 }, emptyText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 5 }, interestCard: { borderRadius: 15, borderWidth: 1, padding: 14, gap: 12 }, interestHead: { flexDirection: "row", gap: 9 }, interestLabel: { fontFamily: "Inter_700Bold", fontSize: 15, textTransform: "capitalize" }, interestMeta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 }, temp: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginTop: 5 }, state: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, alignSelf: "flex-start" }, stateText: { fontFamily: "Inter_700Bold", fontSize: 10, textTransform: "capitalize" }, actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }, action: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7 }, actionText: { fontFamily: "Inter_700Bold", fontSize: 11 }, remove: { fontFamily: "Inter_700Bold", fontSize: 11, paddingHorizontal: 4, paddingVertical: 7 }, footnote: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 5 }, modalBackdrop: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#00000077" }, modal: { borderRadius: 18, padding: 18, gap: 14 }, modalTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" }, modalTitle: { fontFamily: "Inter_700Bold", fontSize: 17 }, circleRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 12 }, circleName: { fontFamily: "Inter_700Bold", fontSize: 14 }, circleMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 3 },
});
