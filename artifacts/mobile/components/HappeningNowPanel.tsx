import React, { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator, Alert, FlatList, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { getApiBase } from "@/lib/api";
import { openExternalUrl } from "@/lib/safeLinking";
import { useColors } from "@/hooks/useColors";

export interface HappeningNowStory {
  id: string;
  title: string;
  summary: string;
  category: string;
  topicTags?: string[] | null;
  scope: "local" | "state" | "national" | "global";
  city?: string | null;
  state?: string | null;
  sourceUrl?: string | null;
  sourceStatus: string;
  status: string;
  communityPostId?: string | null;
  submitterName?: string | null;
  confirmCount: number;
  hasConfirmed: boolean;
  isOwnStory: boolean;
  rankingReason?: string;
}

const CATEGORIES = ["politics", "health", "safety", "housing", "education", "economy", "environment", "transportation", "culture", "community", "other"] as const;
const SCOPES = ["local", "state", "national", "global"] as const;

async function authHeaders(json = false): Promise<Record<string, string>> {
  const token = Platform.OS !== "web" ? await SecureStore.getItemAsync("auth_session_token") : null;
  return { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export function HappeningNowPanel({ isAuthenticated, bottomPadding, onDiscuss }: {
  isAuthenticated: boolean;
  bottomPadding: number;
  onDiscuss: (story: HappeningNowStory) => void;
}) {
  const colors = useColors();
  const [stories, setStories] = useState<HappeningNowStory[]>([]);
  const [feed, setFeed] = useState<"foryou" | "latest">("foryou");
  const [scope, setScope] = useState<string>("all");
  const [localExpansion, setLocalExpansion] = useState<"state" | null>(null);
  const [stateExpansionAvailable, setStateExpansionAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ feed });
      if (scope !== "all") params.set("scope", scope);
      if (scope === "local" && localExpansion) params.set("localExpansion", localExpansion);
      const response = await fetch(`${getApiBase()}/api/knowledge/happening-now?${params.toString()}`, { headers: await authHeaders() });
      const body = await response.json().catch(() => ({})) as {
        stories?: HappeningNowStory[];
        error?: string;
        localExpansion?: { active?: "state" | null; available?: string[] };
      };
      if (!response.ok) throw new Error(body.error ?? "Could not load community updates.");
      setStories(body.stories ?? []);
      setStateExpansionAvailable(body.localExpansion?.available?.includes("state") ?? false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load community updates.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [feed, scope, localExpansion]);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  const confirmStory = async (story: HappeningNowStory) => {
    if (!isAuthenticated || story.isOwnStory || confirming) return;
    setConfirming(story.id);
    try {
      const response = await fetch(`${getApiBase()}/api/knowledge/happening-now/${story.id}/confirm`, { method: "POST", headers: await authHeaders() });
      const body = await response.json().catch(() => ({})) as { confirmed?: boolean; confirmCount?: number; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not update confirmation.");
      setStories((items) => items.map((item) => item.id === story.id ? { ...item, hasConfirmed: !!body.confirmed, confirmCount: body.confirmCount ?? item.confirmCount } : item));
    } catch (cause) { Alert.alert("Couldn’t confirm", cause instanceof Error ? cause.message : "Please try again."); }
    finally { setConfirming(null); }
  };

  const reportStory = (story: HappeningNowStory) => Alert.alert("Report this update?", "The community desk will review its accuracy and safety.", [
    { text: "Cancel", style: "cancel" },
    { text: "Report", style: "destructive", onPress: async () => {
      const response = await fetch(`${getApiBase()}/api/knowledge/happening-now/${story.id}/report`, { method: "POST", headers: await authHeaders(true), body: JSON.stringify({ reason: "incorrect_info" }) });
      Alert.alert(response.ok ? "Report received" : "Couldn’t send report", response.ok ? "Thank you for helping keep community information accurate." : "Please try again.");
    } },
  ]);

  const header = <View>
    <View style={[s.hero, { backgroundColor: "#2B1507" }]}>
      <View style={s.heroEyebrow}><Feather name="radio" size={14} color="#F3C969" /><Text style={s.heroEyebrowText}>WHAT’S HAPPENING</Text></View>
      <Text style={s.heroTitle}>What the community should know</Text>
      <Text style={s.heroBody}>Local impact first, then state, national, and global context—shaped by the topics you choose.</Text>
      {isAuthenticated && <TouchableOpacity accessibilityLabel="Share a community update" onPress={() => setShowSubmit(true)} style={s.shareButton}><Feather name="plus" size={15} color="#FFF" /><Text style={s.shareButtonText}>Share an update</Text></TouchableOpacity>}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
      {(["foryou", "latest"] as const).map((value) => <TouchableOpacity key={value} onPress={() => setFeed(value)} style={[s.chip, { borderColor: feed === value ? colors.foreground : colors.border, backgroundColor: feed === value ? colors.foreground : colors.card }]}><Text style={[s.chipText, { color: feed === value ? colors.background : colors.mutedForeground }]}>{value === "foryou" ? "For You" : "Latest"}</Text></TouchableOpacity>)}
      {["all", ...SCOPES].map((value) => <TouchableOpacity key={value} onPress={() => { setScope(value); setLocalExpansion(null); }} style={[s.chip, { borderColor: scope === value ? colors.primary : colors.border, backgroundColor: scope === value ? colors.primary + "18" : colors.card }]}><Text style={[s.chipText, { color: scope === value ? colors.primary : colors.mutedForeground }]}>{value === "all" ? "All locations" : value[0].toUpperCase() + value.slice(1)}</Text></TouchableOpacity>)}
      {scope === "local" && stateExpansionAvailable && <TouchableOpacity accessibilityLabel="Expand local updates to my state" onPress={() => setLocalExpansion((current) => current === "state" ? null : "state")} style={[s.chip, { borderColor: colors.primary, backgroundColor: colors.primary + "18" }]}><Text style={[s.chipText, { color: colors.primary }]}>{localExpansion === "state" ? "Only my cities" : "Expand to my state"}</Text></TouchableOpacity>}
    </ScrollView>
    {!!error && <TouchableOpacity onPress={() => void load()} style={s.errorBanner}><Text style={s.errorText}>{error} Tap to retry.</Text></TouchableOpacity>}
  </View>;

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} /><Text style={[s.loadingText, { color: colors.mutedForeground }]}>Loading community updates…</Text></View>;

  return <View style={{ flex: 1 }}>
    <FlatList data={stories} keyExtractor={(item) => item.id} refreshing={refreshing} onRefresh={() => void load(true)} ListHeaderComponent={header} contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 110, gap: 12 }} ListEmptyComponent={<View style={[s.empty, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="radio" size={28} color={colors.primary} /><Text style={[s.emptyTitle, { color: colors.foreground }]}>No approved updates yet</Text><Text style={[s.emptyBody, { color: colors.mutedForeground }]}>Share a reliable article or community-impact update for review.</Text></View>} renderItem={({ item }) => <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={s.badgeRow}><Text style={s.categoryBadge}>{item.category.toUpperCase()}</Text><Text style={[s.scopeBadge, { color: colors.mutedForeground }]}>{item.scope.toUpperCase()}</Text>{item.status === "pending" && <Text style={s.pendingBadge}>PENDING REVIEW</Text>}{item.sourceStatus === "verified" && <Text style={s.verifiedBadge}>✓ VERIFIED SOURCE</Text>}</View>
      <Text style={[s.title, { color: colors.foreground }]}>{item.title}</Text><Text style={[s.summary, { color: colors.mutedForeground }]}>{item.summary}</Text>
      {(item.city || item.state) && <View style={s.locationRow}><Feather name="map-pin" size={12} color={colors.mutedForeground} /><Text style={[s.locationText, { color: colors.mutedForeground }]}>{[item.city, item.state].filter(Boolean).join(", ")}</Text></View>}
      {!!item.rankingReason && feed === "foryou" && <View style={[s.reason, { backgroundColor: colors.background }]}><Text style={[s.reasonText, { color: colors.mutedForeground }]}><Text style={{ fontFamily: "Inter_700Bold" }}>Why you’re seeing this: </Text>{item.rankingReason}</Text></View>}
      <View style={[s.actions, { borderTopColor: colors.border }]}>{item.sourceUrl && <TouchableOpacity onPress={() => void openExternalUrl(item.sourceUrl!, { kind: "web" })}><Text style={s.actionText}>Read source ↗</Text></TouchableOpacity>}{item.status === "approved" && !item.isOwnStory && <TouchableOpacity disabled={confirming === item.id} onPress={() => void confirmStory(item)}><Text style={[s.actionText, item.hasConfirmed && { color: "#15803D" }]}>{item.hasConfirmed ? "Confirmed" : "Confirm"} ({item.confirmCount})</Text></TouchableOpacity>}{item.communityPostId && <TouchableOpacity onPress={() => onDiscuss(item)}><Text style={s.actionText}>Discuss</Text></TouchableOpacity>}{isAuthenticated && item.status === "approved" && <TouchableOpacity onPress={() => reportStory(item)} style={{ marginLeft: "auto" }}><Feather name="flag" size={14} color={colors.mutedForeground} /></TouchableOpacity>}</View>
    </View>} />
    <HappeningSubmitModal visible={showSubmit} onClose={() => setShowSubmit(false)} onSubmitted={() => { setShowSubmit(false); void load(); }} />
  </View>;
}

function HappeningSubmitModal({ visible, onClose, onSubmitted }: { visible: boolean; onClose: () => void; onSubmitted: () => void }) {
  const colors = useColors(); const [title, setTitle] = useState(""); const [summary, setSummary] = useState(""); const [sourceUrl, setSourceUrl] = useState(""); const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("community"); const [scope, setScope] = useState<(typeof SCOPES)[number]>("local"); const [city, setCity] = useState(""); const [state, setState] = useState(""); const [tags, setTags] = useState(""); const [submitting, setSubmitting] = useState(false);
  const submit = async () => { if (!title.trim() || !summary.trim() || (scope === "local" && !city.trim()) || (scope === "state" && !state.trim()) || submitting) return; setSubmitting(true); try { const response = await fetch(`${getApiBase()}/api/knowledge/happening-now`, { method: "POST", headers: await authHeaders(true), body: JSON.stringify({ title, summary, sourceUrl: sourceUrl || undefined, category, scope, city: city || undefined, state: state || undefined, topicTags: tags.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8) }) }); const body = await response.json().catch(() => ({})) as { error?: string }; if (!response.ok) throw new Error(body.error ?? "Could not submit this update."); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onSubmitted(); } catch (cause) { Alert.alert("Couldn’t submit", cause instanceof Error ? cause.message : "Please try again."); } finally { setSubmitting(false); } };
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.form, { backgroundColor: colors.background }]}><View style={s.formHeader}><View style={{ flex: 1 }}><Text style={[s.formTitle, { color: colors.foreground }]}>Share what’s happening</Text><Text style={[s.formHelp, { color: colors.mutedForeground }]}>Reliable articles and community-impact updates are reviewed before publishing.</Text></View><TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity></View><TextInput value={title} onChangeText={setTitle} maxLength={300} placeholder="Headline" placeholderTextColor={colors.mutedForeground} style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /><TextInput value={summary} onChangeText={setSummary} maxLength={3000} multiline placeholder="What should the community know, and why does it matter?" placeholderTextColor={colors.mutedForeground} style={[s.input, s.textArea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /><TextInput value={sourceUrl} onChangeText={setSourceUrl} autoCapitalize="none" keyboardType="url" placeholder="Source URL (recommended for articles)" placeholderTextColor={colors.mutedForeground} style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /><Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Topic</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{CATEGORIES.map((value) => <TouchableOpacity key={value} onPress={() => setCategory(value)} style={[s.chip, { marginRight: 8, borderColor: category === value ? colors.primary : colors.border, backgroundColor: category === value ? colors.primary + "18" : colors.card }]}><Text style={[s.chipText, { color: category === value ? colors.primary : colors.mutedForeground }]}>{value}</Text></TouchableOpacity>)}</ScrollView><Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>Reach</Text><View style={s.badgeRow}>{SCOPES.map((value) => <TouchableOpacity key={value} onPress={() => setScope(value)} style={[s.chip, { borderColor: scope === value ? colors.primary : colors.border, backgroundColor: scope === value ? colors.primary + "18" : colors.card }]}><Text style={[s.chipText, { color: scope === value ? colors.primary : colors.mutedForeground }]}>{value}</Text></TouchableOpacity>)}</View>{(scope === "local" || scope === "state") && <View style={s.twoColumns}>{scope === "local" && <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={colors.mutedForeground} style={[s.input, { flex: 1, color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />}<TextInput value={state} onChangeText={setState} placeholder="State" placeholderTextColor={colors.mutedForeground} style={[s.input, { flex: 1, color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></View>}<TextInput value={tags} onChangeText={setTags} placeholder="Topics, separated by commas" placeholderTextColor={colors.mutedForeground} style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /><TouchableOpacity onPress={() => void submit()} disabled={!title.trim() || !summary.trim() || submitting} style={[s.submit, { backgroundColor: colors.primary, opacity: !title.trim() || !summary.trim() || submitting ? 0.45 : 1 }]}>{submitting ? <ActivityIndicator color="#FFF" /> : <Text style={s.submitText}>Submit for review</Text>}</TouchableOpacity></ScrollView></Modal>;
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }, loadingText: { fontFamily: "Inter_500Medium", fontSize: 13 }, hero: { borderRadius: 22, padding: 18, marginBottom: 12 }, heroEyebrow: { flexDirection: "row", gap: 7, alignItems: "center" }, heroEyebrowText: { color: "#F3C969", fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.5 }, heroTitle: { color: "#FFF", fontFamily: "PlayfairDisplay_700Bold", fontSize: 23, marginTop: 8 }, heroBody: { color: "rgba(255,255,255,0.72)", fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 4 }, shareButton: { alignSelf: "flex-start", marginTop: 14, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#CA922B", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 }, shareButtonText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 12 }, filterRow: { gap: 8, paddingBottom: 12 }, chip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 }, chipText: { fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "capitalize" }, errorBanner: { backgroundColor: "#FEF2F2", borderRadius: 14, padding: 12, marginBottom: 10 }, errorText: { color: "#B91C1C", fontFamily: "Inter_600SemiBold", fontSize: 12 }, empty: { alignItems: "center", borderRadius: 20, borderWidth: 1, padding: 30, gap: 7 }, emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 16 }, emptyBody: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" }, card: { borderRadius: 20, borderWidth: 1, padding: 16 }, badgeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7 }, categoryBadge: { color: "#A86F12", backgroundColor: "#CA922B18", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, fontFamily: "Inter_700Bold", fontSize: 9 }, scopeBadge: { fontFamily: "Inter_700Bold", fontSize: 9 }, pendingBadge: { color: "#B45309", backgroundColor: "#FFFBEB", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, fontFamily: "Inter_700Bold", fontSize: 9 }, verifiedBadge: { color: "#15803D", fontFamily: "Inter_700Bold", fontSize: 9 }, title: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 19, marginTop: 11 }, summary: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 6 }, locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 }, locationText: { fontFamily: "Inter_500Medium", fontSize: 11 }, reason: { borderRadius: 12, padding: 10, marginTop: 11 }, reasonText: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 }, actions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 14, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 13 }, actionText: { color: "#A86F12", fontFamily: "Inter_700Bold", fontSize: 11 }, form: { flexGrow: 1, padding: 20, gap: 14 }, formHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 4 }, formTitle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 22 }, formHelp: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 3 }, input: { borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14 }, textArea: { minHeight: 125, textAlignVertical: "top" }, fieldLabel: { fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }, twoColumns: { flexDirection: "row", gap: 10 }, submit: { borderRadius: 18, paddingVertical: 14, alignItems: "center", marginTop: 5 }, submitText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 14 },
});
