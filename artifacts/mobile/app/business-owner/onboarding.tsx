import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { getApiBase } from "@/lib/api";

type Offering = { name: string; detail: string };
type Onboarding = {
  identityReviewed: boolean;
  offerings: Offering[];
  pricing: { model: "not_listed" | "starting_at" | "range" | "contact_for_quote"; detail: string };
  availability: { useWeeklySchedule: boolean; note: string };
  media: { confirmedRights: boolean; confirmedReview: boolean };
  communication: { channels: Array<"email" | "phone" | "website" | "social">; responseWindow: string };
};
type ChecklistItem = { key: string; label: string; complete: boolean; helper: string };
type Payload = { onboarding: Onboarding; checklist: ChecklistItem[]; completionPercent: number };

const EMPTY: Onboarding = {
  identityReviewed: false,
  offerings: [],
  pricing: { model: "not_listed", detail: "" },
  availability: { useWeeklySchedule: false, note: "" },
  media: { confirmedRights: false, confirmedReview: false },
  communication: { channels: [], responseWindow: "" },
};
const PRICE_OPTIONS: Array<{ key: Onboarding["pricing"]["model"]; label: string }> = [
  { key: "not_listed", label: "Not listed" },
  { key: "starting_at", label: "Starting at" },
  { key: "range", label: "Range" },
  { key: "contact_for_quote", label: "Contact for quote" },
];

async function tokenHeaders(json = false): Promise<Record<string, string>> {
  const token = Platform.OS === "web" ? null : await SecureStore.getItemAsync("auth_session_token");
  return { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function ToggleRow({ label, detail, value, onToggle }: { label: string; detail: string; value: boolean; onToggle: () => void }) {
  const colors = useColors();
  return <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
    <View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{label}</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{detail}</Text></View>
    <View style={[styles.toggle, { backgroundColor: value ? colors.primary : colors.border }]}><View style={[styles.toggleKnob, { alignSelf: value ? "flex-end" : "flex-start" }]} /></View>
  </TouchableOpacity>;
}

export default function BusinessOwnerOnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onboarding, setOnboarding] = useState<Onboarding>(EMPTY);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [percent, setPercent] = useState(0);
  const [offerName, setOfferName] = useState("");
  const [offerDetail, setOfferDetail] = useState("");

  const completed = useMemo(() => checklist.filter((item) => item.complete).length, [checklist]);
  const apply = (payload: Payload) => { setOnboarding(payload.onboarding); setChecklist(payload.checklist); setPercent(payload.completionPercent); };

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBase()}/api/businesses/mine/onboarding`, { headers: await tokenHeaders() });
      if (!response.ok) throw new Error("Could not load your private owner checklist.");
      apply(await response.json() as Payload);
    } catch (error) {
      Alert.alert("Owner checklist unavailable", error instanceof Error ? error.message : "Please try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleChannel = (channel: Onboarding["communication"]["channels"][number]) => setOnboarding((current) => ({
    ...current,
    communication: {
      ...current.communication,
      channels: current.communication.channels.includes(channel)
        ? current.communication.channels.filter((value) => value !== channel)
        : [...current.communication.channels, channel],
    },
  }));

  const addOffering = () => {
    const name = offerName.trim();
    if (name.length < 2 || onboarding.offerings.length >= 12) return;
    setOnboarding((current) => ({ ...current, offerings: [...current.offerings, { name, detail: offerDetail.trim() }] }));
    setOfferName(""); setOfferDetail("");
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${getApiBase()}/api/businesses/mine/onboarding`, {
        method: "PUT", headers: await tokenHeaders(true), body: JSON.stringify(onboarding),
      });
      const payload = await response.json() as Payload & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not save your private owner checklist.");
      apply(payload);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Private checklist saved", "Nothing was published, generated, or sent to customers.");
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Please try again.");
    } finally { setSaving(false); }
  };

  if (loading) return <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/business-owner" as never)}><Feather name="arrow-left" size={22} color={colors.foreground} /></TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.foreground }]}>Owner Launch Checklist</Text>
      <TouchableOpacity disabled={saving} onPress={() => void save()} style={[styles.save, { backgroundColor: colors.primary, opacity: saving ? 0.65 : 1 }]}><Text style={styles.saveText}>{saving ? "Saving…" : "Save"}</Text></TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.notice, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
        <Feather name="shield" size={18} color={colors.primary} /><View style={{ flex: 1 }}><Text style={[styles.noticeTitle, { color: colors.foreground }]}>Private, owner-controlled setup</Text><Text style={[styles.noticeText, { color: colors.mutedForeground }]}>This checklist never publishes your profile, creates marketing content, contacts customers, charges money, or changes directory eligibility.</Text></View>
      </View>
      <View style={[styles.progress, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.progressTop}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{completed} of 6 steps complete</Text><Text style={[styles.percent, { color: colors.primary }]}>{percent}%</Text></View><View style={[styles.track, { backgroundColor: colors.border }]}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.primary }]} /></View></View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your checklist</Text>
      {checklist.map((item) => <View key={item.key} style={[styles.checkRow, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name={item.complete ? "check-circle" : "circle"} size={18} color={item.complete ? "#2D7A4F" : colors.mutedForeground} /><View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.label}</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{item.helper}</Text></View></View>)}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Complete your launch details</Text>
      <ToggleRow label="Identity reviewed" detail="I checked my existing business story and contact details." value={onboarding.identityReviewed} onToggle={() => setOnboarding((current) => ({ ...current, identityReviewed: !current.identityReviewed }))} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Offerings</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>Owner-written only — no offer, caption, or promotion is generated.</Text>{onboarding.offerings.map((offering, index) => <View key={`${offering.name}-${index}`} style={[styles.offerRow, { backgroundColor: colors.background }]}><View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{offering.name}</Text>{offering.detail ? <Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{offering.detail}</Text> : null}</View><TouchableOpacity onPress={() => setOnboarding((current) => ({ ...current, offerings: current.offerings.filter((_, itemIndex) => itemIndex !== index) }))}><Feather name="x" size={17} color={colors.mutedForeground} /></TouchableOpacity></View>)}{onboarding.offerings.length < 12 && <><TextInput value={offerName} onChangeText={setOfferName} placeholder="Offering name" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} /><TextInput value={offerDetail} onChangeText={setOfferDetail} placeholder="Short detail (optional)" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} /><TouchableOpacity onPress={addOffering} disabled={offerName.trim().length < 2} style={[styles.add, { backgroundColor: colors.primary, opacity: offerName.trim().length < 2 ? 0.5 : 1 }]}><Feather name="plus" size={16} color="#FFF" /><Text style={styles.addText}>Add offering</Text></TouchableOpacity></>}</View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Pricing guidance</Text><View style={styles.chips}>{PRICE_OPTIONS.map((option) => <TouchableOpacity key={option.key} onPress={() => setOnboarding((current) => ({ ...current, pricing: { ...current.pricing, model: option.key } }))} style={[styles.chip, { borderColor: onboarding.pricing.model === option.key ? colors.primary : colors.border, backgroundColor: onboarding.pricing.model === option.key ? colors.primary + "18" : colors.card }]}><Text style={{ color: onboarding.pricing.model === option.key ? colors.primary : colors.mutedForeground, fontSize: 12 }}>{option.label}</Text></TouchableOpacity>)}</View><TextInput value={onboarding.pricing.detail} onChangeText={(detail) => setOnboarding((current) => ({ ...current, pricing: { ...current.pricing, detail } }))} placeholder="Owner-written guidance" placeholderTextColor={colors.mutedForeground} maxLength={180} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} /></View>
      <ToggleRow label="Use my existing weekly schedule" detail="This references your schedule; it does not change it." value={onboarding.availability.useWeeklySchedule} onToggle={() => setOnboarding((current) => ({ ...current, availability: { ...current.availability, useWeeklySchedule: !current.availability.useWeeklySchedule } }))} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Availability note</Text><TextInput value={onboarding.availability.note} onChangeText={(note) => setOnboarding((current) => ({ ...current, availability: { ...current.availability, note } }))} placeholder="Owner-written, optional" placeholderTextColor={colors.mutedForeground} maxLength={280} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} /></View>
      <ToggleRow label="I have rights to current media" detail="No media is uploaded or changed here." value={onboarding.media.confirmedRights} onToggle={() => setOnboarding((current) => ({ ...current, media: { ...current.media, confirmedRights: !current.media.confirmedRights } }))} />
      <ToggleRow label="I reviewed current media" detail="Existing media approval and image-eligibility rules still apply." value={onboarding.media.confirmedReview} onToggle={() => setOnboarding((current) => ({ ...current, media: { ...current.media, confirmedReview: !current.media.confirmedReview } }))} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Communication preference</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>Choose existing public channels. No messages are sent by this checklist.</Text><View style={styles.chips}>{(["email", "phone", "website", "social"] as const).map((channel) => <TouchableOpacity key={channel} onPress={() => toggleChannel(channel)} style={[styles.chip, { borderColor: onboarding.communication.channels.includes(channel) ? colors.primary : colors.border, backgroundColor: onboarding.communication.channels.includes(channel) ? colors.primary + "18" : colors.card }]}><Text style={{ color: onboarding.communication.channels.includes(channel) ? colors.primary : colors.mutedForeground, fontSize: 12 }}>{channel}</Text></TouchableOpacity>)}</View><TextInput value={onboarding.communication.responseWindow} onChangeText={(responseWindow) => setOnboarding((current) => ({ ...current, communication: { ...current.communication, responseWindow } }))} placeholder="e.g. We reply within two business days" placeholderTextColor={colors.mutedForeground} maxLength={120} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} /></View>
      <TouchableOpacity disabled={saving} onPress={() => void save()} style={[styles.bottomSave, { backgroundColor: colors.primary, opacity: saving ? 0.65 : 1 }]}><Feather name="check" size={18} color="#FFF" /><Text style={styles.saveText}>{saving ? "Saving…" : "Save private checklist"}</Text></TouchableOpacity>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, center: { alignItems: "center", justifyContent: "center" }, header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 }, back: { width: 38 }, headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontFamily: "Inter_700Bold" }, save: { minWidth: 58, alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 }, saveText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 13 }, content: { padding: 16, gap: 12 }, notice: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 }, noticeTitle: { fontFamily: "Inter_700Bold", fontSize: 14 }, noticeText: { marginTop: 3, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 }, progress: { borderWidth: 1, borderRadius: 14, padding: 14 }, progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }, percent: { fontFamily: "Inter_700Bold", fontSize: 16 }, track: { height: 7, overflow: "hidden", borderRadius: 5 }, fill: { height: 7, borderRadius: 5 }, sectionTitle: { marginTop: 8, fontFamily: "Inter_700Bold", fontSize: 16 }, checkRow: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 }, card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 9 }, rowTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 }, rowDetail: { marginTop: 2, fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 }, toggleRow: { flexDirection: "row", gap: 12, alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 14 }, toggle: { width: 42, height: 24, padding: 3, borderRadius: 12 }, toggleKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#FFF" }, input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 13 }, offerRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10 }, add: { flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10 }, addText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 13 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7 }, bottomSave: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 15, marginTop: 10 },
});
