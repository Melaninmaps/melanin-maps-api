import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { KinfolkContinuityDisclosure } from "@/components/KinfolkContinuityDisclosure";

async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync("auth_session_token"); } catch { return null; }
}

interface MemoryItem {
  icon: "map-pin" | "tag" | "dollar-sign" | "users" | "coffee" | "globe" | "heart" | "star" | "settings";
  label: string;
  value: string;
  color: string;
}

interface PrivateMemory {
  id: string;
  content: string;
  purpose: string;
  isSensitive: boolean;
  sensitiveConsentGrantedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface MemorySummary {
  favoriteCities: string[];
  favoriteCategories: string[];
  budgetRange: string | null;
  travelCompanion: string | null;
  tripStyle: string[];
  dietaryNotes: string | null;
  communicationStyle: string | null;
  personalityMode: string | null;
  emojiLevel: string | null;
  humorLevel: string | null;
  culturalInterests: string[];
  diasporaCountries: string[];
  lifestyleServices: string[];
}

const MODE_LABELS: Record<string, string> = { community: "Community guide", professional: "Professional mode", local: "Local insider", home: "Home & comfort", neighborhood_guide: "Neighborhood guide" };
const COMPANION_LABELS: Record<string, string> = { solo: "Solo explorer", partner: "With a partner", family: "Family trips", group: "Group travels", friends: "Friends crew" };

function companionLabel(memory: PrivateMemory): string | null {
  if (memory.purpose !== "companion_context") return null;
  return /^Companion:\s*([^\n]{2,60})/im.exec(memory.content)?.[1]?.trim() || null;
}

export default function KinfolkMemoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MemorySummary | null>(null);
  const [privateMemories, setPrivateMemories] = useState<PrivateMemory[]>([]);
  const [memoryError, setMemoryError] = useState("");
  const [continuityEnabled, setContinuityEnabled] = useState(false);
  const [continuityDisclosureRequired, setContinuityDisclosureRequired] = useState(false);
  const [updatingContinuity, setUpdatingContinuity] = useState(false);
  const [editing, setEditing] = useState<{ id: string; content: string; sensitiveConfirmationRequired: boolean } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [resetting, setResetting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 44);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const load = async () => {
    try {
      const token = await getToken();
      const base = getApiBase();
      if (!token || !base) { setLoading(false); return; }
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, privateRes, continuityRes] = await Promise.all([
        fetch(`${base}/api/kinfolk/memory-summary`, { headers }),
        fetch(`${base}/api/kinfolk/memories`, { headers }),
        fetch(`${base}/api/kinfolk/continuity`, { headers }),
      ]);
      if (summaryRes.ok) setSummary((await summaryRes.json() as { summary: MemorySummary }).summary);
      if (privateRes.ok) setPrivateMemories((await privateRes.json() as { memories: PrivateMemory[] }).memories ?? []);
      if (continuityRes.ok) {
        const continuity = await continuityRes.json() as { enabled?: boolean; disclosureRequired?: boolean };
        setContinuityEnabled(continuity.enabled === true);
        setContinuityDisclosureRequired(continuity.disclosureRequired === true);
      }
    } catch { setMemoryError("Could not load Kinfolk memory settings."); }
    finally { setLoading(false); }
  };

  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  const updateContinuity = async (enabled: boolean, decision?: "accepted" | "declined"): Promise<boolean> => {
    const prior = continuityEnabled;
    setUpdatingContinuity(true); setContinuityEnabled(enabled); setMemoryError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again before changing memory.");
      const response = await fetch(`${getApiBase()}/api/kinfolk/continuity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled, ...(decision ? { decision } : {}) }),
      });
      const body = await response.json().catch(() => ({})) as { enabled?: boolean; disclosureRequired?: boolean; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kinfolk could not update memory.");
      setContinuityEnabled(body.enabled === true);
      setContinuityDisclosureRequired(body.disclosureRequired === true);
      if (Platform.OS !== "web") Haptics.selectionAsync();
      return true;
    } catch (cause) {
      setContinuityEnabled(prior);
      setMemoryError(cause instanceof Error ? cause.message : "Kinfolk could not update memory.");
      return false;
    } finally { setUpdatingContinuity(false); }
  };

  const forgetMemory = async (id: string) => {
    setMemoryError("");
    const token = await getToken();
    if (!token) return;
    try {
      const response = await fetch(`${getApiBase()}/api/kinfolk/memories/${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Could not forget that memory.");
      setPrivateMemories((items) => items.filter((item) => item.id !== id));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) { setMemoryError(cause instanceof Error ? cause.message : "Could not forget that memory."); }
  };

  const saveEdit = async () => {
    if (!editing || !editing.content.trim() || savingEdit) return;
    setSavingEdit(true); setMemoryError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again before editing memory.");
      const response = await fetch(`${getApiBase()}/api/kinfolk/memories/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editing.content.trim(), sensitiveConsent: editing.sensitiveConfirmationRequired }),
      });
      const body = await response.json().catch(() => ({})) as { memory?: PrivateMemory; error?: string };
      if (response.status === 409) { setEditing((current) => current ? { ...current, sensitiveConfirmationRequired: true } : current); return; }
      if (!response.ok || !body.memory) throw new Error(body.error ?? "Could not edit that memory.");
      setPrivateMemories((items) => items.map((item) => item.id === body.memory!.id ? { ...item, ...body.memory! } : item));
      setEditing(null);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) { setMemoryError(cause instanceof Error ? cause.message : "Could not edit that memory."); }
    finally { setSavingEdit(false); }
  };

  const resetKinfolk = () => {
    Alert.alert(
      "Start Kinfolk fresh?",
      "This clears Kinfolk chats, private memories, feedback, and Kinfolk-only preferences. It does not delete your account, password, profile, Community posts, DMs, circles, saved places, memberships, or other Mapping With Melanin data.",
      [{ text: "Cancel", style: "cancel" }, { text: "Start fresh", style: "destructive", onPress: () => void confirmReset() }],
    );
  };

  const confirmReset = async () => {
    setResetting(true); setMemoryError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again before resetting Kinfolk.");
      const response = await fetch(`${getApiBase()}/api/kinfolk/reset`, { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ confirmation: true }) });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Kinfolk could not reset.");
      setPrivateMemories([]); setContinuityEnabled(false); setContinuityDisclosureRequired(true);
    } catch (cause) { setMemoryError(cause instanceof Error ? cause.message : "Kinfolk could not reset."); }
    finally { setResetting(false); }
  };

  const buildItems = (s: MemorySummary): MemoryItem[] => {
    const items: MemoryItem[] = [];
    if (s.favoriteCities?.length) items.push({ icon: "map-pin", label: "Favorite Cities", value: s.favoriteCities.slice(0, 5).join(", "), color: colors.primary });
    if (s.favoriteCategories?.length) items.push({ icon: "tag", label: "Go-To Categories", value: s.favoriteCategories.slice(0, 4).join(", "), color: "#7C3AED" });
    if (s.budgetRange && s.budgetRange !== "any") items.push({ icon: "dollar-sign", label: "Budget Style", value: s.budgetRange, color: "#059669" });
    if (s.travelCompanion) items.push({ icon: "users", label: "Travel Crew", value: COMPANION_LABELS[s.travelCompanion] ?? s.travelCompanion, color: "#DB2777" });
    if (s.tripStyle?.length) items.push({ icon: "star", label: "Trip Vibes", value: s.tripStyle.slice(0, 3).join(", "), color: "#D97706" });
    if (s.dietaryNotes) items.push({ icon: "coffee", label: "Dietary Notes", value: s.dietaryNotes, color: "#0891B2" });
    if (s.personalityMode) items.push({ icon: "settings", label: "KinfolkAI Voice", value: MODE_LABELS[s.personalityMode] ?? s.personalityMode, color: colors.primary });
    if (s.culturalInterests?.length) items.push({ icon: "heart", label: "Cultural Interests", value: s.culturalInterests.slice(0, 4).join(", "), color: "#BE185D" });
    if (s.diasporaCountries?.length) items.push({ icon: "globe", label: "Diaspora Connection", value: s.diasporaCountries.slice(0, 4).join(", "), color: "#065F46" });
    if (s.lifestyleServices?.length) items.push({ icon: "tag", label: "Lifestyle Services", value: s.lifestyleServices.slice(0, 4).join(", "), color: "#6D28D9" });
    return items;
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <KinfolkContinuityDisclosure visible={!loading && continuityDisclosureRequired} onChoose={(decision) => updateContinuity(decision === "accepted", decision)} />
    <View style={[styles.header, { paddingTop: topPad + 12 }]}><TouchableOpacity activeOpacity={0.85} style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/kinfolk-settings" as never)}><Feather name="arrow-left" size={22} color={colors.foreground} /></TouchableOpacity><Text style={[styles.headerTitle, { color: colors.foreground }]}>What KinfolkAI™ Knows</Text><View style={{ width: 40 }} /></View>
    {loading ? <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View> : <ScrollView keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}>
      <View style={[styles.hero, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}><View style={[styles.heroIcon, { backgroundColor: colors.primary }]}><Feather name="cpu" size={22} color="#fff" /></View><Text style={[styles.heroTitle, { color: colors.foreground }]}>Your KinfolkAI™ Memory</Text><Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>Review what Kinfolk can use in future conversations. You can edit, delete, turn continuity off, or reset Kinfolk anytime.</Text></View>
      <View style={[styles.continuityCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={{ flex: 1, paddingRight: 14 }}><Text style={[styles.itemValue, { color: colors.foreground }]}>Continue private context between chats</Text><Text style={[styles.noteTxt, { color: colors.mutedForeground }]}>When on, Kinfolk can retain useful non-sensitive preferences, plans, projects, goals, and conversations. Turning this off stops future use and retention; saved items stay until you delete or reset them.</Text></View><Switch value={continuityEnabled} disabled={updatingContinuity} onValueChange={(value) => void updateContinuity(value)} trackColor={{ false: colors.border, true: colors.primary + "99" }} thumbColor={continuityEnabled ? colors.primary : "#f5f5f5"} accessibilityLabel="Continue private context between chats" /></View>
      {!summary || buildItems(summary).length === 0 ? <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="inbox" size={36} color={colors.mutedForeground} style={{ marginBottom: 12 }} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your profile is empty</Text><Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>Complete your KinfolkAI™ setup to unlock personalized recommendations, trip briefings, and local intel tailored to you.</Text><TouchableOpacity activeOpacity={0.85} style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/kinfolk-settings" as never)}><Text style={styles.emptyBtnTxt}>Set Up My Profile</Text></TouchableOpacity></View> : <><Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>WHAT I KNOW ABOUT YOU</Text><View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>{buildItems(summary).map((item, i, arr) => <React.Fragment key={item.label}><View style={styles.itemRow}><View style={[styles.itemIcon, { backgroundColor: item.color + "18" }]}><Feather name={item.icon} size={16} color={item.color} /></View><View style={styles.itemContent}><Text style={[styles.itemLabel, { color: colors.mutedForeground }]}>{item.label}</Text><Text style={[styles.itemValue, { color: colors.foreground }]}>{item.value}</Text></View></View>{i < arr.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />}</React.Fragment>)}</View><TouchableOpacity activeOpacity={0.85} style={[styles.editBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/kinfolk-settings" as never)}><Feather name="edit-2" size={16} color="#fff" /><Text style={styles.editBtnTxt}>Edit My KinfolkAI™ Profile</Text></TouchableOpacity></>}
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 4 }]}>PRIVATE MEMORIES</Text>
      {privateMemories.length === 0 ? <View style={[styles.emptyMemory, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="lock" size={18} color={colors.primary} /><View style={{ flex: 1 }}><Text style={[styles.itemValue, { color: colors.foreground }]}>Nothing saved from chat</Text><Text style={[styles.noteTxt, { color: colors.mutedForeground }]}>With memory on, Kinfolk can retain useful ordinary continuity. You can also save a specific note from the composer; sensitive details always ask separately.</Text></View></View> : <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>{privateMemories.map((memory, index) => { const companion = companionLabel(memory); const isEditing = editing?.id === memory.id; return <React.Fragment key={memory.id}><View style={styles.memoryRow}><View style={[styles.itemIcon, { backgroundColor: colors.primary + "18" }]}><Feather name={companion ? "users" : "lock"} size={15} color={colors.primary} /></View><View style={styles.itemContent}>{isEditing ? <><TextInput value={editing.content} onChangeText={(content) => setEditing({ ...editing, content })} multiline maxLength={1000} accessibilityLabel="Edit private Kinfolk memory" style={[styles.memoryInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />{editing.sensitiveConfirmationRequired && <Text style={[styles.sensitiveNote, { color: colors.primary }]}>This is sensitive. Confirm separately to save this edit privately.</Text>}<View style={styles.editActions}><TouchableOpacity disabled={savingEdit || !editing.content.trim()} onPress={() => void saveEdit()} style={[styles.smallPrimary, { backgroundColor: colors.primary, opacity: savingEdit || !editing.content.trim() ? 0.55 : 1 }]}><Text style={styles.smallPrimaryText}>{savingEdit ? "Saving…" : editing.sensitiveConfirmationRequired ? "Confirm sensitive edit" : "Save edit"}</Text></TouchableOpacity><TouchableOpacity disabled={savingEdit} onPress={() => setEditing(null)}><Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text></TouchableOpacity></View></> : <><Text style={[styles.itemValue, { color: colors.foreground }]}>{companion ? `Private note for ${companion}` : memory.content}</Text><Text style={[styles.itemLabel, { color: colors.mutedForeground }]} numberOfLines={2}>{companion ? memory.content.replace(/^Companion:\s*[^\n]+\s*\nNotes:\s*/im, "") : `${memory.purpose.replace("_", " ")}${memory.isSensitive ? " · sensitive" : ""}${memory.isSensitive && !memory.sensitiveConsentGrantedAt ? " · confirmation required before use" : ""}`}</Text></>}</View>{!isEditing && <View style={styles.memoryActions}><TouchableOpacity accessibilityLabel="Edit this memory" onPress={() => setEditing({ id: memory.id, content: memory.content, sensitiveConfirmationRequired: false })}><Feather name="edit-2" size={16} color={colors.primary} /></TouchableOpacity><TouchableOpacity accessibilityLabel={companion ? `Forget companion ${companion}` : "Forget this memory"} onPress={() => void forgetMemory(memory.id)}><Feather name="trash-2" size={17} color="#DC2626" /></TouchableOpacity></View>}</View>{index < privateMemories.length - 1 && <View style={[styles.sep, { backgroundColor: colors.border, marginLeft: 60 }]} />}</React.Fragment>; })}</View>}
      {!!memoryError && <Text style={styles.error}>{memoryError}</Text>}
      <View style={[styles.resetCard, { borderColor: "#FECACA", backgroundColor: "#FEF2F2" }]}><Feather name="rotate-ccw" size={16} color="#B42318" /><View style={{ flex: 1 }}><Text style={[styles.itemValue, { color: colors.foreground }]}>Reset Kinfolk</Text><Text style={[styles.noteTxt, { color: colors.mutedForeground }]}>Clear Kinfolk-only chats, memories, feedback, and preferences. Your account, password, profile, Community posts, saved places, and memberships stay untouched.</Text><TouchableOpacity disabled={resetting} onPress={resetKinfolk} style={styles.resetButton}><Text style={styles.resetButtonText}>{resetting ? "Resetting…" : "Start Kinfolk fresh"}</Text></TouchableOpacity></View></View>
      <View style={[styles.note, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Feather name="lock" size={14} color={colors.mutedForeground} /><Text style={[styles.noteTxt, { color: colors.mutedForeground }]}>Private Kinfolk memory is never public, shared with another member, or used for similarity-based recommendations.</Text></View>
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 }, back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" }, headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" }, scroll: { paddingHorizontal: 20 }, hero: { alignItems: "center", padding: 24, borderRadius: 20, borderWidth: 1, marginBottom: 18, gap: 10 }, heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" }, heroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" }, heroDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, textAlign: "center" }, continuityCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 }, sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 }, card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 24 }, sep: { height: 1 }, itemRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 }, memoryRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 16, paddingVertical: 14 }, itemIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" }, itemContent: { flex: 1 }, itemLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.3, marginBottom: 2 }, itemValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" }, emptyCard: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: "center", marginBottom: 24 }, emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 10 }, emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, textAlign: "center", marginBottom: 20 }, emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }, emptyBtnTxt: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" }, emptyMemory: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 }, editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 24 }, editBtnTxt: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" }, note: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 24 }, noteTxt: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 }, memoryActions: { gap: 16, paddingTop: 3 }, memoryInput: { minHeight: 72, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontFamily: "Inter_400Regular", fontSize: 13, textAlignVertical: "top" }, editActions: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 9 }, smallPrimary: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 }, smallPrimaryText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 10 }, cancelText: { fontFamily: "Inter_600SemiBold", fontSize: 11 }, sensitiveNote: { fontFamily: "Inter_500Medium", fontSize: 10, lineHeight: 14, marginTop: 6 }, error: { color: "#B42318", fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: 12 }, resetCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 }, resetButton: { alignSelf: "flex-start", borderRadius: 12, borderWidth: 1, borderColor: "#FCA5A5", backgroundColor: "#fff", paddingHorizontal: 11, paddingVertical: 8, marginTop: 10 }, resetButtonText: { color: "#B42318", fontFamily: "Inter_700Bold", fontSize: 11 },
});
